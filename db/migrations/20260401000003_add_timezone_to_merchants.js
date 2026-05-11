/**
 * Add timezone to merchants for business hours display and currently_open calculation.
 * IANA identifiers (e.g. "America/New_York", "Asia/Kuala_Lumpur").
 * Default "UTC" — merchants must set this explicitly for accurate hours.
 */
exports.up = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.string('timezone').defaultTo('UTC');
  });
};

exports.down = function (knex) {
  return knex.schema.table('merchants', (t) => {
    t.dropColumn('timezone');
  });
};
