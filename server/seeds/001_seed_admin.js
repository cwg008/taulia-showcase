const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Check if admin already exists
  const adminExists = await knex('users').where('email', 'admin@taulia.com').first();
  if (adminExists) {
    return;
  }

  const adminId = 'admin-001';
  const password = await bcrypt.hash('Taulia26!', 10);

  // Insert admin user
  await knex('users').insert({
    id: adminId,
    email: 'admin@taulia.com',
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
  const proto3Id = 'proto-003';

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
      is_top_secret: false,
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
      is_top_secret: false,
      created_by: adminId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: proto3Id,
      title: 'AI-Powered Invoice Matching',
      description: 'Next-gen invoice matching using machine learning to automatically reconcile invoices with POs',
      slug: 'ai-invoice-matching',
      status: 'published',
      type: 'prototype',
      file_path: '/uploads/prototypes/proto-003/index.html',
      thumbnail_path: null,
      version: 1,
      is_top_secret: true,
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
    {
      id: 'link-003',
      token: require('crypto').randomBytes(32).toString('hex'),
      prototype_id: proto3Id,
      label: 'Preview - AI Invoice Matching',
      created_by: adminId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_revoked: false,
      view_count: 0,
      created_at: new Date(),
    },
  ]);

  // Insert sample feedback for proto-001
  await knex('prospect_feedback').insert([
    {
      id: 'feedback-001',
      prototype_id: proto1Id,
      magic_link_id: 'link-001',
      category: 'general-feedback",
      message: 'Really impressed with the early payment dashboard! The UI is clean and intuitive. Would love to see more filtering options.',
      contact_email: 'jane.smith@acme.com',
      rating: 5,
      reviewer_name: 'Jane Smith',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'feedback-002',
      prototype_id: proto1Id,
      magic_link_id: 'link-001',
      category: 'feature-request',
      message: 'It would be great to have an export-to-CSV feature for the payment data. Our finance team needs this for reporting.',
      contact_email: 'bob.johnson@acme.com',
      rating: 4,
      reviewer_name: 'Bob Johnson',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'feedback-003',
      prototype_id: proto2Id,
      magic_link_id: 'link-002',
      category: 'general-feedback',
      message: 'The supplier portal redesign looks modern and user-friendly. Much better than the current version.',
      contact_email: null,
      rating: 4,
      reviewer_name: 'Anonymous Reviewer',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ]);
};