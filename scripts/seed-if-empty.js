#!/usr/bin/env node
/**
 * Run knex seeds when the merchants table is empty (first deploy / fresh DB).
 * No-op when merchants already exist. Set SKIP_SEED=1 to disable.
 */

const { execSync } = require('child_process');
const knex = require('../db/knex');

async function main() {
  if (process.env.SKIP_SEED === '1') {
    console.log('[seed-if-empty] SKIP_SEED=1, skipping');
    return;
  }

  let count = 0;
  try {
    const row = await knex('merchants').count('* as c').first();
    count = Number(row?.c ?? 0);
  } catch (err) {
    console.error('[seed-if-empty] Could not count merchants:', err.message);
    process.exit(1);
  } finally {
    await knex.destroy();
  }

  if (count > 0) {
    console.log(`[seed-if-empty] ${count} merchant(s) present, skipping seeds`);
    return;
  }

  console.log('[seed-if-empty] Empty merchants table — running seeds...');
  execSync('npx knex seed:run --knexfile db/knexfile.js', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[seed-if-empty] Seed data loaded');
}

main().catch((err) => {
  console.error('[seed-if-empty] Failed:', err);
  process.exit(1);
});
