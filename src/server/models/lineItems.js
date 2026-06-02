const db = require('./db');

const T = () => db('line_items');
const ModifiersT = () => db('line_item_modifiers');

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

  static async addModifiers(lineItemId, modifierIds) {
    if (!modifierIds || modifierIds.length === 0) return;
    await ModifiersT().insert(
      modifierIds.map(modifierId => ({
        line_item_id: lineItemId,
        modifier_id: modifierId,
      }))
    );
  }

  static async getModifiers(lineItemId) {
    return ModifiersT()
      .join('modifiers', 'line_item_modifiers.modifier_id', 'modifiers.id')
      .select('modifiers.*')
      .where('line_item_modifiers.line_item_id', lineItemId);
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
