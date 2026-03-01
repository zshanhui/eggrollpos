exports.up = function(knex) {
  return knex.schema.alterTable('merchants', function(t) {
    t.uuid('uuid').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('merchants', function(t) {
    t.dropColumn('uuid');
  });
};
