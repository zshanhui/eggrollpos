import { expect } from 'chai';
import path from 'path';
import db from '../../src/server/models/db';
import * as Actions from '../../src/server/services/actions';

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

async function resetAll() {
  await db('line_items').del();
  await db('orders').del();
  await db('customers').del();
  await db('menu_items').del();
  await db('merchants').del();
  for (const t of ['line_items', 'orders', 'customers', 'menu_items', 'merchants']) {
    await db.raw(`DELETE FROM sqlite_sequence WHERE name = '${t}'`);
  }
}

describe('Actions.createOrder', () => {
  let merchantId: number;
  let menuItemId1: number;
  let menuItemId2: number;

  before(async () => {
    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });
    await resetAll();

    [merchantId] = await db('merchants').insert({
      business_name: 'Test Cafe',
      type: 'cafe',
    });

    [menuItemId1] = await db('menu_items').insert({
      merchant_id: merchantId,
      name: 'Latte',
      description: 'Hot latte',
      price_cents: 450,
      is_active: 1,
    });

    [menuItemId2] = await db('menu_items').insert({
      merchant_id: merchantId,
      name: 'Croissant',
      description: 'Butter croissant',
      price_cents: 350,
      is_active: 1,
    });
  });

  afterEach(async () => {
    await db('line_items').del();
    await db('orders').del();
    await db('customers').del();
  });

  it('creates an order with customer, line items, and returns a UUID', async () => {
    const result = await Actions.createOrder({
      merchantId,
      customerName: 'Jane Doe',
      orderType: 'pickup',
      items: [
        { menuItemId: menuItemId1, quantity: 2 },
        { menuItemId: menuItemId2, quantity: 1 },
      ],
    });

    expect(result).to.have.property('orderUuid').that.is.a('string');
    expect(result.orderUuid).to.have.lengthOf(36);

    const order = await db('orders').where('uuid', result.orderUuid).first();
    expect(order).to.exist;
    expect(order.merchant_id).to.equal(merchantId);
    expect(order.status).to.equal('waiting_for_acceptance');

    const customer = await db('customers').where('id', order.customer_id).first();
    expect(customer.name).to.equal('Jane Doe');

    const lineItems = await db('line_items').where('order_id', order.id);
    expect(lineItems).to.have.lengthOf(2);
    expect(lineItems.map(li => li.menu_item_id)).to.include.members([menuItemId1, menuItemId2]);
  });

  it('stores customer phone when provided', async () => {
    const result = await Actions.createOrder({
      merchantId,
      customerName: 'Bob',
      customerPhone: '+1234567890',
      items: [{ menuItemId: menuItemId1, quantity: 1 }],
    });

    const order = await db('orders').where('uuid', result.orderUuid).first();
    const customer = await db('customers').where('id', order.customer_id).first();
    expect(customer.mobile_phone).to.equal('+1234567890');
  });

  it('defaults orderType to pickup', async () => {
    const result = await Actions.createOrder({
      merchantId,
      customerName: 'Carol',
      items: [{ menuItemId: menuItemId1, quantity: 1 }],
    });

    const order = await db('orders').where('uuid', result.orderUuid).first();
    expect(order.order_type).to.equal('pickup');
  });

  it('supports delivery orderType', async () => {
    const result = await Actions.createOrder({
      merchantId,
      customerName: 'Dave',
      orderType: 'delivery',
      items: [{ menuItemId: menuItemId1, quantity: 1 }],
    });

    const order = await db('orders').where('uuid', result.orderUuid).first();
    expect(order.order_type).to.equal('delivery');
  });

  it('throws when merchant does not exist', async () => {
    try {
      await Actions.createOrder({
        merchantId: 99999,
        customerName: 'Ghost',
        items: [{ menuItemId: menuItemId1, quantity: 1 }],
      });
      expect.fail('should have thrown');
    } catch (err: any) {
      expect(err.message).to.include('not found');
    }
  });

  it('throws when items array is empty', async () => {
    try {
      await Actions.createOrder({
        merchantId,
        customerName: 'Empty Order',
        items: [],
      });
      expect.fail('should have thrown');
    } catch (err: any) {
      expect(err.message).to.include('item');
    }
  });
});
