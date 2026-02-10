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

// GET /prototypes - List assigned prototypes + top-secret prototypes (blurred preview)
router.get('/prototypes', authenticate, requireViewer, async (req, res) => {
  try {
    // Get prototypes assigned to this viewer
    const assignedPrototypes = await db('user_prototype_access')
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

    const assignedIds = assignedPrototypes.map(p => p.id);

    // Get top-secret prototypes NOT assigned to this viewer (for blurred preview)
    let topSecretPrototypes = await db('prototypes')
      .where('status', 'published')
      .where('is_top_secret', true)
      .whereNotIn('id', assignedIds.length > 0 ? assignedIds : ['__none__'])
      .select(
        'id', 'title', 'description', 'slug', 'status',
        'type', 'version', 'is_top_secret', 'created_at', 'updated_at'
      )
      .orderBy('created_at', 'desc');

    // For each top-secret prototype, check if viewer has a pending/approved access request
    for (const proto of topSecretPrototypes) {
      const accessRequest = await db('prototype_access_requests')
        .where('prototype_id', proto.id)
        .where('requester_email', req.user.email)
        .orderBy('created_at', 'desc')
        .first();
      proto.access_request_status = accessRequest ? accessRequest.status : null;
    }

    // Mark assigned prototypes with access_granted flag
    const prototypes = assignedPrototypes.map(p => ({ ...p, access_granted: true }));
    const lockedPrototypes = topSecretPrototypes.map(p => ({ ...p, access_granted: false }));

    res.json({ prototypes, lockedPrototypes });
  } catch (error) {
    console.error('Get viewer prototypes error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /prototypes/:id/request-access - Viewer requests access to a top-secret prototype
router.post('/prototypes/:id/request-access', authenticate, requireViewer, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const prototype = await db('prototypes').where('id', id).first();
    if (!prototype || prototype.status !== 'published') {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    if (!prototype.is_top_secret) {
      return res.status(400).json({ error: 'This prototype does not require access requests' });
    }

    // Check if already has access
    const existingAccess = await db('user_prototype_access')
      .where('user_id', req.user.id)
      .where('prototype_id', id)
      .first();
    if (existingAccess) {
      return res.status(400).json({ error: 'You already have access to this prototype' });
    }

    // Check for existing pending/approved request
    const existingRequest = await db('prototype_access_requests')
      .where('requester_email', req.user.email)
      .where('prototype_id', id)
      .whereIn('status', ['pending', 'approved'])
      .first();

    if (existingRequest) {
      return res.status(409).json({
        error: existingRequest.status === 'approved'
          ? 'Access already granted'
          : 'An access request is already pending',
        status: existingRequest.status,
      });
    }

    const requestId = require('crypto').randomBytes(8).toString('hex');

    await db('prototype_access_requests').insert({
      id: requestId,
      prototype_id: id,
      magic_link_id: null,
      requester_name: req.user.name || req.user.email,
      requester_email: req.user.email,
      requester_company: null,
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
    console.error('Viewer access request error:', error.message);
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
      feedback,
    });
  } catch (error) {
    console.error('Get viewer prototype detail error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
