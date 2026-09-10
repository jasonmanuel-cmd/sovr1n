const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: req.method === 'POST' ? 15 : 60 })) return;

  if (req.method === 'GET') {
    const { city, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
      let query = supabaseAdmin
        .from('service_providers')
        .select('*, users(full_name, avatar_url)', { count: 'exact' })
        .eq('is_active', true)
        .order('rating_avg', { ascending: false })
        .range(offset, offset + limit - 1);

      if (city) query = query.eq('city', city);
      if (category) query = query.eq('category', category);

      const { data, error, count } = await query;

      if (error) return serverError(res, error.message);

      return res.status(200).json({
        providers: data,
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

    const { businessName, description, category, photos, phone, email, website, city } = req.body;

    if (!businessName) return badRequest(res, 'Business name is required');

    try {
      const { data: existing } = await supabaseAdmin
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Already registered as a provider' });
      }

      const { data, error } = await supabaseAdmin
        .from('service_providers')
        .insert({
          user_id: user.id,
          city: city || 'Bakersfield',
          business_name: businessName,
          description: description || '',
          category: category || null,
          photos: photos || [],
          phone: phone || '',
          email: email || user.email,
          website: website || '',
        })
        .select()
        .single();

      if (error) return serverError(res, error.message);

      return res.status(201).json({ provider: data });
    } catch (err) {
      return serverError(res, err.message);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
