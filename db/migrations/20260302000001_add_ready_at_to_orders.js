/**
 * Add ready_at timestamp to track when orders are marked ready for pickup/delivery.
 * Used to measure prep time.
 */

exports.up = function(knex) {
  return knex.schema.alterTable('orders', t => {
    t.timestamp('ready_at');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', t => {
    t.dropColumn('ready_at');
  });
};
