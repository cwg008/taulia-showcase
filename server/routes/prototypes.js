const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');
const { handleUpload } = require('../services/uploadService');

const router = express.Router();

// GET / - List all prototypes
router.get('/', authenticate, async (req, res) => {
  try {
    const prototypes = await db('prototypes')
      .select('id', 'title', 'description', 'slug', 'status', 'type', 'version', 'created_by', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    res.json({ prototypes });
  } catch (error) {
    console.error('Get prototypes error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create new prototype with file upload
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, status, type } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-');
    const prototypeId = require('crypto').randomBytes(8).toString('hex');

    // Create prototype record
    const [id] = await db('prototypes').insert({
      id: prototypeId,
      title,
      description,
      slug,
      status: status || 'draft',
      type: type || 'prototype',
      file_path: null,
      thumbnail_path: null,
      version: 1,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Handle file upload if present
    if (req.body.uploadFile) {
      try {
        await handleUpload(req, id, prototypeId);
      } catch (uploadError) {
        console.error('Upload error:', uploadError.message);
        // Continue without file - it's optional
      }
    }

    await createAuditLog(
      req.user.id,
      'prototype:create',
      'prototype',
      prototypeId,
      { title, type },
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
    const { title, description, status } = req.body;

    const prototype = await db('prototypes').where('id', id).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const updates = { updated_at: new Date() };
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (status) updates.status = status;

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

module.exports = router;
