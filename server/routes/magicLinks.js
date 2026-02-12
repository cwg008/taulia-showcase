const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

const router = express.Router();

// GET / - List all magic links with prototype info
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, active } = req.query;

    let query = db('magic_links')
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
        'magic_links.created_at',
        'magic_links.password_hash',
        'magic_links.branding_config'
      );

    // Apply search filter
    if (search) {
      query = query.where((builder) => {
        builder.where('magic_links.label', 'like', `%${search}%`)
               .orWhere('magic_links.token', 'like', `%${search}%`);
      });
    }

    // Apply active filter
    if (active === 'true') {
      query = query.where('magic_links.is_revoked', false);
    } else if (active === 'false') {
      query = query.where('magic_links.is_revoked', true);
    }

    const links = await query.orderBy('magic_links.created_at', 'desc');

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
      isPasswordProtected: !!link.password_hash,
      brandingConfig: link.branding_config ? JSON.parse(link.branding_config) : null,
    }));

    res.json({ links: transformed });
  } catch (error) {
    console.error('Get magic links error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create new magic link (prototypeId optional — omit for homepage link)
router.post('/', authenticate, requireAdmin, [
  body('prototypeId').optional(),
  body('label').notEmpty(),
  body('brandingConfig').optional().isObject(),
  body('password').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { prototypeId, label, expiresAt, brandingConfig, password } = req.body;

    // If prototypeId is provided, validate the prototype exists
    if (prototypeId) {
      const prototype = await db('prototypes').where('id', prototypeId).first();
      if (!prototype) {
        return res.status(404).json({ error: 'Prototype not found' });
      }
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    const linkId = require('crypto').randomBytes(8).toString('hex');

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Stringify branding config if provided
    let brandingConfigStr = null;
    if (brandingConfig) {
      brandingConfigStr = JSON.stringify(brandingConfig);
    }

    await db('magic_links').insert({
      id: linkId,
      token,
      prototype_id: prototypeId || null,
      label,
      created_by: req.user.id,
      expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30-day expiry
      is_revoked: false,
      view_count: 0,
      created_at: new Date(),
      password_hash: passwordHash,
      branding_config: brandingConfigStr,
    });

    await createAuditLog(
      req.user.id,
      'link:create',
      'magic_link',
      linkId,
      { prototypeId: prototypeId || 'homepage', label },
      req.ip
    );

    res.status(201).json({
      link: {
        id: linkId,
        token,
        prototypeId: prototypeId || null,
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

// PATCH /:id/branding - Update branding config for magic link
router.patch('/:id/branding', authenticate, requireAdmin, [
  body('primaryColor').optional().matches(/^#[0-9a-fA-F]{6}$/),
  body('headerText').optional().isString(),
  body('footerText').optional().isString(),
  body('logoUrl').optional().isString(),
  body('hideTaulia').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;

    const link = await db('magic_links').where('id', id).first();
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const { primaryColor, headerText, footerText, logoUrl, hideTaulia } = req.body;

    const brandingConfig = {
      primaryColor,
      headerText,
      footerText,
      logoUrl,
      hideTaulia,
    };

    await db('magic_links').where('id', id).update({
      branding_config: JSON.stringify(brandingConfig),
      updated_at: new Date(),
    });

    await createAuditLog(
      req.user.id,
      'link:update-branding',
      'magic_link',
      id,
      { brandingConfig },
      req.ip
    );

    res.json({ message: 'Branding updated successfully', brandingConfig });
  } catch (error) {
    console.error('Update branding error:', error.message);
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
