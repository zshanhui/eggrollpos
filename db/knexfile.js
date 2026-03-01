const path = require('path');

const useSqlite = process.env.DB_CLIENT === 'sqlite3';

const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, process.env.DB_FILENAME || './eggrollpos.db'),
  },
  useNullAsDefault: true,
};

const postgresConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'eggrollpos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
};

module.exports = {
  development: useSqlite ? sqliteConfig : postgresConfig,
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
