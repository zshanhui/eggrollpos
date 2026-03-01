
exports.seed = function(knex) {
  return knex('menu_items').del()
    .then(function () {
      return knex('menu_items').insert([
        // Alice Merchant 1 — cafe
        {id: 1,  merchant_id: 1, name: 'Drip Coffee',        description: 'House blend, 16oz',                           price_cents: 350},
        {id: 2,  merchant_id: 1, name: 'Cappuccino',          description: 'Double shot espresso with steamed milk foam',  price_cents: 525},
        {id: 3,  merchant_id: 1, name: 'Avocado Toast',       description: 'Sourdough, smashed avo, chili flakes, egg',    price_cents: 1100},
        {id: 4,  merchant_id: 1, name: 'Breakfast Burrito',   description: 'Scrambled eggs, cheese, bacon, salsa',         price_cents: 950},
        {id: 5,  merchant_id: 1, name: 'Blueberry Muffin',    description: 'Freshly baked daily',                          price_cents: 425},

        // Alice Merchant 2 — Chinese restaurant
        {id: 6,  merchant_id: 2, name: 'Kung Pao Chicken',    description: 'Spicy stir-fry with peanuts and peppers',      price_cents: 1450},
        {id: 7,  merchant_id: 2, name: 'Beef Chow Fun',       description: 'Wide rice noodles, tender beef, bean sprouts', price_cents: 1350},
        {id: 8,  merchant_id: 2, name: 'Wonton Soup',         description: 'Pork wontons in clear broth, scallions',       price_cents: 850},
        {id: 9,  merchant_id: 2, name: 'Spring Rolls (4)',    description: 'Crispy vegetable spring rolls',                price_cents: 650},
        {id: 10, merchant_id: 2, name: 'Fried Rice',          description: 'Egg fried rice with peas and carrots',         price_cents: 1050},

        // Alice Merchant 3 — fast casual
        {id: 11, merchant_id: 3, name: 'Chicken Bowl',        description: 'Grilled chicken, rice, black beans, corn',     price_cents: 1175},
        {id: 12, merchant_id: 3, name: 'Veggie Wrap',         description: 'Hummus, roasted veggies, feta, spinach',       price_cents: 1025},
        {id: 13, merchant_id: 3, name: 'Steak Burrito',       description: 'Grilled steak, guac, sour cream, cheese',      price_cents: 1350},
        {id: 14, merchant_id: 3, name: 'Sweet Potato Fries',  description: 'Crispy with chipotle aioli',                   price_cents: 550},
        {id: 15, merchant_id: 3, name: 'Mango Smoothie',      description: 'Mango, banana, coconut milk',                  price_cents: 625},
      ]);
    });
};
