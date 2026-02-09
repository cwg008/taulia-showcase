exports.up = function(knex) {
  return knex.schema
    .table('magic_links', function(table) {
      table.string('recipient_email').nullable();
    })
    .createTable('feedback', function(table) {
      table.increments('id').primary();
      table.integer('prototype_id').notNullable().references('id').inTable('prototypes').onDelete('CASCADE');
      table.integer('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.integer('magic_link_id').nullable().references('id').inTable('magic_links').onDelete('SET NULL');
      table.text('comment').notNullable();
      table.integer('rating').nullable(); // 1-5 stars
      table.string('category').nullable(); // e.g. 'ui', 'navigation', 'feature', 'general'
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('feedback')
    .table('magic_links', function(table) {
      table.dropColumn('recipient_email');
    });
};
