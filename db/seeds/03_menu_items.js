
exports.seed = function(knex) {
  return knex('menu_items').del()
    .then(function () {
      return knex('menu_items').insert([
        // ─── INSTEP Cafe (merchant 1) — cafe ───
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

        // ─── Eastern Express (merchant 2) — Chinese takeout ───

        // Spice Level Addition
        {id: 200, merchant_id: 2, category_id: 100, name: 'Medium 中辣', description: 'Medium 中辣', price_cents: 0},
        {id: 201, merchant_id: 2, category_id: 100, name: 'Mild 不辣', description: 'Mild 不辣', price_cents: 0},
        {id: 202, merchant_id: 2, category_id: 100, name: 'Spicy 辣', description: 'Spicy 辣', price_cents: 0},

        // Chicken Lunch Special
        {id: 203, merchant_id: 2, category_id: 101, name: "L 1. General Tso's Chicken 左宗鸡", description: "L 1. General Tso's Chicken 左宗鸡", price_cents: 995},
        {id: 204, merchant_id: 2, category_id: 101, name: 'L 2. Chicken w. Broccoli 芥兰鸡', description: 'L 2. Chicken w. Broccoli 芥兰鸡', price_cents: 995},
        {id: 205, merchant_id: 2, category_id: 101, name: 'L 3. Moo Goo Gai Pan Chicken 蘑菇鸡片', description: 'L 3. Moo Goo Gai Pan Chicken 蘑菇鸡片', price_cents: 995},
        {id: 206, merchant_id: 2, category_id: 101, name: 'L 4. Sweet & Sour Chicken 甜酸鸡', description: 'L 4. Sweet & Sour Chicken 甜酸鸡', price_cents: 995},
        {id: 207, merchant_id: 2, category_id: 101, name: 'L 5. Crispy Chicken 脆皮鸡', description: 'L 5. Crispy Chicken 脆皮鸡', price_cents: 995},
        {id: 208, merchant_id: 2, category_id: 101, name: 'L 6. Chicken w. Garlic Sauce 鱼香鸡', description: 'L 6. Chicken w. Garlic Sauce 鱼香鸡', price_cents: 995},
        {id: 209, merchant_id: 2, category_id: 101, name: 'L 7. Black Pepper Chicken 黑淑鸡', description: 'L 7. Black Pepper Chicken 黑淑鸡', price_cents: 995},
        {id: 210, merchant_id: 2, category_id: 101, name: 'L 8. Chicken w. Mixed Vegetables 杂菜鸡', description: 'L 8. Chicken w. Mixed Vegetables 杂菜鸡', price_cents: 995},
        {id: 211, merchant_id: 2, category_id: 101, name: 'L 9. Sesame Chicken 芝麻鸡', description: 'L 9. Sesame Chicken 芝麻鸡', price_cents: 995},
        {id: 212, merchant_id: 2, category_id: 101, name: 'L10. Orange Chicken 陈皮鸡', description: 'L10. Orange Chicken 陈皮鸡', price_cents: 995},
        {id: 213, merchant_id: 2, category_id: 101, name: 'L11. Cashew Nut Chicken 腰果鸡', description: 'L11. Cashew Nut Chicken 腰果鸡', price_cents: 995},
        {id: 214, merchant_id: 2, category_id: 101, name: 'L12. Kung Po Chicken 宫保鸡', description: 'L12. Kung Po Chicken 宫保鸡', price_cents: 995},
        {id: 215, merchant_id: 2, category_id: 101, name: 'L13. Chicken Chow Mein 鸡炒面', description: 'L13. Chicken Chow Mein 鸡炒面', price_cents: 995},
        {id: 216, merchant_id: 2, category_id: 101, name: 'L14. Curry Chicken 咖喱鸡', description: 'L14. Curry Chicken 咖喱鸡', price_cents: 995},
        {id: 217, merchant_id: 2, category_id: 101, name: 'L15. Hunan Chicken 湖南鸡', description: 'L15. Hunan Chicken 湖南鸡', price_cents: 995},

        // Beef Lunch Special
        {id: 218, merchant_id: 2, category_id: 102, name: 'L16. Beef w. Broccoli 芥兰牛', description: 'L16. Beef w. Broccoli 芥兰牛', price_cents: 995},
        {id: 219, merchant_id: 2, category_id: 102, name: 'L17. Pepper Steak w. Onion 青椒牛', description: 'L17. Pepper Steak w. Onion 青椒牛', price_cents: 995},
        {id: 220, merchant_id: 2, category_id: 102, name: 'L18. Beef w. Mushroom 蘑菇牛', description: 'L18. Beef w. Mushroom 蘑菇牛', price_cents: 995},
        {id: 221, merchant_id: 2, category_id: 102, name: 'L19. Hunan Beef 湖南牛', description: 'L19. Hunan Beef 湖南牛', price_cents: 995},
        {id: 222, merchant_id: 2, category_id: 102, name: 'L20. Beef w. Garlic Sauce 鱼香牛', description: 'L20. Beef w. Garlic Sauce 鱼香牛', price_cents: 995},

        // Shrimp Lunch Special
        {id: 223, merchant_id: 2, category_id: 103, name: 'L21. Shrimp w. Broccoli 芥兰虾', description: 'L21. Shrimp w. Broccoli 芥兰虾', price_cents: 995},
        {id: 224, merchant_id: 2, category_id: 103, name: 'L22. Shrimp w. Garlic Sauce 鱼香虾', description: 'L22. Shrimp w. Garlic Sauce 鱼香虾', price_cents: 995},
        {id: 225, merchant_id: 2, category_id: 103, name: 'L23. Shrimp w. Lobster Sauce 虾龙糊', description: 'L23. Shrimp w. Lobster Sauce 虾龙糊', price_cents: 995},
        {id: 226, merchant_id: 2, category_id: 103, name: 'L24. Shrimp w. Mixed Vegetables 什菜虾', description: 'L24. Shrimp w. Mixed Vegetables 什菜虾', price_cents: 995},
        {id: 227, merchant_id: 2, category_id: 103, name: 'L25. Shrimp Egg Foo Young 虾芙蓉蛋', description: 'L25. Shrimp Egg Foo Young 虾芙蓉蛋', price_cents: 995},
        {id: 228, merchant_id: 2, category_id: 103, name: 'L26. Scallop w. Broccoli 芥兰干贝', description: 'L26. Scallop w. Broccoli 芥兰干贝', price_cents: 995},

        // Vegetable Lunch Special
        {id: 229, merchant_id: 2, category_id: 104, name: 'L27. Sauteed Mixed Vegetable 什菜', description: 'L27. Sauteed Mixed Vegetable 什菜', price_cents: 995},
        {id: 230, merchant_id: 2, category_id: 104, name: 'L28. Buddhist Delight 罗汉斋', description: 'L28. Buddhist Delight 罗汉斋', price_cents: 995},
        {id: 231, merchant_id: 2, category_id: 104, name: "L29. General Tso's Tofu 左宗豆腐", description: "L29. General Tso's Tofu 左宗豆腐", price_cents: 995},
        {id: 232, merchant_id: 2, category_id: 104, name: 'L30. Sesame Tofu 芝麻豆腐', description: 'L30. Sesame Tofu 芝麻豆腐', price_cents: 995},
        {id: 233, merchant_id: 2, category_id: 104, name: 'L31. Broccoli w. Garlic Sauce 鱼香芥兰', description: 'L31. Broccoli w. Garlic Sauce 鱼香芥兰', price_cents: 995},

        // Lo Mein Lunch Special
        {id: 234, merchant_id: 2, category_id: 105, name: 'L32. Chicken Lo Mein 鸡捞面', description: 'L32. Chicken Lo Mein 鸡捞面', price_cents: 995},
        {id: 235, merchant_id: 2, category_id: 105, name: 'L33. Shrimp Lo Mein 虾捞面', description: 'L33. Shrimp Lo Mein 虾捞面', price_cents: 995},
        {id: 236, merchant_id: 2, category_id: 105, name: 'L34. Pork Lo Mein 肉捞面', description: 'L34. Pork Lo Mein 肉捞面', price_cents: 995},
        {id: 237, merchant_id: 2, category_id: 105, name: 'L35. Vegetable Lo Mein 菜捞面', description: 'L35. Vegetable Lo Mein 菜捞面', price_cents: 995},

        // Appetizers
        {id: 238, merchant_id: 2, category_id: 106, name: '1. Roast Pork Egg Roll (1) 春卷', description: '1. Roast Pork Egg Roll (1) 春卷', price_cents: 220},
        {id: 239, merchant_id: 2, category_id: 106, name: '2. Shrimp Egg Roll (1) 虾卷', description: '2. Shrimp Egg Roll (1) 虾卷', price_cents: 300},
        {id: 240, merchant_id: 2, category_id: 106, name: '4. Boneless Spare Ribs 无骨排', description: '4. Boneless Spare Ribs 无骨排', price_cents: 995},
        {id: 241, merchant_id: 2, category_id: 106, name: '5. Shrimp Toast (4) 虾吐司', description: '5. Shrimp Toast (4) 虾吐司', price_cents: 695},
        {id: 242, merchant_id: 2, category_id: 106, name: '6. Steamed Dumpling 水饺(8)', description: '6. Steamed Dumpling 水饺(8)', price_cents: 895},
        {id: 243, merchant_id: 2, category_id: 106, name: '6a. Fried Dumpling 锅贴(8)', description: '6a. Fried Dumpling 锅贴(8)', price_cents: 895},
        {id: 244, merchant_id: 2, category_id: 106, name: '7. Crab Rangoon (8) 蟹角', description: '7. Crab Rangoon (8) 蟹角', price_cents: 695},
        {id: 245, merchant_id: 2, category_id: 106, name: '8. Teriyaki Beef on Stick (4pcs) 牛串', description: '8. Teriyaki Beef on Stick (4pcs) 牛串', price_cents: 995},
        {id: 246, merchant_id: 2, category_id: 106, name: '8a. Teriyaki Chicken (4) 鸡串', description: '8a. Teriyaki Chicken (4) 鸡串', price_cents: 895},
        {id: 247, merchant_id: 2, category_id: 106, name: '9. Fried Chicken Wings (8) 炸鸡翅', description: '9. Fried Chicken Wings (8) 炸鸡翅', price_cents: 850},
        {id: 248, merchant_id: 2, category_id: 106, name: '10. Po Po Platter (for 2) 宝宝盘', description: '10. Po Po Platter (for 2) 宝宝盘', price_cents: 1395},
        {id: 249, merchant_id: 2, category_id: 106, name: '11. Hot & Spicy Wings (8) 麻辣翅膀', description: '11. Hot & Spicy Wings (8) 麻辣翅膀', price_cents: 850},
        {id: 250, merchant_id: 2, category_id: 106, name: '11A. Sugar Donut (10) 甜甜圈', description: '11A. Sugar Donut (10) 甜甜圈', price_cents: 695},

        // Soup
        {id: 251, merchant_id: 2, category_id: 107, name: '12. Wonton Soup 云吞汤', description: '12. Wonton Soup 云吞汤', price_cents: 395},
        {id: 252, merchant_id: 2, category_id: 107, name: '13. Egg Drop Soup 蛋花汤', description: '13. Egg Drop Soup 蛋花汤', price_cents: 395},
        {id: 253, merchant_id: 2, category_id: 107, name: '14. Wonton w. Egg Drop Soup 云吞蛋花汤', description: '14. Wonton w. Egg Drop Soup 云吞蛋花汤', price_cents: 395},
        {id: 254, merchant_id: 2, category_id: 107, name: '15. Chicken Noodle Soup 鸡汤面', description: '15. Chicken Noodle Soup 鸡汤面', price_cents: 395},
        {id: 255, merchant_id: 2, category_id: 107, name: '16. Chicken Rice Soup 鸡饭汤', description: '16. Chicken Rice Soup 鸡饭汤', price_cents: 395},
        {id: 256, merchant_id: 2, category_id: 107, name: '17. Hot & Sour Soup 酸辣汤', description: '17. Hot & Sour Soup 酸辣汤', price_cents: 395},
        {id: 257, merchant_id: 2, category_id: 107, name: '18. Vegetable Soup 青菜汤', description: '18. Vegetable Soup 青菜汤', price_cents: 395},
        {id: 258, merchant_id: 2, category_id: 107, name: '19. House Special Soup 本楼汤', description: '19. House Special Soup 本楼汤', price_cents: 395},

        // Chow Mein
        {id: 259, merchant_id: 2, category_id: 108, name: '20. Chicken Chow Mein 鸡炒面', description: '20. Chicken Chow Mein 鸡炒面', price_cents: 1325},
        {id: 260, merchant_id: 2, category_id: 108, name: '21. Pork Chow Mein 肉炒面', description: '21. Pork Chow Mein 肉炒面', price_cents: 1325},
        {id: 261, merchant_id: 2, category_id: 108, name: '22. Beef Chow Mein 牛肉炒面', description: '22. Beef Chow Mein 牛肉炒面', price_cents: 1325},
        {id: 262, merchant_id: 2, category_id: 108, name: '23. Shrimp Chow Mein 虾炒面', description: '23. Shrimp Chow Mein 虾炒面', price_cents: 1325},
        {id: 263, merchant_id: 2, category_id: 108, name: '24. Vegetable Chow Mein 蔬菜炒面', description: '24. Vegetable Chow Mein 蔬菜炒面', price_cents: 1325},
        {id: 264, merchant_id: 2, category_id: 108, name: '25. House Special Chow Mein 本楼炒面', description: '25. House Special Chow Mein 本楼炒面', price_cents: 1325},

        // Fried Rice
        {id: 265, merchant_id: 2, category_id: 109, name: '26a. Plain Fried Rice 净炒饭', description: '26a. Plain Fried Rice 净炒饭', price_cents: 700},
        {id: 266, merchant_id: 2, category_id: 109, name: '26. Chicken Fried Rice 鸡炒饭', description: '26. Chicken Fried Rice 鸡炒饭', price_cents: 1175},
        {id: 267, merchant_id: 2, category_id: 109, name: '27. Roast Pork Fried Rice 叉烧炒饭', description: '27. Roast Pork Fried Rice 叉烧炒饭', price_cents: 1175},
        {id: 268, merchant_id: 2, category_id: 109, name: '28. Beef Fried Rice 牛炒饭', description: '28. Beef Fried Rice 牛炒饭', price_cents: 1295},
        {id: 269, merchant_id: 2, category_id: 109, name: '29. Shrimp Fried Rice 虾仁炒饭', description: '29. Shrimp Fried Rice 虾仁炒饭', price_cents: 1295},
        {id: 270, merchant_id: 2, category_id: 109, name: '30. Vegetable Fried Rice 蔬菜炒饭', description: '30. Vegetable Fried Rice 蔬菜炒饭', price_cents: 1175},
        {id: 271, merchant_id: 2, category_id: 109, name: '31. House Special Fried Rice 本楼炒菜', description: '31. House Special Fried Rice 本楼炒菜', price_cents: 1295},

        // Lo Mein
        {id: 272, merchant_id: 2, category_id: 110, name: '32a. Plain Lo Mein 净捞面', description: '32a. Plain Lo Mein 净捞面', price_cents: 995},
        {id: 273, merchant_id: 2, category_id: 110, name: '32. Chicken Lo Mein 鸡捞面', description: '32. Chicken Lo Mein 鸡捞面', price_cents: 1325},
        {id: 274, merchant_id: 2, category_id: 110, name: '33. Roast Pork Lo Mein 叉烧捞面', description: '33. Roast Pork Lo Mein 叉烧捞面', price_cents: 1325},
        {id: 275, merchant_id: 2, category_id: 110, name: '34. Beef Lo Mein 牛肉捞面', description: '34. Beef Lo Mein 牛肉捞面', price_cents: 1395},
        {id: 276, merchant_id: 2, category_id: 110, name: '35. Shrimp Lo Mein 虾捞面', description: '35. Shrimp Lo Mein 虾捞面', price_cents: 1395},
        {id: 277, merchant_id: 2, category_id: 110, name: '36. Vegetable Lo Mein 菜捞面', description: '36. Vegetable Lo Mein 菜捞面', price_cents: 1295},
        {id: 278, merchant_id: 2, category_id: 110, name: '37. House Special Lo Mein 本楼捞面', description: '37. House Special Lo Mein 本楼捞面', price_cents: 1395},

        // Chicken
        {id: 279, merchant_id: 2, category_id: 111, name: '38a. Chicken w. Brown Sauce 鸡汁', description: '38a. Chicken w. Brown Sauce 鸡汁', price_cents: 1325},
        {id: 280, merchant_id: 2, category_id: 111, name: '38. Chicken w. Broccoli 芥兰鸡', description: '38. Chicken w. Broccoli 芥兰鸡', price_cents: 1325},
        {id: 281, merchant_id: 2, category_id: 111, name: '39. Moo Goo Gai Pan 蘑菇鸡片', description: '39. Moo Goo Gai Pan 蘑菇鸡片', price_cents: 1325},
        {id: 282, merchant_id: 2, category_id: 111, name: '40. Chicken w. Snow Peas 雪豆鸡', description: '40. Chicken w. Snow Peas 雪豆鸡', price_cents: 1325},
        {id: 283, merchant_id: 2, category_id: 111, name: '41. Chicken w. Curry Sauce 咖喱鸡', description: '41. Chicken w. Curry Sauce 咖喱鸡', price_cents: 1325},
        {id: 284, merchant_id: 2, category_id: 111, name: '42. Chicken w. Cashew Nuts 腰果鸡', description: '42. Chicken w. Cashew Nuts 腰果鸡', price_cents: 1325},
        {id: 285, merchant_id: 2, category_id: 111, name: '43. Chicken w. Mixed Vegetables 杂菜鸡', description: '43. Chicken w. Mixed Vegetables 杂菜鸡', price_cents: 1325},
        {id: 286, merchant_id: 2, category_id: 111, name: '44. Kung Po Chicken 宫保鸡', description: '44. Kung Po Chicken 宫保鸡', price_cents: 1325},
        {id: 287, merchant_id: 2, category_id: 111, name: '45. Chicken w. Garlic Sauce 鱼香鸡', description: '45. Chicken w. Garlic Sauce 鱼香鸡', price_cents: 1325},
        {id: 288, merchant_id: 2, category_id: 111, name: '46. Hunan Chicken 湖南鸡', description: '46. Hunan Chicken 湖南鸡', price_cents: 1325},
        {id: 289, merchant_id: 2, category_id: 111, name: '47. Crispy Chicken 脆皮鸡', description: '47. Crispy Chicken 脆皮鸡', price_cents: 1325},
        {id: 290, merchant_id: 2, category_id: 111, name: '48. Szechuan Chicken 四川鸡', description: '48. Szechuan Chicken 四川鸡', price_cents: 1325},
        {id: 291, merchant_id: 2, category_id: 111, name: '49. Black Pepper Chicken 黑椒鸡', description: '49. Black Pepper Chicken 黑椒鸡', price_cents: 1325},

        // Pork
        {id: 292, merchant_id: 2, category_id: 112, name: '50. Roast Pork w. Broccoli 芥兰叉烧', description: '50. Roast Pork w. Broccoli 芥兰叉烧', price_cents: 1350},
        {id: 293, merchant_id: 2, category_id: 112, name: '51. Roast Pork w. Chinese Vegetable 白菜叉烧', description: '51. Roast Pork w. Chinese Vegetable 白菜叉烧', price_cents: 1350},
        {id: 294, merchant_id: 2, category_id: 112, name: '52. Roast Pork w. Snow Peas 雪豆叉烧', description: '52. Roast Pork w. Snow Peas 雪豆叉烧', price_cents: 1350},
        {id: 295, merchant_id: 2, category_id: 112, name: '53. Roast Pork w. Mixed Vegetable 什菜叉烧', description: '53. Roast Pork w. Mixed Vegetable 什菜叉烧', price_cents: 1350},
        {id: 296, merchant_id: 2, category_id: 112, name: '54. Roast Pork w. Garlic Sauce 鱼香叉烧', description: '54. Roast Pork w. Garlic Sauce 鱼香叉烧', price_cents: 1350},

        // Beef
        {id: 297, merchant_id: 2, category_id: 113, name: '56a. Beef w. Brown Sauce 牛肉酱汁', description: '56a. Beef w. Brown Sauce 牛肉酱汁', price_cents: 1475},
        {id: 298, merchant_id: 2, category_id: 113, name: '56. Beef w. Broccoli 芥兰牛', description: '56. Beef w. Broccoli 芥兰牛', price_cents: 1475},
        {id: 299, merchant_id: 2, category_id: 113, name: '57. Beef w. Chinese Vegetables 白菜牛', description: '57. Beef w. Chinese Vegetables 白菜牛', price_cents: 1475},
        {id: 300, merchant_id: 2, category_id: 113, name: '58. Pepper Steak w. Onion 青椒牛', description: '58. Pepper Steak w. Onion 青椒牛', price_cents: 1475},
        {id: 301, merchant_id: 2, category_id: 113, name: '59. Beef w. Mushroom 蘑菇牛', description: '59. Beef w. Mushroom 蘑菇牛', price_cents: 1475},
        {id: 302, merchant_id: 2, category_id: 113, name: '60. Beef w. Snow Peas 雪豆牛', description: '60. Beef w. Snow Peas 雪豆牛', price_cents: 1475},
        {id: 303, merchant_id: 2, category_id: 113, name: '61. Beef w. Mixed Vegetables 什菜牛', description: '61. Beef w. Mixed Vegetables 什菜牛', price_cents: 1475},
        {id: 304, merchant_id: 2, category_id: 113, name: '62. Curry Beef w. Onion 咖喱牛', description: '62. Curry Beef w. Onion 咖喱牛', price_cents: 1475},
        {id: 305, merchant_id: 2, category_id: 113, name: '63. Beef w. Garlic Sauce 鱼香牛', description: '63. Beef w. Garlic Sauce 鱼香牛', price_cents: 1475},
        {id: 306, merchant_id: 2, category_id: 113, name: '64. Hunan Beef 湖南牛', description: '64. Hunan Beef 湖南牛', price_cents: 1475},
        {id: 307, merchant_id: 2, category_id: 113, name: '65. Szechuan Beef 四川牛', description: '65. Szechuan Beef 四川牛', price_cents: 1475},

        // Jumbo Shrimp
        {id: 308, merchant_id: 2, category_id: 114, name: '66. Shrimp w. Broccoli 芥兰虾', description: '66. Shrimp w. Broccoli 芥兰虾', price_cents: 1575},
        {id: 309, merchant_id: 2, category_id: 114, name: '67. Shrimp w. Lobster Sauce 虾龙糊', description: '67. Shrimp w. Lobster Sauce 虾龙糊', price_cents: 1575},
        {id: 310, merchant_id: 2, category_id: 114, name: '68. Shrimp w. Chinese Vegetables 白菜虾', description: '68. Shrimp w. Chinese Vegetables 白菜虾', price_cents: 1575},
        {id: 311, merchant_id: 2, category_id: 114, name: '69. Scallop w. Broccoli 芥兰干贝', description: '69. Scallop w. Broccoli 芥兰干贝', price_cents: 1600},
        {id: 312, merchant_id: 2, category_id: 114, name: '70. Shrimp w. Snow Peas 雪豆虾', description: '70. Shrimp w. Snow Peas 雪豆虾', price_cents: 1575},
        {id: 313, merchant_id: 2, category_id: 114, name: '71. Shrimp w. Mixed Vegetables 什菜虾', description: '71. Shrimp w. Mixed Vegetables 什菜虾', price_cents: 1575},
        {id: 314, merchant_id: 2, category_id: 114, name: '72. Shrimp w. Garlic Sauce 鱼香虾', description: '72. Shrimp w. Garlic Sauce 鱼香虾', price_cents: 1575},
        {id: 315, merchant_id: 2, category_id: 114, name: '73. Hunan Shrimp 湖南虾', description: '73. Hunan Shrimp 湖南虾', price_cents: 1575},
        {id: 316, merchant_id: 2, category_id: 114, name: '74. Szechuan Shrimp 四川虾', description: '74. Szechuan Shrimp 四川虾', price_cents: 1575},

        // Egg Foo Young
        {id: 317, merchant_id: 2, category_id: 115, name: '75. Mushroom Egg Foo Young 蘑菇芙蓉蛋', description: '75. Mushroom Egg Foo Young 蘑菇芙蓉蛋', price_cents: 1350},
        {id: 318, merchant_id: 2, category_id: 115, name: '76. Roast Pork Egg Foo Young 叉烧芙蓉蛋', description: '76. Roast Pork Egg Foo Young 叉烧芙蓉蛋', price_cents: 1350},
        {id: 319, merchant_id: 2, category_id: 115, name: '77. Chicken Egg Foo Young 鸡芙蓉蛋', description: '77. Chicken Egg Foo Young 鸡芙蓉蛋', price_cents: 1350},
        {id: 320, merchant_id: 2, category_id: 115, name: '78. Shrimp Egg Foo Young 虾芙蓉蛋', description: '78. Shrimp Egg Foo Young 虾芙蓉蛋', price_cents: 1350},
        {id: 321, merchant_id: 2, category_id: 115, name: '79. Beef Egg Foo Young 牛芙蓉蛋', description: '79. Beef Egg Foo Young 牛芙蓉蛋', price_cents: 1350},

        // Sweet & Sour
        {id: 322, merchant_id: 2, category_id: 116, name: '80. Sweet & Sour Chicken 甜酸鸡', description: '80. Sweet & Sour Chicken 甜酸鸡', price_cents: 1350},

        // Vegetables
        {id: 323, merchant_id: 2, category_id: 117, name: '84a. Broccoli w. Brown Sauce 净芥兰', description: '84a. Broccoli w. Brown Sauce 净芥兰', price_cents: 1350},
        {id: 324, merchant_id: 2, category_id: 117, name: '84. Buddhist Delight 罗汉斋', description: '84. Buddhist Delight 罗汉斋', price_cents: 1350},
        {id: 325, merchant_id: 2, category_id: 117, name: '85. Sauteed Mixed Vegetables 什菜', description: '85. Sauteed Mixed Vegetables 什菜', price_cents: 1350},
        {id: 326, merchant_id: 2, category_id: 117, name: '86. Szechuan Bean Curd 四川豆腐', description: '86. Szechuan Bean Curd 四川豆腐', price_cents: 1350},
        {id: 327, merchant_id: 2, category_id: 117, name: '87. Broccoli w. Garlic Sauce 鱼香芥兰', description: '87. Broccoli w. Garlic Sauce 鱼香芥兰', price_cents: 1350},
        {id: 328, merchant_id: 2, category_id: 117, name: "89. General Tso's Tofu 左宗豆腐", description: "89. General Tso's Tofu 左宗豆腐", price_cents: 1350},
        {id: 329, merchant_id: 2, category_id: 117, name: '90. Sesame Tofu 芝麻豆腐', description: '90. Sesame Tofu 芝麻豆腐', price_cents: 1350},

        // Diet Menu
        {id: 330, merchant_id: 2, category_id: 118, name: 'D1. Steamed Mixed Vegetables 水煮杂菜', description: 'D1. Steamed Mixed Vegetables 水煮杂菜', price_cents: 1250},
        {id: 331, merchant_id: 2, category_id: 118, name: 'D2. Steamed Broccoli 水煮芥兰', description: 'D2. Steamed Broccoli 水煮芥兰', price_cents: 1250},
        {id: 332, merchant_id: 2, category_id: 118, name: 'D3. Steamed Mixed Vegetables w. Chicken 水煮杂菜鸡', description: 'D3. Steamed Mixed Vegetables w. Chicken 水煮杂菜鸡', price_cents: 1250},
        {id: 333, merchant_id: 2, category_id: 118, name: 'D4. Steamed Broccoli w. Chicken 水煮芥兰鸡', description: 'D4. Steamed Broccoli w. Chicken 水煮芥兰鸡', price_cents: 1250},
        {id: 334, merchant_id: 2, category_id: 118, name: 'D5. Steamed Broccoli w. Snow Peas 水煮雪豆芥兰', description: 'D5. Steamed Broccoli w. Snow Peas 水煮雪豆芥兰', price_cents: 1250},
        {id: 335, merchant_id: 2, category_id: 118, name: 'D6. Steamed Broccoli w. Lo Mein 水煮芥兰捞面', description: 'D6. Steamed Broccoli w. Lo Mein 水煮芥兰捞面', price_cents: 1250},
        {id: 336, merchant_id: 2, category_id: 118, name: 'D7. Steamed Shrimp w. Mixed Veg 白煮杂菜虾', description: 'D7. Steamed Shrimp w. Mixed Veg 白煮杂菜虾', price_cents: 1450},
        {id: 337, merchant_id: 2, category_id: 118, name: 'D8. Steamed Shrimp w. Broccoli', description: 'D8. Steamed Shrimp w. Broccoli', price_cents: 1450},

        // Chef's Specialties
        {id: 338, merchant_id: 2, category_id: 119, name: 'S1. Happy Family 全家福', description: 'S1. Happy Family 全家福', price_cents: 1600},
        {id: 339, merchant_id: 2, category_id: 119, name: 'S2. Hot & Spicy Shrimp 干烧虾', description: 'S2. Hot & Spicy Shrimp 干烧虾', price_cents: 1600},
        {id: 340, merchant_id: 2, category_id: 119, name: 'S3. Shrimp & Scallop in Hot Garlic Sauce 鱼香双干', description: 'S3. Shrimp & Scallop in Hot Garlic Sauce 鱼香双干', price_cents: 1750},
        {id: 341, merchant_id: 2, category_id: 119, name: 'S4. Seafood Delight 海鲜大会', description: 'S4. Seafood Delight 海鲜大会', price_cents: 2050},
        {id: 342, merchant_id: 2, category_id: 119, name: 'S5. Chicken & Shrimp Sauteed 爆双丁', description: 'S5. Chicken & Shrimp Sauteed 爆双丁', price_cents: 1450},
        {id: 343, merchant_id: 2, category_id: 119, name: 'S6. Dragon & Phoenix 龙凤配', description: 'S6. Dragon & Phoenix 龙凤配', price_cents: 1600},
        {id: 344, merchant_id: 2, category_id: 119, name: 'S7. Mongolian Triple Delight 蒙古三祥', description: 'S7. Mongolian Triple Delight 蒙古三祥', price_cents: 1600},
        {id: 345, merchant_id: 2, category_id: 119, name: 'S8. Sesame Beef 芝麻牛', description: 'S8. Sesame Beef 芝麻牛', price_cents: 1600},
        {id: 346, merchant_id: 2, category_id: 119, name: 'S9. Sesame Chicken 芝麻鸡', description: 'S9. Sesame Chicken 芝麻鸡', price_cents: 1450},
        {id: 347, merchant_id: 2, category_id: 119, name: 'S10. Hot & Spicy Beef 干烧牛', description: 'S10. Hot & Spicy Beef 干烧牛', price_cents: 1600},
        {id: 348, merchant_id: 2, category_id: 119, name: 'S11. Triple Delight 炒三祥', description: 'S11. Triple Delight 炒三祥', price_cents: 1600},
        {id: 349, merchant_id: 2, category_id: 119, name: "S12. General Tso's Chicken 左宗鸡", description: "S12. General Tso's Chicken 左宗鸡", price_cents: 1450},
        {id: 350, merchant_id: 2, category_id: 119, name: 'S13. Chicken with Orange Flavor 陈皮鸡', description: 'S13. Chicken with Orange Flavor 陈皮鸡', price_cents: 1450},
        {id: 351, merchant_id: 2, category_id: 119, name: 'S13. Beef with Orange Flavor 陈皮牛', description: 'S13. Beef with Orange Flavor 陈皮牛', price_cents: 1600},
        {id: 352, merchant_id: 2, category_id: 119, name: 'S14. Double Delight 炒双祥', description: 'S14. Double Delight 炒双祥', price_cents: 1600},

        // Chicken Dinner Combination
        {id: 353, merchant_id: 2, category_id: 120, name: "C 1. General Tso's Chicken 左宗鸡", description: "C 1. General Tso's Chicken 左宗鸡", price_cents: 1325},
        {id: 354, merchant_id: 2, category_id: 120, name: 'C 2. Chicken w. Broccoli 芥兰鸡', description: 'C 2. Chicken w. Broccoli 芥兰鸡', price_cents: 1325},
        {id: 355, merchant_id: 2, category_id: 120, name: 'C 3. Moo Goo Gai Pan Chicken 蘑菇鸡片', description: 'C 3. Moo Goo Gai Pan Chicken 蘑菇鸡片', price_cents: 1325},
        {id: 356, merchant_id: 2, category_id: 120, name: 'C 4. Sweet & Sour Chicken 甜酸鸡', description: 'C 4. Sweet & Sour Chicken 甜酸鸡', price_cents: 1325},
        {id: 357, merchant_id: 2, category_id: 120, name: 'C 5. Crispy Chicken 脆皮鸡', description: 'C 5. Crispy Chicken 脆皮鸡', price_cents: 1325},
        {id: 358, merchant_id: 2, category_id: 120, name: 'C 6. Chicken w. Garlic Sauce 鱼香鸡', description: 'C 6. Chicken w. Garlic Sauce 鱼香鸡', price_cents: 1325},
        {id: 359, merchant_id: 2, category_id: 120, name: 'C 7. Black Pepper Chicken 黑淑鸡', description: 'C 7. Black Pepper Chicken 黑淑鸡', price_cents: 1325},
        {id: 360, merchant_id: 2, category_id: 120, name: 'C 8. Chicken w. Mixed Vegetables 杂菜鸡', description: 'C 8. Chicken w. Mixed Vegetables 杂菜鸡', price_cents: 1325},
        {id: 361, merchant_id: 2, category_id: 120, name: 'C 9. Sesame Chicken 芝麻鸡', description: 'C 9. Sesame Chicken 芝麻鸡', price_cents: 1325},
        {id: 362, merchant_id: 2, category_id: 120, name: 'C10. Orange Chicken 陈皮鸡', description: 'C10. Orange Chicken 陈皮鸡', price_cents: 1325},
        {id: 363, merchant_id: 2, category_id: 120, name: 'C11. Cashew Nut Chicken 腰果鸡', description: 'C11. Cashew Nut Chicken 腰果鸡', price_cents: 1325},
        {id: 364, merchant_id: 2, category_id: 120, name: 'C12. Kung Po Chicken 宫保鸡', description: 'C12. Kung Po Chicken 宫保鸡', price_cents: 1325},
        {id: 365, merchant_id: 2, category_id: 120, name: 'C13. Chicken Chow Mein 鸡炒面', description: 'C13. Chicken Chow Mein 鸡炒面', price_cents: 1325},
        {id: 366, merchant_id: 2, category_id: 120, name: 'C14. Curry Chicken 咖喱鸡', description: 'C14. Curry Chicken 咖喱鸡', price_cents: 1325},
        {id: 367, merchant_id: 2, category_id: 120, name: 'C15. Hunan Chicken 湖南鸡', description: 'C15. Hunan Chicken 湖南鸡', price_cents: 1325},

        // Beef Dinner Combination
        {id: 368, merchant_id: 2, category_id: 121, name: 'C16. Beef w. Broccoli 芥兰牛', description: 'C16. Beef w. Broccoli 芥兰牛', price_cents: 1325},
        {id: 369, merchant_id: 2, category_id: 121, name: 'C17. Pepper Steak w. Onion 青椒牛', description: 'C17. Pepper Steak w. Onion 青椒牛', price_cents: 1325},
        {id: 370, merchant_id: 2, category_id: 121, name: 'C18. Beef w. Mushroom 蘑菇牛', description: 'C18. Beef w. Mushroom 蘑菇牛', price_cents: 1325},
        {id: 371, merchant_id: 2, category_id: 121, name: 'C19. Hunan Beef 湖南牛', description: 'C19. Hunan Beef 湖南牛', price_cents: 1325},
        {id: 372, merchant_id: 2, category_id: 121, name: 'C20. Beef w. Garlic Sauce 鱼香牛', description: 'C20. Beef w. Garlic Sauce 鱼香牛', price_cents: 1325},

        // Shrimp Dinner Combination
        {id: 373, merchant_id: 2, category_id: 122, name: 'C21. Shrimp w. Broccoli 芥兰虾', description: 'C21. Shrimp w. Broccoli 芥兰虾', price_cents: 1325},
        {id: 374, merchant_id: 2, category_id: 122, name: 'C22. Shrimp w. Garlic Sauce 鱼香虾', description: 'C22. Shrimp w. Garlic Sauce 鱼香虾', price_cents: 1325},
        {id: 375, merchant_id: 2, category_id: 122, name: 'C23. Shrimp w. Lobster Sauce 虾龙糊', description: 'C23. Shrimp w. Lobster Sauce 虾龙糊', price_cents: 1325},
        {id: 376, merchant_id: 2, category_id: 122, name: 'C24. Shrimp w. Mixed Vegetables 什菜虾', description: 'C24. Shrimp w. Mixed Vegetables 什菜虾', price_cents: 1325},
        {id: 377, merchant_id: 2, category_id: 122, name: 'C25. Shrimp Egg Foo Young 虾芙蓉蛋', description: 'C25. Shrimp Egg Foo Young 虾芙蓉蛋', price_cents: 1325},
        {id: 378, merchant_id: 2, category_id: 122, name: 'C26. Scallop w. Broccoli 芥兰干贝', description: 'C26. Scallop w. Broccoli 芥兰干贝', price_cents: 1195},

        // Vegetable Dinner Combination
        {id: 379, merchant_id: 2, category_id: 123, name: 'C27. Sauteed Mixed Vegetable 什菜', description: 'C27. Sauteed Mixed Vegetable 什菜', price_cents: 1325},
        {id: 380, merchant_id: 2, category_id: 123, name: 'C28. Buddhist Delight 罗汉斋', description: 'C28. Buddhist Delight 罗汉斋', price_cents: 1325},
        {id: 381, merchant_id: 2, category_id: 123, name: "C29. General Tso's Tofu 左宗豆腐", description: "C29. General Tso's Tofu 左宗豆腐", price_cents: 1325},
        {id: 382, merchant_id: 2, category_id: 123, name: 'C30. Sesame Tofu 芝麻豆腐', description: 'C30. Sesame Tofu 芝麻豆腐', price_cents: 1325},
        {id: 383, merchant_id: 2, category_id: 123, name: 'C31. Broccoli w. Garlic Sauce 鱼香芥兰', description: 'C31. Broccoli w. Garlic Sauce 鱼香芥兰', price_cents: 1325},

        // Lo Mein Dinner Combination
        {id: 384, merchant_id: 2, category_id: 124, name: 'C32. Chicken Lo Mein 鸡捞面', description: 'C32. Chicken Lo Mein 鸡捞面', price_cents: 1325},
        {id: 385, merchant_id: 2, category_id: 124, name: 'C33. Shrimp Lo Mein 虾捞面', description: 'C33. Shrimp Lo Mein 虾捞面', price_cents: 1325},
        {id: 386, merchant_id: 2, category_id: 124, name: 'C34. Pork Lo Mein 肉捞面', description: 'C34. Pork Lo Mein 肉捞面', price_cents: 1325},
        {id: 387, merchant_id: 2, category_id: 124, name: 'C35. Vegetable Lo Mein 菜捞面', description: 'C35. Vegetable Lo Mein 菜捞面', price_cents: 1325},

        // Side Order
        {id: 388, merchant_id: 2, category_id: 125, name: 'Fortune Cookies (5)', description: 'Fortune Cookies (5)', price_cents: 150},
        {id: 389, merchant_id: 2, category_id: 125, name: 'Crispy Noodles (Per Bag)', description: 'Crispy Noodles (Per Bag)', price_cents: 150},
        {id: 390, merchant_id: 2, category_id: 125, name: 'Boiled Rice', description: 'Boiled Rice', price_cents: 300},

        // Beverage
        {id: 391, merchant_id: 2, category_id: 126, name: 'Pepsi', description: 'Pepsi', price_cents: 275},
        {id: 392, merchant_id: 2, category_id: 126, name: 'Diet Pepsi', description: 'Diet Pepsi', price_cents: 275},
        {id: 393, merchant_id: 2, category_id: 126, name: 'Mountain Dew', description: 'Mountain Dew', price_cents: 275},
        {id: 394, merchant_id: 2, category_id: 126, name: 'Mug Root Beer', description: 'Mug Root Beer', price_cents: 275},
        {id: 395, merchant_id: 2, category_id: 126, name: 'Pepsi Wild Cherry', description: 'Pepsi Wild Cherry', price_cents: 275},
        {id: 396, merchant_id: 2, category_id: 126, name: 'Dr Pepper', description: 'Dr Pepper', price_cents: 275},
        {id: 397, merchant_id: 2, category_id: 126, name: 'Brisk Iced Tea Lemon', description: 'Brisk Iced Tea Lemon', price_cents: 275},
        {id: 398, merchant_id: 2, category_id: 126, name: 'Gatorade Fruit Punch', description: 'Gatorade Fruit Punch', price_cents: 275},
        {id: 399, merchant_id: 2, category_id: 126, name: 'Gatorade Cool Blue', description: 'Gatorade Cool Blue', price_cents: 275},
        {id: 400, merchant_id: 2, category_id: 126, name: 'Poppi Wild Berry', description: 'Poppi Wild Berry', price_cents: 300},
        {id: 401, merchant_id: 2, category_id: 126, name: 'Poppi Watermelon', description: 'Poppi Watermelon', price_cents: 300},
        {id: 402, merchant_id: 2, category_id: 126, name: 'Pure Leaf Sweet Tea', description: 'Pure Leaf Sweet Tea', price_cents: 325},
        {id: 403, merchant_id: 2, category_id: 126, name: 'Lipton Zero Sugar Green Tea Citrus', description: 'Lipton Zero Sugar Green Tea Citrus', price_cents: 200},

        // ─── Mazu Stewed Noodles (merchant 3) — Fujian & Taiwanese noodles ───
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
