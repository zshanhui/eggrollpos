/**
 * Add state to merchants for address consistency and slug generation
 */
exports.up = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.string('address_state');
  });
};

exports.down = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.dropColumn('address_state');
  });
};
