/**
 * Add image_url to menu_items for online ordering page display
 */
exports.up = function (knex) {
  return knex.schema.table('menu_items', (t) => {
    t.string('image_url');
  });
};

exports.down = function (knex) {
  return knex.schema.table('menu_items', (t) => {
    t.dropColumn('image_url');
  });
};
