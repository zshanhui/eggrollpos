const db = require('./db');
const uuid = require('uuid');
const camelcaseKeys = require('camelcase-keys');

const {Status} = require('../../shared/orders');

const Table = () => db('orders');
const MenuItemsTable = () => db('menu_items');
const LineItemsTable = () => db('line_items');

class Order {
  constructor(order) { this.order = order }

  static async getByUuid(uuid, extras = {}) {
    let order = await Table()
      .select()
      .where('uuid', uuid)
      .first()

    let menuItems;
    if (order.id && extras.withMenus) {
      menuItems = await MenuItemsTable()
        .select()
        .where('merchant_id', order.merchant_id)
    }

    let lineItems;
    if (order.id && extras.withLineItems) {
      lineItems = await LineItemsTable()
        .select()
        .where('order_id', order.id)
    }

    return {
      order,
      menuItems,
      cart: {
        lineItems,
      },
    };
  }

  static async list(merchantId, filter) {
    const isSqlite = db.client.config.client === 'sqlite3';
    const pickupEtaExpr = isSqlite
      ? `datetime(orders.confirmed_at, '+' || orders.pickup_in || ' minutes') as pickup_eta`
      : `orders.confirmed_at + (orders.pickup_in * interval '1 minute') as pickup_eta`;
    const dateExpr = isSqlite ? 'date(orders.created_at)' : '(orders.created_at)::date';
    const dateExprO2 = isSqlite ? 'date(o2.created_at)' : '(o2.created_at)::date';
    const displayNumberExpr = `(SELECT COUNT(*) FROM orders o2 WHERE o2.merchant_id = orders.merchant_id AND ${dateExprO2} = ${dateExpr} AND o2.id <= orders.id) as display_number`;

    let query = db
      .with('t1', db.raw(`
          select orders.id as order_id
          , ${displayNumberExpr}
          , orders.uuid as uuid
          , orders.merchant_id
          , orders.customer_id
          , orders.confirmed_at
          , orders.created_at
          , ${pickupEtaExpr}
          , orders.pickup_in
          , orders.status
          , orders.order_type
          , orders.cancel_reason
          , orders.comments
          , orders.ready_at
          , line_items.id as line_item_id
          , line_items.quantity
          , menu_items.id as menu_item_id
          , menu_items.name as menu_item_name
          , menu_items.description as menu_item_description
          , menu_items.price_cents
          , customers.name as customer_name
          , customers.mobile_phone
        from orders
        INNER JOIN line_items ON orders.id = line_items.order_id
        LEFT JOIN menu_items on line_items.menu_item_id = menu_items.id
        LEFT JOIN customers on orders.customer_id = customers.id
      `))
      .select()
      .from('t1')
      .where('merchant_id', merchantId);

    if (filter.startDate) {
      if (isSqlite) {
        query = query.andWhereRaw('date(created_at) >= date(?)', [filter.startDate]);
      } else {
        query = query.andWhereRaw('(created_at)::date >= ?::date', [filter.startDate]);
      }
    }
    if (filter.endDate) {
      if (isSqlite) {
        query = query.andWhereRaw('date(created_at) <= date(?)', [filter.endDate]);
      } else {
        query = query.andWhereRaw('(created_at)::date <= ?::date', [filter.endDate]);
      }
    }

    if (filter.status) {
      const validStatuses = [
        Status.WAITING_FOR_ACCEPTANCE, Status.ACCEPTED, Status.PREPARING,
        Status.READY_FOR_PICKUP, Status.READY_FOR_DELIVERY, Status.PICKUP_SUCCESS,
        Status.DELIVERY_IN_PROGRESS, Status.DELIVERED, Status.CANCELED, Status.REFUNDED
      ];
      if (validStatuses.includes(filter.status)) {
        query = query.andWhere('status', filter.status);
      }
    }
    const res = await query.orderBy('created_at', 'desc');
    return this._groupMenuItemsByOrder(camelcaseKeys(res));
  }

  static async create({merchantId, customerId, orderType = 'pickup'}) {
    const orderUuid = uuid.v4();
    await Table().insert({
      merchant_id: merchantId,
      customer_id: customerId,
      status: Status.WAITING_FOR_ACCEPTANCE,
      order_type: orderType,
      uuid: orderUuid,
    });
    return orderUuid;
  }

  static async update(id, params) {
    if (params.status === Status.ACCEPTED) {
      params.accepted_at = db.fn.now();
    }
    if (params.status === Status.READY_FOR_PICKUP || params.status === Status.READY_FOR_DELIVERY) {
      params.ready_at = db.fn.now();
    }

    const res = await Table()
      .update({...params})
      .where('id', id)
      .returning('*');
    return res[0];
  }

  static async getWithID(id) {
    return await Table()
      .select()
      .where('id', id)
      .first();
  }

  static async getDetailWithID(id) {
    const isSqlite = db.client.config.client === 'sqlite3';
    const dateExpr = isSqlite ? 'date(orders.created_at)' : '(orders.created_at)::date';
    const dateExprO2 = isSqlite ? 'date(o2.created_at)' : '(o2.created_at)::date';

    const order = await Table()
      .select(
        'orders.*',
        'customers.name as customer_name',
        'customers.mobile_phone',
        'merchants.business_name as merchant_name',
        db.raw(`(SELECT COUNT(*) FROM orders o2 WHERE o2.merchant_id = orders.merchant_id AND ${dateExprO2} = ${dateExpr} AND o2.id <= orders.id) as display_number`)
      )
      .join('customers', {'orders.customer_id': 'customers.id'})
      .join('merchants', {'orders.merchant_id': 'merchants.id'})
      .where('orders.id', id)
      .first();

    if (!order) return null;

    const lineItems = await LineItemsTable()
      .select('line_items.*', 'menu_items.name', 'menu_items.description', 'menu_items.price_cents')
      .join('menu_items', {'line_items.menu_item_id': 'menu_items.id'})
      .where('line_items.order_id', id);

    return camelcaseKeys({
      ...order,
      line_items: lineItems,
    }, {deep: true});
  }

  static async lineItems(id) {
    return await Table()
      .select()
      .join('line_items', {'orders.id': 'line_items.order_id'})
      .join('menu_items', {'line_items.menu_item_id': 'menu_items.id'})
      .where('orders.id', id);
  }

  static async calculateTotals(id) {
    const lines = await this.lineItems(id);
    const TAX = .07;
    let subTotal = 0;
    lines.forEach(line => {
      subTotal += (parseInt(line.price_cents) * line.quantity);
    });

    return {
      subTotal,
      totalWithTax: subTotal + (subTotal * TAX),
    };
  }

  static async calculateSubtotal({id, taxRate}) {
    const lineItems = await(this.lineItems(id));
    const subtotalCents = lineItems.reduce((a,c) => a + parseInt(c.price_cents), 0);
    const taxCents = Math.ceil(subtotalCents * taxRate);
    const totalCents = subtotalCents + taxCents;
    return {
      subtotalCents,
      taxCents,
      totalCents,
    };
  }

  static async _groupMenuItemsByOrder(order) {
    const grouped = {}

    order.forEach(ord => {
      const lineItem = {
        id: ord.lineItemId,
        quantity: ord.quantity,
        menuItemId: ord.menuItemId,
        name: ord.menuItemName,
        description: ord.menuItemDescription,
        priceCents: parseInt(ord.priceCents),
      };
      if (grouped[ord.uuid]) {
        grouped[ord.uuid].lineItems.push(lineItem);
      } else {
        grouped[ord.uuid] = {
          ...ord,
          lineItems: [lineItem],
        };
        delete grouped[ord.uuid].lineItemId;
        delete grouped[ord.uuid].quantity;
        delete grouped[ord.uuid].menuItemName;
        delete grouped[ord.uuid].menuItemDescription;
        delete grouped[ord.uuid].priceCents;
        delete grouped[ord.uuid].menuItemId;
      }
    });
    return grouped;
  }

  static async getWithCustomerId(customerId) {
    return await Table()
      .select()
      .where('customer_id', customerId)
      .orderBy('created_at', 'desc')
      .first()
  }
}

module.exports = Order;
