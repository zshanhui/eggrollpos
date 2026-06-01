import db from './db';
import type { CustomerRow, CustomerCreateParams } from '../../shared/customers';

const Table = () => db('customers');

class Customers {
  customer: CustomerRow;

  constructor(customer: CustomerRow) {
    this.customer = customer;
  }

  static async create({ name, mobile_phone }: CustomerCreateParams): Promise<number[]> {
    const row: Record<string, any> = { name };
    if (mobile_phone != null) row.mobile_phone = mobile_phone;
    return Table()
      .insert(row)
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
