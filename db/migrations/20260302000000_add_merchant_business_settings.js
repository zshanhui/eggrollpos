exports.up = function(knex) {
  return knex.schema.alterTable('merchants', function(t) {
    t.string('tax_id');
    t.string('whatsapp_number');
    t.string('theme').defaultTo('dark');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('merchants', function(t) {
    t.dropColumn('tax_id');
    t.dropColumn('whatsapp_number');
    t.dropColumn('theme');
  });
};
