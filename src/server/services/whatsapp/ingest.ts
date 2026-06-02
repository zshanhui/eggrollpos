import crypto from 'crypto';
import WhatsAppMessageLog from '../../models/whatsapp_message_log';
import type {
  IngestResult,
  WhatsAppLogInsertRow,
  WhatsAppWebhookPayload,
} from '../../../shared/whatsapp';

export function extractLogEntries(payload: WhatsAppWebhookPayload): WhatsAppLogInsertRow[] {
  const entries: WhatsAppLogInsertRow[] = [];
  if (!payload || typeof payload !== 'object') {
    return entries;
  }

  const objectType = payload.object ?? null;
  const entryList = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entryList) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change.value ?? {};
      const phoneNumberId = value.metadata?.phone_number_id ?? null;
      const field = change.field ?? null;

      if (Array.isArray(value.messages)) {
        for (const message of value.messages) {
          entries.push({
            dedupe_key: `${message.id}:inbound`,
            wa_message_id: message.id,
            direction: 'inbound',
            event_field: field,
            event_kind: message.type ?? null,
            phone_number_id: phoneNumberId,
            wa_id: message.from ?? null,
            payload_json: {
              object: objectType,
              entry_id: entry.id,
              field,
              message,
            },
          });
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          entries.push({
            dedupe_key: `${status.id}:${status.status}`,
            wa_message_id: status.id,
            direction: 'status',
            event_field: field,
            event_kind: status.status ?? null,
            phone_number_id: phoneNumberId,
            wa_id: status.recipient_id ?? null,
            payload_json: {
              object: objectType,
              entry_id: entry.id,
              field,
              status,
            },
          });
        }
      }

      const hasMessages = Array.isArray(value.messages) && value.messages.length > 0;
      const hasStatuses = Array.isArray(value.statuses) && value.statuses.length > 0;

      if (!hasMessages && !hasStatuses) {
        const hash = crypto
          .createHash('sha256')
          .update(JSON.stringify({ entry_id: entry.id, field, value }))
          .digest('hex');
        entries.push({
          dedupe_key: hash,
          wa_message_id: null,
          direction: 'event',
          event_field: field,
          event_kind: objectType,
          phone_number_id: phoneNumberId,
          wa_id: null,
          payload_json: {
            object: objectType,
            entry_id: entry.id,
            field,
            value,
          },
        });
      }
    }
  }

  return entries;
}

export async function ingestWebhookPayload(rawBody: Buffer | string): Promise<IngestResult> {
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(text) as WhatsAppWebhookPayload;
  } catch {
    throw new Error('Invalid JSON webhook payload');
  }

  const rows = extractLogEntries(payload);
  const stored = await WhatsAppMessageLog.insertManyIgnoreDuplicates(rows);
  return { stored: stored.length, entries: rows };
}
