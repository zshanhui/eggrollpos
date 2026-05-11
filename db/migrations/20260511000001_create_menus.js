exports.up = function (knex) {
  return knex.schema
    .createTable('menus', (t) => {
      t.increments('id');
      t.integer('merchant_id').unsigned().notNullable().index();
      t.foreign('merchant_id').references('id').inTable('merchants').onUpdate('CASCADE').onDelete('CASCADE');
      t.string('name').notNullable();
      t.string('slug').unique().notNullable();
      t.text('description');
      t.boolean('is_published').defaultTo(false);
      t.jsonb('business_hours');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('menu_menu_items', (t) => {
      t.integer('menu_id').unsigned().notNullable();
      t.integer('menu_item_id').unsigned().notNullable();
      t.primary(['menu_id', 'menu_item_id']);
      t.foreign('menu_id').references('id').inTable('menus').onUpdate('CASCADE').onDelete('CASCADE');
      t.foreign('menu_item_id').references('id').inTable('menu_items').onUpdate('CASCADE').onDelete('CASCADE');
      t.integer('sort_order').defaultTo(0);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('menu_menu_items')
    .dropTableIfExists('menus');
};
