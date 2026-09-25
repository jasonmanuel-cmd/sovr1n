const { supabaseAdmin } = require('../../lib/supabase-admin');
const { badRequest, serverError, created } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit } = require('../../lib/security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 30 })) return;

  // GET /api/beta/testers - list all testers
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('beta_signups')
        .select('*')
        .order('signed_up_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        testers: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      console.error('[Get Testers]', error);
      return serverError(res);
    }
  }

  // PATCH /api/beta/testers/:id - update tester status
  if (req.method === 'PATCH') {
    try {
      const testerId = req.query.id;
      const { status, notes } = req.body;

      if (!testerId) {
        return badRequest(res, 'Tester ID required');
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (notes) updateData.notes = notes;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('beta_signups')
        .update(updateData)
        .eq('id', testerId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        tester: data,
        message: 'Tester updated'
      });
    } catch (error) {
      console.error('[Update Tester]', error);
      return serverError(res);
    }
  }

  // DELETE /api/beta/testers/:id - remove tester
  if (req.method === 'DELETE') {
    try {
      const testerId = req.query.id;

      if (!testerId) {
        return badRequest(res, 'Tester ID required');
      }

      const { error } = await supabaseAdmin
        .from('beta_signups')
        .delete()
        .eq('id', testerId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Tester removed'
      });
    } catch (error) {
      console.error('[Delete Tester]', error);
      return serverError(res);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
