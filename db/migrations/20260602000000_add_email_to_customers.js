exports.up = function (knex) {
  return knex.schema.alterTable('customers', (t) => {
    t.string('email');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('customers', (t) => {
    t.dropColumn('email');
  });
};
