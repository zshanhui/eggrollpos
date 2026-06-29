const db = require('./db');
const { extractReturningRow } = require('../db/insert-id');

const T = () => db('modifiers');
const JunctionT = () => db('menu_item_modifiers');

class Modifiers {
  static async listByMerchantId(merchantId) {
    return T()
      .select()
      .where('merchant_id', merchantId)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc');
  }

  static async create({ merchantId, name, priceAdjustmentCents = 0, sortOrder = 0 }) {
    const result = await T()
      .insert({
        merchant_id: merchantId,
        name,
        price_adjustment_cents: priceAdjustmentCents,
        sort_order: sortOrder,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return extractReturningRow(result);
  }

  static async update(id, { name, priceAdjustmentCents, sortOrder }) {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (priceAdjustmentCents !== undefined) updates.price_adjustment_cents = priceAdjustmentCents;
    if (sortOrder !== undefined) updates.sort_order = sortOrder;
    updates.updated_at = db.fn.now();

    const result = await T()
      .update(updates)
      .where('id', id)
      .returning('*');
    return extractReturningRow(result);
  }

  static async getById(id) {
    return T().select().where('id', id).first();
  }

  static async delete(id) {
    return T().where('id', id).del();
  }

  static async getModifiersForMenuItem(menuItemId) {
    return JunctionT()
      .join('modifiers', 'menu_item_modifiers.modifier_id', 'modifiers.id')
      .select('modifiers.*')
      .where('menu_item_modifiers.menu_item_id', menuItemId)
      .orderBy('modifiers.sort_order', 'asc')
      .orderBy('modifiers.name', 'asc');
  }

  static async setModifiersForMenuItem(menuItemId, modifierIds, trx) {
    const junction = trx ? trx('menu_item_modifiers') : JunctionT();
    await junction.where('menu_item_id', menuItemId).del();
    if (modifierIds && modifierIds.length > 0) {
      await junction.insert(
        modifierIds.map((modifierId) => ({
          menu_item_id: menuItemId,
          modifier_id: modifierId,
        }))
      );
    }
  }

  static async validateForMerchant(merchantId, modifierIds, trx) {
    if (!modifierIds || modifierIds.length === 0) return;
    const table = trx ? trx('modifiers') : T();
    const rows = await table
      .where('merchant_id', merchantId)
      .whereIn('id', modifierIds);
    if (rows.length !== modifierIds.length) {
      const err = new Error('One or more modifiers are invalid for this merchant');
      err.status = 400;
      throw err;
    }
  }
}

module.exports = Modifiers;
