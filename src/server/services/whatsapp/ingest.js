const crypto = require('crypto');
const WhatsAppMessageLog = require('../../models/whatsapp_message_log');

/**
 * Build idempotent log rows from a Meta WhatsApp webhook payload.
 * @param {object} payload parsed JSON body
 * @returns {object[]}
 */
function extractLogEntries(payload) {
  const entries = [];
  if (!payload || typeof payload !== 'object') {
    return entries;
  }

  const objectType = payload.object;
  const entryList = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entryList) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change.value || {};
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

      if (
        (!value.messages || value.messages.length === 0) &&
        (!value.statuses || value.statuses.length === 0)
      ) {
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

/**
 * @param {Buffer|string} rawBody
 * @returns {Promise<{ stored: number; entries: object[] }>}
 */
async function ingestWebhookPayload(rawBody) {
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON webhook payload');
  }

  const rows = extractLogEntries(payload);
  const stored = await WhatsAppMessageLog.insertManyIgnoreDuplicates(rows);
  return { stored: stored.length, entries: rows };
}

module.exports = {
  extractLogEntries,
  ingestWebhookPayload,
};
