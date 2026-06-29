const path = require('path');

const useSqlite = process.env.DB_CLIENT === 'sqlite3';

const migrations = {
  directory: path.join(__dirname, 'migrations'),
  tableName: 'knex_migrations',
};

const seeds = {
  directory: path.join(__dirname, 'seeds'),
};

const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, process.env.DB_FILENAME || './eggrollpos.db'),
  },
  useNullAsDefault: true,
  migrations,
  seeds,
};

const postgresConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'eggrollpos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations,
  seeds,
};

function productionConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return connectionString;
  }

  const sslDisabled = process.env.DATABASE_SSL === 'false';
  const sslRequired =
    !sslDisabled &&
    (process.env.DATABASE_SSL === 'true' ||
      /sslmode=require|neon\.tech|supabase\.co/i.test(connectionString));

  if (sslRequired) {
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
    };
  }

  return connectionString;
}

module.exports = {
  development: useSqlite ? sqliteConfig : postgresConfig,
  test: useSqlite ? sqliteConfig : postgresConfig,
  production: {
    client: 'postgresql',
    connection: productionConnection(),
    pool: {
      min: 0,
      max: 10,
    },
    migrations,
    seeds,
  },
};
