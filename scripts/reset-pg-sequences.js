#!/usr/bin/env node
/**
 * Reset PostgreSQL serial sequences to MAX(id) after seeds with explicit IDs.
 * No-op on SQLite. Safe to run on every deploy.
 */

const knex = require('../db/knex');

const TABLES = [
  'merchants',
  'customers',
  'menu_categories',
  'menu_items',
  'modifiers',
  'menus',
  'orders',
  'line_items',
  'receipts',
];

async function resetSequences() {
  const client = knex.client.config.client;
  if (client !== 'postgresql' && client !== 'postgres') {
    return;
  }

  for (const table of TABLES) {
    try {
      await knex.raw(`
        SELECT setval(
          pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1),
          true
        )
      `);
    } catch (err) {
      if (!/does not exist|pg_get_serial_sequence|null/i.test(String(err.message))) {
        console.warn(`[reset-pg-sequences] ${table}: ${err.message}`);
      }
    }
  }
}

resetSequences()
  .then(() => knex.destroy())
  .catch((err) => {
    console.error('[reset-pg-sequences] Failed:', err.message);
    knex.destroy();
    process.exit(1);
  });
