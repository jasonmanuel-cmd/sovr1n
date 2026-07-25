const { supabaseAdmin } = require('../../lib/supabase-admin');
const { badRequest, conflict, serverError } = require('../../lib/errors');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, fullName, phone, city } = req.body;

  if (!email || !password || !fullName) {
    return badRequest(res, 'Email, password, and full name are required');
  }

  try {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', email)
      .single();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || '',
        city: city || 'Bakersfield',
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return conflict(res, 'Email already registered');
      }
      return serverError(res, error.message);
    }

    return res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: fullName,
        city: city || 'Bakersfield',
      },
    });
  } catch (err) {
    return serverError(res, err.message);
  }
};
