
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('merchants').del()
    .then(function () {
      // Inserts seed entries
      return knex('merchants').insert([
        {id: 1, business_name: 'Alice Merchant 1', postal_code: '018937', address: '9 Straits View, Singapore', type: 'cafe'},
        {id: 2, business_name: 'Alice Merchant 2', postal_code: '15228', address: '723 Washington Rd, Pittsburgh, PA', type: 'cafe'},
        {id: 3, business_name: 'Alice Merchant 3', postal_code: '21532', address: '109 E Main St, Frostburg, MD', type: 'cafe'},
      ]);
    });
};
