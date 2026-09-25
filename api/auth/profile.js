const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

const VALID_ROLES = ['customer', 'service_provider', 'driver', 'load_board'];

function profilePayload(data) {
  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    city: data.city,
    avatarUrl: data.avatar_url,
    roles: data.roles || [],
    isVerified: data.is_verified,
  };
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 30 })) return;
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) return serverError(res, error?.message || 'Profile not found');

      return res.status(200).json(profilePayload(data));
    }

    if (req.method === 'PUT') {
      const { fullName, phone, city, avatarUrl, addRole } = req.body;

      const updates = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (phone !== undefined) updates.phone = phone;
      if (city !== undefined) updates.city = city;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

      if (addRole !== undefined) {
        if (!VALID_ROLES.includes(addRole)) {
          return badRequest(res, `Role must be one of: ${VALID_ROLES.join(', ')}`);
        }

        const { data: existing, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('roles')
          .eq('id', user.id)
          .single();

        if (fetchError) return serverError(res, fetchError.message);

        const currentRoles = existing?.roles || [];
        if (!currentRoles.includes(addRole)) {
          updates.roles = [...currentRoles, addRole];
        }
      }

      const { data, error } = Object.keys(updates).length > 0
        ? await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()
        : await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

      if (error || !data) return serverError(res, error?.message);

      return res.status(200).json(profilePayload(data));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return serverError(res, err.message);
  }
};