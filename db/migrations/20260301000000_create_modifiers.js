/**
 * Modifiers: merchant-level options like "extra bacon", "less salt"
 * - price_adjustment_cents: 0 for instructions (no price), positive for add-ons
 * - sort_order: for display ordering in UI
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('modifiers', (t) => {
      t.increments('id');
      t.integer('merchant_id').unsigned().notNullable().index();
      t.foreign('merchant_id').references('id').inTable('merchants').onUpdate('CASCADE').onDelete('CASCADE');
      t.string('name').notNullable();
      t.integer('price_adjustment_cents').defaultTo(0);
      t.integer('sort_order').defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('menu_item_modifiers', (t) => {
      t.integer('menu_item_id').unsigned().notNullable();
      t.integer('modifier_id').unsigned().notNullable();
      t.primary(['menu_item_id', 'modifier_id']);
      t.foreign('menu_item_id').references('id').inTable('menu_items').onUpdate('CASCADE').onDelete('CASCADE');
      t.foreign('modifier_id').references('id').inTable('modifiers').onUpdate('CASCADE').onDelete('CASCADE');
    })
    .createTable('line_item_modifiers', (t) => {
      t.increments('id');
      t.integer('line_item_id').unsigned().notNullable().index();
      t.integer('modifier_id').unsigned().notNullable().index();
      t.foreign('line_item_id').references('id').inTable('line_items').onUpdate('CASCADE').onDelete('CASCADE');
      t.foreign('modifier_id').references('id').inTable('modifiers').onUpdate('CASCADE').onDelete('RESTRICT');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('line_item_modifiers')
    .dropTableIfExists('menu_item_modifiers')
    .dropTableIfExists('modifiers');
};
