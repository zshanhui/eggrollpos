
exports.seed = function(knex) {
  return knex('customers').del()
    .then(function () {
      return knex('customers').insert([
        {id: 1, name: 'Bob Customer 1', mobile_phone: '+15551234567'},
        {id: 2, name: 'Bob Customer 2', mobile_phone: '+15559876543'},
        {id: 3, name: 'Bob Customer 3', mobile_phone: '+15555550101'},
        {id: 4, name: 'Bob Customer 4', mobile_phone: null},
        {id: 5, name: 'Bob Customer 5', mobile_phone: '+15555550202'},
        {id: 6, name: 'Bob Customer 6', mobile_phone: '+15555550303'},
      ]);
    });
};
