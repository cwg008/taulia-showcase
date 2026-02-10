exports.up = function(knex) {
  return knex.schema.alterTable('prospect_feedback', function(table) {
    table.integer('rating').nullable(); // 1-5 star rating
    table.string('reviewer_name').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('prospect_feedback', function(table) {
    table.dropColumn('rating');
    table.dropColumn('reviewer_name');
  });
};
