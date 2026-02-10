const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Middleware to require viewer role
const requireViewer = (req, res, next) => {
  if (!req.user || req.user.role !== 'viewer') {
    return res.status(403).json({ error: 'Viewer access required' });
  }
  next();
};

// GET /prototypes - List prototypes assigned to the authenticated viewer
router.get('/prototypes', authenticate, requireViewer, async (req, res) => {
  try {
    const prototypes = await db('user_prototype_access')
      .join('prototypes', 'user_prototype_access.prototype_id', 'prototypes.id')
      .where('user_prototype_access.user_id', req.user.id)
      .where('prototypes.status', 'published')
      .select(
        'prototypes.id',
        'prototypes.title',
        'prototypes.description',
        'prototypes.slug',
        'prototypes.status',
        'prototypes.type',
        'prototypes.version',
        'prototypes.is_top_secret',
        'prototypes.created_at',
        'prototypes.updated_at'
      )
      .orderBy('prototypes.created_at', 'desc');

    res.json({ prototypes });
  } catch (error) {
    console.error('Get viewer prototypes error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /prototypes/:id - Get specific assigned prototype details
router.get('/prototypes/:id', authenticate, requireViewer, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access to this prototype
    const access = await db('user_prototype_access')
      .where('user_id', req.user.id)
      .where('prototype_id', id)
      .first();

    if (!access) {
      return res.status(403).json({ error: 'You do not have access to this prototype' });
    }

    const prototype = await db('prototypes')
      .where('id', id)
      .first();

    if (!prototype || prototype.status !== 'published') {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Get feedback for this prototype
    const feedback = await db('prospect_feedback')
      .where('prototype_id', id)
      .select('id', 'category', 'message', 'rating', 'reviewer_name', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json({
      prototype,
      feedback,stats: {
        totalCount: feedback.length,
        averageRating: null,
        ratingCount: 0,
      },
    });
  } catch (error) {
    console.error('Get viewer prototype detail error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /prototypes/:id/serve/* - Serve prototype files for viewer users
router.get('/prototypes/:id/serve/*', authenticate, requireViewer, async (req, res) => {
  try {
    const { id } = req.params;

    // Check access
    const access = await db('user_prototype_access')
      .where('user_id', req.user.id)
      .where('prototype_id', id)
      .first();

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const prototype = await db('prototypes').where('id', id).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const requestedFile = req.params[0] || 'index.html';
    const path = require('path');
    const fs = require('fs');

    // Prevent path traversal
    const safePath = path.normalize(requestedFile).replace(/^(\.\.(\/|\\|$))+/, '');
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'prototypes', id);
    const filePath = path.join(uploadsDir, safePath);

    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve viewer file error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
