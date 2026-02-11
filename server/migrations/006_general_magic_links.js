exports.up = function(knex) {
  // SQLite doesn't support ALTER COLUMN to change nullability,
  // so we recreate the magic_links table with prototype_id nullable.
  // A NULL prototype_id indicates a "homepage" link that shows all published prototypes.
  return knex.raw('PRAGMA foreign_keys = OFF')
    .then(() => knex.raw(`
      CREATE TABLE magic_links_new (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        prototype_id TEXT,
        label TEXT NOT NULL,
        created_by TEXT NOT NULL,
        expires_at DATETIME,
        is_revoked INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prototype_id) REFERENCES prototypes(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `))
    .then(() => knex.raw(`
      INSERT INTO magic_links_new (id, token, prototype_id, label, created_by, expires_at, is_revoked, view_count, created_at)
      SELECT id, token, prototype_id, label, created_by, expires_at, is_revoked, view_count, created_at
      FROM magic_links
    `))
    .then(() => knex.raw('DROP TABLE magic_links'))
    .then(() => knex.raw('ALTER TABLE magic_links_new RENAME TO magic_links'))
    .then(() => knex.raw('PRAGMA foreign_keys = ON'));
};

exports.down = function(knex) {
  // Revert: make prototype_id NOT NULL again (drops any homepage links)
  return knex.raw('PRAGMA foreign_keys = OFF')
    .then(() => knex.raw(`
      CREATE TABLE magic_links_old (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        prototype_id TEXT NOT NULL,
        label TEXT NOT NULL,
        created_by TEXT NOT NULL,
        expires_at DATETIME,
        is_revoked INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prototype_id) REFERENCES prototypes(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `))
    .then(() => knex.raw(`
      INSERT INTO magic_links_old (id, token, prototype_id, label, created_by, expires_at, is_revoked, view_count, created_at)
      SELECT id, token, prototype_id, label, created_by, expires_at, is_revoked, view_count, created_at
      FROM magic_links WHERE prototype_id IS NOT NULL
    `))
    .then(() => knex.raw('DROP TABLE magic_links'))
    .then(() => knex.raw('ALTER TABLE magic_links_old RENAME TO magic_links'))
    .then(() => knex.raw('PRAGMA foreign_keys = ON'));
};
