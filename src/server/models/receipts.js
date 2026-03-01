const db = require('./db');

const Table = () => db('receipts');

class Receipts {
    constructor(receipt) { this.receipt = receipt }

    static async create({orderId, paymentMethod, params}) {
    const res = await Table()
      .insert({
        order_id : orderId,
        payment_method : paymentMethod,
        subtotal_cents : params.subtotalCents,
        tax_cents : params.taxCents,
        total_cents : params.totalCents
      }).returning('id');
    return res[0];
  }

  static async getWithId(id){
      return await Table()
      .select('receipts.*','merchants.business_name')
      .join('orders', {'receipts.order_id': 'orders.id'})
      .join('merchants', {'orders.merchant_id': 'merchants.id'})
      .where('receipts.id', id)
      .first();
  }

  static async getWithOrderId(orderId) {
    return await Table()
      .select()
      .where('order_id', orderId)
      .first();
  }

}

module.exports = Receipts;
