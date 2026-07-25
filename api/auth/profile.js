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
    const { fullName, phone, city, avatarUrl } = req.body;

    try {
      const updates = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (phone !== undefined) updates.phone = phone;
      if (city !== undefined) updates.city = city;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

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
