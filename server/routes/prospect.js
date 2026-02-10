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

    // Check top-secret status
    const isTopSecret = !!prototype.is_top_secret;
    let accessStatus = null;

    if (isTopSecret) {
      const accessRequest = await db('prototype_access_requests')
        .where('magic_link_id', link.id)
        .orderBy('created_at', 'desc')
        .first();

      accessStatus = accessRequest ? accessRequest.status : null;
    }

    res.json({
      prototype: {
        id: prototype.id,
        title: prototype.title,
        description: prototype.description,
        type: prototype.type,
        version: prototype.version,
        is_top_secret: isTopSecret,
      },
      link: {
        id: link.id,
        label: link.label,
      },
      access: isTopSecret ? {
        status: accessStatus,
        granted: accessStatus === 'approved',
      } : {
        status: 'approved',
        granted: true,
      },
    });
  } catch (error) {
    console.error('Get prospect view error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /:token/request-access - Submit access request for top-secret prototype
router.post('/:token/request-access', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('company').optional(),
  body('reason').optional().isLength({ max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token } = req.params;
    const { name, email, company, reason } = req.body;

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

    if (!prototype.is_top_secret) {
      return res.status(400).json({ error: 'This prototype does not require access requests' });
    }

    // Check if there's already a pending/approved request for this link
    const existingRequest = await db('prototype_access_requests')
      .where('magic_link_id', link.id)
      .whereIn('status', ['pending', 'approved'])
      .first();

    if (existingRequest) {
      return res.status(409).json({
        error: existingRequest.status === 'approved'
          ? 'Access already granted for this link'
          : 'An access request is already pending for this link',
        status: existingRequest.status,
      });
    }

    const requestId = require('crypto').randomBytes(8).toString('hex');

    await db('prototype_access_requests').insert({
      id: requestId,
      prototype_id: prototype.id,
      magic_link_id: link.id,
      requester_name: name,
      requester_email: email,
      requester_company: company || null,
      reason: reason || null,
      status: 'pending',
      created_at: new Date(),
    });

    res.status(201).json({
      request: {
        id: requestId,
        status: 'pending',
        message: 'Access request submitted. You will be notified once it is reviewed.',
      },
    });
  } catch (error) {
    console.error('Submit access request error:', error.message);
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
