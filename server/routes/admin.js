const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');
const { sendAccessApproved, sendAccessDenied } = require('../services/emailService');
const { sendSlackNotification } = require('../services/slackService');

const router = express.Router();

// GET /users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = db('users');

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function() {
        this.where('email', 'like', searchTerm)
          .orWhere('name', 'like', searchTerm);
      });
    }

    // Apply role filter
    if (role) {
      query = query.where('role', role);
    }

    const users = await query.select('id', 'email', 'name', 'role', 'is_active', 'created_at', 'updated_at');
    // Transform snake_case to camelCase and fix SQLite booleans
    const transformed = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: !!user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
    res.json({ users: transformed });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/invite
router.post('/users/invite', authenticate, requireAdmin, [
  body('email').isEmail(),
  body('name').notEmpty(),
  body('role').isIn(['admin', 'viewer']),
  body('prototypeIds').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, name, role, prototypeIds } = req.body;

    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const inviteToken = require('crypto').randomBytes(32).toString('hex');
    const userId = require('crypto').randomBytes(8).toString('hex');

    await db('users').insert({
      id: userId,
      email,
      name,
      role,
      password_hash: null,
      is_active: false,
      invite_token: inviteToken,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // If viewer role and prototype IDs provided, create access entries
    if (role === 'viewer' && prototypeIds && prototypeIds.length > 0) {
      const accessEntries = prototypeIds.map(protoId => ({
        id: require('crypto').randomBytes(8).toString('hex'),
        user_id: userId,
        prototype_id: protoId,
        assigned_by: req.user.id,
        created_at: new Date(),
      }));
      await db('user_prototype_access').insert(accessEntries);
    }

    await createAuditLog(
      req.user.id,
      'user:invite',
      'user',
      userId,
      { email, role, prototypeCount: prototypeIds ? prototypeIds.length : 0 },
      req.ip
    );

    res.json({
      user: { id: userId, email, name, role, is_active: false },
      inviteToken,
    });
  } catch (error) {
    console.error('Invite user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /users/:id
router.patch('/users/:id', authenticate, requireAdmin, [
  body('name').optional().notEmpty(),
  body('role').optional().isIn(['admin', 'viewer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (role) updates.role = role;

    await db('users').where('id', id).update(updates);

    await createAuditLog(
      req.user.id,
      'user:update',
      'user',
      id,
      updates,
      req.ip
    );

    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/:id
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await db('users').where('id', id).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db('users').where('id', id).del();

    await createAuditLog(
      req.user.id,
      'user:delete',
      'user',
      id,
      { email: user.email },
      req.ip
    );

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /audit-logs
router.get('/audit-logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { search, action: actionFilter, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id');

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      baseQuery = baseQuery.where(function() {
        this.where('users.email', 'like', searchTerm)
          .orWhere('audit_logs.action', 'like', searchTerm)
          .orWhere('audit_logs.ip_address', 'like', searchTerm);
      });
    }

    // Apply action filter
    if (actionFilter) {
      baseQuery = baseQuery.where('audit_logs.action', actionFilter);
    }

    // Apply date range filters
    if (dateFrom) {
      baseQuery = baseQuery.where('audit_logs.created_at', '>=', dateFrom);
    }
    if (dateTo) {
      baseQuery = baseQuery.where('audit_logs.created_at', '<=', dateTo);
    }

    // Get total count
    const countResult = await baseQuery.clone().count('audit_logs.id as count').first();
    const totalCount = countResult.count;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Get paginated logs
    const logs = await baseQuery.clone()
      .select(
        'audit_logs.id',
        'audit_logs.user_id',
        'users.email as user_email',
        'audit_logs.action',
        'audit_logs.resource_type',
        'audit_logs.resource_id',
        'audit_logs.details',
        'audit_logs.ip_address',
        'audit_logs.created_at'
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({ logs, totalPages, currentPage: page, totalCount });
  } catch (error) {
    console.error('Get audit logs error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await db('users').count('* as count').first();
    const totalPrototypes = await db('prototypes').count('* as count').first();
    const totalLinks = await db('magic_links').count('* as count').first();
    const totalViews = await db('link_views').count('* as count').first();
    const pendingRequests = await db('prototype_access_requests').where('status', 'pending').count('* as count').first();
    const totalFeedback = await db('prospect_feedback').count('* as count').first();

    // Calculate average rating
    const ratingResult = await db('prospect_feedback')
      .whereNotNull('rating')
      .avg('rating as avg')
      .count('* as count')
      .first();

    res.json({
      analytics: {
        totalUsers: totalUsers.count,
        totalPrototypes: totalPrototypes.count,
        totalLinks: totalLinks.count,
        totalViews: totalViews.count,
        pendingAccessRequests: pendingRequests.count,
        totalFeedback: totalFeedback.count,
        averageRating: ratingResult.avg ? parseFloat(parseFloat(ratingResult.avg).toFixed(1)) : null,
        ratingCount: ratingResult.count,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /access-requests - List all access requests
router.get('/access-requests', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = db('prototype_access_requests')
      .leftJoin('prototypes', 'prototype_access_requests.prototype_id', 'prototypes.id')
      .leftJoin('magic_links', 'prototype_access_requests.magic_link_id', 'magic_links.id')
      .leftJoin('users', 'prototype_access_requests.reviewed_by', 'users.id')
      .select(
        'prototype_access_requests.id',
        'prototype_access_requests.prototype_id',
        'prototypes.title as prototype_title',
        'prototype_access_requests.magic_link_id',
        'magic_links.label as link_label',
        'prototype_access_requests.requester_name',
        'prototype_access_requests.requester_email',
        'prototype_access_requests.requester_company',
        'prototype_access_requests.reason',
        'prototype_access_requests.status',
        'prototype_access_requests.reviewed_by',
        'users.email as reviewer_email',
        'prototype_access_requests.reviewed_at',
        'prototype_access_requests.created_at'
      )
      .orderBy('prototype_access_requests.created_at', 'desc');

    if (status) {
      const validStatuses = ['pending', 'approved', 'denied'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      query = query.where('prototype_access_requests.status', status);
    }

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function() {
        this.where('prototype_access_requests.requester_name', 'like', searchTerm)
          .orWhere('prototype_access_requests.requester_email', 'like', searchTerm);
      });
    }

    const requests = await query.limit(500);

    res.json({ requests });
  } catch (error) {
    console.error('Get access requests error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /access-requests/:id - Approve or deny an access request
router.patch('/access-requests/:id', authenticate, requireAdmin, [
  body('status').isIn(['approved', 'denied']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await db('prototype_access_requests').where('id', id).first();
    if (!request) {
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been reviewed' });
    }

    await db('prototype_access_requests').where('id', id).update({
      status,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
    });

    await createAuditLog(
      req.user.id,
      `access-request:${status}`,
      'access_request',
      id,
      {
        requester_email: request.requester_email,
        prototype_id: request.prototype_id,
        decision: status,
      },
      req.ip
    );

    // Send email and Slack notifications (non-blocking)
    (async () => {
      try {
        const magicLink = await db('magic_links').where('id', request.magic_link_id).first();
        const prototype = await db('prototypes').where('id', request.prototype_id).first();
        const viewerUrl = magicLink ? `${process.env.CLIENT_URL || ''}/viewer/${magicLink.token}` : '';

        if (status === 'approved') {
          sendAccessApproved(request.requester_email, request.requester_name, prototype?.title || 'Prototype', viewerUrl);
          sendSlackNotification('access_approved', { name: request.requester_name, prototypeTitle: prototype?.title || 'Prototype' });
        } else {
          sendAccessDenied(request.requester_email, request.requester_name, prototype?.title || 'Prototype');
          sendSlackNotification('access_denied', { name: request.requester_name, prototypeTitle: prototype?.title || 'Prototype' });
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError.message);
      }
    })();

    res.json({ message: `Access request ${status}` });
  } catch (error) {
    console.error('Review access request error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /feedback - List all feedback across prototypes
router.get('/feedback', authenticate, requireAdmin, async (req, res) => {
  try {
    const { prototypeId } = req.query;

    let query = db('prospect_feedback')
      .leftJoin('prototypes', 'prospect_feedback.prototype_id', 'prototypes.id')
      .select(
        'prospect_feedback.id',
        'prospect_feedback.prototype_id',
        'prototypes.title as prototype_title',
        'prospect_feedback.category',
        'prospect_feedback.message',
        'prospect_feedback.rating',
        'prospect_feedback.reviewer_name',
        'prospect_feedback.contact_email',
        'prospect_feedback.created_at'
      )
      .orderBy('prospect_feedback.created_at', 'desc');

    if (prototypeId) {
      query = query.where('prospect_feedback.prototype_id', prototypeId);
    }

    const feedback = await query.limit(500);

    res.json({ feedback });
  } catch (error) {
    console.error('Get feedback error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /prototypes/:id/feedback - Feedback for a specific prototype
router.get('/prototypes/:id/feedback', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await db('prospect_feedback')
      .where('prototype_id', id)
      .select('id', 'category', 'message', 'rating', 'reviewer_name', 'contact_email', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(200);

    // Calculate stats
    const ratingsOnly = feedback.filter(f => f.rating != null);
    const avgRating = ratingsOnly.length > 0
      ? (ratingsOnly.reduce((sum, f) => sum + f.rating, 0) / ratingsOnly.length).toFixed(1)
      : null;

    res.json({
      feedback,
      stats: {
        totalCount: feedback.length,
        averageRating: avgRating ? parseFloat(avgRating) : null,
        ratingCount: ratingsOnly.length,
      },
    });
  } catch (error) {
    console.error('Get prototype feedback error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/detailed - Detailed analytics dashboard
router.get('/analytics/detailed', authenticate, requireAdmin, async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days) || 30);
    const { prototypeId } = req.query;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Views by day
    let viewsByDayQuery = db('link_views')
      .where('viewed_at', '>=', cutoff)
      .select(db.raw('DATE(viewed_at) as date'))
      .count('* as count')
      .groupBy('date')
      .orderBy('date');

    if (prototypeId) {
      viewsByDayQuery = viewsByDayQuery.where('prototype_id', prototypeId);
    }

    const viewsByDay = await viewsByDayQuery;

    // Views by prototype
    let viewsByPrototypeQuery = db('link_views')
      .leftJoin('prototypes', 'link_views.prototype_id', 'prototypes.id')
      .where('link_views.viewed_at', '>=', cutoff)
      .select('link_views.prototype_id', 'prototypes.title')
      .count('link_views.* as viewCount')
      .groupBy('link_views.prototype_id', 'prototypes.title')
      .orderBy('viewCount', 'desc');

    const viewsByPrototype = await viewsByPrototypeQuery;

    // Unique viewers
    let uniqueViewersQuery = db('link_views')
      .where('viewed_at', '>=', cutoff)
      .distinct('ip_address');

    if (prototypeId) {
      uniqueViewersQuery = uniqueViewersQuery.where('prototype_id', prototypeId);
    }

    const uniqueViewersData = await uniqueViewersQuery;
    const uniqueViewers = uniqueViewersData.length;

    // Feedback by category
    let feedbackByCategoryQuery = db('prospect_feedback')
      .where('created_at', '>=', cutoff)
      .select('category')
      .count('* as count')
      .groupBy('category')
      .orderBy('count', 'desc');

    if (prototypeId) {
      feedbackByCategoryQuery = feedbackByCategoryQuery.where('prototype_id', prototypeId);
    }

    const feedbackByCategory = await feedbackByCategoryQuery;

    // Rating distribution
    let ratingDistQuery = db('prospect_feedback')
      .where('created_at', '>=', cutoff)
      .whereNotNull('rating')
      .select('rating')
      .count('* as count')
      .groupBy('rating')
      .orderBy('rating');

    if (prototypeId) {
      ratingDistQuery = ratingDistQuery.where('prototype_id', prototypeId);
    }

    const ratingData = await ratingDistQuery;
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0;
    }
    ratingData.forEach(row => {
      ratingDistribution[row.rating] = row.count;
    });

    // Recent views (last 20)
    let recentViewsQuery = db('link_views')
      .leftJoin('magic_links', 'link_views.magic_link_id', 'magic_links.id')
      .leftJoin('prototypes', 'link_views.prototype_id', 'prototypes.id')
      .where('link_views.viewed_at', '>=', cutoff)
      .select(
        'link_views.id',
        'link_views.viewed_at',
        'link_views.ip_address',
        'magic_links.label',
        'prototypes.title'
      )
      .orderBy('link_views.viewed_at', 'desc')
      .limit(20);

    if (prototypeId) {
      recentViewsQuery = recentViewsQuery.where('link_views.prototype_id', prototypeId);
    }

    const recentViews = await recentViewsQuery;

    // Conversion funnel
    let totalViewsQuery = db('link_views').where('viewed_at', '>=', cutoff);
    let feedbackCountQuery = db('prospect_feedback').where('created_at', '>=', cutoff);
    let accessRequestCountQuery = db('prototype_access_requests').where('created_at', '>=', cutoff);

    if (prototypeId) {
      totalViewsQuery = totalViewsQuery.where('prototype_id', prototypeId);
      feedbackCountQuery = feedbackCountQuery.where('prototype_id', prototypeId);
      accessRequestCountQuery = accessRequestCountQuery.where('prototype_id', prototypeId);
    }

    const totalViewsResult = await totalViewsQuery.count('* as count').first();
    const feedbackCountResult = await feedbackCountQuery.count('* as count').first();
    const accessRequestCountResult = await accessRequestCountQuery.count('* as count').first();

    const conversionFunnel = {
      totalViews: totalViewsResult.count,
      uniqueViewers: uniqueViewers,
      feedbackCount: feedbackCountResult.count,
      accessRequestCount: accessRequestCountResult.count,
    };

    res.json({
      viewsByDay,
      viewsByPrototype,
      uniqueViewers,
      feedbackByCategory,
      ratingDistribution,
      recentViews,
      conversionFunnel,
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/prospects - Prospect analytics
router.get('/analytics/prospects', authenticate, requireAdmin, async (req, res) => {
  try {
    const prospects = await db('link_views')
      .whereNotNull('prospect_email')
      .select(
        'prospect_email as email',
        'prospect_name as name',
        'prospect_company as company'
      )
      .count('* as viewCount')
      .max('viewed_at as lastSeen')
      .groupBy('prospect_email')
      .orderBy('viewCount', 'desc');

    // Get distinct prototypes viewed per prospect
    const prospectProtoMap = {};

    const protoViews = await db('link_views')
      .whereNotNull('prospect_email')
      .select('prospect_email', 'prototype_id')
      .distinct();

    protoViews.forEach(row => {
      if (!prospectProtoMap[row.prospect_email]) {
        prospectProtoMap[row.prospect_email] = [];
      }
      if (!prospectProtoMap[row.prospect_email].includes(row.prototype_id)) {
        prospectProtoMap[row.prospect_email].push(row.prototype_id);
      }
    });

    // Enrich prospects with prototype count
    const enrichedProspects = prospects.map(prospect => ({
      ...prospect,
      prototypesViewed: prospectProtoMap[prospect.email] || [],
    }));

    res.json({ prospects: enrichedProspects });
  } catch (error) {
    console.error('Get prospect analytics error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /settings/slack - Get Slack settings
router.get('/settings/slack', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await db('app_settings')
      .whereIn('setting_key', ['slack_webhook_url', 'slack_events'])
      .select('setting_key', 'setting_value');

    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const webhookUrl = settingsMap.slack_webhook_url || '';
    const maskedUrl = webhookUrl ? `...${webhookUrl.slice(-6)}` : '';
    const events = settingsMap.slack_events ? JSON.parse(settingsMap.slack_events) : [];

    res.json({
      webhookUrl: maskedUrl,
      events,
      configured: !!webhookUrl,
    });
  } catch (error) {
    console.error('Get Slack settings error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /settings/slack - Update Slack settings
router.post('/settings/slack', authenticate, requireAdmin, [
  body('webhookUrl').optional().isString(),
  body('events').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { webhookUrl, events } = req.body;

    if (webhookUrl) {
      await db('app_settings')
        .where('setting_key', 'slack_webhook_url')
        .del();
      await db('app_settings').insert({
        id: require('crypto').randomBytes(8).toString('hex'),
        setting_key: 'slack_webhook_url',
        setting_value: webhookUrl,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (events && Array.isArray(events)) {
      await db('app_settings')
        .where('setting_key', 'slack_events')
        .del();
      await db('app_settings').insert({
        id: require('crypto').randomBytes(8).toString('hex'),
        setting_key: 'slack_events',
        setting_value: JSON.stringify(events),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await createAuditLog(
      req.user.id,
      'settings:slack-update',
      'settings',
      'slack',
      { webhookUpdated: !!webhookUrl, eventsUpdated: !!events },
      req.ip
    );

    res.json({ message: 'Slack settings updated' });
  } catch (error) {
    console.error('Update Slack settings error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /settings/slack/test - Test Slack notification
router.post('/settings/slack/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const success = await sendSlackNotification('test', { message: 'Test notification from admin panel' });

    res.json({ success });
  } catch (error) {
    console.error('Test Slack notification error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /settings/default-branding - Get default branding settings
router.get('/settings/default-branding', authenticate, requireAdmin, async (req, res) => {
  try {
    const setting = await db('app_settings')
      .where('setting_key', 'default_branding')
      .first();

    const branding = setting ? JSON.parse(setting.setting_value) : null;

    res.json({ branding });
  } catch (error) {
    console.error('Get default branding error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /settings/default-branding - Update default branding settings
router.post('/settings/default-branding', authenticate, requireAdmin, [
  body('branding').isObject(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { branding } = req.body;

    await db('app_settings')
      .where('setting_key', 'default_branding')
      .del();

    await db('app_settings').insert({
      id: require('crypto').randomBytes(8).toString('hex'),
      setting_key: 'default_branding',
      setting_value: JSON.stringify(branding),
      created_at: new Date(),
      updated_at: new Date(),
    });

    await createAuditLog(
      req.user.id,
      'settings:branding-update',
      'settings',
      'default_branding',
      branding,
      req.ip
    );

    res.json({ message: 'Default branding updated' });
  } catch (error) {
    console.error('Update default branding error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
