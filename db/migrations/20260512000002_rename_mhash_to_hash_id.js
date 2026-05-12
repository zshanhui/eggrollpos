exports.up = knex => knex.schema.table('merchants', (table) => {
  table.renameColumn('mhash', 'hash_id');
});

exports.down = knex => knex.schema.table('merchants', (table) => {
  table.renameColumn('hash_id', 'mhash');
});
