import { expect } from 'chai';
import path from 'path';
import request from 'supertest';
import { createRequire } from 'module';
import { formatKitchenTicketText } from '../../src/shared/kitchen_ticket';
import { buildKitchenTicket, KitchenTicketError } from '../../src/server/services/kitchen_ticket';

const require = createRequire(import.meta.url);
const db = require('../../src/server/models/db');
const app = require('../../src/server/index');
const { setSupabaseUserResolverForTest } = require('../../src/server/middleware/merchantAuth');

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

describe('kitchen ticket', () => {
  let merchantId: number;
  let otherMerchantId: number;
  let orderId: number;
  let orderUuid: string;
  let menuItemId: number;
  let modifierId: number;
  let lineItemId: number;

  before(async () => {
    process.env.MERCHANT_AUTH_STREAM_SECRET = 'test-stream-secret';
    setSupabaseUserResolverForTest(async (token: string) => {
      if (token === 'token-user-1') return { id: 'user-1', email: 'owner@example.com' };
      return null;
    });

    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });

    await db('line_item_modifiers').del();
    await db('line_items').del();
    await db('orders').del();
    await db('menu_item_modifiers').del();
    await db('modifiers').del();
    await db('menu_items').del();
    await db('customers').del();
    await db('merchant_users').del();
    await db('merchants').del();

    [merchantId] = await db('merchants').insert({
      business_name: 'Kitchen Ticket Cafe',
      type: 'cafe',
      uuid: 'kt000001-0001-0001-0001-000000000001',
      hash_id: 'mc_ktcafe',
    });
    [otherMerchantId] = await db('merchants').insert({
      business_name: 'Other Cafe',
      type: 'cafe',
      uuid: 'kt000002-0002-0002-0002-000000000002',
      hash_id: 'mc_otherkt',
    });
    await db('merchant_users').insert({
      merchant_id: merchantId,
      supabase_user_id: 'user-1',
      role: 'owner',
    });

    const [customerId] = await db('customers').insert({
      name: 'Alice Customer',
      mobile_phone: '+15551234567',
    });
    [menuItemId] = await db('menu_items').insert({
      merchant_id: merchantId,
      name: 'Egg Roll',
      price_cents: 599,
      is_active: true,
    });
    [modifierId] = await db('modifiers').insert({
      merchant_id: merchantId,
      name: 'Extra spicy',
      price_adjustment_cents: 0,
      sort_order: 0,
    });
    [orderId] = await db('orders').insert({
      merchant_id: merchantId,
      customer_id: customerId,
      status: 'waiting_for_acceptance',
      order_type: 'pickup',
      uuid: 'kt-order-0001-0001-0001-000000000001',
      comments: 'No peanuts',
    });
    orderUuid = 'kt-order-0001-0001-0001-000000000001';

    [lineItemId] = await db('line_items').insert({
      order_id: orderId,
      menu_item_id: menuItemId,
      quantity: 2,
    });
    await db('line_item_modifiers').insert({
      line_item_id: lineItemId,
      modifier_id: modifierId,
    });
  });

  after(() => {
    setSupabaseUserResolverForTest(null);
  });

  it('buildKitchenTicket returns modifiers and order metadata', async () => {
    const ticket = await buildKitchenTicket(merchantId, orderUuid);

    expect(ticket.merchantName).to.equal('Kitchen Ticket Cafe');
    expect(ticket.orderUuid).to.equal(orderUuid);
    expect(ticket.customerName).to.equal('Alice Customer');
    expect(ticket.comments).to.equal('No peanuts');
    expect(ticket.orderType).to.equal('pickup');
    expect(ticket.lineItems).to.have.length(1);
    expect(ticket.lineItems[0].quantity).to.equal(2);
    expect(ticket.lineItems[0].name).to.equal('Egg Roll');
    expect(ticket.lineItems[0].modifiers).to.deep.equal([
      { name: 'Extra spicy', priceAdjustmentCents: 0 },
    ]);
  });

  it('formatKitchenTicketText includes order lines and note', () => {
    const text = formatKitchenTicketText({
      orderId: 1,
      orderUuid: 'uuid',
      displayNumber: 7,
      orderType: 'pickup',
      status: 'waiting_for_acceptance',
      createdAt: '2026-06-30T14:30:00.000Z',
      customerName: 'Alice Customer',
      comments: 'No peanuts',
      lineItems: [
        {
          lineItemId: 1,
          quantity: 2,
          name: 'Egg Roll',
          modifiers: [{ name: 'Extra spicy', priceAdjustmentCents: 0 }],
        },
      ],
      merchantName: 'Kitchen Ticket Cafe',
    });

    expect(text).to.include('Kitchen Ticket Cafe');
    expect(text).to.include('ORDER #7');
    expect(text).to.include('2x  Egg Roll');
    expect(text).to.include('+ Extra spicy');
    expect(text).to.include('NOTE: No peanuts');
    expect(text).to.include('Alice Customer');
  });

  it('rejects tickets for orders on another merchant', async () => {
    try {
      await buildKitchenTicket(otherMerchantId, orderUuid);
      expect.fail('expected KitchenTicketError');
    } catch (err) {
      expect(err).to.be.instanceOf(KitchenTicketError);
      expect((err as KitchenTicketError).status).to.equal(404);
    }
  });

  it('GET /api/merchants/:id/orders/:orderUuid/kitchenticket requires auth', async () => {
    await request(app)
      .get(`/api/merchants/${merchantId}/orders/${orderUuid}/kitchenticket`)
      .expect(401);
  });

  it('GET /api/merchants/:id/orders/:orderUuid/kitchenticket returns JSON for linked user', async () => {
    const res = await request(app)
      .get(`/api/merchants/${merchantId}/orders/${orderUuid}/kitchenticket`)
      .set('Authorization', 'Bearer token-user-1')
      .expect(200);

    expect(res.body.kitchenTicket).to.be.an('object');
    expect(res.body.kitchenTicket.orderUuid).to.equal(orderUuid);
    expect(res.body.kitchenTicket.lineItems[0].modifiers[0].name).to.equal('Extra spicy');
  });
});
