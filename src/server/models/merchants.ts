import crypto from 'crypto';
import db from './db';
import type { MerchantRow, MerchantCreateParams, MerchantUpdateParams } from '../../shared/merchants';

const T = () => db('merchants');

export function generateHashId(): string {
  return 'mc_' + crypto.randomBytes(6).toString('base64url');
}

class Merchants {
  merchants: MerchantRow[];

  constructor(merchants: MerchantRow[]) {
    this.merchants = merchants;
  }

  static async list(): Promise<MerchantRow[]> {
    return T().select();
  }

  static async get(id: number): Promise<MerchantRow | undefined> {
    return T()
      .select()
      .where('id', id)
      .first();
  }

  static async getByUuid(uuid: string): Promise<MerchantRow | undefined> {
    return T()
      .select()
      .where('uuid', uuid)
      .first();
  }

  static async getByHashId(hashId: string): Promise<MerchantRow | undefined> {
    return T()
      .select()
      .where('hash_id', hashId)
      .first();
  }

  /**
   * Create merchant. For admin use only — do NOT expose via API or UI.
   * Use: pnpm run create-merchant "Business Name"
   */
  static async create(params: MerchantCreateParams): Promise<number[]> {
    const hash_id = generateHashId();
    return T().insert({ ...params, hash_id }).returning('id');
  }

  static async update(id: number, params: MerchantUpdateParams): Promise<number[]> {
    console.log(`Updating merchant ${id} with `, params);
    return T()
      .update(params)
      .where('id', id)
      .returning('id');
  }

  static async getByZip(zipCode: string): Promise<MerchantRow[]> {
    return T()
      .select()
      .where('address_postal_code', zipCode);
  }

  static async customers(id: number): Promise<any[]> {
    return T()
      .select('customers.*')
      .joinRaw('LEFT JOIN orders ON merchants.id = orders.merchant_id')
      .joinRaw('LEFT JOIN customers on orders.customer_id = customers.id')
      .where('merchants.id', id)
      .distinct();
  }

  static async orders(id: number, filter?: Record<string, any>): Promise<any[]> {
    return T()
      .select('orders.*')
      .joinRaw('LEFT JOIN orders ON merchants.id = orders.merchant_id')
      .where('merchants.id', id);
  }
}

export default Merchants;
