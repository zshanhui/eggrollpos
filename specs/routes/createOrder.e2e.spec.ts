import { expect } from 'chai';
import path from 'path';
import request from 'supertest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const db = require('../../src/server/models/db');
const app = require('../../src/server/index');

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

const MERCHANT_UUID = 'e2e00001-0001-0001-0001-000000000001';

let merchantInternalId: number;
let menuItemLatte: number;
let menuItemCroissant: number;
let menuItemBurrito: number;
let modExtraShot: number;
let modOatMilk: number;
let modNoCream: number;

async function resetAll() {
  await db('line_item_modifiers').del();
  await db('line_items').del();
  await db('whatsapp_opt_ins').del();
  await db('receipts').del();
  await db('orders').del();
  await db('customers').del();
  await db('menu_item_modifiers').del();
  await db('modifiers').del();
  await db('menu_items').del();
  await db('merchants').del();
  for (const t of ['line_item_modifiers', 'line_items', 'orders', 'customers', 'modifiers', 'menu_items', 'merchants']) {
    await db.raw(`DELETE FROM sqlite_sequence WHERE name = '${t}'`);
  }
}

describe('POST /api/orders (e2e)', () => {

  before(async () => {
    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });
    await resetAll();

    [merchantInternalId] = await db('merchants').insert({
      business_name: 'E2E Cafe',
      type: 'cafe',
      uuid: MERCHANT_UUID,
      hash_id: 'mc_e2ecafe',
    });

    [menuItemLatte] = await db('menu_items').insert({
      merchant_id: merchantInternalId, name: 'Latte', description: 'Double espresso with steamed milk',
      price_cents: 525, is_active: 1,
    });
    [menuItemCroissant] = await db('menu_items').insert({
      merchant_id: merchantInternalId, name: 'Butter Croissant', description: 'Flaky French croissant',
      price_cents: 425, is_active: 1,
    });
    [menuItemBurrito] = await db('menu_items').insert({
      merchant_id: merchantInternalId, name: 'Breakfast Burrito', description: 'Eggs, cheese, bacon, salsa',
      price_cents: 950, is_active: 1,
    });

    [modExtraShot] = await db('modifiers').insert({
      merchant_id: merchantInternalId, name: 'Extra Shot', price_adjustment_cents: 75,
    });
    [modOatMilk] = await db('modifiers').insert({
      merchant_id: merchantInternalId, name: 'Oat Milk', price_adjustment_cents: 50,
    });
    [modNoCream] = await db('modifiers').insert({
      merchant_id: merchantInternalId, name: 'No Cream', price_adjustment_cents: 0,
    });
  });

  afterEach(async () => {
    await db('line_item_modifiers').del();
    await db('line_items').del();
    await db('orders').del();
    await db('customers').del();
  });

  // ─── Happy path: multiple items with mixed modifiers ───

  it('creates a full order with 3 items, modifiers, and verifies via GET', async () => {
    const payload = {
      merchantId: MERCHANT_UUID,
      customerName: 'Alice Chen',
      customerPhone: '+14155551234',
      orderType: 'pickup',
      items: [
        { menuItemId: menuItemLatte, quantity: 2, modifierIds: [modExtraShot, modOatMilk] },
        { menuItemId: menuItemCroissant, quantity: 1 },
        { menuItemId: menuItemBurrito, quantity: 1, modifierIds: [modNoCream] },
      ],
    };

    // 1. Create the order
    const createRes = await request(app)
      .post('/api/orders')
      .send(payload)
      .expect(201);

    expect(createRes.body).to.have.property('orderUuid').that.is.a('string').with.lengthOf(36);
    expect(createRes.body).to.have.property('orderId').that.is.a('number');

    const { orderUuid, orderId } = createRes.body;

    // 2. Fetch the order via GET /api/orders/:uuid
    const getRes = await request(app)
      .get(`/api/orders/${orderUuid}`)
      .expect(200);

    const { order, menuItems, cart } = getRes.body;

    // Verify order metadata
    expect(order.uuid).to.equal(orderUuid);
    expect(order.id).to.equal(orderId);
    expect(order.status).to.equal('waiting_for_acceptance');
    expect(order.order_type).to.equal('pickup');
    expect(order.merchant_id).to.equal(merchantInternalId);

    // Verify cart has exactly 3 line items
    expect(cart.lineItems).to.be.an('array').with.lengthOf(3);

    const liByMenuItem = new Map(cart.lineItems.map((li: any) => [li.menu_item_id, li]));

    // Latte x2
    const latteLi = liByMenuItem.get(menuItemLatte);
    expect(latteLi).to.exist;
    expect(latteLi.quantity).to.equal(2);

    // Croissant x1
    const croissantLi = liByMenuItem.get(menuItemCroissant);
    expect(croissantLi).to.exist;
    expect(croissantLi.quantity).to.equal(1);

    // Burrito x1
    const burritoLi = liByMenuItem.get(menuItemBurrito);
    expect(burritoLi).to.exist;
    expect(burritoLi.quantity).to.equal(1);

    // 3. Verify modifiers stored in DB
    const latteMods = await db('line_item_modifiers')
      .join('modifiers', 'line_item_modifiers.modifier_id', 'modifiers.id')
      .select('modifiers.id', 'modifiers.name', 'modifiers.price_adjustment_cents')
      .where('line_item_id', latteLi.id);
    expect(latteMods).to.have.lengthOf(2);
    expect(latteMods.map((m: any) => m.name).sort()).to.deep.equal(['Extra Shot', 'Oat Milk']);
    expect(latteMods.find((m: any) => m.name === 'Extra Shot').price_adjustment_cents).to.equal(75);
    expect(latteMods.find((m: any) => m.name === 'Oat Milk').price_adjustment_cents).to.equal(50);

    const croissantMods = await db('line_item_modifiers').where('line_item_id', croissantLi.id);
    expect(croissantMods).to.have.lengthOf(0);

    const burritoMods = await db('line_item_modifiers')
      .join('modifiers', 'line_item_modifiers.modifier_id', 'modifiers.id')
      .select('modifiers.name', 'modifiers.price_adjustment_cents')
      .where('line_item_id', burritoLi.id);
    expect(burritoMods).to.have.lengthOf(1);
    expect(burritoMods[0].name).to.equal('No Cream');
    expect(burritoMods[0].price_adjustment_cents).to.equal(0);

    // 4. Verify customer was created with phone
    const customer = await db('customers').where('id', order.customer_id).first();
    expect(customer.name).to.equal('Alice Chen');
    expect(customer.mobile_phone).to.equal('+14155551234');
  });

  // ─── Delivery order with single item + multiple modifiers ───

  it('creates a delivery order with one item and all three modifiers', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        merchantId: MERCHANT_UUID,
        customerName: 'Bob Lee',
        orderType: 'delivery',
        items: [
          { menuItemId: menuItemLatte, quantity: 1, modifierIds: [modExtraShot, modOatMilk, modNoCream] },
        ],
      })
      .expect(201);

    const { orderUuid } = createRes.body;

    const getRes = await request(app).get(`/api/orders/${orderUuid}`).expect(200);
    expect(getRes.body.order.order_type).to.equal('delivery');
    expect(getRes.body.cart.lineItems).to.have.lengthOf(1);

    const mods = await db('line_item_modifiers')
      .where('line_item_id', getRes.body.cart.lineItems[0].id);
    expect(mods).to.have.lengthOf(3);
  });

  // ─── No modifiers at all ───

  it('creates an order with no modifiers on any item', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        merchantId: MERCHANT_UUID,
        customerName: 'Carol Wu',
        items: [
          { menuItemId: menuItemLatte, quantity: 1 },
          { menuItemId: menuItemBurrito, quantity: 2 },
        ],
      })
      .expect(201);

    const { orderUuid } = createRes.body;
    const getRes = await request(app).get(`/api/orders/${orderUuid}`).expect(200);

    expect(getRes.body.cart.lineItems).to.have.lengthOf(2);

    const allMods = await db('line_item_modifiers')
      .whereIn('line_item_id', getRes.body.cart.lineItems.map((li: any) => li.id));
    expect(allMods).to.have.lengthOf(0);
  });

  // ─── Validation errors ───

  it('rejects request with missing required fields', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({})
      .expect(400);

    expect(res.body.error).to.include('merchantId');
  });

  it('rejects request with integer merchantId', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ merchantId: 1, customerName: 'X', items: [{ menuItemId: 1, quantity: 1 }] })
      .expect(400);

    expect(res.body.error).to.include('merchantId');
  });

  it('rejects request with empty items array', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ merchantId: MERCHANT_UUID, customerName: 'X', items: [] })
      .expect(400);

    expect(res.body.error).to.include('items');
  });

  it('rejects item with quantity out of range', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        merchantId: MERCHANT_UUID,
        customerName: 'X',
        items: [{ menuItemId: menuItemLatte, quantity: 11 }],
      })
      .expect(400);

    expect(res.body.error).to.include('quantity');
  });

  it('rejects item with non-array modifierIds', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        merchantId: MERCHANT_UUID,
        customerName: 'X',
        items: [{ menuItemId: menuItemLatte, quantity: 1, modifierIds: 'invalid' }],
      })
      .expect(400);

    expect(res.body.error).to.include('modifierIds');
  });

  it('returns 422 for nonexistent merchant', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        merchantId: 'fake0000-0000-0000-0000-000000000000',
        customerName: 'Ghost',
        items: [{ menuItemId: menuItemLatte, quantity: 1 }],
      })
      .expect(422);

    expect(res.body.error).to.include('not found');
  });
});
