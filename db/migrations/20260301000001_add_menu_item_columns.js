/**
 * Add is_active and sort_order to menu_items for availability and display ordering
 */
exports.up = function (knex) {
  return knex.schema.table('menu_items', (t) => {
    t.boolean('is_active').defaultTo(true);
    t.integer('sort_order').defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table('menu_items', (t) => {
    t.dropColumn('is_active');
    t.dropColumn('sort_order');
  });
};
