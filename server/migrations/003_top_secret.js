exports.up = function(knex) {
  return knex.schema.alterTable('prototypes', function(table) {
    table.boolean('is_top_secret').defaultTo(false);
  }).then(() => {
    return knex.schema.createTable('prototype_access_requests', function(table) {
      table.string('id').primary();
      table.string('prototype_id').notNullable();
      table.string('magic_link_id').notNullable();
      table.string('requester_name').notNullable();
      table.string('requester_email').notNullable();
      table.string('requester_company').nullable();
      table.text('reason').nullable();
      table.enum('status', ['pending', 'approved', 'denied']).defaultTo('pending');
      table.string('reviewed_by').nullable();
      table.timestamp('reviewed_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.foreign('prototype_id').references('prototypes.id');
      table.foreign('magic_link_id').references('magic_links.id');
      table.foreign('reviewed_by').references('users.id');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('prototype_access_requests').then(() => {
    return knex.schema.alterTable('prototypes', function(table) {
      table.dropColumn('is_top_secret');
    });
  });
};
