const knex = require('knex');
const path = require('path');

const dbClient = process.env.DB_CLIENT || 'sqlite3';

let connection;
if (dbClient === 'pg') {
  // PostgreSQL (production)
  connection = process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'taulia',
    password: process.env.DB_PASSWORD || 'taulia',
    database: process.env.DB_NAME || 'taulia_showcase',
  };
} else {
  // SQLite (development)
  connection = {
    filename: path.join(__dirname, '..', process.env.DB_FILE || 'dev.sqlite3'),
  };
}

const db = knex({
  client: dbClient === 'pg' ? 'pg' : 'sqlite3',
  connection,
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '..', 'migrations'),
  },
  seeds: {
    directory: path.join(__dirname, '..', 'seeds'),
  },
  pool: dbClient === 'pg' ? { min: 2, max: 10 } : undefined,
});

module.exports = { db };
