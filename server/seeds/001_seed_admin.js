const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.seed = async function(knex) {
  // Truncate tables in correct order
  await knex('feedback').del().catch(() => {});
  await knex('link_views').del();
  await knex('magic_links').del();
  await knex('prototypes').del();
  await knex('audit_logs').del();
  await knex('users').del();

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('T@ulia2025!', 12);
  const prospectPasswordHash = await bcrypt.hash('Prospect2025!', 12);

  // Insert admin user
  const [adminUserId] = await knex('users').insert({
    email: 'admin@taulia.com',
    password_hash: adminPasswordHash,
    name: 'Taulia Admin',
    role: 'admin',
    is_active: true,
  });

  // Insert prospect (customer) user
  const [prospectUserId] = await knex('users').insert({
    email: 'prospect@acme.com',
    password_hash: prospectPasswordHash,
    name: 'Jordan Rivera',
    role: 'prospect',
    is_active: true,
  });

  // Insert sample prototypes
  const [proto1Id] = await knex('prototypes').insert({
    title: 'Early Payment Offers Redesign',
    description: 'New UI for the early payment offers workflow with improved filtering and batch actions.',
    slug: 'early-payment-offers-redesign',
    status: 'published',
    type: 'html',
    file_path: 'prototypes/1/index.html',
    version: '1.0',
    created_by: adminUserId,
  });

  const [proto2Id] = await knex('prototypes').insert({
    title: 'Supplier Portal Dashboard',
    description: 'Redesigned supplier portal with real-time payment status tracking and analytics.',
    slug: 'supplier-portal-dashboard',
    status: 'published',
    type: 'html',
    file_path: 'prototypes/2/index.html',
    version: '0.9',
    created_by: adminUserId,
  });

  // Create magic links shared with the prospect
  const token1 = crypto.randomBytes(32).toString('hex');
  const token2 = crypto.randomBytes(32).toString('hex');

  await knex('magic_links').insert([
    {
      token: token1,
      prototype_id: proto1Id,
      label: 'Acme Corp - Early Payment Demo',
      created_by: adminUserId,
      recipient_email: 'prospect@acme.com',
      is_revoked: false,
      view_count: 0,
    },
    {
      token: token2,
      prototype_id: proto2Id,
      label: 'Acme Corp - Supplier Portal Preview',
      created_by: adminUserId,
      recipient_email: 'prospect@acme.com',
      is_revoked: false,
      view_count: 0,
    },
  ]);
};
