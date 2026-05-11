/**
 * Add city to merchants for slug generation in online ordering
 * Explicit field instead of parsing from address which is unreliable
 */
exports.up = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.string('address_city');
  });
};

exports.down = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.dropColumn('address_city');
  });
};
