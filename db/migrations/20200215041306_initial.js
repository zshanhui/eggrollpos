
exports.up = function(knex) {
  return knex.schema.createTable('merchants', t => {
    t.increments('id')
    t.string('business_name')
    t.string('postal_code')
    t.string('address')
    t.string('description')
    t.string('type') // cafe/burgers/asian/chinese/ect..
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })
  .createTable('customers', t => {
    t.increments()
    t.string('psid')
    t.string('name')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('merchants')
    .dropTableIfExists('customers')
};
