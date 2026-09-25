const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

const VALID_STATUSES = new Set(['available', 'in-discussion', 'contracted', 'completed', 'cancelled']);

function safeServerError(res, error) {
  console.error('[Load Status API]', error);
  return serverError(res);
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 30 })) return;

  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const loadId = sanitizeText(req.query.id || req.body?.loadId, 50);
  const newStatus = sanitizeText(req.body?.status, 20);
  const contractId = sanitizeText(req.body?.contractId || '', 100);
  const driverId = sanitizeText(req.body?.driverId || '', 50);

  if (!loadId) return badRequest(res, 'Load ID is required');
  if (!newStatus) return badRequest(res, 'Status is required');
  if (!VALID_STATUSES.has(newStatus)) {
    return badRequest(res, `Invalid status. Must be one of: ${[...VALID_STATUSES].join(', ')}`);
  }

  try {
    // Get the load to verify ownership
    const { data: load, error: loadError } = await supabaseAdmin
      .from('loads')
      .select('id, poster_id, status, driver_id')
      .eq('id', loadId)
      .single();

    if (loadError || !load) return badRequest(res, 'Load not found');

    // Check authorization (poster can update status, or driver if accepted)
    if (load.poster_id !== user.id && load.driver_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this load' });
    }

    // Validate status transitions
    const validTransitions = {
      'available': ['in-discussion', 'cancelled'],
      'in-discussion': ['available', 'contracted', 'cancelled'],
      'contracted': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[load.status]?.includes(newStatus)) {
      return badRequest(res, `Cannot transition from '${load.status}' to '${newStatus}'`);
    }

    // Build update data
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Add contract info if transitioning to contracted
    if (newStatus === 'contracted' && contractId) {
      updateData.contract_id = contractId;
    }

    // Add driver if accepting load
    if (newStatus === 'in-discussion' && driverId && load.poster_id === user.id) {
      return badRequest(res, 'Driver should update status via their action, not load poster');
    }

    if (newStatus === 'contracted' && !load.driver_id) {
      if (driverId) {
        updateData.driver_id = driverId;
      }
    }

    // Update the load
    const { data, error } = await supabaseAdmin
      .from('loads')
      .update(updateData)
      .eq('id', loadId)
      .select('*, users!loads_poster_id_fkey(full_name, email, avatar_url)')
      .single();

    if (error) throw error;

    // Log status change for audit
    await supabaseAdmin
      .from('load_status_history')
      .insert({
        load_id: loadId,
        from_status: load.status,
        to_status: newStatus,
        changed_by: user.id,
        changed_at: new Date().toISOString(),
        notes: contractId ? `Contract: ${contractId}` : null
      })
      .catch(err => console.error('Failed to log status change:', err));

    // Return appropriate response based on new status
    let responseMessage = '';
    switch (newStatus) {
      case 'in-discussion':
        responseMessage = 'Driver is interested! You can start negotiating or confirm the price.';
        break;
      case 'contracted':
        responseMessage = 'Deal is locked in! Contract has been generated. Both parties should review and sign.';
        break;
      case 'completed':
        responseMessage = 'Delivery complete! Both parties can now rate each other.';
        break;
      case 'cancelled':
        responseMessage = 'Load has been cancelled.';
        break;
      case 'available':
        responseMessage = 'Load is back on the board.';
        break;
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
      load: data,
      status: newStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return safeServerError(res, error);
  }
};
