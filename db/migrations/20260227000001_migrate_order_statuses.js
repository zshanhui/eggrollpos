exports.up = async function(knex) {
  await knex('orders').where('status', 'confirmed').update({ status: 'waiting_for_acceptance' });
  await knex('orders').where('status', 'declined').update({ status: 'canceled' });
  await knex('orders').where('status', 'ready').update({ status: 'ready_for_pickup' });
  await knex('orders').where('status', 'on_delivery').update({ status: 'delivery_in_progress' });
  await knex('orders').where('status', 'started').update({ status: 'waiting_for_acceptance' });
};

exports.down = async function(knex) {
  await knex('orders').where('status', 'waiting_for_acceptance').update({ status: 'confirmed' });
  await knex('orders').where('status', 'canceled').update({ status: 'declined' });
  await knex('orders').where('status', 'ready_for_pickup').update({ status: 'ready' });
  await knex('orders').where('status', 'delivery_in_progress').update({ status: 'on_delivery' });
};
