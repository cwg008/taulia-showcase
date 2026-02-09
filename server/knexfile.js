require('dotenv').config();
const path = require('path');

const parseDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.DB_CLIENT === 'pg') {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'taulia_showcase',
    };
  }

  return {
    filename: process.env.DB_FILE || path.join(__dirname, 'dev.sqlite3'),
  };
};

module.exports = {
  development: {
    client: process.env.DB_CLIENT || 'sqlite3',
    connection: parseDatabaseUrl(),
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    useNullAsDefault: true,
  },

  production: {
    client: process.env.DB_CLIENT || 'pg',
    connection: parseDatabaseUrl(),
    migrations: { directory: './migrations',},
    seeds: { directory: './seeds', },
    useNullAsDefault: (process.env.DB_CLIENT || 'pg') === 'sqlite3',
  },
};
