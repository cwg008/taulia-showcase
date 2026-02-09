const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const router = express.Router();

// GET /:token - Validate magic link and return prototype metadata
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const link = await db('magic_links')
      .where('token', token)
      .first();

    if (!link) {
      return res.status(404).json({ error: 'Invalid link' });
    }

    if (link.is_revoked) {
      return res.status(403).json({ error: 'Link has been revoked' });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Link has expired' });
    }

    const prototype = await db('prototypes')
      .where('id', link.prototype_id)
      .first();

    if (!prototype || prototype.status !== 'published') {
      return res.status(404).json({ error: 'Prototype not found or not published' });
    }

    // Record view
    await db('link_views').insert({
      id: require('crypto').randomBytes(8).toString('hex'),
      magic_link_id: link.id,
      prototype_id: prototype.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      viewed_at: new Date(),
    });

    // Increment view count
    await db('magic_links').where('id', link.id).increment('view_count', 1);

    res.json({
      prototype: {
        id: prototype.id,
        title: prototype.title,
        description: prototype.description,
        type: prototype.type,
        version: prototype.version,
      },
    });
  } catch (error) {
    console.error('Get viewer error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:token/serve/* - Serve static prototype files
router.get('/:token/serve/*', async (req, res) => {
  try {
    const { token } = req.params;
    const filePath = req.params[0];

    // Validate token
    const link = await db('magic_links')
      .where('token', token)
      .first();

    if (!link) {
      return res.status(404).json({ error: 'Invalid link' });
    }

    if (link.is_revoked) {
      return res.status(403).json({ error: 'Link has been revoked' });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Link has expired' });
    }

    const prototype = await db('prototypes')
      .where('id', link.prototype_id)
      .first();

    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Construct safe file path
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'prototypes', prototype.id);
    const fullPath = path.join(uploadsDir, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(fullPath);
  } catch (error) {
    console.error('Serve file error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
