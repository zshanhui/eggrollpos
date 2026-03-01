#!/usr/bin/env node
/**
 * Admin script to create new merchant accounts.
 * Merchants can ONLY be created via this script — not via UI or API.
 *
 * Usage:
 *   node scripts/create-merchant.js "Business Name" [options]
 *   pnpm run create-merchant "Business Name" [options]
 *
 * Options (env or flags):
 *   --address "123 Main St, City, ST"
 *   --postal-code 94105
 *   --description "Coffee and breakfast"
 *   --type cafe|restaurant|fast_casual|etc
 *
 * Examples:
 *   pnpm run create-merchant "Joe's Coffee"
 *   pnpm run create-merchant "Mama's Kitchen" --address "100 Oak Ave" --type restaurant
 */

require('dotenv').config();
const knex = require('knex');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const knexfile = require(path.join(__dirname, '../db/knexfile.js'));
const env = process.env.NODE_ENV || 'development';
const config = knexfile[env] || knexfile.development;

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { businessName: null, address: '', postalCode: '', description: '', type: '' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--address' && args[i + 1]) {
      result.address = args[++i];
    } else if ((args[i] === '--postal-code' || args[i] === '-z') && args[i + 1]) {
      result.postalCode = args[++i];
    } else if (args[i] === '--description' && args[i + 1]) {
      result.description = args[++i];
    } else if (args[i] === '--type' && args[i + 1]) {
      result.type = args[++i];
    } else if (!args[i].startsWith('-')) {
      result.businessName = args[i];
    }
  }

  return result;
}

async function main() {
  const { businessName, address, postalCode, description, type } = parseArgs();

  if (!businessName || !businessName.trim()) {
    console.error('Error: business_name is required');
    console.error('');
    console.error('Usage: pnpm run create-merchant "Business Name" [--address "addr"] [--postal-code 94105] [--description "desc"] [--type cafe]');
    process.exit(1);
  }

  const db = knex(config);

  try {
    const uuid = uuidv4();
    await db('merchants').insert({
      business_name: businessName.trim(),
      address: address || null,
      postal_code: postalCode || null,
      description: description || null,
      type: type || null,
      uuid,
    });

    const row = await db('merchants').where('uuid', uuid).first();
    if (!row) {
      console.error('Error: Failed to create merchant');
      process.exit(1);
    }

    console.log('Merchant created successfully.');
    console.log('');
    console.log('  ID:            ', row.id);
    console.log('  UUID:          ', row.uuid);
    console.log('  Business Name: ', row.business_name);
    console.log('');
    console.log('  Dashboard URL: /merchant/' + row.uuid);
    console.log('  (e.g. http://localhost:3001/merchant/' + row.uuid + ')');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();
