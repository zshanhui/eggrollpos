/**
 * Cleanup seed — runs first, deletes all tables in FK-safe order.
 * Allows all subsequent seeds to be repeatable on PostgreSQL.
 */
exports.seed = function (knex) {
  // Delete children first, then parents (respects FK constraints)
  return knex('menu_menu_items').del()
    .then(() => knex('line_item_modifiers').del())
    .then(() => knex('menu_item_modifiers').del())
    .then(() => knex('line_items').del())
    .then(() => knex('receipts').del())
    .then(() => knex('orders').del())
    .then(() => knex('menus').del())
    .then(() => knex('menu_items').del())
    .then(() => knex('modifiers').del())
    .then(() => knex('customers').del())
    .then(() => knex('merchants').del());
};
