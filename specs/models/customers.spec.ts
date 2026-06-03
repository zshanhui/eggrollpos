import { expect } from 'chai';
import path from 'path';
import db from '../../src/server/models/db';
import Customers from '../../src/server/models/customers';

const migrationsDir = path.resolve(__dirname, '../../db/migrations');

async function resetCustomers() {
  await db('whatsapp_opt_ins').del();
  await db('receipts').del();
  await db('line_items').del();
  await db('orders').del();
  await db('customers').del();
  await db.raw("DELETE FROM sqlite_sequence WHERE name = 'customers'");
}

describe('Customers', () => {
  before(async () => {
    await db.raw('PRAGMA foreign_keys = ON');
    await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });
    await resetCustomers();
  });

  // ─── create ───

  describe('create', () => {
    beforeEach(resetCustomers);

    it('creates a customer and returns the new id', async () => {
      const id = await Customers.create({ name: 'Alice' });

      expect(id).to.be.a('number');

      const customer = await Customers.getWithId(id);
      expect(customer).to.exist;
      expect(customer!.name).to.equal('Alice');
    });

    it('sets created_at automatically', async () => {
      const id = await Customers.create({ name: 'Bob' });
      const customer = await Customers.getWithId(id);

      expect(customer!.created_at).to.exist;
    });
  });

  // ─── getWithId ───

  describe('getWithId', () => {
    let customerId: number;

    before(async () => {
      await resetCustomers();
      customerId = await Customers.create({ name: 'Carol' });
    });

    it('returns a customer by id', async () => {
      const customer = await Customers.getWithId(customerId);

      expect(customer).to.exist;
      expect(customer!.id).to.equal(customerId);
      expect(customer!.name).to.equal('Carol');
    });

    it('returns undefined for a non-existent id', async () => {
      const customer = await Customers.getWithId(99999);

      expect(customer).to.be.undefined;
    });

    it('returns null mobile_phone when not provided', async () => {
      const customer = await Customers.getWithId(customerId);

      expect(customer!.mobile_phone).to.be.null;
    });
  });

  // ─── TypeScript compile-time checks ───

  describe('type narrowing', () => {
    it('narrows the type after null check', async () => {
      const id = await Customers.create({ name: 'TypeTest' });
      const customer = await Customers.getWithId(id);

      // verify the shape matches CustomerRow
      expect(customer).to.have.property('id');
      expect(customer).to.have.property('name');
      expect(customer).to.have.property('psid');
      expect(customer).to.have.property('mobile_phone');
      expect(customer).to.have.property('created_at');
    });
  });
});
