const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

const router = express.Router();

// GET /users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await db('users').select('id', 'email', 'name', 'role', 'is_active', 'created_at', 'updated_at');
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/invite
router.post('/users/invite', authenticate, requireAdmin, [
  body('email').isEmail(),
  body('name').notEmpty(),
  body('role').isIn(['admin', 'viewer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, name, role } = req.body;

    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const inviteToken = require('crypto').randomBytes(32).toString('hex');

    const [userId] = await db('users').insert({
      email,
      name,
      role,
      password_hash: null,
      is_active: false,
      invite_token: inviteToken,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await createAuditLog(
      req.user.id,
      'user:invite',
      'user',
      userId,
      { email, role },
      req.ip
    );

    res.json({
      user: { id: userId, email, name, role, is_active: false },
      inviteToken,
    });
  } catch (error) {
    console.error('Invite user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /users/:id
router.patch('/users/:id', authenticate, requireAdmin, [
  body('name').optional().notEmpty(),
  body('role').optional().isIn(['admin', 'viewer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (role) updates.role = role;

    await db('users').where('id', id).update(updates);

    await createAuditLog(
      req.user.id,
      'user:update',
      'user',
      id,
      updates,
      req.ip
    );

    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/:id
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db('users').where('id', id).del();

    await createAuditLog(
      req.user.id,
      'user:delete',
      'user',
      id,
      { email: user.email },
      req.ip
    );

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /audit-logs
router.get('/audit-logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.id',
        'audit_logs.user_id',
        'users.email as user_email',
        'audit_logs.action',
        'audit_logs.resource_type',
        'audit_logs.resource_id',
        'audit_logs.details',
        'audit_logs.ip_address',
        'audit_logs.created_at'
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(1000);

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await db('users').count('* as count').first();
    const totalPrototypes = await db('prototypes').count('* as count').first();
    const totalLinks = await db('magic_links').count('* as count').first();
    const totalViews = await db('link_views').count('* as count').first();

    res.json({
      analytics: {
        totalUsers: totalUsers.count,
        totalPrototypes: totalPrototypes.count,
        totalLinks: totalLinks.count,
        totalViews: totalViews.count,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
