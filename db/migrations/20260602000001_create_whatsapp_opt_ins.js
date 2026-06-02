exports.up = function (knex) {
  return knex.schema.createTable('whatsapp_opt_ins', (t) => {
    t.increments('id');
    t.integer('customer_id').unsigned().notNullable().index();
    t.integer('merchant_id').unsigned().notNullable().index();
    t.integer('order_id').unsigned().nullable().index();
    t.string('wa_id', 32).nullable();
    t.string('phone_e164', 32).nullable();
    t.string('opt_in_source', 32).notNullable().defaultTo('web_checkout');
    t.boolean('marketing_allowed').notNullable().defaultTo(false);
    t.timestamp('opted_in_at').defaultTo(knex.fn.now());
    t.foreign('customer_id').references('id').inTable('customers').onUpdate('CASCADE').onDelete('CASCADE');
    t.foreign('merchant_id').references('id').inTable('merchants').onUpdate('CASCADE').onDelete('CASCADE');
    t.foreign('order_id').references('id').inTable('orders').onUpdate('CASCADE').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('whatsapp_opt_ins');
};
