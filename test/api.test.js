'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-test-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test-key';

const ADMIN_LIB = path.join(ROOT, 'lib', 'supabase-admin.js');
const BASE_LIB = path.join(ROOT, 'lib', 'supabase.js');

function chain(result) {
  const c = {
    then(resolve) {
      return Promise.resolve(result).then(resolve);
    },
  };
  for (const op of [
    'select', 'eq', 'order', 'range', 'single', 'limit',
    'insert', 'update', 'delete', 'ilike', 'or', 'overlaps', 'contains',
  ]) {
    c[op] = () => c;
  }
  return c;
}

function makeClient(state) {
  return {
    from() {
      return chain(state.queryResult);
    },
    auth: {
      admin: {
        createUser: async () => state.createUserResult,
        getUser: async () => state.getUserResult,
      },
      signInWithPassword: async () => state.signInResult,
      signOut: async () => state.signOutResult || { error: null },
      getUser: async () => state.getUserResult,
    },
  };
}

const USER = { id: 'user-1', email: 'driver@example.com', user_metadata: { full_name: 'Ada Driver' } };

function defaultState() {
  return {
    queryResult: { data: [], error: null, count: 0 },
    createUserResult: { data: { user: { id: 'user-9', email: 'new@example.com' } }, error: null },
    getUserResult: { data: { user: USER }, error: null },
    signInResult: {
      data: {
        user: USER,
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
        },
      },
      error: null,
    },
    signOutResult: { error: null },
  };
}

function loadHandler(relPath, state) {
  for (const lib of [ADMIN_LIB, BASE_LIB, path.join(ROOT, 'lib', 'auth.js')]) {
    delete require.cache[require.resolve(lib)];
  }
  const adminMod = require(ADMIN_LIB);
  const baseMod = require(BASE_LIB);
  adminMod.supabaseAdmin = makeClient(state);
  baseMod.supabase = makeClient(state);

  const abs = path.join(ROOT, relPath);
  delete require.cache[require.resolve(abs)];
  return require(abs);
}

function mockReq(overrides = {}) {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer test-token' },
    query: {},
    body: {},
    socket: { remoteAddress: '127.0.0.1' },
    url: overrides.url || '/api/x',
    ...overrides,
  };
}

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
  };
}

async function call(handler, reqOverrides = {}, state = defaultState()) {
  const req = mockReq(reqOverrides);
  const res = mockRes();
  await Promise.resolve(handler(req, res));
  return { req, res };
}

// ---------------------------------------------------------------
// Routes the app actually calls must NEVER resolve to 404
// ---------------------------------------------------------------
test('every API route the frontend calls responds with a real status (no 404)', async (t) => {
  const routes = [
    ['api/health.js', 'GET', '/api/health'],
    ['api/auth/login.js', 'POST', '/api/auth/login'],
    ['api/auth/register.js', 'POST', '/api/auth/register'],
    ['api/auth/logout.js', 'POST', '/api/auth/logout'],
    ['api/auth/profile.js', 'GET', '/api/auth/profile'],
    ['api/auth/profile.js', 'PUT', '/api/auth/profile'],
    ['api/loads/index.js', 'GET', '/api/loads?city=Bakersfield&status=open&limit=20'],
    ['api/loads/index.js', 'POST', '/api/loads'],
    ['api/loads/[id].js', 'GET', '/api/loads/load-1'],
    ['api/loads/[id].js', 'PUT', '/api/loads/load-1'],
    ['api/loads/[id].js', 'DELETE', '/api/loads/load-1'],
    ['api/listings/index.js', 'GET', '/api/listings?city=Bakersfield&limit=50'],
    ['api/listings/index.js', 'POST', '/api/listings'],
    ['api/listings/[id].js', 'GET', '/api/listings/listing-1'],
    ['api/listings/[id].js', 'PUT', '/api/listings/listing-1'],
    ['api/listings/[id].js', 'DELETE', '/api/listings/listing-1'],
    ['api/listings/search.js', 'GET', '/api/listings/search?q=sofa&city=Bakersfield'],
    ['api/providers/index.js', 'GET', '/api/providers?city=Bakersfield&limit=20'],
    ['api/providers/index.js', 'POST', '/api/providers'],
    ['api/providers/[id].js', 'GET', '/api/providers/provider-1'],
  ];

  for (const [file, method, url] of routes) {
    await t.test(`${method} ${file}`, async () => {
      const state = defaultState();
      state.queryResult = { data: [], error: null, count: 0 };
      const handler = loadHandler(file, state);
      const { res } = await call(handler, { method, url, query: { id: 'load-1' } });
      assert.ok(res.statusCode >= 200 && res.statusCode < 500, `${file} returned ${res.statusCode}`);
      assert.notEqual(res.statusCode, 404, `${file} must not 404`);
      assert.ok(res.body && typeof res.body === 'object', `${file} should return JSON`);
    });
  }
});

// ---------------------------------------------------------------
// Registration duplicate-check bug
// ---------------------------------------------------------------
test('register returns 409 (not 500) when the email is already registered', async () => {
  const state = defaultState();
  // Exact format Supabase emits for an existing email
  state.createUserResult = {
    data: null,
    error: {
      code: 'user_already_exists',
      message: 'A user with this email address has already been registered',
    },
  };
  const handler = loadHandler('api/auth/register.js', state);
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/auth/register',
    body: { email: 'taken@example.com', password: 'secret123', fullName: 'Taken User' },
  });
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'Email already registered');
});

test('register also detects duplicate even without the error code', async () => {
  const state = defaultState();
  state.createUserResult = {
    data: null,
    error: { code: '', message: 'User already registered' },
  };
  const handler = loadHandler('api/auth/register.js', state);
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/auth/register',
    body: { email: 'taken2@example.com', password: 'secret123', fullName: 'Taken Two' },
  });
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'Email already registered');
});

test('register accepts a new, non-duplicate user', async () => {
  const state = defaultState();
  const handler = loadHandler('api/auth/register.js', state);
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/auth/register',
    body: { email: 'new@example.com', password: 'secret123', fullName: 'New User', city: 'Bakersfield' },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.user.email, 'new@example.com');
});

test('register rejects invalid input with 400 instead of crashing', async () => {
  const handler = loadHandler('api/auth/register.js', defaultState());
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/auth/register',
    body: { email: 'not-an-email', password: '123', fullName: '' },
  });
  assert.equal(res.statusCode, 400);
});

// ---------------------------------------------------------------
// Clean error handling + sanitized server errors
// ---------------------------------------------------------------
test('server errors are sanitized - raw internals never reach the client', async () => {
  const state = defaultState();
  state.queryResult = { data: null, error: { message: 'SECRET_INTERNAL_DB_DETAIL', code: 'PGRST999' } };
  const handler = loadHandler('api/loads/index.js', state);
  const { res } = await call(handler, {
    method: 'GET',
    url: '/api/loads?city=Bakersfield&limit=20',
  });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Something went wrong. Please try again.');
  assert.ok(!JSON.stringify(res.body).includes('SECRET_INTERNAL_DB_DETAIL'));
});

test('login failure returns a generic message, not the raw provider error', async () => {
  const state = defaultState();
  state.signInResult = { data: null, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } };
  const handler = loadHandler('api/auth/login.js', state);
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/auth/login',
    body: { email: 'a@b.com', password: 'wrong' },
  });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Invalid email or password');
});

test('unauthorized requests get a clean 401 (no crash)', async () => {
  const state = defaultState();
  state.getUserResult = { data: { user: null }, error: { message: 'JWT expired' } };
  const handler = loadHandler('api/loads/index.js', state);
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/loads',
    body: { title: 'x', pickupAddress: 'a', dropoffAddress: 'b', cargoTier: 'small', offeredPrice: 10 },
  });
  assert.equal(res.statusCode, 401);
});

// ---------------------------------------------------------------
// Load lifecycle
// ---------------------------------------------------------------
test('loads GET returns open loads for the board', async () => {
  const state = defaultState();
  state.queryResult = {
    data: [
      {
        id: 'load-1', title: 'Sofa', pickup_address: 'A', dropoff_address: 'B',
        cargo_tier: 'large', offered_price: 40, status: 'open', created_at: new Date().toISOString(),
        users: { full_name: 'Poster' },
      },
    ],
    error: null,
    count: 1,
  };
  const handler = loadHandler('api/loads/index.js', state);
  const { res } = await call(handler, {
    method: 'GET',
    url: '/api/loads?city=Bakersfield&status=open',
    query: { city: 'Bakersfield', status: 'open' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.loads[0].title, 'Sofa');
});

test('loads POST persists a real load and returns it', async () => {
  const state = defaultState();
  state.queryResult = {
    data: {
      id: 'load-2', poster_id: 'user-1', title: 'Desk', pickup_address: 'A',
      dropoff_address: 'B', cargo_tier: 'medium', offered_price: 25, status: 'open',
    },
    error: null,
  };
  const handler = loadHandler('api/loads/index.js', state);
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/loads',
    body: { title: 'Desk', pickupAddress: 'A', dropoffAddress: 'B', cargoTier: 'medium', offeredPrice: 25 },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.load.id, 'load-2');
});

test('loads POST validates required fields cleanly', async () => {
  const handler = loadHandler('api/loads/index.js', defaultState());
  const { res } = await call(handler, {
    method: 'POST',
    url: '/api/loads',
    body: { title: 'No price' },
  });
  assert.equal(res.statusCode, 400);
});

test('only the load poster can cancel/delete, and it soft-cancels', async () => {
  const state = defaultState();
  // Poster owns the load
  state.queryResult = { data: { poster_id: 'user-1', status: 'open' }, error: null };
  const handler = loadHandler('api/loads/[id].js', state);
  const owned = await call(handler, { method: 'DELETE', url: '/api/loads/load-1', query: { id: 'load-1' } });
  assert.equal(owned.res.statusCode, 200);

  // A different user gets 403
  state.queryResult = { data: { poster_id: 'someone-else', status: 'open' }, error: null };
  const handler2 = loadHandler('api/loads/[id].js', state);
  const denied = await call(handler2, { method: 'DELETE', url: '/api/loads/load-1', query: { id: 'load-1' } });
  assert.equal(denied.res.statusCode, 403);
});

test('load detail returns full detail fields for drivers', async () => {
  const state = defaultState();
  state.queryResult = {
    data: {
      id: 'load-1', title: 'Fridge', pickup_address: 'Pickup Ave', dropoff_address: 'Drop St',
      description: 'Fridge in box', cargo_tier: 'heavy', weight_kg: 80, dimensions: '1x1x2',
      offered_price: 60, status: 'open', created_at: new Date().toISOString(),
      users: { full_name: 'Poster Person', city: 'Bakersfield', avatar_url: null },
    },
    error: null,
  };
  const handler = loadHandler('api/loads/[id].js', state);
  const { res } = await call(handler, {
    method: 'GET',
    url: '/api/loads/load-1',
    query: { id: 'load-1' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.load.pickup_address, 'Pickup Ave');
  assert.equal(res.body.load.dropoff_address, 'Drop St');
  assert.equal(res.body.load.offered_price, 60);
  assert.equal(res.body.load.status, 'open');
  assert.equal(res.body.load.users.full_name, 'Poster Person');
});

// ---------------------------------------------------------------
// Auth profile (RLS regression) + security headers + rate limit
// ---------------------------------------------------------------
test('profile PUT persists roles (RLS regression - no 500)', async () => {
  const state = defaultState();
  state.queryResult = { data: { id: 'user-1', full_name: 'Ada', roles: ['customer'] }, error: null };
  const handler = loadHandler('api/auth/profile.js', state);
  const { res } = await call(handler, {
    method: 'PUT',
    url: '/api/auth/profile',
    body: { addRole: 'driver' },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.roles));
});

test('security headers are applied on API responses', async () => {
  const handler = loadHandler('api/health.js', defaultState());
  const { res } = await call(handler, { method: 'GET', url: '/api/health' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(res.headers['X-Frame-Options'], 'DENY');
  assert.equal(res.headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.ok(res.headers['Content-Security-Policy']);
});

test('rate limiting is active and returns 429 on excess', async () => {
  const handler = loadHandler('api/health.js', defaultState());
  const url = '/api/rate-limit-probe';
  let final = null;
  for (let i = 0; i < 70; i++) {
    const { res } = await call(handler, { method: 'GET', url });
    final = res;
  }
  assert.equal(final.statusCode, 429);
  assert.equal(final.body.error, 'Too many requests. Please try again shortly.');
});

test('unsupported methods return 405, not a crash', async () => {
  const state = defaultState();
  const handler = loadHandler('api/loads/index.js', state);
  const { res } = await call(handler, { method: 'PATCH', url: '/api/loads' });
  assert.equal(res.statusCode, 405);
});