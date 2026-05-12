
exports.seed = function (knex) {
  // Shared categories (merchant_id = null) — available to all merchants
  return knex('menu_categories').del()
    .then(() => knex('menu_categories').insert([
      { id: 1, merchant_id: null, name: 'Drinks', sort_order: 0 },
      { id: 2, merchant_id: null, name: 'Mains', sort_order: 1 },
      { id: 3, merchant_id: null, name: 'Sides', sort_order: 2 },
      { id: 4, merchant_id: null, name: 'Desserts', sort_order: 3 },
    ]))
    .then(() => knex('menu_items').update('category_id', knex.raw("CASE name WHEN 'Drip Coffee' THEN 1 WHEN 'Cappuccino' THEN 1 WHEN 'Mango Smoothie' THEN 1 WHEN 'Avocado Toast' THEN 2 WHEN 'Kung Pao Chicken' THEN 2 WHEN 'Beef Chow Fun' THEN 2 WHEN 'Chicken Bowl' THEN 2 WHEN 'Steak Burrito' THEN 2 WHEN 'Breakfast Burrito' THEN 2 WHEN 'Fried Rice' THEN 2 WHEN 'Veggie Wrap' THEN 2 WHEN 'Spring Rolls (4)' THEN 3 WHEN 'Sweet Potato Fries' THEN 3 WHEN 'Wonton Soup' THEN 3 WHEN 'Blueberry Muffin' THEN 4 END")));
};
