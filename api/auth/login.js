const { supabase } = require('../../lib/supabase');
const { badRequest, unauthorized, serverError } = require('../../lib/errors');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return badRequest(res, 'Email and password are required');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return unauthorized(res, 'Invalid email or password');
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name || '',
        phone: profile?.phone || '',
        city: profile?.city || 'Bakersfield',
        roles: profile?.roles || [],
        avatarUrl: profile?.avatar_url || null,
        isVerified: profile?.is_verified || false,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    });
  } catch (err) {
    return serverError(res, err.message);
  }
};
