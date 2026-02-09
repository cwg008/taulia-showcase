exports.up = function(knex) {
  return Promise.all([
    // Users table
    knex.schema.createTable('users', function(table) {
      table.string('id').primary();
      table.string('email').unique().notNullable();
      table.string('name').notNullable();
      table.string('password_hash').nullable();
      table.enum('role', ['admin', 'viewer']).defaultTo('viewer');
      table.boolean('is_active').defaultTo(false);
      table.string('invite_token').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    }),

    // Prototypes table
    knex.schema.createTable('prototypes', function(table) {
      table.string('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('slug').notNullable();
      table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
      table.string('type').notNullable();
      table.string('file_path').nullable();
      table.string('thumbnail_path').nullable();
      table.integer('version').defaultTo(1);
      table.string('created_by').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.foreign('created_by').references('users.id');
    }),

    // Magic links table
    knex.schema.createTable('magic_links', function(table) {
      table.string('id').primary();
      table.string('token').unique().notNullable();
      table.string('prototype_id').notNullable();
      table.string('label').notNullable();
      table.string('created_by').notNullable();
      table.timestamp('expires_at').nullable();
      table.boolean('is_revoked').defaultTo(false);
      table.integer('view_count').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('prototype_id').references('prototypes.id');
      table.foreign('created_by').references('users.id');
    }),

    // Link views table
    knex.schema.createTable('link_views', function(table) {
      table.string('id').primary();
      table.string('magic_link_id').notNullable();
      table.string('prototype_id').notNullable();
      table.string('ip_address').nullable();
      table.string('user_agent').nullable();
      table.timestamp('viewed_at').defaultTo(knex.fn.now());
      table.foreign('magic_link_id').references('magic_links.id');
      table.foreign('prototype_id').references('prototypes.id');
    }),

    // Audit logs table
    knex.schema.createTable('audit_logs', function(table) {
      table.string('id').primary();
      table.string('user_id').nullable();
      table.string('action').notNullable();
      table.string('resource_type').notNullable();
      table.string('resource_id').notNullable();
      table.text('details').nullable();
      table.string('ip_address').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('user_id').references('users.id');
    }),
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('audit_logs'),
    knex.schema.dropTableIfExists('link_views'),
    knex.schema.dropTableIfExists('magic_links'),
    knex.schema.dropTableIfExists('prototypes'),
    knex.schema.dropTableIfExists('users'),
  ]);
};
