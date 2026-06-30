import { expect } from 'chai';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const knexFactory = require('knex');
const {
  createOrFindSupabaseUser,
  linkMerchantUser,
  parseArgs,
  resolveMerchant,
} = require('../../scripts/link-merchant-user');

function createFakeSupabase(initialUsers: Array<{ id: string; email: string }> = []) {
  const users = [...initialUsers];
  const createPayloads: any[] = [];
  return {
    users,
    createPayloads,
    auth: {
      admin: {
        listUsers: async ({ page, perPage }: { page: number; perPage: number }) => {
          const start = (page - 1) * perPage;
          return { data: { users: users.slice(start, start + perPage) }, error: null };
        },
        createUser: async (payload: any) => {
          createPayloads.push(payload);
          const user = { id: `user-${users.length + 1}`, email: payload.email };
          users.push(user);
          return { data: { user }, error: null };
        },
      },
    },
  };
}

describe('link-merchant-user script helpers', () => {
  let db: any;

  beforeEach(async () => {
    db = knexFactory({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });

    await db.schema.createTable('merchants', (table: any) => {
      table.increments('id').primary();
      table.string('business_name').notNullable();
      table.string('uuid').notNullable().unique();
      table.string('hash_id').notNullable().unique();
    });
    await db.schema.createTable('merchant_users', (table: any) => {
      table.increments('id').primary();
      table.integer('merchant_id').notNullable();
      table.string('supabase_user_id').notNullable();
      table.string('role').notNullable().defaultTo('owner');
      table.unique(['merchant_id', 'supabase_user_id']);
    });
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('parses merchant, email, password, role, and email confirmation flags', () => {
    const args = parseArgs([
      'mc_n1c0ffee',
      'Owner@Example.com',
      '--password',
      'temporary',
      '--role',
      'admin',
      '--no-email-confirm',
    ]);

    expect(args).to.include({
      merchantParam: 'mc_n1c0ffee',
      email: 'Owner@Example.com',
      password: 'temporary',
      role: 'admin',
      emailConfirm: false,
    });
  });

  it('creates a Supabase user when email is new', async () => {
    const supabase = createFakeSupabase();
    const result = await createOrFindSupabaseUser(supabase, 'Owner@Example.com', {
      password: 'temporary',
      emailConfirm: true,
    });

    expect(result.created).to.equal(true);
    expect(result.user).to.deep.equal({ id: 'user-1', email: 'owner@example.com' });
    expect(result.password).to.equal('temporary');
    expect(supabase.createPayloads).to.deep.equal([
      {
        email: 'owner@example.com',
        password: 'temporary',
        email_confirm: true,
      },
    ]);
  });

  it('reuses an existing Supabase user with the same email', async () => {
    const supabase = createFakeSupabase([{ id: 'existing-user', email: 'owner@example.com' }]);
    const result = await createOrFindSupabaseUser(supabase, 'OWNER@example.com', {
      password: 'temporary',
      emailConfirm: true,
    });

    expect(result.created).to.equal(false);
    expect(result.user.id).to.equal('existing-user');
    expect(result.password).to.equal(null);
    expect(supabase.createPayloads).to.deep.equal([]);
  });

  it('resolves merchants and links Supabase users idempotently', async () => {
    const [merchantId] = await db('merchants').insert({
      business_name: 'INSTEP Cafe',
      uuid: 'a0000001-0001-0001-0001-000000000001',
      hash_id: 'mc_n1c0ffee',
    });

    expect((await resolveMerchant(db, String(merchantId))).hash_id).to.equal('mc_n1c0ffee');
    expect((await resolveMerchant(db, 'mc_n1c0ffee')).id).to.equal(merchantId);
    expect((await resolveMerchant(db, 'a0000001-0001-0001-0001-000000000001')).id).to.equal(merchantId);

    const created = await linkMerchantUser(db, {
      merchantId,
      supabaseUserId: 'supabase-user-1',
      role: 'owner',
    });
    expect(created).to.include({ created: true, updated: false });

    const unchanged = await linkMerchantUser(db, {
      merchantId,
      supabaseUserId: 'supabase-user-1',
      role: 'owner',
    });
    expect(unchanged).to.include({ created: false, updated: false });

    const updated = await linkMerchantUser(db, {
      merchantId,
      supabaseUserId: 'supabase-user-1',
      role: 'admin',
    });
    expect(updated).to.include({ created: false, updated: true });

    const row = await db('merchant_users').where({ merchant_id: merchantId }).first();
    expect(row.role).to.equal('admin');
  });
});
