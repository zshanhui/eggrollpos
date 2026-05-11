
const menus = [
  {
    id: 1,
    merchant_id: 1,
    name: 'Lunch Menu',
    slug: 'instep-cafe-new-york-10001-lunch-menu',
    description: 'Available weekdays 11am-2pm',
    is_published: true,
    business_hours: JSON.stringify({
      mon: { open: '16:00', close: '19:00' },
      tue: { open: '16:00', close: '19:00' },
      wed: { open: '16:00', close: '19:00' },
      thu: { open: '16:00', close: '19:00' },
      fri: { open: '16:00', close: '19:00' },
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
      mon: { open: '22:00', close: '03:00' },
      tue: { open: '22:00', close: '03:00' },
      wed: { open: '22:00', close: '03:00' },
      thu: { open: '22:00', close: '03:00' },
      fri: { open: '22:00', close: '04:00' },
      sat: { open: '22:00', close: '04:00' },
      sun: { open: null, close: null },
    }),
  },
];

const menuItems = [
  // INSTEP Cafe Lunch Menu
  { menu_id: 1, menu_item_id: 1, sort_order: 0 },  // Drip Coffee
  { menu_id: 1, menu_item_id: 3, sort_order: 1 },  // Avocado Toast
  { menu_id: 1, menu_item_id: 4, sort_order: 2 },  // Breakfast Burrito

  // Eastern Express Dinner Menu
  { menu_id: 2, menu_item_id: 6, sort_order: 0 },  // Kung Pao Chicken
  { menu_id: 2, menu_item_id: 7, sort_order: 1 },  // Beef Chow Fun
  { menu_id: 2, menu_item_id: 9, sort_order: 2 },  // Spring Rolls
];

exports.seed = function (knex) {
  return knex('menu_menu_items').del()
    .then(() => knex('menus').del())
    .then(() => knex('menus').insert(menus))
    .then(() => knex('menu_menu_items').insert(menuItems));
};
