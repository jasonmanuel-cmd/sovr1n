const { supabaseAdmin } = require('../../lib/supabase-admin');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 60 })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, city, type, category, page = 1, limit = 20 } = req.query;

  if (!q) return badRequest(res, 'Search query (q) is required');

  const offset = (page - 1) * limit;
  const searchTags = q.toLowerCase().split(/\s+/).filter(Boolean);

  try {
    let query = supabaseAdmin
      .from('listings')
      .select('*, users(full_name, avatar_url)', { count: 'exact' })
      .eq('is_active', true)
      .overlaps('tags', searchTags)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) query = query.eq('city', city);
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;

    if (error) return serverError(res, error.message);

    const resultsCount = count || 0;

    if (resultsCount === 0) {
      await supabaseAdmin.from('search_log').insert({
        query: q,
        city: city || 'Bakersfield',
        results_count: 0,
      });
    }

    return res.status(200).json({
      listings: data,
      total: resultsCount,
      query: q,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return serverError(res, err.message);
  }
};
