const { expect } = require('chai');
const WhatsAppMessageLog = require('../../src/server/models/whatsapp_message_log');

describe('whatsapp_message_log model', function () {
  this.timeout(10000);

  const row = {
    dedupe_key: `test-${Date.now()}`,
    wa_message_id: 'wamid.test',
    direction: 'inbound',
    event_field: 'messages',
    event_kind: 'text',
    phone_number_id: '123',
    wa_id: '16505551234',
    payload_json: { test: true },
  };

  it('inserts a row and ignores duplicates', async () => {
    const first = await WhatsAppMessageLog.insertIgnoreDuplicate(row);
    expect(first).to.exist;
    expect(first.dedupe_key).to.equal(row.dedupe_key);

    const second = await WhatsAppMessageLog.insertIgnoreDuplicate(row);
    expect(second).to.equal(null);
  });
});
