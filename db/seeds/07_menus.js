
const menus = [
  {
    id: 1,
    merchant_id: 1,
    name: 'Lunch Menu',
    slug: 'instep-cafe-new-york-10001-lunch-menu',
    description: 'Available weekdays 11am-2pm',
    is_published: true,
    // Wall-clock times in merchant timezone (America/New_York)
    business_hours: JSON.stringify({
      mon: { open: '11:00', close: '14:00' },
      tue: { open: '11:00', close: '14:00' },
      wed: { open: '11:00', close: '14:00' },
      thu: { open: '11:00', close: '14:00' },
      fri: { open: '11:00', close: '14:00' },
      sat: { open: null, close: null },
      sun: { open: null, close: null },
    }),
  },
  {
    id: 2,
    merchant_id: 2,
    name: 'Dinner Menu',
    slug: 'eastern-express-pittsburgh-15228-dinner-menu',
    description: 'Evening specials',
    is_published: true,
    business_hours: JSON.stringify({
      mon: { open: '17:00', close: '22:00' },
      tue: { open: '17:00', close: '22:00' },
      wed: { open: '17:00', close: '22:00' },
      thu: { open: '17:00', close: '22:00' },
      fri: { open: '17:00', close: '23:00' },
      sat: { open: '17:00', close: '23:00' },
      sun: { open: null, close: null },
    }),
  },
];

const menuItems = [
  // INSTEP Cafe Lunch Menu
  { menu_id: 1, menu_item_id: 1, sort_order: 0 },   // Drip Coffee
  { menu_id: 1, menu_item_id: 2, sort_order: 1 },   // Cappuccino
  { menu_id: 1, menu_item_id: 3, sort_order: 2 },   // Avocado Toast
  { menu_id: 1, menu_item_id: 4, sort_order: 3 },   // Breakfast Burrito
  { menu_id: 1, menu_item_id: 5, sort_order: 4 },   // Blueberry Muffin
  { menu_id: 1, menu_item_id: 21, sort_order: 5 },  // Latte

  // Eastern Express Dinner Menu
  { menu_id: 2, menu_item_id: 203, sort_order: 0 }, // General Tso's Chicken
  { menu_id: 2, menu_item_id: 238, sort_order: 1 }, // Roast Pork Egg Roll
  { menu_id: 2, menu_item_id: 251, sort_order: 2 }, // Wonton Soup
];

exports.seed = function (knex) {
  return knex('menu_menu_items').del()
    .then(() => knex('menus').del())
    .then(() => knex('menus').insert(menus))
    .then(() => knex('menu_menu_items').insert(menuItems));
};
