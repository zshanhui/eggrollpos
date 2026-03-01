
exports.seed = function(knex) {
  return knex('orders').del()
    .then(function () {
      return knex('orders').insert([
        // Active orders across all statuses for Alice Merchant 3 (the default dashboard merchant)
        {id: 1,  merchant_id: 3, customer_id: 1, pickup_in: 15, status: 'waiting_for_acceptance', order_type: 'pickup',   uuid: 'a0000001-0001-0001-0001-000000000001', confirmed_at: knex.fn.now()},
        {id: 2,  merchant_id: 3, customer_id: 2, pickup_in: 30, status: 'waiting_for_acceptance', order_type: 'delivery', uuid: 'a0000002-0002-0002-0002-000000000002', confirmed_at: knex.fn.now()},
        {id: 3,  merchant_id: 3, customer_id: 3, pickup_in: 20, status: 'accepted',               order_type: 'pickup',   uuid: 'a0000003-0003-0003-0003-000000000003', confirmed_at: knex.fn.now()},
        {id: 4,  merchant_id: 3, customer_id: 4, pickup_in: 45, status: 'accepted',               order_type: 'delivery', uuid: 'a0000004-0004-0004-0004-000000000004', confirmed_at: knex.fn.now()},
        {id: 5,  merchant_id: 3, customer_id: 5, pickup_in: 30, status: 'preparing',              order_type: 'pickup',   uuid: 'a0000005-0005-0005-0005-000000000005', confirmed_at: knex.fn.now()},
        {id: 6,  merchant_id: 3, customer_id: 6, pickup_in: 60, status: 'preparing',              order_type: 'delivery', uuid: 'a0000006-0006-0006-0006-000000000006', confirmed_at: knex.fn.now()},
        {id: 7,  merchant_id: 3, customer_id: 1, pickup_in: 15, status: 'ready_for_pickup',       order_type: 'pickup',   uuid: 'a0000007-0007-0007-0007-000000000007', confirmed_at: knex.fn.now()},
        {id: 8,  merchant_id: 3, customer_id: 2, pickup_in: 30, status: 'ready_for_delivery',     order_type: 'delivery', uuid: 'a0000008-0008-0008-0008-000000000008', confirmed_at: knex.fn.now()},

        // Completed / terminal orders
        {id: 9,  merchant_id: 3, customer_id: 3, pickup_in: 15, status: 'pickup_success',         order_type: 'pickup',   uuid: 'a0000009-0009-0009-0009-000000000009', confirmed_at: knex.fn.now()},
        {id: 10, merchant_id: 3, customer_id: 4, pickup_in: 30, status: 'delivered',              order_type: 'delivery', uuid: 'a0000010-0010-0010-0010-000000000010', confirmed_at: knex.fn.now()},
        {id: 11, merchant_id: 3, customer_id: 5, pickup_in: 20, status: 'canceled',               order_type: 'pickup',   uuid: 'a0000011-0011-0011-0011-000000000011', confirmed_at: knex.fn.now(), cancel_reason: 'Changed my mind'},
        {id: 12, merchant_id: 3, customer_id: 6, pickup_in: 30, status: 'refunded',               order_type: 'delivery', uuid: 'a0000012-0012-0012-0012-000000000012', confirmed_at: knex.fn.now(), cancel_reason: 'Wrong items delivered'},

        // Orders for other merchants
        {id: 13, merchant_id: 1, customer_id: 1, pickup_in: 10, status: 'waiting_for_acceptance', order_type: 'pickup',   uuid: 'a0000013-0013-0013-0013-000000000013', confirmed_at: knex.fn.now()},
        {id: 14, merchant_id: 1, customer_id: 3, pickup_in: 20, status: 'preparing',              order_type: 'pickup',   uuid: 'a0000014-0014-0014-0014-000000000014', confirmed_at: knex.fn.now()},
        {id: 15, merchant_id: 2, customer_id: 2, pickup_in: 30, status: 'accepted',               order_type: 'delivery', uuid: 'a0000015-0015-0015-0015-000000000015', confirmed_at: knex.fn.now()},
        {id: 16, merchant_id: 2, customer_id: 5, pickup_in: 25, status: 'waiting_for_acceptance', order_type: 'pickup',   uuid: 'a0000016-0016-0016-0016-000000000016', confirmed_at: knex.fn.now()},
      ]);
    });
};
