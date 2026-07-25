const { supabase } = require('../../lib/supabase');
const { serverError } = require('../../lib/errors');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return serverError(res, error.message);
    }

    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    return serverError(res, err.message);
  }
};
