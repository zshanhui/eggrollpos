import { expect } from 'chai';
import path from 'path';
import request from 'supertest';
import { createRequire } from 'module';
import { publishOrderEvent, subscribeMerchantOrders } from '../../src/server/services/order_events';
import { submitMenuCheckout } from '../../src/server/services/checkout';
import { buildKitchenTicket } from '../../src/server/services/kitchen_ticket';
import { merchantKitchenTicketPath } from '../../src/shared/merchant_dashboard';
import type { Response } from 'express';

const require = createRequire(import.meta.url);
const db = require('../../src/server/models/db');
const app = require('../../src/server/index');
const { setSupabaseUserResolverForTest } = require('../../src/server/middleware/merchantAuth');

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

function createMockResponse() {
  const chunks: string[] = [];
  const res = {
    writeHead: () => res,
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
    on: (event: string, handler: () => void) => {
      if (event === 'close') {
        (res as any)._closeHandler = handler;
      }
    },
    _chunks: chunks,
    _close: () => {
      (res as any)._closeHandler?.();
    },
  } as unknown as Response & { _chunks: string[]; _close: () => void };
  return res;
}

describe('kitchen auto-print flow', function () {
  this.timeout(15000);

  let merchantId: number;
  let menuItemId: number;
  let slug: string;

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
    await db('whatsapp_opt_ins').del();
    await db('receipts').del();
    await db('orders').del();
    await db('menu_menu_items').del();
    await db('menus').del();
    await db('menu_items').del();
    await db('customers').del();
    await db('merchant_users').del();
    await db('modifiers').del();
    await db('merchants').del();

    [merchantId] = await db('merchants').insert({
      business_name: 'Auto Print Cafe',
      type: 'cafe',
      hash_id: 'mc_autoprint',
      kitchen_auto_print: false,
    });
    await db('merchant_users').insert({
      merchant_id: merchantId,
      supabase_user_id: 'user-1',
      role: 'owner',
    });

    [menuItemId] = await db('menu_items').insert({
      merchant_id: merchantId,
      name: 'Test Bowl',
      price_cents: 899,
      is_active: true,
    });

    slug = 'auto-print-menu';
    const [menuId] = await db('menus').insert({
      merchant_id: merchantId,
      name: 'Auto Print Menu',
      slug,
      is_published: true,
      business_hours: null,
    });
    await db('menu_menu_items').insert({
      menu_id: menuId,
      menu_item_id: menuItemId,
      sort_order: 0,
    });
  });

  after(() => {
    setSupabaseUserResolverForTest(null);
  });

  after(async () => {
    await db('line_item_modifiers').del();
    await db('line_items').del();
    await db('whatsapp_opt_ins').del();
    await db('receipts').del();
    await db('orders').del();
    await db('menu_menu_items').del();
    await db('menus').del();
    await db('menu_items').del();
    await db('customers').del();
    await db('merchant_users').del();
    await db('modifiers').del();
    await db('merchants').del();
  });

  it('defaults kitchen_auto_print to false on new merchants', async () => {
    const res = await request(app)
      .get('/api/merchants/mc_autoprint')
      .expect(200);

    expect(res.body.kitchen_auto_print === false || res.body.kitchen_auto_print === 0).to.equal(true);
  });

  it('persists kitchenAutoPrint via PATCH settings', async () => {
    const patchRes = await request(app)
      .patch(`/api/merchants/${merchantId}`)
      .set('Authorization', 'Bearer token-user-1')
      .send({ kitchenAutoPrint: true })
      .expect(200);

    expect(patchRes.body.merchant.kitchen_auto_print === true || patchRes.body.merchant.kitchen_auto_print === 1).to.equal(true);

    const getRes = await request(app)
      .get('/api/merchants/mc_autoprint')
      .expect(200);

    expect(getRes.body.kitchen_auto_print === true || getRes.body.kitchen_auto_print === 1).to.equal(true);
  });

  it('checkout → SSE order_created includes orderUuid for auto-print', async () => {
    const res = createMockResponse();
    subscribeMerchantOrders(merchantId, res);

    const checkout = await submitMenuCheckout(slug, {
      lineItems: [{ menuItemId, quantity: 1 }],
      contact: {
        name: 'Auto Print Customer',
        phone: `+1555${Date.now().toString().slice(-7)}`,
      },
      paymentMethod: 'mock_pay_at_pickup',
    });

    const payload = res._chunks.find((c) => c.includes('order_created'));
    expect(payload).to.include('event: order_created');
    expect(payload).to.include(`"orderUuid":"${checkout.orderUuid}"`);

    res._close();
  });

  it('kitchen ticket API returns printable data for checkout order', async () => {
    const checkout = await submitMenuCheckout(slug, {
      lineItems: [{ menuItemId, quantity: 2 }],
      contact: {
        name: 'Ticket Customer',
        phone: `+1555${(Date.now() + 1).toString().slice(-7)}`,
      },
      paymentMethod: 'mock_pay_at_pickup',
      comments: 'Extra sauce',
    });

    const ticketRes = await request(app)
      .get(`/api/merchants/${merchantId}/orders/${checkout.orderUuid}/kitchenticket`)
      .set('Authorization', 'Bearer token-user-1')
      .expect(200);

    expect(ticketRes.body.kitchenTicket.orderUuid).to.equal(checkout.orderUuid);
    expect(ticketRes.body.kitchenTicket.lineItems[0].name).to.equal('Test Bowl');
    expect(ticketRes.body.kitchenTicket.comments).to.equal('Extra sauce');

    const built = await buildKitchenTicket(merchantId, checkout.orderUuid);
    expect(built.merchantName).to.equal('Auto Print Cafe');
  });

  it('merchantKitchenTicketPath builds auto-print URL for manual reprint', () => {
    const orderUuid = 'a0000001-0001-0001-0001-000000000001';
    expect(merchantKitchenTicketPath('mc_autoprint', orderUuid, true)).to.equal(
      `/md/mc_autoprint/kitchenticket/${orderUuid}?print=1`
    );
  });

  it('publishOrderEvent includes orderUuid in SSE payload', () => {
    const res = createMockResponse();
    subscribeMerchantOrders(merchantId, res);

    publishOrderEvent({
      type: 'order_created',
      orderId: 99,
      merchantId,
      orderUuid: 'sse-test-uuid',
    });

    const payload = res._chunks.find((c) => c.includes('order_created'));
    expect(payload).to.include('"orderUuid":"sse-test-uuid"');

    res._close();
  });
});
