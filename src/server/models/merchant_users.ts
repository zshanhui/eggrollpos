import db from './db';
import { extractInsertId } from '../db/insert-id';

export interface MerchantUserRow {
  id: number;
  merchant_id: number;
  supabase_user_id: string;
  role: string;
  created_at: string;
}

const T = () => db('merchant_users');

class MerchantUsers {
  static async link(params: {
    merchantId: number;
    supabaseUserId: string;
    role?: string;
  }): Promise<number> {
    const result = await T()
      .insert({
        merchant_id: params.merchantId,
        supabase_user_id: params.supabaseUserId,
        role: params.role || 'owner',
      })
      .returning('id');
    return extractInsertId(result);
  }

  static async getForMerchantUser(
    merchantId: number,
    supabaseUserId: string,
  ): Promise<MerchantUserRow | undefined> {
    return T()
      .select()
      .where({
        merchant_id: merchantId,
        supabase_user_id: supabaseUserId,
      })
      .first();
  }

  static async isUserLinkedToMerchant(
    merchantId: number,
    supabaseUserId: string,
  ): Promise<boolean> {
    const row = await this.getForMerchantUser(merchantId, supabaseUserId);
    return Boolean(row);
  }
}

export default MerchantUsers;
