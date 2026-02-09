const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

router.use(authenticate, authorize('admin'));

// GET /api/links - List all magic links
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;

    const links = await db('magic_links')
      .leftJoin('prototypes', 'magic_links.prototype_id', 'prototypes.id')
      .leftJoin('users', 'magic_links.created_by', 'users.id')
      .select(
        'magic_links.*',
        'prototypes.title as prototype_title',
        'prototypes.status as prototype_status',
        'users.name as created_by_name'
      )
      .orderBy('magic_links.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('magic_links').count('* as count');

    res.json({
      links,
      pagination: { page: Number(page), limit: Number(limit), total: Number(count) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/links - Create a magic link
router.post('/',
  body('prototype_id').isInt().withMessage('Prototype ID is required'),
  body('label').optional().trim(),
  body('expires_at').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { prototype_id, label, expires_at, recipient_email } = req.body;

      // Verify prototype exists
      const prototype = await db('prototypes').where('id', prototype_id).first();
      if (!prototype) {
        return res.status(404).json({ error: 'Prototype not found' });
      }

      const token = crypto.randomBytes(32).toString('hex');

      const [id] = await db('magic_links').insert({
        token,
        prototype_id,
        label: label || `Link for ${prototype.title}`,
        created_by: req.user.id,
        expires_at: expires_at || null,
        recipient_email: recipient_email || null,
        is_revoked: false,
        view_count: 0,
      });

      const link = await db('magic_links').where('id', id).first();

      res.status(201).json({
        link,
        share_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/view/${token}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/links/:id - Get link details with analytics
router.get('/:id',
  param('id').isInt(),
  async (req, res, next) => {
    try {
      const link = await db('magic_links')
        .leftJoin('prototypes', 'magic_links.prototype_id', 'prototypes.id')
        .select('magic_links.*', 'prototypes.title as prototype_title')
        .where('magic_links.id', req.params.id)
        .first();

      if (!link) {
        return res.status(404).json({ error: 'Magic link not found' });
      }

      // Get view history
      const views = await db('link_views')
        .where('magic_link_id', link.id)
        .orderBy('viewed_at', 'desc')
        .limit(100);

      // Views per day (last 30 days)
      const dailyViews = await db('link_views')
        .where('magic_link_id', link.id)
        .select(db.raw("DATE(viewed_at) as date"))
        .count('* as views')
        .groupByRaw('DATE(viewed_at)')
        .orderBy('date', 'desc')
        .limit(30);

      res.json({ link, views, daily_views: dailyViews });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/links/:id - Update link (revoke, expiry)
router.patch('/:id',
  param('id').isInt(),
  body('is_revoked').optional().isBoolean(),
  body('expires_at').optional().isISO8601(),
  body('label').optional().trim(),
  async (req, res, next) => {
    try {
      const link = await db('magic_links').where('id', req.params.id).first();
      if (!link) {
        return res.status(404).json({ error: 'Magic link not found' });
      }

      const updates = {};
      if (req.body.is_revoked !== undefined) updates.is_revoked = req.body.is_revoked;
      if (req.body.expires_at !== undefined) updates.expires_at = req.body.expires_at;
      if (req.body.label !== undefined) updates.label = req.body.label;

      await db('magic_links').where('id', req.params.id).update(updates);
      const updated = await db('magic_links').where('id', req.params.id).first();

      res.json({ link: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/links/:id - Delete link
router.delete('/:id',
  param('id').isInt(),
  async (req, res, next) => {
    try {
      const link = await db('magic_links').where('id', req.params.id).first();
      if (!link) {
        return res.status(404).json({ error: 'Magic link not found' });
      }

      await db('magic_links').where('id', req.params.id).del();
      res.json({ message: 'Magic link deleted' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
