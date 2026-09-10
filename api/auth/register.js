const { supabaseAdmin } = require('../../lib/supabase-admin');
const { badRequest, conflict, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 10 })) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = sanitizeText(req.body?.email, 254).toLowerCase();
  const password = req.body?.password;
  const fullName = sanitizeText(req.body?.fullName, 120);
  const phone = sanitizeText(req.body?.phone, 40);
  const city = sanitizeText(req.body?.city, 100) || 'Bakersfield';

  if (!email || !password || !fullName) return badRequest(res, 'Email, password, and full name are required');
  if (!/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 6) {
    return badRequest(res, 'Enter a valid email and a password of at least 6 characters');
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, city },
    });
    if (error) {
      const code = String(error.code || '');
      const message = String(error.message || '');
      const isDuplicate =
        code === 'user_already_exists' ||
        /already (been )?(registered|exists)/i.test(message) ||
        /duplicate/i.test(message) ||
        /email.*(already|taken)/i.test(message);
      if (isDuplicate) return conflict(res, 'Email already registered');
      console.error('[Register] Auth error:', error);
      return serverError(res);
    }
    return res.status(201).json({
      user: { id: data.user.id, email: data.user.email, fullName, city },
    });
  } catch (error) {
    console.error('[Register] Server error:', error);
    return serverError(res);
  }
};
