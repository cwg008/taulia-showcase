exports.up = function(knex) {
  return knex.schema.createTable('user_prototype_access', function(table) {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('prototype_id').notNullable();
    table.string('assigned_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('prototype_id').references('prototypes.id').onDelete('CASCADE');
    table.foreign('assigned_by').references('users.id');
    table.unique(['user_id', 'prototype_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_prototype_access');
};
