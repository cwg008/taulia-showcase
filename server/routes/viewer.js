const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const router = express.Router();

// Helper: validate a magic link (exists, not revoked, not expired)
async function validateMagicLink(token) {
  const link = await db('magic_links')
    .where('token', token)
    .first();

  if (!link) return { error: 'Invalid link', status: 404 };
  if (link.is_revoked) return { error: 'Link has been revoked', status: 403 };
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: 'Link has expired', status: 403 };
  }
  return { link };
}

// Helper: check top-secret access for a magic link + specific prototype
async function checkTopSecretAccess(prototype, link) {
  if (!prototype.is_top_secret) return true;

  const accessRequest = await db('prototype_access_requests')
    .where('magic_link_id', link.id)
    .where('prototype_id', prototype.id)
    .where('status', 'approved')
    .first();

  return !!accessRequest;
}

// Helper: serve a prototype file with security checks
function servePrototypeFile(prototype, filePath, res) {
  const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'prototypes', prototype.id);

  // Reject obvious traversal attempts before path resolution
  if (filePath.includes('..') || filePath.includes('\0')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const fullPath = path.resolve(uploadsDir, filePath);

  // Security: strict directory containment check using normalized paths
  const normalizedUploads = uploadsDir + path.sep;
  if (!fullPath.startsWith(normalizedUploads) && fullPath !== uploadsDir) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Additional safety: verify the prototype ID segment hasn't been escaped
  const relPath = path.relative(uploadsDir, fullPath);
  if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set security headers for served files
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
  res.sendFile(fullPath);
}

// GET /:token - Validate magic link and return prototype metadata (or homepage type)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await validateMagicLink(token);
    if (result.error) return res.status(result.status).json({ error: result.error });
    const { link } = result;

    // Homepage link: prototype_id is null
    if (!link.prototype_id) {
      // Record view for homepage link
      await db('link_views').insert({
        id: require('crypto').randomBytes(8).toString('hex'),
        magic_link_id: link.id,
        prototype_id: 'homepage',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        viewed_at: new Date(),
      });
      await db('magic_links').where('id', link.id).increment('view_count', 1);

      return res.json({
        type: 'homepage',
        link: {
          id: link.id,
          label: link.label,
        },
      });
    }

    // Single-prototype link
    const prototype = await db('prototypes')
      .where('id', link.prototype_id)
      .first();

    if (!prototype || prototype.status !== 'published') {
      return res.status(404).json({ error: 'Prototype not found or not published' });
    }

    // Check top-secret access
    const isTopSecret = !!prototype.is_top_secret;
    let accessGranted = true;
    let accessStatus = 'approved';

    if (isTopSecret) {
      const accessRequest = await db('prototype_access_requests')
        .where('magic_link_id', link.id)
        .where('prototype_id', prototype.id)
        .orderBy('created_at', 'desc')
        .first();

      accessStatus = accessRequest ? accessRequest.status : null;
      accessGranted = accessStatus === 'approved';
    }

    // Only record view if access is granted
    if (accessGranted) {
      await db('link_views').insert({
        id: require('crypto').randomBytes(8).toString('hex'),
        magic_link_id: link.id,
        prototype_id: prototype.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        viewed_at: new Date(),
      });

      await db('magic_links').where('id', link.id).increment('view_count', 1);
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
      access: {
        status: accessStatus,
        granted: accessGranted,
      },
    });
  } catch (error) {
    console.error('Get viewer error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:token/homepage - Get all published prototypes for a homepage link
router.get('/:token/homepage', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await validateMagicLink(token);
    if (result.error) return res.status(result.status).json({ error: result.error });
    const { link } = result;

    if (link.prototype_id) {
      return res.status(400).json({ error: 'This is not a homepage link' });
    }

    // Fetch all published prototypes
    const prototypes = await db('prototypes')
      .where('status', 'published')
      .orderBy('created_at', 'desc');

    // Categorize into accessible and top-secret
    const accessible = [];
    const restricted = [];

    for (const proto of prototypes) {
      if (proto.is_top_secret) {
        // Check if this link has approved access to this prototype
        const accessRequest = await db('prototype_access_requests')
          .where('magic_link_id', link.id)
          .where('prototype_id', proto.id)
          .orderBy('created_at', 'desc')
          .first();

        restricted.push({
          id: proto.id,
          title: proto.title,
          description: proto.description,
          type: proto.type,
          version: proto.version,
          is_top_secret: true,
          accessStatus: accessRequest ? accessRequest.status : null,
          accessGranted: accessRequest ? accessRequest.status === 'approved' : false,
        });
      } else {
        accessible.push({
          id: proto.id,
          title: proto.title,
          description: proto.description,
          type: proto.type,
          version: proto.version,
          is_top_secret: false,
          accessGranted: true,
        });
      }
    }

    res.json({
      prototypes: accessible,
      restrictedPrototypes: restricted,
      link: {
        id: link.id,
        label: link.label,
      },
    });
  } catch (error) {
    console.error('Get homepage error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /:token/homepage/request-access - Submit access request for a prototype from homepage link
router.post('/:token/homepage/request-access', async (req, res) => {
  try {
    const { token } = req.params;
    const { prototypeId, name, email, company, reason } = req.body;

    if (!prototypeId || !name || !email) {
      return res.status(400).json({ error: 'prototypeId, name, and email are required' });
    }

    const result = await validateMagicLink(token);
    if (result.error) return res.status(result.status).json({ error: result.error });
    const { link } = result;

    if (link.prototype_id) {
      return res.status(400).json({ error: 'This is not a homepage link' });
    }

    // Validate prototype exists, is published, and is top-secret
    const prototype = await db('prototypes')
      .where('id', prototypeId)
      .first();

    if (!prototype || prototype.status !== 'published') {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    if (!prototype.is_top_secret) {
      return res.status(400).json({ error: 'This prototype does not require access requests' });
    }

    // Check for existing pending/approved request
    const existingRequest = await db('prototype_access_requests')
      .where('magic_link_id', link.id)
      .where('prototype_id', prototypeId)
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

    // Strip HTML for XSS prevention
    const stripHtml = (str) => {
      if (!str) return str;
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    };

    const requestId = require('crypto').randomBytes(8).toString('hex');

    await db('prototype_access_requests').insert({
      id: requestId,
      prototype_id: prototypeId,
      magic_link_id: link.id,
      requester_name: stripHtml(name),
      requester_email: email,
      requester_company: company ? stripHtml(company) : null,
      reason: reason ? stripHtml(reason) : null,
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
    console.error('Homepage request-access error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:token/homepage/serve/:prototypeId/* - Serve prototype files from a homepage link
router.get('/:token/homepage/serve/:prototypeId/*', async (req, res) => {
  try {
    const { token, prototypeId } = req.params;
    const filePath = req.params[0];

    const result = await validateMagicLink(token);
    if (result.error) return res.status(result.status).json({ error: result.error });
    const { link } = result;

    if (link.prototype_id) {
      return res.status(400).json({ error: 'This is not a homepage link' });
    }

    const prototype = await db('prototypes')
      .where('id', prototypeId)
      .first();

    if (!prototype || prototype.status !== 'published') {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Block serving files for top-secret prototypes without approved access
    const hasAccess = await checkTopSecretAccess(prototype, link);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access not granted. Please request access first.' });
    }

    servePrototypeFile(prototype, filePath, res);
  } catch (error) {
    console.error('Homepage serve file error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:token/serve/* - Serve static prototype files (single-prototype link)
router.get('/:token/serve/*', async (req, res) => {
  try {
    const { token } = req.params;
    const filePath = req.params[0];

    const result = await validateMagicLink(token);
    if (result.error) return res.status(result.status).json({ error: result.error });
    const { link } = result;

    if (!link.prototype_id) {
      return res.status(400).json({ error: 'This is a homepage link. Use /homepage/serve/ endpoint.' });
    }

    const prototype = await db('prototypes')
      .where('id', link.prototype_id)
      .first();

    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }

    // Block serving files for top-secret prototypes without approved access
    const hasAccess = await checkTopSecretAccess(prototype, link);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access not granted. Please request access first.' });
    }

    servePrototypeFile(prototype, filePath, res);
  } catch (error) {
    console.error('Serve file error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
