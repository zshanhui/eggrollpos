const db = require('./db');

const T = () => db('merchants');

class Merchants {
  constructor(merchants) { this.merchants = merchants }

  static async list() {
    // @todo: list all merchants for admin or nearby merchants
    return T().select();
  }

  static async get(id) {
    const res = await T()
      .select()
      .where('id', id)
      .first();
    return res;
  }

  static async getByUuid(uuid) {
    return await T()
      .select()
      .where('uuid', uuid)
      .first();
  }

  static async getByHash(mhash) {
    const res = await T()
      .select()
      .where('mhash', mhash)
      .first();
    return res;
  }

  /**
   * Create merchant. For admin use only — do NOT expose via API or UI.
   * Use: pnpm run create-merchant "Business Name"
   */
  static async create(params) {
    return T().insert(params).returning('id');
  }

  static async update(id, params) {
    console.log(`Updating merchant ${id} with `, params);
    return await T()
      .update(params)
      .where('id', id)
      .returning('id');
  }

  static async getByZip(zipCode) {
    return await T()
      .select()
      .where('address_postal_code', zipCode);
  }

  static async  customers(id) {
    const res = await T()
      .select('customers.*')
      .joinRaw('LEFT JOIN orders ON merchants.id = orders.merchant_id')
      .joinRaw('LEFT JOIN customers on orders.customer_id = customers.id')
      .where('merchants.id', id)
      .distinct();

    return res;
  }

  static async orders(id, filter) {
    // @todo: implement filters {date_range, status}
    const res = await T()
      .select('orders.*')
      .joinRaw('LEFT JOIN orders ON merchants.id = orders.merchant_id')
      .where('merchants.id', id);

    return res;
  }
}

module.exports = Merchants;