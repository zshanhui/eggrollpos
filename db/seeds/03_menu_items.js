
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

        // Eastern Express — Chinese takeout (merchant 3)
        {id: 11, merchant_id: 3, name: 'General Tso\'s Chicken', description: 'Crispy chicken in sweet spicy sauce',        price_cents: 1295},
        {id: 12, merchant_id: 3, name: 'Chicken Fried Rice',    description: 'Wok-fried rice with egg and vegetables',       price_cents: 995},
        {id: 13, merchant_id: 3, name: 'Beef with Broccoli',     description: 'Tender beef and broccoli in brown sauce',     price_cents: 1395},
        {id: 14, merchant_id: 3, name: 'Vegetable Lo Mein',       description: 'Stir-fried noodles with mixed vegetables',     price_cents: 995},
        {id: 15, merchant_id: 3, name: 'Egg Roll (2)',           description: 'Crispy pork and vegetable egg rolls',          price_cents: 495},
        {id: 16, merchant_id: 3, name: 'Wonton Soup',            description: 'Pork wontons in clear broth',                 price_cents: 595},
        {id: 17, merchant_id: 3, name: 'Sweet and Sour Chicken', description: 'Breaded chicken with sweet and sour sauce',  price_cents: 1195},
        {id: 18, merchant_id: 3, name: 'Kung Pao Shrimp',        description: 'Shrimp with peanuts and peppers',            price_cents: 1495},
        {id: 19, merchant_id: 3, name: 'Hot and Sour Soup',     description: 'Spicy and tangy with tofu and mushrooms',    price_cents: 495},
        {id: 20, merchant_id: 3, name: 'Steamed Dumplings (6)',  description: 'Pork dumplings with soy ginger dipping',      price_cents: 695},
      ]);
    });
};
