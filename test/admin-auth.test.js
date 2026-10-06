// Regression tests for the beta admin gate.
//
// /api/beta/testers lists tester names, emails, phones and notes and accepts
// PATCH/DELETE. It was reachable by anonymous request, so anyone could read or
// destroy beta sign-ups. These tests pin the gate closed.

process.env.ADMIN_SECRET = 'test-secret-value';

const test = require('node:test');
const assert = require('node:assert');
const { requireAdmin, safeEqual } = require('../lib/admin-auth');

function fakeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  return res;
}

test('anonymous requests are rejected',()=>{
  const res = fakeRes();
  const blocked = requireAdmin({ headers: {} }, res);
  assert.ok(blocked,'handler must stop the request');
  assert.equal(res.statusCode,401);
  assert.match(res.body.error,/Admin access required/i);
});

test('a wrong secret is rejected',()=>{
  const res = fakeRes();
  requireAdmin({ headers: { 'x-admin-secret': 'nope' } }, res);
  assert.equal(res.statusCode,401);
});

test('a secret of the wrong length is rejected without throwing',()=>{
  const res = fakeRes();
  requireAdmin({ headers: { 'x-admin-secret': 'short' } }, res);
  assert.equal(res.statusCode,401);
});

test('the correct secret is accepted',()=>{
  const res = fakeRes();
  const blocked = requireAdmin({ headers: { 'x-admin-secret': 'test-secret-value' } }, res);
  assert.equal(blocked,null,'handler must continue');
  assert.equal(res.statusCode,null,'no response should be written');
});

test('a bearer token is accepted as an alternative to the header',()=>{
  const res = fakeRes();
  const blocked = requireAdmin({ headers: { authorization: 'Bearer test-secret-value' } }, res);
  assert.equal(blocked,null);
});

test('an unset ADMIN_SECRET fails closed rather than open',()=>{
  const saved = process.env.ADMIN_SECRET;
  delete process.env.ADMIN_SECRET;
  const res = fakeRes();
  requireAdmin({ headers: { 'x-admin-secret': 'anything' } }, res);
  assert.equal(res.statusCode,503,'must refuse when unconfigured, not admit');
  process.env.ADMIN_SECRET = saved;
});

test('safeEqual rejects mismatches and accepts equal strings',()=>{
  assert.equal(safeEqual('abc','abc'),true);
  assert.equal(safeEqual('abc','abd'),false);
  assert.equal(safeEqual('abc','abcd'),false);
  assert.equal(safeEqual('',''),true);
});