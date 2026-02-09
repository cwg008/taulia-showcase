const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { UPLOAD_DIR } = require('../services/uploadService');

// All prospect routes require authentication + prospect role
router.use(authenticate);
router.use(authorize('prospect'));

// GET /api/prospect/prototypes - List all prototypes shared with this prospect
router.get('/prototypes', async (req, res, next) => {
  try {
    const userEmail = req.user.email;

    // Find all prototypes shared with this prospect via magic links
    const prototypes = await db('magic_links')
      .join('prototypes', 'magic_links.prototype_id', 'prototypes.id')
      .where('magic_links.recipient_email', userEmail)
      .where('magic_links.is_revoked', false)
      .where('prototypes.status', 'published')
      .where(function() {
        this.whereNull('magic_links.expires_at')
          .orWhere('magic_links.expires_at', '>', new Date());
      })
      .select(
        'prototypes.id',
        'prototypes.title',
        'prototypes.description',
        'prototypes.type',
        'prototypes.version',
        'prototypes.created_at',
        'prototypes.updated_at',
        'magic_links.id as magic_link_id',
        'magic_links.token as magic_link_token',
        'magic_links.label as share_label',
      )
      .orderBy('magic_links.created_at', 'desc');

    // Get feedback counts per prototype for this user
    const feedbackCounts = await db('feedback')
      .where('user_id', req.user.id)
      .groupBy('prototype_id')
      .select('prototype_id')
      .count('* as count');

    const feedbackMap = {};
    feedbackCounts.forEach(f => {
      feedbackMap[f.prototype_id] = f.count;
    });

    const enriched = prototypes.map(p => ({
      ...p,
      feedback_count: feedbackMap[p.id] || 0,
    }));

    res.json({ prototypes: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/prospect/prototypes/:id - Get a single prototype detail
router.get('/prototypes/:id', async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const prototypeId = req.params.id;

    // Verify this prospect has access via a magic link
    const link = await db('magic_links')
      .where('recipient_email', userEmail)
      .where('prototype_id', prototypeId)
      .where('is_revoked', false)
      .where(function() {
        this.whereNull('expires_at')
          .orWhere('expires_at', '>', new Date());
      })
      .first();

    if (!link) {
      return res.status(403).json({ error: 'You do not have access to this prototype' });
    }

    const prototype = await db('prototypes')
      .where('id', prototypeId)
      .where('status', 'published')
      .first();

    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Record the view
    await db('link_views').insert({
      magic_link_id: link.id,
      prototype_id: prototype.id,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent']?.substring(0, 500),
    });

    await db('magic_links')
      .where('id', link.id)
      .increment('view_count', 1);

    // Get this user's feedback
    const feedback = await db('feedback')
      .where('prototype_id', prototypeId)
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    res.json({
      prototype: {
        id: prototype.id,
        title: prototype.title,
        description: prototype.description,
        type: prototype.type,
        version: prototype.version,
      },
      serve_url: `/api/prospect/prototypes/${prototypeId}/serve/`,
      magic_link/token: link.token,
      feedback,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/prospect/prototypes/:id/serve/* - Serve prototype files
router.get('/prototypes/:id/serve/*', async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const prototypeId = req.params.id;

    // Verify access
    const link = await db('magic_links')
      .where('recipient_email', userEmail)
      .where('prototype_id', prototypeId)
      .where('is_revoked', false)
      .first();

    if (!link) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const prototype = await db('prototypes').where('id', prototypeId).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const requestedPath = req.params[0] || '';
    const protoDir = path.join(UPLOAD_DIR, 'prototypes', String(prototype.id));

    let filePath;
    if (!requestedPath || requestedPath === '' || requestedPath === '/') {
      filePath = path.join(UPLOAD_DIR, prototype.file_path);
    } else {
      filePath = path.join(protoDir, requestedPath);
    }

    // Security: prevent path traversal
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(resolved);
  } catch (err) {
    next(err);
  }
});

// POST /api/prospect/prototypes/:id/feedback - Submit feedback
router.post('/prototypes/:id/feedback', async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const prototypeId = req.params.id;
    const { comment, rating, category } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const allowedCategories = ['ui', 'navigation', 'feature', 'performance', 'general'];
    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${allowedCategories.join(', ')}` });
    }

    // Verify access
    const link = await db('magic_links')
      .where('recipient_email', userEmail)
      .where('prototype_id', prototypeId)
      .where('is_revoked', false)
      .first();

    if (!link) {
      return res.status(403).json({ error: 'You do not have access to this prototype' });
    }

    const [feedbackId] = await db('feedback').insert({
      prototype_id: parseInt(prototypeId),
      user_id: req.user.id,
      magic_link_id: link.id,
      comment: comment.trim(),
      rating: rating || null,
      category: category || 'general',
    });

    const newFeedback = await db('feedback').where('id', feedbackId).first();

    res.status(201).json({ feedback: newFeedback });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/prospect/prototypes/:id/feedback/:feedbackId - Delete own feedback
router.delete('/prototypes/:id/feedback/:feedbackId', async (req, res, next) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await db('feedback')
      .where('id', feedbackId)
      .where('user_id', req.user.id)
      .first();

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await db('feedback').where('id', feedbackId).del();
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
