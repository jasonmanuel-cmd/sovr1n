const { unauthorized } = require('./errors');

/**
 * Admin gate for private beta tooling.
 *
 * Beta admin endpoints expose tester PII (name, email, phone, notes) and allow
 * writes, so they must never be reachable by an anonymous request. Supabase user
 * auth is not configured for an admin account yet, so this uses a shared secret
 * compared in constant time. Replace with requireAuth() once an admin Supabase
 * user exists — the callers do not need to change.
 *
 * The secret is supplied either as `x-admin-secret` or as a Bearer token, and may
 * come from the header or from ADMIN_SECRET. Header comparison is
 * timing-safe; a missing or unset secret fails closed.
 */
const crypto = require('node:crypto');

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so length alone is not a fast path.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function presentedSecret(req) {
  const header = req.headers?.['x-admin-secret'];
  if (header) return String(header);
  const auth = req.headers?.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return req.query?.key ? String(req.query.key) : null;
}

function requireAdmin(req, res) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    console.error('[admin] ADMIN_SECRET is not configured — refusing request');
    return res.status(503).json({ error: 'Admin access not configured' });
  }
  const presented = presentedSecret(req);
  if (!presented || !safeEqual(presented, expected)) {
    return unauthorized(res, 'Admin access required');
  }
  return null;
}

module.exports = { requireAdmin, safeEqual };