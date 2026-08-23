const windows = new Map();

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; frame-ancestors 'none'");
}

function rateLimit(req, res, { limit = 60, windowMs = 60_000 } = {}) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const key = `${req.url}:${ip}`;
  const now = Date.now();
  const entry = windows.get(key);
  const active = entry && now - entry.startedAt < windowMs ? entry : { startedAt: now, count: 0 };
  active.count += 1;
  windows.set(key, active);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - active.count)));
  if (active.count > limit) {
    res.setHeader('Retry-After', String(Math.ceil((windowMs - (now - active.startedAt)) / 1000)));
    res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    return false;
  }
  return true;
}

function sanitizeText(value, maxLength = 5000) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

module.exports = { applySecurityHeaders, rateLimit, sanitizeText };
