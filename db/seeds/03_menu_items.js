
exports.seed = function(knex) {
  return knex('menu_items').del()
    .then(function () {
      return knex('menu_items').insert([
        // INSTEP Cafe (merchant 1) — cafe
        {id: 1,  merchant_id: 1, name: 'Drip Coffee',        description: 'House blend, 16oz',                           price_cents: 350},
        {id: 2,  merchant_id: 1, name: 'Cappuccino',          description: 'Double shot espresso with steamed milk foam',  price_cents: 525},
        {id: 3,  merchant_id: 1, name: 'Avocado Toast',       description: 'Sourdough, smashed avo, chili flakes, egg',    price_cents: 1100},
        {id: 4,  merchant_id: 1, name: 'Breakfast Burrito',   description: 'Scrambled eggs, cheese, bacon, salsa',         price_cents: 950},
        {id: 5,  merchant_id: 1, name: 'Blueberry Muffin',    description: 'Freshly baked daily',                          price_cents: 425},
        {id: 21, merchant_id: 1, name: 'Latte',               description: 'Double espresso with steamed milk, 16oz',     price_cents: 525},
        {id: 22, merchant_id: 1, name: 'Mocha',               description: 'Espresso, chocolate, steamed milk',            price_cents: 575},
        {id: 23, merchant_id: 1, name: 'Chai Latte',          description: 'Spiced chai with steamed milk, 16oz',          price_cents: 525},
        {id: 24, merchant_id: 1, name: 'Espresso',            description: 'Double shot, 2oz',                             price_cents: 325},
        {id: 25, merchant_id: 1, name: 'Cold Brew',           description: '24-hour steeped, served over ice, 20oz',       price_cents: 475},
        {id: 26, merchant_id: 1, name: 'Hot Chocolate',       description: 'Rich cocoa with whipped cream, 12oz',          price_cents: 425},
        {id: 27, merchant_id: 1, name: 'Bagel & Cream Cheese',description: 'Toasted plain bagel with cream cheese',        price_cents: 525},
        {id: 28, merchant_id: 1, name: 'Butter Croissant',    description: 'Flaky French croissant, served warm',           price_cents: 425},
        {id: 29, merchant_id: 1, name: 'Turkey Club',         description: 'Turkey, bacon, lettuce, tomato, mayo on sourdough', price_cents: 1195},
        {id: 30, merchant_id: 1, name: 'Granola Bowl',        description: 'House granola, Greek yogurt, fresh berries',   price_cents: 875},
        {id: 31, merchant_id: 1, name: 'Banana Smoothie',     description: 'Banana, yogurt, honey, 16oz',                  price_cents: 675},
        {id: 32, merchant_id: 1, name: 'Chocolate Chip Cookie',description: 'Fresh-baked, warm',                           price_cents: 325},

        // Eastern Express (merchant 2) — Chinese takeout
        {id: 6,  merchant_id: 2, name: 'Kung Pao Chicken',    description: 'Spicy stir-fry with peanuts and peppers',      price_cents: 1450},
        {id: 7,  merchant_id: 2, name: 'Beef Chow Fun',       description: 'Wide rice noodles, tender beef, bean sprouts', price_cents: 1350},
        {id: 8,  merchant_id: 2, name: 'Wonton Soup',         description: 'Pork wontons in clear broth, scallions',       price_cents: 850},
        {id: 9,  merchant_id: 2, name: 'Spring Rolls (4)',    description: 'Crispy vegetable spring rolls',                price_cents: 650},
        {id: 10, merchant_id: 2, name: 'Fried Rice',          description: 'Egg fried rice with peas and carrots',         price_cents: 1050},
        {id: 43, merchant_id: 2, name: 'Orange Chicken',       description: 'Crispy fried chicken in tangy orange glaze',  price_cents: 1395},
        {id: 44, merchant_id: 2, name: 'Sesame Chicken',       description: 'Breaded chicken in sweet sesame sauce',       price_cents: 1350},
        {id: 45, merchant_id: 2, name: 'Mongolian Beef',       description: 'Wok-seared beef, scallions, garlic, soy glaze',price_cents: 1495},
        {id: 46, merchant_id: 2, name: 'Mapo Tofu',            description: 'Silken tofu in spicy Sichuan chili bean paste',price_cents: 1195},
        {id: 47, merchant_id: 2, name: 'Chicken with Broccoli',description: 'Sliced chicken and broccoli in garlic sauce',  price_cents: 1250},
        {id: 48, merchant_id: 2, name: 'Pepper Steak',         description: 'Thin-sliced beef, green peppers, onions, brown sauce', price_cents: 1395},
        {id: 49, merchant_id: 2, name: 'Shrimp with Lobster Sauce',description: 'Shrimp, egg, scallion in savory white sauce',price_cents: 1495},
        {id: 50, merchant_id: 2, name: 'Egg Drop Soup',        description: 'Silky egg ribbons in chicken broth',           price_cents: 425},
        {id: 51, merchant_id: 2, name: 'Crab Rangoon (6)',     description: 'Crispy wontons stuffed with crab and cream cheese', price_cents: 795},
        {id: 52, merchant_id: 2, name: 'Scallion Pancake',     description: 'Crispy pan-fried layered flatbread',           price_cents: 625},
        {id: 53, merchant_id: 2, name: 'Combination Lo Mein',  description: 'Chicken, beef, shrimp with stir-fried egg noodles', price_cents: 1295},
        {id: 54, merchant_id: 2, name: 'Shrimp Fried Rice',    description: 'Wok-fried rice with shrimp, egg, peas',        price_cents: 1195},

        // Mazu Stewed Noodles (merchant 3) — Fujian & Taiwanese noodles
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
        {id: 33, merchant_id: 3, name: 'Taiwanese Beef Noodle Soup', description: 'Braised beef shank, rich broth, hand-pulled noodles', price_cents: 1595},
        {id: 34, merchant_id: 3, name: 'Xiamen Satay Noodles',       description: 'Sha cha sauce, shrimp, squid, fish cake, wheat noodles', price_cents: 1395},
        {id: 35, merchant_id: 3, name: 'Danzai Noodles',             description: 'Minced pork, shrimp, egg in rich broth, thin noodles', price_cents: 1195},
        {id: 36, merchant_id: 3, name: 'Fujian Braised Noodles',     description: 'Braised thick wheat noodles, pork belly, shiitake, dried shrimp', price_cents: 1295},
        {id: 37, merchant_id: 3, name: 'Oyster Vermicelli',          description: 'Thin rice vermicelli, fresh oysters, black vinegar, cilantro', price_cents: 1095},
        {id: 38, merchant_id: 3, name: 'Fuzhou Fish Ball Noodles',   description: 'Stuffed fish balls, seaweed, clear broth, thin noodles', price_cents: 1195},
        {id: 39, merchant_id: 3, name: 'Sesame Paste Noodles',       description: 'Rich sesame-peanut sauce, julienned cucumber, wheat noodles', price_cents: 995},
        {id: 40, merchant_id: 3, name: 'Taiwanese Thick Soup Noodles',description: 'Pork羹 with enoki mushroom, bamboo shoots, thin noodles', price_cents: 1095},
        {id: 41, merchant_id: 3, name: 'Fried Sauce Noodles',        description: 'Zha Jiang — minced pork, soybean paste, bean sprouts, thick noodles', price_cents: 1195},
        {id: 42, merchant_id: 3, name: 'Xinghua Rice Vermicelli',    description: 'Paper-thin rice noodles, clams, lean pork, peanuts', price_cents: 995},
      ]);
    });
};
