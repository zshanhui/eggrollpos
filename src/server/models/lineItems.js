const db = require('./db');

const T = () => db('line_items');

class LineItems {
  constructor(lineItems) { this.lineItems = lineItems }

  static async create({orderId, menuItemId, quantity}) {
    const res = await T().insert({
      order_id: orderId,
      menu_item_id: menuItemId,
      quantity,
    }).returning('id');
    return res[0];
  }

  static async update(id, params) {
    return await T()
      .update({...params})
      .where('id', id)
      .returning('id')
  }

  static async remove({lineItemId, orderId}) {
    const result = await T()
      .del()
      .where('id', lineItemId)
      .andWhere('order_id', orderId);
    return result;
  }

}

module.exports = LineItems;
