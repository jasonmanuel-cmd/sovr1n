const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../../lib/auth');
const { badRequest, forbidden, notFound, serverError } = require('../../lib/errors');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const VALID_TRANSITIONS = {
  requesting:  ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   [],
  cancelled:   [],
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !order) return notFound(res, 'Order not found');
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return forbidden(res, 'Not a participant in this order');
  }

  if (req.method === 'GET') {
    return res.status(200).json({ order });
  }

  if (req.method === 'PUT') {
    const { status } = req.body || {};
    if (!status) return badRequest(res, 'status is required');

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return badRequest(res, `Cannot transition from '${order.status}' to '${status}'`);
    }

    // Only the seller can accept (move to in_progress); either party can cancel
    if (status === 'in_progress' && order.seller_id !== user.id) {
      return forbidden(res, 'Only the seller can accept an order');
    }
    if (status === 'completed' && order.seller_id !== user.id) {
      return forbidden(res, 'Only the seller can mark an order completed');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return serverError(res, updateErr.message);
    return res.status(200).json({ order: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
