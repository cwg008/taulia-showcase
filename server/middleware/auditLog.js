const { db } = require('../config/database');

function auditLog(req, res, next) {
  // Capture the original end method
  const originalEnd = res.end;

  res.end = function (...args) {
    // Log after response is sent
    const logEntry = {
      user_id: req.user?.id || null,
      action: deriveAction(req),
      resource: req.originalUrl,
      method: req.method,
      status_code: res.statusCode,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent']?.substring(0, 500),
    };

    // Fire and forget - don't block response
    db('audit_logs').insert(logEntry).catch(err => {
      console.error('Audit log error:', err.message);
    });

    originalEnd.apply(res, args);
  };

  next();
}

function deriveAction(req) {
  const path = req.originalUrl;
  if (path.includes('/auth/login')) return 'auth:login';
  if (path.includes('/auth/logout')) return 'auth:logout';
  if (path.includes('/auth/register') || path.includes('/auth/accept-invite')) return 'auth:register';
  if (path.includes('/admin')) return 'admin:access';
  if (path.includes('/prototypes')) return 'prototype:manage';
  if (path.includes('/links')) return 'link:manage';
  if (path.includes('/viewer')) return 'viewer:access';
  return 'general';
}

module.exports = auditLog;
