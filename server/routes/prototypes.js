const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');

const router = express.Router();

// Configure multer for file uploads (memory storage â we write to disk ourselves)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.html', '.htm', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .html and .zip files are allowed'));
    }
  },
});

// GET / - List all prototypes
router.get('/', authenticate, async (req, res) => {
  try {
    const prototypes = await db('prototypes')
      .select('id', 'title', 'description', 'slug', 'status', 'type', 'version', 'is_top_secret', 'created_by', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    res.json({ prototypes });
  } catch (error) {
    console.error('Get prototypes error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create new prototype with file upload
router.post('/', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, status, type, is_top_secret } = req.body;
    const description = req.body.description || '';

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-');
    const prototypeId = require('crypto').randomBytes(8).toString('hex');

    // Create prototype record
    await db('prototypes').insert({
      id: prototypeId,
      title,
      description,
      slug,
      status: status || 'draft',
      type: type || 'prototype',
      file_path: null,
      thumbnail_path: null,
      version: 1,
      is_top_secret: is_top_secret === 'true' || is_top_secret === true ? true : false,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Handle file upload if present
    if (req.file) {
      try {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'prototypes', prototypeId);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const fileName = ext === '.zip' ? req.file.originalname : 'index.html';
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);

        // Update prototype record with file path
        await db('prototypes').where('id', prototypeId).update({
          file_path: `uploads/prototypes/${prototypeId}/${fileName}`,
          updated_at: new Date(),
        });
      } catch (uploadError) {
        console.error('Upload file save error:', uploadError.message);
        // Continue without file â it's optional
      }
    }

    await createAuditLog(
      req.user.id,
      'prototype:create',
      'prototype',
      prototypeId,
      { title, type, is_top_secret: is_top_secret === 'true' || is_top_secret === true },
      req.ip
    );

    res.status(201).json({
      prototype: {
        id: prototypeId,
        title,
        description,
        slug,
        status: status || 'draft',
        type: type || 'prototype',
        version: 1,
        is_top_secret: is_top_secret === 'true' || is_top_secret === true,
      },
    });
  } catch (error) {
    console.error('Create prototype error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id - Get prototype by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prototype = await db('prototypes').where('id', id).first();

    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    res.json({ prototype });
  } catch (error) {
    console.error('Get prototype error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /:id - Update prototype
router.patch('/:id', authenticate, requireAdmin, [
  body('title').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('status').optional().isIn(['draft', 'published', 'archived']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { title, description, status, is_top_secret } = req.body;

    const prototype = await db('prototypes').where('id', id).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const updates = { updated_at: new Date() };
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (typeof is_top_secret === 'boolean') updates.is_top_secret = is_top_secret;

    await db('prototypes').where('id', id).update(updates);

    await createAuditLog(
      req.user.id,
      'prototype:update',
      'prototype',
      id,
      updates,
      req.ip
    );

    res.json({ message: 'Prototype updated' });
  } catch (error) {
    console.error('Update prototype error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - Delete prototype
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const prototype = await db('prototypes').where('id', id).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Delete associated access requests
    await db('prototype_access_requests').where('prototype_id', id).del();

    // Delete associated magic links
    await db('magic_links').where('prototype_id', id).del();

    // Delete prototype record
    await db('prototypes').where('id', id).del();

    // Delete files from disk
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'prototypes', id);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true });
    }

    await createAuditLog(
      req.user.id,
      'prototype:delete',
      'prototype',
      id,
      { title: prototype.title },
      req.ip
    );

    res.json({ message: 'Prototype deleted' });
  } catch (error) {
    console.error('Delete prototype error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  if (err && err.message === 'Only .html and .zip files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
