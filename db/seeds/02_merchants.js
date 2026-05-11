
exports.seed = function(knex) {
  return knex('merchants').del()
    .then(function () {
      return knex('merchants').insert([
        {id: 1, uuid: 'a0000001-0001-0001-0001-000000000001', business_name: 'INSTEP Cafe', address_postal_code: '10001', address_street: '100 Main St', address_city: 'New York', address_state: 'NY', description: 'Coffee and breakfast all day', type: 'cafe'},
        {id: 2, uuid: 'a0000002-0002-0002-0002-000000000002', business_name: 'Eastern Express', address_postal_code: '15228', address_street: '200 Oak Ave', address_city: 'Pittsburgh', address_state: 'PA', description: 'Authentic Chinese cuisine', type: 'restaurant'},
        {id: 3, uuid: 'a0000003-0003-0003-0003-000000000003', business_name: 'Mazu Stewed Noodles', address_postal_code: '94105', address_street: '300 Market St', address_city: 'San Francisco', address_state: 'CA', description: 'Fast casual bowls and wraps', type: 'fast_casual'},
      ]);
    });
};
