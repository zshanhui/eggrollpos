exports.up = async function (knex) {
  await knex('merchants').whereNull('theme').update({ theme: 'light' });
  await knex('merchants').where('theme', 'dark').update({ theme: 'light' });

  await knex.schema.alterTable('merchants', function (t) {
    t.string('theme').defaultTo('light').alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('merchants', function (t) {
    t.string('theme').defaultTo('dark').alter();
  });
};
