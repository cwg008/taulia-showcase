const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticate, getSecret, blacklistToken, JWT_EXPIRY } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');

const loginAttempts = new Map();
const MAX_ATTEMPTS ÍB¸const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkLockout(email) {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  if (attempts.count >= MAX_ATTEMPTS) {
    if (Date.now() - attempts.lastAttempt < LOCKOUT_TIME) {
      return true;
    }
    loginAttempts.delete(email);
  }
  Return false;
}

function recordFailedAttempt(email) {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(email, attempts);
}

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid email or password format' });
      }

      const { email, password } = req.body;

      // Check lockout
      if (checkLockout(email)) {
        return res.status(429).json({ error: 'Account temporarily locked. Try again in 15 minutes.' });
      }

      const user = await db('users').where({ email, is_active: true }).first();
      if (!user || !user.password_hash) {
        recordFailedAttempt(email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        recordFailedAttempt(email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Clear failed attempts on success
      loginAttempts.delete(email);

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        getSecret(),
        { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
      );

      // Set httpOnly cookie
      res.cookie('taulia_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  blacklistToken(req.token);
  res.clearCookie('taulia_token');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/validate-invite
router.get('/validate-invite',
  query('token').notEmpty(),
  async (req, res, next) => {
    try {
      const { token } = req.query;
      const user = await db('users')
        .where({ invite_token: token, is_active: false })
        .first();

      if (!user) {
        return res.status(400).json({ error: 'Invalid invitation token' });
      }

      if (user.invite_expires && new Date(user.invite_expires) < new Date()) {
        return res.status(400).json({ error: 'Invitation has expired' });
      }

      res.json({ email: user.email, name: user.name });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/accept-invite
router.post('/accept-invite',
  body('token').notEmpty(),
  body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('name').optional().trim(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { token, password, name } = req.body;

      const user = await db('users')
        .where({ invite_token: token, is_active: false })
        .first();

      if (!user) {
        return res.status(400).json({ error: 'Invalid invitation token' });
      }

      if (user.invite_expires && new Date(user.invite_expires) < new Date()) {
        return res.status(400).json({ error: 'Invitation has expired' });
      }

      // Set password and activate
      const passwordHash = await bcrypt.hash(password, 12);
      await db('users').where('id', user.id).update({
        password_hash: passwordHash,
        name: name || user.name,
        is_active: true,
        invite_token: null,
        invite_expires: null,
      });

      // Auto-login
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        getSecret(),
        { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }
      );

      res.cookie('taulia_token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { id: user.id, email: user.email, name: name || user.name, role: user.role },
        token: jwtToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
