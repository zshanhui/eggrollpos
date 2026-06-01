import db from './db';
import type { CustomerRow, CustomerCreateParams } from '../../shared/customers';

const Table = () => db('customers');

class Customers {
  customer: CustomerRow;

  constructor(customer: CustomerRow) {
    this.customer = customer;
  }

  static async create({
    name,
    psid = null,
    mobile_phone = null,
    email = null,
  }: CustomerCreateParams): Promise<number[]> {
    return Table()
      .insert({ name, psid, mobile_phone, email })
      .returning('id');
  }

  static async updateContact(
    id: number,
    fields: { name?: string; mobile_phone?: string | null; email?: string | null }
  ): Promise<void> {
    const updates: Record<string, string | null> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.mobile_phone !== undefined) updates.mobile_phone = fields.mobile_phone;
    if (fields.email !== undefined) updates.email = fields.email;
    if (Object.keys(updates).length === 0) return;
    await Table().where('id', id).update(updates);
  }

  static async getWithId(id: number): Promise<CustomerRow | undefined> {
    return Table()
      .select()
      .where('id', id)
      .first();
  }
}

export default Customers;
