const { supabaseAdmin } = require('../../lib/supabase-admin');
const { requireAuth } = require('../../lib/auth');
const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

function safeServerError(res, error) {
  console.error('[Contracts API]', error);
  return serverError(res);
}

function generateContractId() {
  return `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateContractText(contractData) {
  const contractId = generateContractId();
  const contractDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
================================================================================
                            DELIVERY CONTRACT
================================================================================

Contract ID:        ${contractId}
Date Created:       ${contractDate}

================================================================================
PARTIES
================================================================================

PARTY A (Load Poster / Buyer):
  Name:              ${contractData.buyerName || 'Party A'}
  Email:             ${contractData.buyerEmail || 'Not provided'}
  Phone:             ${contractData.buyerPhone || 'Not provided'}
  Location:          ${contractData.buyerCity || 'Not provided'}

PARTY B (Driver / Service Provider):
  Name:              ${contractData.driverName || 'Party B'}
  Email:             ${contractData.driverEmail || 'Not provided'}
  Phone:             ${contractData.driverPhone || 'Not provided'}
  Vehicle Class:     ${contractData.vehicleClass || 'Not specified'}
  License #:         ${contractData.licenseNumber || 'On file with platform'}

================================================================================
LOAD DETAILS
================================================================================

Load Title:         ${contractData.loadTitle}
Description:        ${contractData.loadDescription}
Prior Damage:       ${contractData.priorDamage || 'None reported'}
Pickup Location:    ${contractData.pickupAddress}
Dropoff Location:   ${contractData.dropoffAddress}
Required By:        ${contractData.timeframe}
Cargo Size:         ${contractData.cargoSize}
Weight:             ${contractData.weightKg || 'Not specified'} kg
Dimensions:         ${contractData.dimensions || 'Not specified'}

================================================================================
PRICING TERMS
================================================================================

Agreed Total Price: $${parseFloat(contractData.agreedPrice).toFixed(2)}
Platform Fee (10%): $${(parseFloat(contractData.agreedPrice) * 0.10).toFixed(2)}
Driver Earns:       $${(parseFloat(contractData.agreedPrice) * 0.90).toFixed(2)}

NOTE: Driver keeps 100% of the agreed delivery fee. Platform fee is 10% of
total transaction (2% for Hot Shot/Class A loads).

================================================================================
TERMS & CONDITIONS
================================================================================

1. INSPECTION & DOCUMENTATION
   - Driver agrees to inspect the load before pickup
   - Driver will document the load condition with photographs
   - Buyer confirms any existing damage in writing before pickup
   - This protects both parties from damage disputes

2. DELIVERY OBLIGATION
   - Driver agrees to deliver the load to the specified location
   - Delivery must occur by the agreed date/time: ${contractData.timeframe}
   - "Reasonable time" means within the specified timeframe window
   - Delays must be communicated immediately to buyer

3. DELIVERY CONFIRMATION
   - Upon arrival at drop-off location, buyer inspects the load
   - Buyer confirms delivery condition by signing this contract
   - Delivery is not complete until buyer confirms no damage
   - If damage is found, buyer must document it immediately

4. VEHICLE & WEIGHT COMPLIANCE
   - Driver is responsible for knowing vehicle weight capacity
   - Driver is responsible for knowing all local/state/federal laws
   - Driver must comply with DOT regulations and weight limits
   - Any violations of transportation laws are driver's liability
   - Platform is NOT responsible for driver legal violations

5. INSURANCE REQUIREMENTS
   - Driver confirms valid insurance coverage for this load
   - Insurance must cover commercial load transportation
   - Driver is responsible for insurance validity
   - Platform validates proof but cannot guarantee coverage

6. PAYMENT TERMS
   - Total agreed price: $${parseFloat(contractData.agreedPrice).toFixed(2)}
   - Payment due upon successful delivery completion
   - Buyer must confirm delivery before payment is processed
   - Platform processes payment and fee collection

7. DISPUTE RESOLUTION
   - Any disputes must be resolved between the parties
   - Documentation (photos, messages, contract) governs disputes
   - Sovr1n facilitates but does not arbitrate disputes
   - Legal action is the final recourse if parties cannot agree

8. RATINGS & FEEDBACK
   - Both parties agree to provide honest ratings post-delivery
   - Ratings are confidential but average rating is public
   - Ratings cannot be retaliated against
   - Comments must be factual and relevant to the transaction

9. SOVEREIGN DISCLAIMER
   - Sovr1n is a connection platform, not a party to this contract
   - Sovr1n is not responsible for lost, stolen, or damaged items
   - Sovr1n is not responsible for driver behavior or capability
   - Sovr1n is not responsible for buyer non-payment or fraud
   - This contract is between Party A and Party B only

10. GOVERNING LAW
    - This contract is governed by the laws of California
    - Kern County is the venue for any legal proceedings
    - Both parties submit to jurisdiction of California courts

================================================================================
DRIVER ACKNOWLEDGMENT & SIGNATURE
================================================================================

I, ${contractData.driverName || 'the Driver'}, acknowledge that:

• I have read and understand all terms of this contract
• I have a valid driver's license (${contractData.licenseNumber || 'on file'})
• I have valid insurance covering this load type
• I will comply with all traffic and weight regulations
• I take full responsibility for legal compliance
• I will inspect and document the load condition
• I will deliver by the specified date/time
• I understand my earnings after platform fee

Driver (Printed Name):    _________________________________

Driver Signature:         _________________________________

Date:                     _________________________________

Driver Email:             ${contractData.driverEmail || '_________________________'}

Driver Phone:             ${contractData.driverPhone || '_________________________'}

================================================================================
BUYER ACKNOWLEDGMENT & SIGNATURE
================================================================================

I, ${contractData.buyerName || 'the Buyer'}, acknowledge that:

• I have read and understand all terms of this contract
• I have described the load accurately
• I have documented any prior damage
• I will pay the agreed amount upon delivery
• I understand the delivery timeframe
• I will inspect the load upon delivery
• I will sign this contract confirming delivery condition
• I understand my responsibility to rate the driver

Buyer (Printed Name):     _________________________________

Buyer Signature:          _________________________________

Date:                     _________________________________

Buyer Email:              ${contractData.buyerEmail || '_________________________'}

Buyer Phone:              ${contractData.buyerPhone || '_________________________'}

================================================================================
PLATFORM VERIFICATION
================================================================================

This contract was auto-generated by Sovr1n Platform
Generated: ${contractDate}
Contract ID: ${contractId}

PLATFORM CONFIRMS:
[ ] Driver license verified (valid, not expired)
[ ] Insurance proof provided (covers commercial loads)
[ ] Both parties agreed to contract terms
[ ] Contract signed by both parties

This contract is legally binding upon digital signature by both parties.

For disputes or questions: support@sovr1n.local

================================================================================
                            END OF CONTRACT
================================================================================
`;
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 10 })) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  // Validate required fields
  const requiredFields = [
    'buyerName', 'buyerEmail', 'driverName', 'driverEmail',
    'loadTitle', 'loadDescription', 'pickupAddress', 'dropoffAddress',
    'agreedPrice', 'timeframe', 'cargoSize'
  ];

  for (const field of requiredFields) {
    if (!req.body?.[field]) {
      return badRequest(res, `Missing required field: ${field}`);
    }
  }

  const agreedPrice = Number(req.body.agreedPrice);
  if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
    return badRequest(res, 'Agreed price must be a positive number');
  }

  // Sanitize inputs
  const contractData = {
    buyerName: sanitizeText(req.body.buyerName, 100),
    buyerEmail: sanitizeText(req.body.buyerEmail, 100),
    buyerPhone: sanitizeText(req.body.buyerPhone || '', 20),
    buyerCity: sanitizeText(req.body.buyerCity || 'Bakersfield', 50),
    driverName: sanitizeText(req.body.driverName, 100),
    driverEmail: sanitizeText(req.body.driverEmail, 100),
    driverPhone: sanitizeText(req.body.driverPhone || '', 20),
    licenseNumber: sanitizeText(req.body.licenseNumber || '', 50),
    vehicleClass: sanitizeText(req.body.vehicleClass || '', 50),
    loadTitle: sanitizeText(req.body.loadTitle, 200),
    loadDescription: sanitizeText(req.body.loadDescription, 2000),
    priorDamage: sanitizeText(req.body.priorDamage || '', 1000),
    pickupAddress: sanitizeText(req.body.pickupAddress, 300),
    dropoffAddress: sanitizeText(req.body.dropoffAddress, 300),
    timeframe: sanitizeText(req.body.timeframe, 200),
    cargoSize: sanitizeText(req.body.cargoSize, 50),
    weightKg: req.body.weightKg ? Number(req.body.weightKg) : null,
    dimensions: sanitizeText(req.body.dimensions || '', 200),
    agreedPrice: agreedPrice
  };

  try {
    const contractText = generateContractText(contractData);
    const contractId = contractText.match(/Contract ID:\s+(\S+)/)?.[1] || 'UNKNOWN';

    // Store contract in database
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .insert({
        contract_id: contractId,
        buyer_id: req.body.buyerId,
        driver_id: req.body.driverId,
        load_id: req.body.loadId || null,
        buyer_data: contractData,
        agreed_price: agreedPrice,
        platform_fee: agreedPrice * 0.10,
        driver_earnings: agreedPrice * 0.90,
        status: 'pending',
        contract_text: contractText
      })
      .select('id, contract_id, status, created_at')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      contractId: contractId,
      contract: data,
      contractText: contractText,
      agreedPrice: agreedPrice,
      platformFee: (agreedPrice * 0.10).toFixed(2),
      driverEarnings: (agreedPrice * 0.90).toFixed(2)
    });
  } catch (error) {
    return safeServerError(res, error);
  }
};
