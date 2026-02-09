const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Check if admin already exists
  const adminExists = await knex('users').where('email', 'admin@example.com').first();
  if (adminExists) {
    return;
  }

  const adminId = 'admin-001';
  const password = await bcrypt.hash('password123', 10);

  // Insert admin user
  await knex('users').insert({
    id: adminId,
    email: 'admin@example.com',
    name: 'Admin User',
    password_hash: password,
    role: 'admin',
    is_active: true,
    invite_token: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Insert sample prototypes
  const proto1Id = 'proto-001';
  const proto2Id = 'proto-002';

  await knex('prototypes').insert([
    {
      id: proto1Id,
      title: 'Early Payment Dashboard',
      description: 'Interactive dashboard for early payment solutions',
      slug: 'early-payment-dashboard',
      status: 'published',
      type: 'prototype',
      file_path: '/uploads/prototypes/proto-001/index.html',
      thumbnail_path: null,
      version: 1,
      created_by: adminId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: proto2Id,
      title: 'Supplier Portal Redesign',
      description: 'New supplier portal interface with improved UX',
      slug: 'supplier-portal-redesign',
      status: 'published',
      type: 'prototype',
      file_path: '/uploads/prototypes/proto-002/index.html',
      thumbnail_path: null,
      version: 1,
      created_by: adminId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // Insert sample magic links
  await knex('magic_links').insert([
    {
      id: 'link-001',
      token: require('crypto').randomBytes(32).toString('hex'),
      prototype_id: proto1Id,
      label: 'Client Demo - Early Payment',
      created_by: adminId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_revoked: false,
      view_count: 0,
      created_at: new Date(),
    },
    {
      id: 'link-002',
      token: require('crypto').randomBytes(32).toString('hex'),
      prototype_id: proto2Id,
      label: 'Supplier Review - Portal Redesign',
      created_by: adminId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_revoked: false,
      view_count: 0,
      created_at: new Date(),
    },
  ]);
};
