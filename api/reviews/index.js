const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../../lib/auth');
const { badRequest, forbidden, conflict, serverError } = require('../../lib/errors');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order_id, rating, comment } = req.body || {};

  if (!order_id) return badRequest(res, 'order_id is required');
  if (!rating || rating < 1 || rating > 5) return badRequest(res, 'rating must be 1–5');

  // Verified-purchase check: order must exist, be completed, and current user must be the buyer
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, status, has_reviewed')
    .eq('id', order_id)
    .single();

  if (orderErr || !order) return badRequest(res, 'Order not found');
  if (order.buyer_id !== user.id) return forbidden(res, 'Only the buyer can leave a review');
  if (order.status !== 'completed') return forbidden(res, 'Can only review a completed order');
  if (order.has_reviewed) return conflict(res, 'This order has already been reviewed');

  // Insert review
  const { data: review, error: reviewErr } = await supabase
    .from('reviews')
    .insert({
      order_id,
      reviewer_id: user.id,
      reviewee_id: order.seller_id,
      rating: parseInt(rating, 10),
      comment: comment || null,
      type: 'seller_rating',
    })
    .select()
    .single();

  if (reviewErr) {
    if (reviewErr.code === '23505') return conflict(res, 'Review already submitted for this order');
    return serverError(res, reviewErr.message);
  }

  // Mark order as reviewed
  await supabase
    .from('orders')
    .update({ has_reviewed: true })
    .eq('id', order_id);

  return res.status(201).json({ review });
};
