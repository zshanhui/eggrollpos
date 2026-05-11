/**
 * Rename address columns to use consistent address_ prefix
 * address → address_street, postal_code → address_postal_code
 */
exports.up = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.renameColumn('address', 'address_street');
    t.renameColumn('postal_code', 'address_postal_code');
  });
};

exports.down = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.renameColumn('address_street', 'address');
    t.renameColumn('address_postal_code', 'postal_code');
  });
};
