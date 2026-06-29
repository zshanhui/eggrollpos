#!/usr/bin/env node
/**
 * Run knex seeds when the DB has no demo data yet, or demo seed failed partway.
 * Set SKIP_SEED=1 to disable.
 */

const { execSync } = require('child_process');
const knex = require('../db/knex');

const DEMO_MERCHANT_HASH = 'mc_n1c0ffee';

async function shouldRunSeeds() {
  const merchantCount = Number((await knex('merchants').count('* as c').first())?.c ?? 0);
  if (merchantCount === 0) {
    return { run: true, reason: 'empty merchants table' };
  }

  const menuItemCount = Number((await knex('menu_items').count('* as c').first())?.c ?? 0);
  const demoMerchant = await knex('merchants').where('hash_id', DEMO_MERCHANT_HASH).first();

  if (demoMerchant && menuItemCount === 0) {
    return { run: true, reason: 'demo merchant present but menu_items empty (incomplete seed)' };
  }

  return { run: false, reason: `${merchantCount} merchant(s), ${menuItemCount} menu item(s)` };
}

async function main() {
  if (process.env.SKIP_SEED === '1') {
    console.log('[seed-if-empty] SKIP_SEED=1, skipping');
    return;
  }

  let decision;
  try {
    decision = await shouldRunSeeds();
  } catch (err) {
    console.error('[seed-if-empty] Could not inspect database:', err.message);
    process.exit(1);
  } finally {
    await knex.destroy();
  }

  if (!decision.run) {
    console.log(`[seed-if-empty] Skipping seeds (${decision.reason})`);
    return;
  }

  console.log(`[seed-if-empty] ${decision.reason} — running seeds...`);
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
