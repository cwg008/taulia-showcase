const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Validate JWT secret on startup
const secret = process.env.JWT_SECRET;
if (!secret && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}

const JWT_SECRET = secret || 'dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Token blacklist for logout
const tokenBlacklist = new Set();

// Clean expired tokens every hour
setInterval(() => {
  tokenBlacklist.clear();
}, 60 * 60 * 1000);

function getSecret() {
  return JWT_SECRET;
}

// Main authentication middleware
async function authenticate(req, res, next) {
  try {
    // Extract token from cookie or Authorization header
    let token = req.cookies?.taulia_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check blacklist
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Verify user still exists and is active
    const user = await db('users')
      .where({ id: decoded.id, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User account not found or inactive' });
    }

    // Attach user to request (use DB values, not token claims)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    req.token = token;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(err);
  }
}

// Role authorization middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Blacklist a token (for logout)
function blacklistToken(token) {
  tokenBlacklist.add(token);
}

module.exports = { authenticate, authorize, getSecret, blacklistToken, JWT_EXPIRY };
