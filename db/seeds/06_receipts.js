
exports.seed = function(knex) {
  return knex('receipts').del()
    .then(function () {
      return knex('receipts').insert([
        {id: 1, order_id: 9,  payment_method: 'in_store', subtotal_cents: 1175, tax_cents: 82,  total_cents: 1257},
        {id: 2, order_id: 10, payment_method: 'online_card', subtotal_cents: 2700, tax_cents: 189, total_cents: 2889},
      ]);
    });
};
