#!/usr/bin/env node
/**
 * Admin script to create/link a Supabase Auth user to a merchant account.
 *
 * Usage:
 *   pnpm run link-merchant-user <merchant-id|uuid|mc_hash> <email> [options]
 *
 * Options:
 *   --password "temporary-password"  Password for newly created Supabase users.
 *   --role owner|admin|staff         Role stored in merchant_users. Defaults to owner.
 *   --no-email-confirm              Do not mark the Supabase user's email as confirmed.
 *
 * Examples:
 *   pnpm run link-merchant-user mc_n1c0ffee owner@example.com
 *   pnpm run link-merchant-user 1 owner@example.com --password "change-me-now"
 */

require('dotenv').config();
const crypto = require('crypto');
const knex = require('knex');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const knexfile = require(path.join(__dirname, '../db/knexfile.js'));
const env = process.env.NODE_ENV || 'development';
const config = knexfile[env] || knexfile.development;

function usage() {
  return [
    'Usage: pnpm run link-merchant-user <merchant-id|uuid|mc_hash> <email> [options]',
    '',
    'Options:',
    '  --password "temporary-password"  Password for newly created Supabase users.',
    '  --role owner|admin|staff         Role stored in merchant_users. Defaults to owner.',
    '  --no-email-confirm              Do not mark the Supabase user email as confirmed.',
  ].join('\n');
}

function parseArgs(argv = process.argv.slice(2)) {
  const result = {
    merchantParam: null,
    email: null,
    password: null,
    role: 'owner',
    emailConfirm: true,
    help: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      continue;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--password' && argv[i + 1]) {
      result.password = argv[++i];
    } else if (arg === '--role' && argv[i + 1]) {
      result.role = argv[++i];
    } else if (arg === '--no-email-confirm') {
      result.emailConfirm = false;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }

  result.merchantParam = positional[0] || null;
  result.email = positional[1] || null;
  return result;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateTemporaryPassword() {
  return crypto.randomBytes(18).toString('base64url');
}

function requireSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SECRET_KEY are required to create Supabase Auth users'
    );
  }
  return { url, secretKey };
}

function createSupabaseAdminClient() {
  const { url, secretKey } = requireSupabaseAdminConfig();
  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findSupabaseUserByEmail(supabase, email) {
  const target = normalizeEmail(email);
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => normalizeEmail(user.email) === target);
    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function createOrFindSupabaseUser(
  supabase,
  email,
  { password, emailConfirm = true } = {}
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const existing = await findSupabaseUserByEmail(supabase, normalizedEmail);
  if (existing) {
    return { user: existing, created: false, password: null };
  }

  const newPassword = password || generateTemporaryPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: newPassword,
    email_confirm: emailConfirm,
  });

  if (error) {
    const message = String(error.message || '');
    if (/already|exists|registered/i.test(message)) {
      const user = await findSupabaseUserByEmail(supabase, normalizedEmail);
      if (user) return { user, created: false, password: null };
    }
    throw error;
  }

  if (!data?.user?.id) {
    throw new Error('Supabase did not return a user id');
  }

  return { user: data.user, created: true, password: newPassword };
}

async function resolveMerchant(db, param) {
  if (!param) return null;

  if (/^\d+$/.test(param)) {
    const merchant = await db('merchants').where('id', Number(param)).first();
    if (merchant) return merchant;
  }

  const byHash = await db('merchants').where('hash_id', param).first();
  if (byHash) return byHash;

  return db('merchants').where('uuid', param).first();
}

async function linkMerchantUser(db, { merchantId, supabaseUserId, role }) {
  const existing = await db('merchant_users')
    .where({
      merchant_id: merchantId,
      supabase_user_id: supabaseUserId,
    })
    .first();

  if (existing) {
    if (existing.role !== role) {
      await db('merchant_users').where('id', existing.id).update({ role });
      return { created: false, updated: true, id: existing.id };
    }
    return { created: false, updated: false, id: existing.id };
  }

  const result = await db('merchant_users')
    .insert({
      merchant_id: merchantId,
      supabase_user_id: supabaseUserId,
      role,
    })
    .returning('id');
  const inserted = Array.isArray(result) ? result[0] : result;
  const id = typeof inserted === 'object' && inserted !== null ? inserted.id : inserted;
  return { created: true, updated: false, id };
}

async function run(argv = process.argv.slice(2), deps = {}) {
  const args = parseArgs(argv);
  if (args.help) {
    return { help: true };
  }

  if (!args.merchantParam || !args.email) {
    throw new Error(`Merchant identifier and email are required\n\n${usage()}`);
  }

  const db = deps.db || knex(config);
  const supabase = deps.supabase || createSupabaseAdminClient();
  let shouldDestroy = !deps.db;

  try {
    const merchant = await resolveMerchant(db, args.merchantParam);
    if (!merchant) {
      throw new Error(`Merchant '${args.merchantParam}' not found`);
    }

    const userResult = await createOrFindSupabaseUser(supabase, args.email, {
      password: args.password,
      emailConfirm: args.emailConfirm,
    });
    const linkResult = await linkMerchantUser(db, {
      merchantId: merchant.id,
      supabaseUserId: userResult.user.id,
      role: args.role,
    });

    return {
      merchant,
      supabaseUser: userResult.user,
      supabaseUserCreated: userResult.created,
      temporaryPassword: userResult.password,
      link: linkResult,
      role: args.role,
    };
  } finally {
    if (shouldDestroy) {
      await db.destroy();
    }
  }
}

async function main() {
  try {
    const result = await run();
    if (result.help) {
      console.log(usage());
      return;
    }

    console.log('Merchant user linked successfully.');
    console.log('');
    console.log('  Merchant ID:       ', result.merchant.id);
    console.log('  Merchant Code:     ', result.merchant.hash_id);
    console.log('  Business Name:     ', result.merchant.business_name);
    console.log('  Supabase User ID:  ', result.supabaseUser.id);
    console.log('  Supabase Email:    ', result.supabaseUser.email);
    console.log('  Supabase Created:  ', result.supabaseUserCreated ? 'yes' : 'no');
    console.log('  Link Created:      ', result.link.created ? 'yes' : 'no');
    console.log('  Link Updated:      ', result.link.updated ? 'yes' : 'no');
    console.log('  Role:              ', result.role);
    if (result.temporaryPassword) {
      console.log('');
      console.log('  Temporary Password:', result.temporaryPassword);
      console.log('  Share this securely and ask the merchant to change it after signing in.');
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createOrFindSupabaseUser,
  findSupabaseUserByEmail,
  linkMerchantUser,
  parseArgs,
  resolveMerchant,
  run,
  usage,
};
