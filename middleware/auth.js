const jwt = require('jsonwebtoken');
const { AUTH_COOKIE_NAME } = require('../lib/authCookie');

const getToken = (req) => {
  const cookieToken = req.cookies && req.cookies[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    // The frontend sends the header even when localStorage holds a stale
    // "null"/"undefined" string, which would otherwise fail verification.
    if (bearer && bearer !== 'null' && bearer !== 'undefined') return bearer;
  }

  return null;
};

const verify = (token) => jwt.verify(token, process.env.JWT_SECRET);

exports.protect = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    req.user = verify(token); // Contains id and role
    next();
  } catch (error) {
    // Let the client tell "log in again" apart from "something is misconfigured".
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please log in again', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized, token failed', code: 'TOKEN_INVALID' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication is misconfigured on the server' });
  }
};

exports.optionalProtect = async (req, res, next) => {
  const token = getToken(req);

  if (token) {
    try {
      req.user = verify(token);
    } catch (error) {
      // Ignore token errors for optional auth, act as guest
    }
  }
  next();
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
