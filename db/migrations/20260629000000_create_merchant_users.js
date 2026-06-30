exports.up = async function (knex) {
  await knex.schema.createTable('merchant_users', function (table) {
    table.increments('id').primary();
    table
      .integer('merchant_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('merchants')
      .onDelete('CASCADE');
    table.string('supabase_user_id', 128).notNullable();
    table.string('role', 32).notNullable().defaultTo('owner');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['merchant_id', 'supabase_user_id']);
    table.index(['supabase_user_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('merchant_users');
};
