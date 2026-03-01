
exports.seed = function(knex) {
  return knex('merchants').del()
    .then(function () {
      return knex('merchants').insert([
        {id: 1, business_name: 'Alice Merchant 1', postal_code: '10001', address: '100 Main St, New York, NY', description: 'Coffee and breakfast all day', type: 'cafe'},
        {id: 2, business_name: 'Alice Merchant 2', postal_code: '15228', address: '200 Oak Ave, Pittsburgh, PA', description: 'Authentic Chinese cuisine', type: 'restaurant'},
        {id: 3, business_name: 'Alice Merchant 3', postal_code: '94105', address: '300 Market St, San Francisco, CA', description: 'Fast casual bowls and wraps', type: 'fast_casual'},
      ]);
    });
};
