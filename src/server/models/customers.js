const db = require('./db');

const Table = () => db('customers');

class Customers {
  constructor(customer) { this.customer = customer }

  static async create({name}) {
    const res = await Table()
      .insert({ name })
      .returning('id');
    return res[0];
  }

  static async getWithId(id) {
    return await Table()
      .select()
      .where('id', id)
      .first();
  }
}

module.exports = Customers;