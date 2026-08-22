const { supabase } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');

module.exports = async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        return serverError(res, error.message);
      }

      return res.status(200).json({
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        city: data.city,
        avatarUrl: data.avatar_url,
        roles: data.roles,
        isVerified: data.is_verified,
        createdAt: data.created_at,
      });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  if (req.method === 'PUT') {
    const { fullName, phone, city, avatarUrl, addRole } = req.body;
    const VALID_ROLES = ['customer', 'service_provider', 'driver', 'load_board'];

    try {
      const updates = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (phone !== undefined) updates.phone = phone;
      if (city !== undefined) updates.city = city;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

      if (addRole !== undefined) {
        if (!VALID_ROLES.includes(addRole)) {
          return badRequest(res, `Role must be one of: ${VALID_ROLES.join(', ')}`);
        }

        const { data: existing, error: fetchError } = await supabase
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

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return serverError(res, error.message);
      }

      return res.status(200).json({
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        city: data.city,
        avatarUrl: data.avatar_url,
        roles: data.roles,
        isVerified: data.is_verified,
      });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
