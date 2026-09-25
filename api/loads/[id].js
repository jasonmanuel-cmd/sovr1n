const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, forbidden, notFound, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

const EDITABLE_FIELDS = {
  title: ['title', 160],
  description: ['description', 5000],
  pickupAddress: ['pickup_address', 300],
  dropoffAddress: ['dropoff_address', 300],
  city: ['city', 100],
  dimensions: ['dimensions', 200],
};
const CARGO_TIERS = new Set(['small', 'medium', 'large', 'heavy']);

function safeServerError(res, error) {
  console.error('[Load API]', error);
  return serverError(res);
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: req.method === 'GET' ? 120 : 30 })) return;
  const id = sanitizeText(req.query.id, 100);
  if (!id) return badRequest(res, 'A load id is required');

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('loads')
        .select('*, users!loads_poster_id_fkey(full_name, city, avatar_url)')
        .eq('id', id)
        .single();
      if (error || !data) return notFound(res, 'Load not found');
      return res.status(200).json({ load: data });
    } catch (error) {
      return safeServerError(res, error);
    }
  }

  if (!['PUT', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from('loads')
      .select('poster_id, status')
      .eq('id', id)
      .single();
    if (findError || !existing) return notFound(res, 'Load not found');
    if (existing.poster_id !== user.id) return forbidden(res, 'Only the poster can change this load');

    if (req.method === 'DELETE') {
      const { data, error } = await supabaseAdmin
        .from('loads')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ load: data });
    }

    if (existing.status !== 'open') return badRequest(res, 'Only open loads can be edited');
    const updates = {};
    for (const [input, [column, maxLength]] of Object.entries(EDITABLE_FIELDS)) {
      if (req.body?.[input] !== undefined) updates[column] = sanitizeText(req.body[input], maxLength);
    }
    if (req.body?.cargoTier !== undefined) {
      if (!CARGO_TIERS.has(req.body.cargoTier)) return badRequest(res, 'Invalid cargo tier');
      updates.cargo_tier = req.body.cargoTier;
    }
    for (const [input, column] of [['offeredPrice', 'offered_price'], ['weightKg', 'weight_kg']]) {
      if (req.body?.[input] !== undefined) {
        const value = Number(req.body[input]);
        if (!Number.isFinite(value) || value < 0 || (input === 'offeredPrice' && value === 0)) return badRequest(res, `Invalid ${input}`);
        updates[column] = value;
      }
    }
    if (!Object.keys(updates).length) return badRequest(res, 'No editable fields provided');

    const { data, error } = await supabaseAdmin
      .from('loads')
      .update(updates)
      .eq('id', id)
      .select('*, users!loads_poster_id_fkey(full_name, city, avatar_url)')
      .single();
    if (error) throw error;
    return res.status(200).json({ load: data });
  } catch (error) {
    return safeServerError(res, error);
  }
};
