const ALLOWED_ORIGINS = new Set([
  'https://sovr1n.com',
  'https://www.sovr1n.com',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
]);

/**
 * Applies CORS headers scoped to the app's own origin instead of '*'.
 * A wildcard origin lets any site read these endpoints' JSON responses
 * cross-origin if it ever gets hold of a bearer token; this limits that
 * to the origins the app actually serves from.
 *
 * Returns true if the request can proceed, false if it was an OPTIONS
 * preflight that this function already responded to.
 */
function applyCors(req, res, { methods } = {}) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methods || 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }
  return true;
}

module.exports = { applyCors, ALLOWED_ORIGINS };
