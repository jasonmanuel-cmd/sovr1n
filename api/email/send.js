const { badRequest, serverError } = require('../../lib/errors');
const { applySecurityHeaders, rateLimit, sanitizeText } = require('../../lib/security');

// Email templates
const templates = {
  beta_welcome: (data) => ({
    subject: '🚀 Welcome to Sovr1n Beta Testing!',
    text: `
Hi ${data.name},

Thank you for joining the Sovr1n beta testing program!

We're excited to have you as a ${data.role} helping us shape the future of delivery logistics.

WHAT'S NEXT:
1. You'll receive your welcome pack with login credentials
2. Platform access: https://sovr1n.vercel.app
3. Testing starts: Sep 24, 2026
4. We'll guide you through everything!

YOUR ROLE: ${data.role}
As a ${data.role}, you'll help us test:
- ${data.role === 'customer' ? 'Load posting, browsing drivers, ratings' : data.role === 'driver' ? 'License verification, browsing loads, contracts' : 'Product listings, delivery options, customer management'}

SUPPORT:
Questions? Reply to this email or check #sovr1n-beta on our communication channel.

Let's build something amazing together!
—The Sovr1n Team

P.S. Keep an eye on your email for daily updates and feedback surveys!
    `.trim()
  }),

  onboarding: (data) => ({
    subject: 'Your Sovr1n Beta Testing Guide',
    text: `
Hi ${data.name},

Your platform access is ready! Here's everything you need to know.

PLATFORM LINK: https://sovr1n.vercel.app
USERNAME: ${data.email}
PASSWORD: Check your welcome email

GETTING STARTED:
1. Log in with your credentials
2. Complete your profile
3. ${data.role === 'driver' ? 'Submit driver verification (license + insurance)' : 'Browse available loads'}
4. Start testing!

WEEK 1 (Sep 24-30):
- Explore the platform
- Complete your profile
- Take daily 1-minute surveys (at 5pm)

WEEK 2 (Oct 1-7):
- Complete real transactions
- Test contracts
- Rate experiences

DAILY SURVEY:
Every day at 5pm, you'll get a quick 1-minute survey about your experience.

WEEKLY SURVEY:
Every Friday at 4pm, a 10-minute survey for detailed feedback.

NEED HELP?
Email: support@sovr1n.local
Slack: #sovr1n-beta

Thanks for being part of our journey!
—Jason
    `.trim()
  }),

  daily_survey: (data) => ({
    subject: `🎯 Quick Check-in - How's Sovr1n?`,
    text: `
Hi ${data.name},

Quick question about your Sovr1n experience today:

Rate your experience: [😀 Great] [😐 OK] [😞 Frustrated]

What worked well? (optional)
[Text response]

What didn't work? (optional)
[Text response]

Reply to this email with your response, or click below:
[Survey Link]

Takes 1 minute. Your feedback helps us improve!

Thanks!
—Jason
    `.trim()
  }),

  weekly_survey: (data) => ({
    subject: `📊 Weekly Feedback - Sovr1n Beta`,
    text: `
Hi ${data.name},

Thank you for being part of week ${data.weekNumber} of Sovr1n beta testing!

Your feedback helps us ship a better product. This survey takes ~10 minutes.

Complete survey: [Link]

Key topics:
1. Overall experience (1-10 rating)
2. What worked best
3. What confused you
4. Feature requests
5. Would you use regularly?

Due: Sunday 11:59pm

Thanks!
—Jason
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

  try {
    // Get template
    const getTemplate = templates[template];
    if (!getTemplate) {
      return badRequest(res, 'Template not found');
    }

    const emailContent = getTemplate(data);

    // Send email (using Resend, SendGrid, or your email service)
    // For now, just log it (implement your email service here)
    console.log(`[EMAIL] To: ${to}`, emailContent);

    // TODO: Integrate with email service
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'support@sovr1n.local',
    //     to,
    //     subject: emailContent.subject,
    //     text: emailContent.text
    //   })
    // });

    return res.status(200).json({
      success: true,
      message: 'Email sent',
      template
    });
  } catch (error) {
    console.error('[Email Send]', error);
    return serverError(res);
  }
};
