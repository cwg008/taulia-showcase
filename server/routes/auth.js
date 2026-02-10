const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

const router = express.Router();

// Password strength validator
const passwordValidator = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

// Timing-safe token comparison
const safeCompare = (a, b) => {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
});

// POST /login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await db('users').where('email', email).first();

    if (!user) {
      // Audit log: failed login (unknown email)
      await createAuditLog(null, 'auth:login_failed', 'user', null, { email, reason: 'unknown_email' }, req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      await createAuditLog(user.id, 'auth:login_failed', 'user', user.id, { email, reason: 'inactive_account' }, req.ip);
      return res.status(403).json({ error: 'User account is not active' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await createAuditLog(user.id, 'auth:login_failed', 'user', user.id, { email, reason: 'wrong_password' }, req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Audit log: successful login
    await createAuditLog(user.id, 'auth:login', 'user', user.id, { email: user.email }, req.ip);

    res.cookie('token', token, getCookieOptions());
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /logout
router.post('/logout', async (req, res) => {
  // Try to log who is logging out
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await createAuditLog(decoded.id, 'auth:logout', 'user', decoded.id, {}, req.ip);
    }
  } catch (e) {
    // Token may be expired or invalid - that's fine, still clear cookie
  }
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// GET /me
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

// GET /validate-invite
router.get('/validate-invite', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Timing-safe token comparison
    const pendingUsers = await db('users').whereNotNull('invite_token');
    const user = pendingUsers.find(u => safeCompare(u.invite_token, token));

    if (!user) {
      return res.status(404).json({ error: 'Invalid invite token' });
    }

    res.json({ email: user.email });
  } catch (error) {
    console.error('Validate invite error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /accept-invite
router.post('/accept-invite', [
  body('token').notEmpty(),
  passwordValidator,
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token, password } = req.body;

    // Find all users with pending invite tokens and use timing-safe compare
    const pendingUsers = await db('users').whereNotNull('invite_token');
    const user = pendingUsers.find(u => safeCompare(u.invite_token, token));

    if (!user) {
      return res.status(404).json({ error: 'Invalid invite token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db('users').where('id', user.id).update({
      password_hash: passwordHash,
      invite_token: null,
      is_active: true,
      updated_at: new Date(),
    });

    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.cookie('token', jwtToken, getCookieOptions());
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
