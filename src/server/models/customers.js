const db = require('./db');

const Table = () => db('customers');
const OrderTable = () => db('orders');

class Customers {
  constructor(customer) { this.customer = customer }

  static async create({psid, name}) {
    const res = await Table()
      .insert({
        psid,
        name,
      }).returning('id');
    return res[0];
  }

  static async getWithPSID(psid) {
    return await Table()
      .select()
      .where('psid', psid)
      .first();
  }

  static async getWithId(id) {
    return await Table()
      .select()
      .where('id', id)
      .first();
  }

  static async update(psid, params) {
    const res = await Table()
      .update(params)
      .where('psid', psid)
      .returning('*');
    return res[0];
  }

  static async updateLatestCustomerOrderWithPSID(psid, params) {
    const customer = await this.getWithPSID(psid);
    const currentOrder = await OrderTable()
      .select()
      .where('customer_id', customer.id)
      .orderBy('created_at', 'desc')
      .first()

    if (currentOrder.payment_method) {
      console.error(`Order already has payment method ${currentOrder.payment_method}; Will not modify`);
      return null;
    }

    const updated = await OrderTable()
      .update(params)
      .where('id', currentOrder.id)
      .returning('*')
    console.info('UPDATED ', JSON.stringify(updated));
    return updated[0];
  }

  static async orders() {
    // @todo: implement get customer's orders
    
  }
}

module.exports = Customers;