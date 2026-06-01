exports.up = function (knex) {
  return knex.schema.createTable('whatsapp_message_log', (t) => {
    t.increments('id');
    t.string('dedupe_key', 255).notNullable().unique();
    t.string('wa_message_id', 255).nullable().index();
    t.string('direction', 32).notNullable();
    t.string('event_field', 64).nullable();
    t.string('event_kind', 64).nullable();
    t.string('phone_number_id', 64).nullable();
    t.string('wa_id', 32).nullable();
    t.json('payload_json').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('whatsapp_message_log');
};
