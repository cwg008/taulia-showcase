/**
 * Migration 007: v1.4.0 Enhancements
 *
 * Adds:
 * - password_hash + branding_config columns to magic_links
 * - prospect identity columns to link_views
 * - prototype_annotations table
 * - app_settings table
 */

exports.up = async function(knex) {
  // 1. Add columns to magic_links
  const hasPwHash = await knex.schema.hasColumn('magic_links', 'password_hash');
  if (!hasPwHash) {
    await knex.schema.alterTable('magic_links', (table) => {
      table.string('password_hash').nullable();
      table.text('branding_config').nullable(); // JSON string
    });
  }

  // 2. Add prospect identity columns to link_views
  const hasProspectName = await knex.schema.hasColumn('link_views', 'prospect_name');
  if (!hasProspectName) {
    await knex.schema.alterTable('link_views', (table) => {
      table.string('prospect_name').nullable();
      table.string('prospect_email').nullable();
      table.string('prospect_company').nullable();
      table.integer('duration_seconds').nullable();
    });
  }

  // 3. Create prototype_annotations table
  const hasAnnotations = await knex.schema.hasTable('prototype_annotations');
  if (!hasAnnotations) {
    await knex.schema.createTable('prototype_annotations', (table) => {
      table.string('id').primary();
      table.string('prototype_id').notNullable();
      table.string('title').notNullable();
      table.text('description').nullable();
      table.integer('x_percent').notNullable().defaultTo(50);
      table.integer('y_percent').notNullable().defaultTo(50);
      table.integer('step_order').notNullable().defaultTo(1);
      table.string('page_path').notNullable().defaultTo('index.html');
      table.string('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('prototype_id').references('prototypes.id').onDelete('CASCADE');
      table.foreign('created_by').references('users.id').onDelete('SET NULL');
      table.index(['prototype_id', 'step_order']);
    });
  }

  // 4. Create app_settings table
  const hasSettings = await knex.schema.hasTable('app_settings');
  if (!hasSettings) {
    await knex.schema.createTable('app_settings', (table) => {
      table.string('id').primary();
      table.string('setting_key').unique().notNullable();
      table.text('setting_value').nullable(); // JSON string
      table.text('description').nullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  // Drop new tables
  await knex.schema.dropTableIfExists('prototype_annotations');
  await knex.schema.dropTableIfExists('app_settings');

  // Remove added columns from link_views
  const hasProspectName = await knex.schema.hasColumn('link_views', 'prospect_name');
  if (hasProspectName) {
    // SQLite doesn't support DROP COLUMN directly in older versions
    // For safety, we'll use a try-catch
    try {
      await knex.schema.alterTable('link_views', (table) => {
        table.dropColumn('prospect_name');
        table.dropColumn('prospect_email');
        table.dropColumn('prospect_company');
        table.dropColumn('duration_seconds');
      });
    } catch (e) {
      console.log('Could not drop link_views columns (SQLite limitation):', e.message);
    }
  }

  // Remove added columns from magic_links
  const hasPwHash = await knex.schema.hasColumn('magic_links', 'password_hash');
  if (hasPwHash) {
    try {
      await knex.schema.alterTable('magic_links', (table) => {
        table.dropColumn('password_hash');
        table.dropColumn('branding_config');
      });
    } catch (e) {
      console.log('Could not drop magic_links columns (SQLite limitation):', e.message);
    }
  }
};
