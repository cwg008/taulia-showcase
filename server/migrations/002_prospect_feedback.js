exports.up = function(knex) {
  return knex.schema.createTable('prospect_feedback', function(table) {
    table.string('id').primary();
    table.string('prototype_id').notNullable();
    table.string('magic_link_id').notNullable();
    table.enum('category', ['feature-request', 'bug-report', 'general-feedback', 'other']).notNullable();
    table.text('message').notNullable();
    table.string('contact_email').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('prototype_id').references('prototypes.id');
    table.foreign('magic_link_id').references('magic_links.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('prospect_feedback');
};
