const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// GET /:token - Get prototype info for prospect view
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

    res.json({
      prototype: {
        id: prototype.id,
        title: prototype.title,
        description: prototype.description,
        type: prototype.type,
        version: prototype.version,
      },
      link: {
        id: link.id,
        label: link.label,
      },
    });
  } catch (error) {
    console.error('Get prospect view error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /:token/feedback - Submit feedback from prospect
router.post('/:token/feedback', [
  body('category').isIn(['feature-request', 'bug-report', 'general-feedback', 'other']),
  body('message').notEmpty().isLength({ min: 10, max: 5000 }),
  body('contactEmail').optional().isEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token } = req.params;
    const { category, message, contactEmail } = req.body;

    const link = await db('magic_links')
      .where('token', token)
      .first();

    if (!link) {
      return res.status(404).json({ error: 'Invalid link' });
    }

    if (link.is_revoked) {
      return res.status(403).json({ error: 'Link has been revoked' });
    }

    const prototype = await db('prototypes')
      .where('id', link.prototype_id)
      .first();

    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    const feedbackId = require('crypto').randomBytes(8).toString('hex');

    await db('prospect_feedback').insert({
      id: feedbackId,
      prototype_id: prototype.id,
      magic_link_id: link.id,
      category,
      message,
      contact_email: contactEmail || null,
      created_at: new Date(),
    });

    res.status(201).json({
      feedback: {
        id: feedbackId,
        message: 'Feedback submitted successfully',
      },
    });
  } catch (error) {
    console.error('Submit feedback error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
