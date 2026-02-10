const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

const router = express.Router();

// GET / - List all magic links with prototype info
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const links = await db('magic_links')
      .leftJoin('prototypes', 'magic_links.prototype_id', 'prototypes.id')
      .select(
        'magic_links.id',
        'magic_links.token',
        'magic_links.prototype_id',
        'prototypes.title as prototype_title',
        'magic_links.label',
        'magic_links.created_by',
        'magic_links.expires_at',
        'magic_links.is_revoked',
        'magic_links.view_count',
        'magic_links.created_at'
      )
      .orderBy('magic_links.created_at', 'desc');

    // Transform snake_case to camelCase and fix SQLite booleans
    const transformed = links.map(link => ({
      id: link.id,
      token: link.token,
      prototypeId: link.prototype_id,
      prototypeTitle: link.prototype_title,
      label: link.label,
      createdBy: link.created_by,
      expiresAt: link.expires_at,
      isActive: !link.is_revoked,
      viewCount: link.view_count,
      createdAt: link.created_at,
    }));

    res.json({ links: transformed });
  } catch (error) {
    console.error('Get magic links error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create new magic link
router.post('/', authenticate, requireAdmin, [
  body('prototypeId').notEmpty(),
  body('label').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { prototypeId, label, expiresAt } = req.body;

    const prototype = await db('prototypes').where('id', prototypeId).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    const linkId = require('crypto').randomBytes(8).toString('hex');

    const [id] = await db('magic_links').insert({
      id: linkId,
      token,
      prototype_id: prototypeId,
      label,
      created_by: req.user.id,
      expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30-day expiry
      is_revoked: false,
      view_count: 0,
      created_at: new Date(),
    });

    await createAuditLog(
      req.user.id,
      'link:create',
      'magic_link',
      linkId,
      { prototypeId, label },
      req.ip
    );

    res.status(201).json({
      link: {
        id: linkId,
        token,
        prototypeId,
        label,
        isRevoked: false,
        viewCount: 0,
      },
    });
  } catch (error) {
    console.error('Create magic link error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id - Get magic link by ID
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const link = await db('magic_links')
      .leftJoin('prototypes', 'magic_links.prototype_id', 'prototypes.id')
      .where('magic_links.id', id)
      .select('magic_links.*', 'prototypes.title as prototype_title')
      .first();

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ link });
  } catch (error) {
    console.error('Get magic link error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /:id - Revoke magic link
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const link = await db('magic_links').where('id', id).first();
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await db('magic_links').where('id', id).update({
      is_revoked: true,
      updated_at: new Date(),
    });

    await createAuditLog(
      req.user.id,
      'link:revoke',
      'magic_link',
      id,
      { token: link.token },
      req.ip
    );

    res.json({ message: 'Link revoked' });
  } catch (error) {
    console.error('Revoke magic link error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - Delete magic link
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const link = await db('magic_links').where('id', id).first();
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await db('magic_links').where('id', id).del();

    await createAuditLog(
      req.user.id,
      'link:delete',
      'magic_link',
      id,
      { token: link.token },
      req.ip
    );

    res.json({ message: 'Link deleted' });
  } catch (error) {
    console.error('Delete magic link error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
