const { supabase } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { badRequest, notFound, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: req.method === 'GET' ? 120 : 30 })) return;
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, users(full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (error || !data) return notFound(res, 'Listing not found');

      await supabase
        .from('listings')
        .update({ views: data.views + 1 })
        .eq('id', id);

      return res.status(200).json({ listing: data });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { title, description, tags, price, photos, category, is_active } = req.body;

    try {
      const { data: existing } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing) return notFound(res, 'Listing not found');
      if (existing.user_id !== user.id) return res.status(403).json({ error: 'Not your listing' });

      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (tags !== undefined) updates.tags = tags;
      if (price !== undefined) updates.price = price;
      if (photos !== undefined) updates.photos = photos;
      if (category !== undefined) updates.category = category;
      if (is_active !== undefined) updates.is_active = is_active;

      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return serverError(res, error.message);

      return res.status(200).json({ listing: data });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  if (req.method === 'DELETE') {
    const user = await requireAuth(req, res);
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing) return notFound(res, 'Listing not found');
      if (existing.user_id !== user.id) return res.status(403).json({ error: 'Not your listing' });

      const { error } = await supabase
        .from('listings')
        .update({ is_active: false })
        .eq('id', id);

      if (error) return serverError(res, error.message);

      return res.status(200).json({ message: 'Listing deleted' });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
