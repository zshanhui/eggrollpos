import db from './db';
import type { WhatsAppOptInCreateParams, WhatsAppOptInRow } from '../../shared/whatsapp';
import { extractInsertId } from '../db/insert-id';

const Table = () => db('whatsapp_opt_ins');

class WhatsAppOptIns {
  static async create(params: WhatsAppOptInCreateParams): Promise<WhatsAppOptInRow> {
    const result = await Table().insert({
      customer_id: params.customerId,
      merchant_id: params.merchantId,
      order_id: params.orderId ?? null,
      wa_id: params.waId ?? null,
      phone_e164: params.phoneE164 ?? null,
      opt_in_source: params.optInSource ?? 'web_checkout',
      marketing_allowed: params.marketingAllowed ?? false,
    });
    const id = extractInsertId(result);
    const row = await Table().where({ id }).first();
    return row as WhatsAppOptInRow;
  }

  static async getForOrder(orderId: number): Promise<WhatsAppOptInRow | undefined> {
    return Table().where({ order_id: orderId }).first();
  }
}

export default WhatsAppOptIns;
