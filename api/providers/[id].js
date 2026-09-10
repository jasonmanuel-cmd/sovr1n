const { supabase } = require('../../lib/supabase');
const { notFound, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 60 })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*, users(full_name, avatar_url, city)')
      .eq('id', id)
      .single();

    if (error || !data) return notFound(res, 'Provider not found');

    return res.status(200).json({ provider: data });
  } catch (err) {
    return serverError(res, err.message);
  }
};
