const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

const VALID_VEHICLE_CLASSES = new Set(['car-pickup', 'hotshot', 'class-a']);

function safeServerError(res, error) {
  console.error('[Driver Verify API]', error);
  return serverError(res);
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 10 })) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  // Required fields
  const licenseNumber = sanitizeText(req.body?.licenseNumber, 50);
  const licenseState = sanitizeText(req.body?.licenseState, 2);
  const vehicleClass = sanitizeText(req.body?.vehicleClass, 20);
  const insuranceProvider = sanitizeText(req.body?.insuranceProvider, 100);
  const insurancePolicy = sanitizeText(req.body?.insurancePolicy, 50);

  if (!licenseNumber || !licenseState || !vehicleClass) {
    return badRequest(res, 'License number, state, and vehicle class are required');
  }

  if (!VALID_VEHICLE_CLASSES.has(vehicleClass)) {
    return badRequest(res, 'Invalid vehicle class. Must be: car-pickup, hotshot, or class-a');
  }

  if (!licenseState.match(/^[A-Z]{2}$/)) {
    return badRequest(res, 'License state must be 2-letter US state code');
  }

  try {
    // Check if verification already exists
    const { data: existing } = await supabaseAdmin
      .from('driver_verification')
      .select('id')
      .eq('driver_id', user.id)
      .single();

    let verificationData = {
      driver_id: user.id,
      license_number: licenseNumber,
      license_state: licenseState,
      vehicle_class: vehicleClass,
      insurance_provider: insuranceProvider,
      insurance_policy: insurancePolicy,
      license_verified: false, // Pending manual verification
      insurance_verified: false // Pending manual verification
    };

    let result;

    if (existing) {
      // Update existing verification
      const { data, error } = await supabaseAdmin
        .from('driver_verification')
        .update(verificationData)
        .eq('driver_id', user.id)
        .select('id, driver_id, license_number, vehicle_class, license_verified, insurance_verified, created_at, updated_at')
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new verification record
      const { data, error } = await supabaseAdmin
        .from('driver_verification')
        .insert(verificationData)
        .select('id, driver_id, license_number, vehicle_class, license_verified, insurance_verified, created_at, updated_at')
        .single();

      if (error) throw error;
      result = data;
    }

    // Update user profile to indicate they're a driver
    await supabaseAdmin
      .from('users')
      .update({
        is_driver: true,
        vehicle_class: vehicleClass
      })
      .eq('id', user.id);

    return res.status(201).json({
      success: true,
      message: 'Driver verification submitted. Documents are pending manual review.',
      verification: result,
      status: 'pending',
      nextSteps: [
        'Platform admin will verify your license and insurance',
        'You will receive an email when verification is complete',
        'Approval typically takes 24-48 hours',
        'You can start accepting loads once approved'
      ]
    });
  } catch (error) {
    return safeServerError(res, error);
  }
};
