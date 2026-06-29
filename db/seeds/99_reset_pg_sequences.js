
exports.seed = function (knex) {
  const client = knex.client.config.client;
  if (client !== 'postgresql' && client !== 'postgres') {
    return Promise.resolve();
  }

  const tables = [
    'merchants',
    'customers',
    'menu_categories',
    'menu_items',
    'modifiers',
    'menus',
    'orders',
    'line_items',
    'receipts',
  ];

  return Promise.all(
    tables.map((table) =>
      knex.raw(`
        SELECT setval(
          pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1),
          true
        )
      `)
    )
  );
};
