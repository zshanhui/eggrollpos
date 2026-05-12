import db from './db';
import type { CustomerRow, CustomerCreateParams } from '../../shared/customers';

const Table = () => db('customers');

class Customers {
  customer: CustomerRow;

  constructor(customer: CustomerRow) {
    this.customer = customer;
  }

  static async create({ name }: CustomerCreateParams): Promise<number[]> {
    return Table()
      .insert({ name })
      .returning('id');
  }

  static async getWithId(id: number): Promise<CustomerRow | undefined> {
    return Table()
      .select()
      .where('id', id)
      .first();
  }
}

export default Customers;
