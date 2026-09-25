const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError, created } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 5 })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const name = sanitizeText(req.body?.name, 100);
  const email = sanitizeText(req.body?.email, 100);
  const phone = sanitizeText(req.body?.phone || '', 20);
  const role = sanitizeText(req.body?.role, 20);
  const problem = sanitizeText(req.body?.problem, 500);
  const frequency = sanitizeText(req.body?.frequency, 20);
  const areas = Array.isArray(req.body?.areas) ? req.body.areas.map(a => sanitizeText(a, 50)) : [];

  if (!name || !email || !role || !problem) {
    return badRequest(res, 'Name, email, role, and problem are required');
  }

  if (!email.includes('@')) {
    return badRequest(res, 'Invalid email format');
  }

  const validRoles = ['customer', 'driver', 'shop-owner'];
  if (!validRoles.includes(role)) {
    return badRequest(res, 'Invalid role');
  }

  try {
    // Check if already signed up
    const { data: existing } = await supabaseAdmin
      .from('beta_signups')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'You are already signed up for beta testing!',
        status: 'already_registered'
      });
    }

    // Insert new signup
    const { data, error } = await supabaseAdmin
      .from('beta_signups')
      .insert({
        name,
        email,
        phone,
        role,
        problem,
        frequency,
        areas: areas.join(','),
        status: 'pending',
        signed_up_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email
    try {
      await fetch(`https://sovr1n.com/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: '🚀 Welcome to Sovr1n Beta Testing!',
          template: 'beta_welcome',
          data: {
            name: name.split(' ')[0],
            role,
            signupDate: new Date().toLocaleDateString()
          }
        })
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Don't fail signup if email fails
    }

    return created(res, {
      success: true,
      message: 'Thank you for signing up! Check your email for next steps.',
      signupId: data.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('[Beta Signup]', error);
    return serverError(res);
  }
};
