import { expect } from 'chai';
import path from 'path';
import db from '../../src/server/models/db';
import Menus from '../../src/server/models/menus';
import { submitMenuCheckout, CheckoutError } from '../../src/server/services/checkout';

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

describe('submitMenuCheckout', function () {
  this.timeout(15000);

  let slug: string;
  let menuItemId: number;

  before(async () => {
    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });

    await db('whatsapp_opt_ins').del();
    await db('receipts').del();
    await db('line_items').del();
    await db('orders').del();
    await db('menu_menu_items').del();
    await db('menus').del();
    await db('menu_items').del();
    await db('customers').del();
    await db('merchants').del();

    const [merchantId] = await db('merchants').insert({
      business_name: 'Checkout Test Cafe',
      type: 'cafe',
    });
    const [menuItemIdInserted] = await db('menu_items').insert({
      merchant_id: merchantId,
      name: 'Test Item',
      price_cents: 500,
      is_active: true,
    });
    menuItemId = menuItemIdInserted as number;

    slug = 'checkout-test-menu';
    const [menuId] = await db('menus').insert({
      merchant_id: merchantId,
      name: 'Test Menu',
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

  it('creates order, receipt, and whatsapp opt-in when requested', async () => {
    const phone = `+1555${Date.now().toString().slice(-7)}`;
    const result = await submitMenuCheckout(slug, {
      lineItems: [{ menuItemId, quantity: 1 }],
      contact: {
        name: 'Test Checkout',
        phone,
        email: `test${Date.now()}@example.com`,
        whatsappOptIn: true,
      },
      paymentMethod: 'mock_pay_at_pickup',
    });

    expect(result.orderUuid).to.be.a('string');
    expect(result.receiptId).to.be.a('number');

    const orderRow = await db('orders').where({ uuid: result.orderUuid }).first();
    const optInDirect = await db('whatsapp_opt_ins').where({ order_id: orderRow.id }).first();
    expect(optInDirect).to.exist;
    expect(optInDirect.phone_e164).to.equal(phone);
    expect(orderRow.paid === true || orderRow.paid === 1).to.equal(true);
  });

  it('rejects checkout without phone or email', async () => {
    try {
      await submitMenuCheckout(slug, {
        lineItems: [{ menuItemId, quantity: 1 }],
        contact: { name: 'Nobody' },
        paymentMethod: 'mock_card',
      });
      expect.fail('should throw');
    } catch (err) {
      expect(err).to.be.instanceOf(CheckoutError);
      expect((err as CheckoutError).status).to.equal(400);
    }
  });

  it('skips whatsapp opt-in when not checked', async () => {
    const phone = `+1556${Date.now().toString().slice(-7)}`;
    const result = await submitMenuCheckout(slug, {
      lineItems: [{ menuItemId, quantity: 1 }],
      contact: { phone, whatsappOptIn: false },
      paymentMethod: 'mock_pay_at_pickup',
    });
    const orderRow = await db('orders').where({ uuid: result.orderUuid }).first();
    const optIn = await db('whatsapp_opt_ins').where({ order_id: orderRow.id }).first();
    expect(optIn).to.be.undefined;
  });
});
