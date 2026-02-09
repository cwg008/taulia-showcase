const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { upload, processUpload, deletePrototypeFiles } = require('../services/uploadService');
const { body, param, query, validationResult } = require('express-validator');

// All routes require admin auth
router.use(authenticate, authorize('admin'));

// Helper: generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// GET /api/prototypes - List all prototypes
router.get('/',
  query('status').optional().isIn(['draft', 'published', 'archived']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      let q = db('prototypes')
        .leftJoin('users', 'prototypes.created_by', 'users.id')
        .select(
          'prototypes.*',
          'users.name as creator_name',
          'users.email as creator_email'
        )
        .orderBy('prototypes.created_at', 'desc');

      if (status) {
        q = q.where('prototypes.status', status);
      }

      const offset = (page - 1) * limit;
      const prototypes = await q.limit(limit).offset(offset);

      // Get total count
      let countQ = db('prototypes').count('* as count');
      if (status) countT = countQ.where('status', status);
      const [{ count }] = await countQ;

      // Get magic link counts per prototype
      const linkCounts = await db('magic_links')
        .select('prototype_id')
        .count('* as link_count')
        .where('is_revoked', false)
        .groupBy('prototype_id');

      const linkCountMap = {};
      linkCounts.forEach(lc => { linkCountMap[lc.prototype_id] = lc.link_count; });

      const enriched = prototypes.map(p => ({
        ...p,
        active_links: linkCountMap[p.id] || 0,
      }));

      res.json({
        prototypes: enriched,
        pagination: { page: Number(page), limit: Number(limit), total: Number(count) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/prototypes - Create prototype with file upload
router.post('/',
  upload.single('file'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'A file (HTML or ZIP) is required' });
      }

      const { title, description, status = 'draft' } = req.body;
      const slug = generateSlug(title);

      // Check slug uniqueness
      const existing = await db('prototypes').where('slug', slug).first();
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      // Create prototype record first (to get ID)
      const [id] = await db('prototypes').insert({
        title,
        description: description || '',
        slug: finalSlug,
        status,
        type: 'html', // will be updated by processUpload
        file_path: '', // will be updated
        version: '1.0',
        created_by: req.user.id,
      });

      // Process the uploaded file
      const result = await processUpload(req.file, id);

      // Update with file info
      await db('prototypes').where('id', id).update({
        type: result.type,
        file_path: result.file_path,
      });

      const prototype = await db('prototypes').where('id', id).first();
      res.status(201).json({ prototype });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/prototypes/:id - Get prototype details
router.get('/:id',
  param('id').isInt(),
  async (req, res, next) => {
    try {
      const prototype = await db('prototypes')
        .leftJoin('users', 'prototypes.created_by', 'users.id')
        .select('prototypes.*', 'users.name as creator_name')
        .where('prototypes.id', req.params.id)
        .first();

      if (!prototype) {
        return res.status(404).json({ error: 'Prototype not found' });
      }

      // Get magic links for this prototype
      const links = await db('magic_links')
        .where('prototype_id', prototype.id)
        .orderBy('created_at', 'desc');

      // Get total views
      const [{ total_views }] = await db('link_views')
        .where('prototype_id', prototype.id)
        .count('* as total_views');

      res.json({
        prototype,
        magic_links: links,
        total_views: Number(total_views),
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/prototypes/:id - Update prototype metadata
router.patch('/:id',
  param('id').isInt(),
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('version').optional().trim(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const prototype = await db('prototypes').where('id', req.params.id).first();
      if (!prototype) {
        return res.status(404).json({ error: 'Prototype not found' });
      }

      const updates = {};
      if (req.body.title) {
        updates.title = req.body.title;
        updates.slug = generateSlug(req.body.title);
        // Check slug uniqueness
        const existing = await db('prototypes').where('slug', updates.slug).whereNot('id', prototype.id).first();
        if (existing) updates.slug = `${updates.slug}-${Date.now()}`;
      }
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.status) updates.status = req.body.status;
      if (req.body.version) updates.version = req.body.version;
      updates.updated_at = db.fn.now();

      await db('prototypes').where('id', req.params.id).update(updates);
      const updated = await db('prototypes').where('id', req.params.id).first();
      res.json({ prototype: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/prototypes/:id - Delete prototype
router.delete('/:id',
  param('id').isInt(),
  async (req, res, next) => {
    try {
      const prototype = await db('prototypes').where('id', req.params.id).first();
      if (!prototype) {
        return res.status(404).json({ error: 'Prototype not found' });
      }

      // Delete files
      deletePrototypeFiles(req.params.id);

      // Delete from DB (cascades to magic_links and link_views)
      await db('prototypes').where('id', req.params.id).del();

      res.json({ message: 'Prototype deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/prototypes/:id/upload - Re-upload files
router.post('/:id/upload',
  upload.single('file'),
  param('id').isInt(),
  async (req, res, next) => {
    try {
      const prototype = await db('prototypes').where('id', req.params.id).first();
      if (!prototype) {
        return res.status(404).json({ error: 'Prototype not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'A file (HTML or ZIP) is required' });
      }

      const result = await processUpload(req.file, req.params.id);

      // Bump version
      const currentVersion = parseFloat(prototype.version) || 1.0;
      const newVersion = (currentVersion + 0.1).toFixed(1);

      await db('prototypes').where('id', req.params.id).update({
        type: result.type,
        file_path: result.file_path,
        version: newVersion,
        updated_at: db.fn.now(),
      });

      const updated = await db('prototypes').where('id', req.params.id).first();
      res.json({ prototype: updated });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
