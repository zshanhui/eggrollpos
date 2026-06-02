import db from './db';
import type {
  WhatsAppLogInsertRow,
  WhatsAppMessageLogRow,
} from '../../shared/whatsapp';

const Table = () => db('whatsapp_message_log');

function isDuplicateKeyError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  const msg = e?.message ?? '';
  return (
    e?.code === '23505' ||
    msg.includes('UNIQUE constraint failed') ||
    msg.includes('duplicate key value')
  );
}

class WhatsAppMessageLog {
  static async insertIgnoreDuplicate(
    row: WhatsAppLogInsertRow
  ): Promise<WhatsAppMessageLogRow | null> {
    try {
      const [id] = await Table().insert({
        dedupe_key: row.dedupe_key,
        wa_message_id: row.wa_message_id ?? null,
        direction: row.direction,
        event_field: row.event_field ?? null,
        event_kind: row.event_kind ?? null,
        phone_number_id: row.phone_number_id ?? null,
        wa_id: row.wa_id ?? null,
        payload_json: row.payload_json,
      });
      const pk = typeof id === 'object' && id !== null && 'id' in id ? (id as { id: number }).id : id;
      return Table().where({ id: pk as number }).first();
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return null;
      }
      throw err;
    }
  }

  static async insertManyIgnoreDuplicates(
    rows: WhatsAppLogInsertRow[]
  ): Promise<WhatsAppMessageLogRow[]> {
    const results: WhatsAppMessageLogRow[] = [];
    for (const row of rows) {
      const inserted = await WhatsAppMessageLog.insertIgnoreDuplicate(row);
      if (inserted) results.push(inserted);
    }
    return results;
  }

  static async count(): Promise<number> {
    const row = await Table().count({ count: '*' }).first();
    const n = row?.count ?? (row as Record<string, unknown>)?.['count(*)'] ?? 0;
    return typeof n === 'string' ? parseInt(n, 10) : Number(n);
  }
}

export default WhatsAppMessageLog;
