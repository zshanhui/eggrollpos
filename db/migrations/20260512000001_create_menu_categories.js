exports.up = function (knex) {
  return knex.schema
    .createTable('menu_categories', (t) => {
      t.increments('id');
      t.integer('merchant_id').unsigned().index();
      t.foreign('merchant_id').references('id').inTable('merchants').onUpdate('CASCADE').onDelete('CASCADE');
      t.string('name').notNullable();
      t.integer('sort_order').defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .alterTable('menu_items', (t) => {
      t.integer('category_id').unsigned().index();
      t.foreign('category_id').references('id').inTable('menu_categories').onUpdate('CASCADE').onDelete('SET NULL');
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('menu_items', (t) => {
      t.dropForeign('category_id');
      t.dropColumn('category_id');
    })
    .dropTableIfExists('menu_categories');
};
