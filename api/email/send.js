const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@sovr1n.com';

// Email templates
const templates = {
  beta_welcome: (data) => ({
    subject: 'Welcome to Sovr1n Beta!',
    text: `
Hi ${data.name},

Thank you for joining the Sovr1n beta program!

We're excited to have you helping shape the future of local commerce in Kern County.

WHAT HAPPENS NEXT:
1. Our team reviews your application (usually within 24 hours)
2. You'll receive your access details by email once approved
3. Platform: https://www.sovr1n.com

YOUR ROLE: ${data.role}

QUESTIONS?
Reply to this email — we read every message.

Thanks for being part of this,
— The Sovr1n Team
    `.trim(),
    html: `
<p>Hi ${data.name},</p>
<p>Thank you for joining the Sovr1n beta program!</p>
<p>We're excited to have you helping shape the future of local commerce in Kern County.</p>
<p><strong>What happens next:</strong></p>
<ol>
  <li>Our team reviews your application (usually within 24 hours)</li>
  <li>You'll receive your access details by email once approved</li>
  <li>Platform: <a href="https://www.sovr1n.com">sovr1n.com</a></li>
</ol>
<p><strong>Your role:</strong> ${data.role}</p>
<p><strong>Questions?</strong> Reply to this email — we read every message.</p>
<p>Thanks for being part of this,<br>— The Sovr1n Team</p>
    `.trim()
  }),

  onboarding: (data) => ({
    subject: 'Your Sovr1n Beta Access Is Ready',
    text: `
Hi ${data.name},

Your platform access is ready!

PLATFORM LINK: https://www.sovr1n.com
USERNAME: ${data.email}

GETTING STARTED:
1. Log in at sovr1n.com
2. Complete your profile
3. ${data.role === 'driver' ? 'Submit driver verification (license + insurance)' : 'Browse the marketplace'}
4. Start testing and share feedback!

NEED HELP?
Reply to this email any time.

Thanks for being part of our journey!
— Jason
    `.trim()
  }),

  daily_survey: (data) => ({
    subject: `Quick check-in — how's Sovr1n today?`,
    text: `
Hi ${data.name},

How was your Sovr1n experience today? Reply with:
- 1 = Great
- 2 = OK
- 3 = Frustrated

And anything you want to share — takes 1 minute.

Thanks!
— Jason
    `.trim()
  }),

  weekly_survey: (data) => ({
    subject: `Weekly feedback — Sovr1n Beta week ${data.weekNumber}`,
    text: `
Hi ${data.name},

Thanks for being part of week ${data.weekNumber} of the Sovr1n beta!

Your feedback is the most important thing we can get right now. When you have 10 minutes:

${data.surveyLink || 'Reply to this email with your thoughts'}

Key questions:
1. Overall experience (1–10)
2. What worked best
3. What confused you
4. Feature requests
5. Would you use this regularly?

Thanks!
— Jason
    `.trim()
  })
};

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (!rateLimit(req, res, { limit: 100 })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const to = sanitizeText(req.body?.to, 100);
  const template = sanitizeText(req.body?.template, 50);
  const data = req.body?.data || {};

  if (!to || !template) {
    return badRequest(res, 'Email and template are required');
  }

  const getTemplate = templates[template];
  if (!getTemplate) {
    return badRequest(res, 'Template not found');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] RESEND_API_KEY not set — email not delivered');
    return res.status(501).json({
      success: false,
      delivered: false,
      error: 'Email delivery not configured'
    });
  }

  try {
    const emailContent = getTemplate(data);

    const payload = {
      from: FROM_ADDRESS,
      to: [to],
      subject: emailContent.subject,
      text: emailContent.text
    };
    if (emailContent.html) payload.html = emailContent.html;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[EMAIL] Resend error:', response.status, err);
      return serverError(res);
    }

    const result = await response.json();
    return res.status(200).json({ success: true, delivered: true, id: result.id, template });
  } catch (error) {
    console.error('[EMAIL] Send error:', error);
    return serverError(res);
  }
};
