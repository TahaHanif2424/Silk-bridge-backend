const isProd = process.env.NODE_ENV === 'production';

exports.AUTH_COOKIE_NAME = 'access_token';

exports.AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days, matches the JWT expiry

// `SameSite=None` is only honoured alongside `Secure`, and browsers only accept
// `Secure` cookies over HTTPS. In local dev both the API and the Vite dev server
// are plain http://localhost, so forcing None/Secure makes the browser discard
// the cookie and every request after login looks unauthenticated.
// localhost:5173 -> localhost:5000 is still same-site, so Lax is delivered fine.
exports.authCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};
