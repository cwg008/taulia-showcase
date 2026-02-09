exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('password_hash').nullable();
      table.string('name').notNullable();
      table.string('role').defaultTo('admin');
      table.boolean('is_active').defaultTo(true);
      table.string('invite_token').nullable();
      table.timestamp('invite_expires').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('prototypes', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description').nullable();
      table.string('slug').unique().notNullable();
      table.string('status').defaultTo('draft');
      table.string('type').notNullable();
      table.string('file_path').notNullable();
      table.string('thumbnail_path').nullable();
      table.string('version').defaultTo('1.0');
      table.integer('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('magic_links', function(table) {
      table.increments('id').primary();
      table.string('token').unique().notNullable();
      table.integer('prototype_id').references('id').inTable('prototypes').onDelete('CASCADE');
      table.string('label').nullable();
      table.integer('created_by').references('id').inTable('users');
      table.timestamp('expires_at').nullable();
      table.boolean('is_revoked').defaultTo(false);
      table.integer('view_count').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('link_views', function(table) {
      table.increments('id').primary();
      table.integer('magic_link_id').references('id').inTable('magic_links').onDelete('CASCADE');
      table.integer('prototype_id').references('id').inTable('prototypes').onDelete('CASCADE');
      table.string('ip_address');
      table.string('user_agent', 500);
      table.timestamp('viewed_at').defaultTo(knex.fn.now());
    })
    .createTable('audit_logs', function(table) {
      table.increments('id').primary();
      table.integer('user_id').nullable().references('id').inTable('users');
      table.string('action').notNullable();
      table.string('resource').nullable();
      table.string('method').nullable();
      table.integer('status_code').nullable();
      table.string('ip_address').nullable();
      table.string('user_agent', 500).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('link_views')
    .dropTableIfExists('magic_links')
    .dropTableIfExists('prototypes')
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('users');
};
