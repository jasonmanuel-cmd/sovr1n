const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { status } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        id, status, has_reviewed, created_at,
        listing:listing_id ( id, title, vertical, price ),
        buyer:buyer_id ( id, full_name ),
        seller:seller_id ( id, full_name )
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return serverError(res, error.message);
    return res.status(200).json({ orders: data || [] });
  }

  if (req.method === 'POST') {
    const { listing_id, seller_id } = req.body || {};
    if (!seller_id) return badRequest(res, 'seller_id is required');
    if (seller_id === user.id) return badRequest(res, 'Cannot place an order on your own listing');

    const { data, error } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id,
        listing_id: listing_id || null,
        status: 'requesting',
      })
      .select()
      .single();

    if (error) return serverError(res, error.message);
    return res.status(201).json({ order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
