
exports.seed = function(knex) {
  return knex('line_items').del()
    .then(function () {
      return knex('line_items').insert([
        // Order 1 — Bob Customer 1, pickup, waiting
        {id: 1,  menu_item_id: 11, order_id: 1, quantity: 1},
        {id: 2,  menu_item_id: 14, order_id: 1, quantity: 2},

        // Order 2 — Bob Customer 2, delivery, waiting
        {id: 3,  menu_item_id: 13, order_id: 2, quantity: 1},
        {id: 4,  menu_item_id: 15, order_id: 2, quantity: 2},
        {id: 5,  menu_item_id: 12, order_id: 2, quantity: 1},

        // Order 3 — Bob Customer 3, pickup, accepted
        {id: 6,  menu_item_id: 11, order_id: 3, quantity: 2},
        {id: 7,  menu_item_id: 15, order_id: 3, quantity: 1},

        // Order 4 — Bob Customer 4, delivery, accepted
        {id: 8,  menu_item_id: 13, order_id: 4, quantity: 1},
        {id: 9,  menu_item_id: 14, order_id: 4, quantity: 1},
        {id: 10, menu_item_id: 11, order_id: 4, quantity: 1},

        // Order 5 — Bob Customer 5, pickup, preparing
        {id: 11, menu_item_id: 12, order_id: 5, quantity: 1},
        {id: 12, menu_item_id: 14, order_id: 5, quantity: 3},

        // Order 6 — Bob Customer 6, delivery, preparing
        {id: 13, menu_item_id: 13, order_id: 6, quantity: 2},
        {id: 14, menu_item_id: 11, order_id: 6, quantity: 1},
        {id: 15, menu_item_id: 15, order_id: 6, quantity: 1},

        // Order 7 — Bob Customer 1, pickup, ready for pickup
        {id: 16, menu_item_id: 11, order_id: 7, quantity: 1},
        {id: 17, menu_item_id: 13, order_id: 7, quantity: 1},

        // Order 8 — Bob Customer 2, delivery, ready for delivery
        {id: 18, menu_item_id: 12, order_id: 8, quantity: 1},
        {id: 19, menu_item_id: 14, order_id: 8, quantity: 2},

        // Order 9 — completed pickup
        {id: 20, menu_item_id: 11, order_id: 9,  quantity: 1},

        // Order 10 — completed delivery
        {id: 21, menu_item_id: 13, order_id: 10, quantity: 2},

        // Order 11 — canceled
        {id: 22, menu_item_id: 14, order_id: 11, quantity: 1},

        // Order 12 — refunded
        {id: 23, menu_item_id: 11, order_id: 12, quantity: 1},
        {id: 24, menu_item_id: 12, order_id: 12, quantity: 1},

        // Order 13 — Alice Merchant 1
        {id: 25, menu_item_id: 1,  order_id: 13, quantity: 2},
        {id: 26, menu_item_id: 3,  order_id: 13, quantity: 1},

        // Order 14 — Alice Merchant 1
        {id: 27, menu_item_id: 2,  order_id: 14, quantity: 1},
        {id: 28, menu_item_id: 4,  order_id: 14, quantity: 1},
        {id: 29, menu_item_id: 5,  order_id: 14, quantity: 2},

        // Order 15 — Alice Merchant 2
        {id: 30, menu_item_id: 6,  order_id: 15, quantity: 1},
        {id: 31, menu_item_id: 8,  order_id: 15, quantity: 2},
        {id: 32, menu_item_id: 10, order_id: 15, quantity: 1},

        // Order 16 — Alice Merchant 2
        {id: 33, menu_item_id: 7,  order_id: 16, quantity: 1},
        {id: 34, menu_item_id: 9,  order_id: 16, quantity: 2},
      ]);
    });
};
