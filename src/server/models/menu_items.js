const db = require('./db');

const T = () => db('menu_items');

class MenuItem {
  constructor(menuItem) { this.menuItem = menuItem }

  static async getByMerchantId(merchantId) {
    const res = await T()
      .select()
      .where('merchant_id', merchantId);
    return res;
  }

  static async create(params) {
    return T().
      insert({
        ...params,
      }).returning('id');
  }

  static async update(id, params) {
    return await T()
      .update(params)
      .where('id', id)
      .returning('id');
  }
}

module.exports = MenuItem;
