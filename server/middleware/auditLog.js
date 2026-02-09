const db = require('../config/database');

const createAuditLog = async (userId, action, resourceType, resourceId, details, ipAddress) => {
  try {
    await db('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: JSON.stringify(details || {}),
      ip_address: ipAddress,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
  }
};

module.exports = { createAuditLog };
