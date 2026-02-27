exports.up = function(knex) {
  return knex.raw(`
    UPDATE orders SET status = 'waiting_for_acceptance' WHERE status = 'confirmed';
    UPDATE orders SET status = 'canceled' WHERE status = 'declined';
    UPDATE orders SET status = 'ready_for_pickup' WHERE status = 'ready';
    UPDATE orders SET status = 'delivery_in_progress' WHERE status = 'on_delivery';
    UPDATE orders SET status = 'waiting_for_acceptance' WHERE status = 'started';
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    UPDATE orders SET status = 'confirmed' WHERE status = 'waiting_for_acceptance';
    UPDATE orders SET status = 'declined' WHERE status = 'canceled';
    UPDATE orders SET status = 'ready' WHERE status = 'ready_for_pickup';
    UPDATE orders SET status = 'on_delivery' WHERE status = 'delivery_in_progress';
  `);
};
