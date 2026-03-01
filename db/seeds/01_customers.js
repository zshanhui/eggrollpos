
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('customers').del()
    .then(function () {
      // Inserts seed entries
      return knex('customers').insert([
        {id: 1, psid: '1005', name: 'Bob Customer 1', mobile_phone: '+16467122213'},
        {id: 2, psid: '1006', name: 'Bob Customer 2', mobile_phone: null},
        {id: 3, psid: '1007', name: 'Bob Customer 3', mobile_phone: '+13334445555'},
      ]);
    });
};
