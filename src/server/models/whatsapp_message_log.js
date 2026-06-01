const db = require('./db');

const Table = () => db('whatsapp_message_log');

function isDuplicateKeyError(err) {
  const msg = err && err.message ? err.message : '';
  return (
    err.code === '23505' ||
    msg.includes('UNIQUE constraint failed') ||
    msg.includes('duplicate key value')
  );
}

/**
 * @param {object} row
 * @returns {Promise<object|null>} inserted row, or null if duplicate
 */
async function insertIgnoreDuplicate(row) {
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
    const pk = typeof id === 'object' ? id.id ?? id : id;
    return Table().where({ id: pk }).first();
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return null;
    }
    throw err;
  }
}

/**
 * @param {object[]} rows
 */
async function insertManyIgnoreDuplicates(rows) {
  const results = [];
  for (const row of rows) {
    const inserted = await insertIgnoreDuplicate(row);
    if (inserted) results.push(inserted);
  }
  return results;
}

async function count() {
  const row = await Table().count({ count: '*' }).first();
  const n = row?.count ?? row?.['count(*)'] ?? 0;
  return typeof n === 'string' ? parseInt(n, 10) : n;
}

module.exports = {
  insertIgnoreDuplicate,
  insertManyIgnoreDuplicates,
  count,
};
