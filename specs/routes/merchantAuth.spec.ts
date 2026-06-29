import { expect } from 'chai';
import path from 'path';
import request from 'supertest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const db = require('../../src/server/models/db');
const app = require('../../src/server/index');
const {
  setSupabaseUserResolverForTest,
  verifyMerchantStreamToken,
} = require('../../src/server/middleware/merchantAuth');

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

let merchantId: number;
let otherMerchantId: number;

async function resetAll() {
  await db('merchant_users').del();
  await db('menu_items').del();
  await db('merchants').del();
  for (const t of ['merchant_users', 'menu_items', 'merchants']) {
    await db.raw(`DELETE FROM sqlite_sequence WHERE name = '${t}'`);
  }
}

describe('merchant Supabase auth', () => {
  before(async () => {
    process.env.MERCHANT_AUTH_STREAM_SECRET = 'test-stream-secret';
    setSupabaseUserResolverForTest(async (token: string) => {
      if (token === 'token-user-1') return { id: 'user-1', email: 'owner@example.com' };
      if (token === 'token-user-2') return { id: 'user-2', email: 'other@example.com' };
      return null;
    });

    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });
    await resetAll();

    [merchantId] = await db('merchants').insert({
      business_name: 'Authenticated Cafe',
      type: 'cafe',
      uuid: 'auth0001-0001-0001-0001-000000000001',
      hash_id: 'mc_authcafe',
    });
    [otherMerchantId] = await db('merchants').insert({
      business_name: 'Other Cafe',
      type: 'cafe',
      uuid: 'auth0002-0002-0002-0002-000000000002',
      hash_id: 'mc_othercafe',
    });
    await db('merchant_users').insert({
      merchant_id: merchantId,
      supabase_user_id: 'user-1',
      role: 'owner',
    });
  });

  after(() => {
    setSupabaseUserResolverForTest(null);
  });

  it('keeps merchant hash lookup public', async () => {
    const res = await request(app)
      .get('/api/merchants/mc_authcafe')
      .expect(200);

    expect(res.body.id).to.equal(merchantId);
  });

  it('rejects merchant admin APIs without a bearer token', async () => {
    await request(app)
      .get(`/api/merchants/${merchantId}/menu-items`)
      .expect(401);
  });

  it('rejects invalid bearer tokens', async () => {
    await request(app)
      .get(`/api/merchants/${merchantId}/menu-items`)
      .set('Authorization', 'Bearer not-valid')
      .expect(401);
  });

  it('allows a linked Supabase user to access their merchant admin APIs', async () => {
    const res = await request(app)
      .get(`/api/merchants/${merchantId}/menu-items`)
      .set('Authorization', 'Bearer token-user-1')
      .expect(200);

    expect(res.body.menuItems).to.deep.equal([]);
  });

  it('allows linked users to preflight merchant dashboard authorization', async () => {
    const res = await request(app)
      .get(`/api/merchants/${merchantId}/authz`)
      .set('Authorization', 'Bearer token-user-1')
      .expect(200);

    expect(res.body).to.deep.equal({ ok: true });
  });

  it('rejects access to merchants the user is not linked to', async () => {
    await request(app)
      .get(`/api/merchants/${otherMerchantId}/menu-items`)
      .set('Authorization', 'Bearer token-user-1')
      .expect(403);
  });

  it('issues scoped stream tokens for linked users', async () => {
    const res = await request(app)
      .post(`/api/merchants/${merchantId}/orders/stream-token`)
      .set('Authorization', 'Bearer token-user-1')
      .send({})
      .expect(200);

    const payload = verifyMerchantStreamToken(res.body.token);
    expect(payload).to.include({
      merchantId,
      supabaseUserId: 'user-1',
    });
  });
});
