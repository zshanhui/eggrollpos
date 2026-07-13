/**
 * When true, the merchant KDS auto-opens the kitchen ticket print dialog on order_created.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('merchants', (t) => {
    t.boolean('kitchen_auto_print').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('merchants', (t) => {
    t.dropColumn('kitchen_auto_print');
  });
};
