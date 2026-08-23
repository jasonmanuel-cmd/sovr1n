const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

const CARGO_TIERS = new Set(['small', 'medium', 'large', 'heavy']);

function parsePage(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), max) : fallback;
}

function safeServerError(res, error) {
  console.error('[Loads API]', error);
  return serverError(res);
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: req.method === 'POST' ? 15 : 120 })) return;

  if (req.method === 'GET') {
    const page = parsePage(req.query.page, 1, 10_000);
    const limit = parsePage(req.query.limit, 20, 100);
    const city = sanitizeText(req.query.city, 100);
    const status = sanitizeText(req.query.status, 30);

    try {
      let query = supabaseAdmin
        .from('loads')
        .select('*, users!loads_poster_id_fkey(full_name, city, avatar_url)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (city) query = query.eq('city', city);
      if (status) query = query.eq('status', status);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.status(200).json({ loads: data || [], total: count || 0, page, limit });
    } catch (error) {
      return safeServerError(res, error);
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;

  const title = sanitizeText(req.body?.title, 160);
  const description = sanitizeText(req.body?.description, 5000);
  const pickupAddress = sanitizeText(req.body?.pickupAddress, 300);
  const dropoffAddress = sanitizeText(req.body?.dropoffAddress, 300);
  const city = sanitizeText(req.body?.city, 100) || 'Bakersfield';
  const cargoTier = sanitizeText(req.body?.cargoTier, 20);
  const dimensions = sanitizeText(req.body?.dimensions, 200) || null;
  const offeredPrice = Number(req.body?.offeredPrice);
  const weightKg = req.body?.weightKg === '' || req.body?.weightKg == null ? null : Number(req.body.weightKg);

  if (!title || !pickupAddress || !dropoffAddress || !cargoTier || !Number.isFinite(offeredPrice) || offeredPrice <= 0) {
    return badRequest(res, 'Title, pickup, drop-off, cargo tier, and a positive offered price are required');
  }
  if (!CARGO_TIERS.has(cargoTier)) return badRequest(res, 'Invalid cargo tier');
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 0)) return badRequest(res, 'Weight must be a positive number');

  try {
    const { data, error } = await supabaseAdmin
      .from('loads')
      .insert({
        poster_id: user.id,
        city,
        title,
        description,
        cargo_tier: cargoTier,
        weight_kg: weightKg,
        dimensions,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        offered_price: offeredPrice,
      })
      .select('*, users!loads_poster_id_fkey(full_name, city, avatar_url)')
      .single();
    if (error) throw error;
    return res.status(201).json({ load: data });
  } catch (error) {
    return safeServerError(res, error);
  }
};
