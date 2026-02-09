const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { UPLOAD_DIR } = require('../services/uploadService');

// GET /api/viewer/:token - Validate magic link and return prototype info
router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const link = await db('magic_links')
      .where('token', token)
      .first();

    if (!link) {
      return res.status(404).json({ error: 'Link not found or invalid' });
    }

    if (link.is_revoked) {
      return res.status(403).json({ error: 'This link has been revoked' });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    // Get prototype
    const prototype = await db('prototypes')
      .where('id', link.prototype_id)
      .first();

    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    if (prototype.status !== 'published') {
      return res.status(403).json({ error: 'This prototype is not currently available' });
    }

    // Record the view
    await db('link_views').insert({
      magic_link_id: link.id,
      prototype_id: prototype.id,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent']?.substring(0, 500),
    });

    // Increment view count
    await db('magic_links')
      .where('id', link.id)
      .increment('view_count', 1);

    res.json({
      prototype: {
        id: prototype.id,
        title: prototype.title,
        description: prototype.description,
        type: prototype.type,
        version: prototype.version,
      },
      serve_url: `/api/viewer/${token}/serve/`,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/viewer/:token/serve/* - Serve prototype files
router.get('/:token/serve/*', async (req, res, next) => {
  try {
    const { token } = req.params;

    // Validate the link (quick check, no view recording)
    const link = await db('magic_links').where('token', token).first();

    if (!link || link.is_revoked) {
      return res.status(403).json({ error: 'Invalid or revoked link' });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Link expired' });
    }

    const prototype = await db('prototypes').where('id', link.prototype_id).first();
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Get the requested file path
    const requestedPath = req.params[0] || '';
    const protoDir = path.join(UPLOAD_DIR, 'prototypes', String(prototype.id));

    // If no specific file requested, serve the main HTML
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

module.exports = router;
