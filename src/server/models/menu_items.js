const db = require('./db');

const T = () => db('menu_items');

class MenuItem {
  constructor(menuItem) { this.menuItem = menuItem }

  static async getByMerchantId(merchantId) {
    const res = await T()
      .select()
      .where('merchant_id', merchantId)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
    return res;
  }

  static async getById(id) {
    return T().select().where('id', id).first();
  }

  static async create(params) {
    const merchantId = params.merchantId ?? params.merchant_id;
    const name = params.name;
    const description = params.description ?? '';
    const priceCents = params.priceCents ?? params.price_cents;
    const isActive = params.isActive ?? params.is_active ?? true;
    const sortOrder = params.sortOrder ?? params.sort_order ?? 0;
    const [row] = await T()
      .insert({
        merchant_id: merchantId,
        name,
        description,
        price_cents: priceCents,
        is_active: isActive !== false,
        sort_order: sortOrder,
      })
      .returning('*');
    return row;
  }

  static async update(id, params) {
    const allowed = ['name', 'description', 'price_cents', 'is_active', 'sort_order'];
    const updates = {};
    for (const k of allowed) {
      if (params[k] !== undefined) updates[k] = params[k];
    }
    if (Object.keys(updates).length === 0) return null;
    const [row] = await T()
      .update(updates)
      .where('id', id)
      .returning('*');
    return row;
  }

  static async delete(id) {
    return T().where('id', id).del();
  }
}

module.exports = MenuItem;
