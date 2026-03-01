exports.up = function(knex) {
  return knex.schema.alterTable('orders', function(t) {
    t.string('order_type').defaultTo('pickup');
    t.text('cancel_reason').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('orders', function(t) {
    t.dropColumn('order_type');
    t.dropColumn('cancel_reason');
  });
};
