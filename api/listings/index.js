const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: req.method === 'POST' ? 15 : 120 })) return;

  if (req.method === 'GET') {
    const { city, type, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from('listings')
        .select('*, users(full_name, avatar_url)', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (city) query = query.eq('city', city);
      if (type) query = query.eq('type', type);
      if (category) query = query.eq('category', category);

      const { data, error, count } = await query;

      if (error) return serverError(res, error.message);

      return res.status(200).json({
        listings: data,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  if (req.method === 'POST') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { title, description, type, tags, price, photos, category, city } = req.body;

    if (!title || !type) {
      return badRequest(res, 'Title and type are required');
    }

    if (!['market', 'service'].includes(type)) {
      return badRequest(res, 'Type must be market or service');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .insert({
          user_id: user.id,
          city: city || 'Bakersfield',
          type,
          title,
          description: description || '',
          tags: tags || [],
          price: price || null,
          photos: photos || [],
          category: category || null,
        })
        .select()
        .single();

      if (error) return serverError(res, error.message);

      return res.status(201).json({ listing: data });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
