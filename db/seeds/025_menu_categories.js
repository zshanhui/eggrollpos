
exports.seed = function (knex) {
  // Must run before 03_menu_items.js — menu_items.category_id FK references this table on PostgreSQL.
  return knex('menu_categories').del()
    .then(() => knex('menu_categories').insert([
      // Shared categories
      { id: 1, merchant_id: null, name: 'Drinks', sort_order: 0 },
      { id: 2, merchant_id: null, name: 'Mains', sort_order: 1 },
      { id: 3, merchant_id: null, name: 'Sides', sort_order: 2 },
      { id: 4, merchant_id: null, name: 'Desserts', sort_order: 3 },

      // Eastern Express categories
      { id: 100, merchant_id: 2, name: 'Spice Level Addition', sort_order: 0 },
      { id: 101, merchant_id: 2, name: 'Chicken Lunch Special', sort_order: 1 },
      { id: 102, merchant_id: 2, name: 'Beef Lunch Special', sort_order: 2 },
      { id: 103, merchant_id: 2, name: 'Shrimp Lunch Special', sort_order: 3 },
      { id: 104, merchant_id: 2, name: 'Vegetable Lunch Special', sort_order: 4 },
      { id: 105, merchant_id: 2, name: 'Lo Mein Lunch Special', sort_order: 5 },
      { id: 106, merchant_id: 2, name: 'Appetizers', sort_order: 6 },
      { id: 107, merchant_id: 2, name: 'Soup', sort_order: 7 },
      { id: 108, merchant_id: 2, name: 'Chow Mein', sort_order: 8 },
      { id: 109, merchant_id: 2, name: 'Fried Rice', sort_order: 9 },
      { id: 110, merchant_id: 2, name: 'Lo Mein', sort_order: 10 },
      { id: 111, merchant_id: 2, name: 'Chicken', sort_order: 11 },
      { id: 112, merchant_id: 2, name: 'Pork', sort_order: 12 },
      { id: 113, merchant_id: 2, name: 'Beef', sort_order: 13 },
      { id: 114, merchant_id: 2, name: 'Jumbo Shrimp', sort_order: 14 },
      { id: 115, merchant_id: 2, name: 'Egg Foo Young', sort_order: 15 },
      { id: 116, merchant_id: 2, name: 'Sweet & Sour', sort_order: 16 },
      { id: 117, merchant_id: 2, name: 'Vegetables', sort_order: 17 },
      { id: 118, merchant_id: 2, name: 'Diet Menu', sort_order: 18 },
      { id: 119, merchant_id: 2, name: "Chef's Specialties", sort_order: 19 },
      { id: 120, merchant_id: 2, name: 'Chicken Dinner Combination', sort_order: 20 },
      { id: 121, merchant_id: 2, name: 'Beef Dinner Combination', sort_order: 21 },
      { id: 122, merchant_id: 2, name: 'Shrimp Dinner Combination', sort_order: 22 },
      { id: 123, merchant_id: 2, name: 'Vegetable Dinner Combination', sort_order: 23 },
      { id: 124, merchant_id: 2, name: 'Lo Mein Dinner Combination', sort_order: 24 },
      { id: 125, merchant_id: 2, name: 'Side Order', sort_order: 25 },
      { id: 126, merchant_id: 2, name: 'Beverage', sort_order: 26 },
    ]));
};
