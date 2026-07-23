import { expect } from 'chai';
import path from 'path';
import request from 'supertest';
import { createRequire } from 'module';
import { Status } from '../../src/shared/orders';

const require = createRequire(import.meta.url);
const db = require('../../src/server/models/db');
const app = require('../../src/server/index');
const {
  setSupabaseUserResolverForTest,
} = require('../../src/server/middleware/merchantAuth');

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

let merchantA: number;
let merchantB: number;
let orderOnA: number;
let orderOnB: number;
let customerId: number;
let menuItemId: number;

async function resetTables() {
  await db('line_items').del();
  await db('orders').del();
  await db('customers').del();
  await db('merchant_users').del();
  await db('menu_items').del();
  await db('merchants').del();
  for (const t of [
    'line_items',
    'orders',
    'customers',
    'merchant_users',
    'menu_items',
    'merchants',
  ]) {
    await db.raw(`DELETE FROM sqlite_sequence WHERE name = '${t}'`);
  }
}

describe('merchant order authorization + status machine', function () {
  this.timeout(15000);

  before(async () => {
    process.env.MERCHANT_AUTH_STREAM_SECRET = 'test-stream-secret';
    setSupabaseUserResolverForTest(async (token: string) => {
      if (token === 'token-owner-a') return { id: 'user-a', email: 'a@example.com' };
      if (token === 'token-owner-b') return { id: 'user-b', email: 'b@example.com' };
      return null;
    });

    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });
    await resetTables();

    [merchantA] = await db('merchants').insert({
      business_name: 'Cafe A',
      type: 'cafe',
      uuid: 'orda0001-0001-0001-0001-000000000001',
      hash_id: 'mc_ordercafea',
      timezone: 'America/New_York',
    });
    [merchantB] = await db('merchants').insert({
      business_name: 'Cafe B',
      type: 'cafe',
      uuid: 'ordb0002-0002-0002-0002-000000000002',
      hash_id: 'mc_ordercafeb',
      timezone: 'America/New_York',
    });
    await db('merchant_users').insert([
      { merchant_id: merchantA, supabase_user_id: 'user-a', role: 'owner' },
      { merchant_id: merchantB, supabase_user_id: 'user-b', role: 'owner' },
    ]);

    [customerId] = await db('customers').insert({ name: 'Pat', mobile_phone: '+15551234567' });
    [menuItemId] = await db('menu_items').insert({
      merchant_id: merchantA,
      name: 'Coffee',
      price_cents: 350,
      is_active: true,
    });

    [orderOnA] = await db('orders').insert({
      merchant_id: merchantA,
      customer_id: customerId,
      status: Status.WAITING_FOR_ACCEPTANCE,
      order_type: 'pickup',
      uuid: 'order-a-0001-0001-0001-000000000001',
    });
    await db('line_items').insert({
      order_id: orderOnA,
      menu_item_id: menuItemId,
      quantity: 1,
    });

    [orderOnB] = await db('orders').insert({
      merchant_id: merchantB,
      customer_id: customerId,
      status: Status.WAITING_FOR_ACCEPTANCE,
      order_type: 'pickup',
      uuid: 'order-b-0002-0002-0002-000000000002',
    });
  });

  after(() => {
    setSupabaseUserResolverForTest(null);
  });

  it('rejects reading another merchant order by numeric id (IDOR)', async () => {
    await request(app)
      .get(`/api/merchants/${merchantA}/orders/${orderOnB}`)
      .set('Authorization', 'Bearer token-owner-a')
      .expect(404);
  });

  it('allows reading own merchant order detail', async () => {
    const res = await request(app)
      .get(`/api/merchants/${merchantA}/orders/${orderOnA}`)
      .set('Authorization', 'Bearer token-owner-a')
      .expect(200);

    expect(res.body.id).to.equal(orderOnA);
    expect(res.body.merchantId).to.equal(merchantA);
  });

  it('rejects updating another merchant order status (IDOR)', async () => {
    await request(app)
      .post(`/api/merchants/${merchantA}/orders`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ orderId: orderOnB, status: Status.ACCEPTED })
      .expect(404);

    const row = await db('orders').where({ id: orderOnB }).first();
    expect(row.status).to.equal(Status.WAITING_FOR_ACCEPTANCE);
  });

  it('rejects illegal status jumps', async () => {
    const res = await request(app)
      .post(`/api/merchants/${merchantA}/orders`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ orderId: orderOnA, status: Status.READY_FOR_PICKUP })
      .expect(400);

    expect(res.body.error).to.match(/Invalid status transition/);
    const row = await db('orders').where({ id: orderOnA }).first();
    expect(row.status).to.equal(Status.WAITING_FOR_ACCEPTANCE);
  });

  it('allows the valid next status transition', async () => {
    await request(app)
      .post(`/api/merchants/${merchantA}/orders`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ orderId: orderOnA, status: Status.ACCEPTED })
      .expect(200);

    const row = await db('orders').where({ id: orderOnA }).first();
    expect(row.status).to.equal(Status.ACCEPTED);
  });

  it('requires a reason when refunding / canceling', async () => {
    await request(app)
      .post(`/api/merchants/${merchantA}/orders`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({ orderId: orderOnA, status: Status.REFUNDED })
      .expect(400);
  });

  it('allows refund with reason for a non-terminal order', async () => {
    await request(app)
      .post(`/api/merchants/${merchantA}/orders`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({
        orderId: orderOnA,
        status: Status.REFUNDED,
        cancelReason: 'Customer changed mind',
      })
      .expect(200);

    const row = await db('orders').where({ id: orderOnA }).first();
    expect(row.status).to.equal(Status.REFUNDED);
    expect(row.cancel_reason).to.equal('Customer changed mind');
  });

  it('rejects refund of an already terminal order', async () => {
    await request(app)
      .post(`/api/merchants/${merchantA}/orders`)
      .set('Authorization', 'Bearer token-owner-a')
      .send({
        orderId: orderOnA,
        status: Status.REFUNDED,
        cancelReason: 'again',
      })
      .expect(400);
  });
});
