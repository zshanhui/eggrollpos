import { expect } from 'chai';
import { extractLogEntries } from '../../src/server/services/whatsapp/ingest';
import type { WhatsAppWebhookPayload } from '../../src/shared/whatsapp';

describe('WhatsApp webhook ingest', () => {
  it('extracts inbound messages and delivery statuses', () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '102290129340398',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '106540352242922' },
                contacts: [{ wa_id: '16505551234', profile: { name: 'Test User' } }],
                messages: [
                  {
                    from: '16505551234',
                    id: 'wamid.inbound123',
                    timestamp: '1749416383',
                    type: 'text',
                    text: { body: 'Hello' },
                  },
                ],
                statuses: [
                  {
                    id: 'wamid.outbound456',
                    status: 'delivered',
                    timestamp: '1749416400',
                    recipient_id: '16505551234',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const rows = extractLogEntries(payload);
    expect(rows).to.have.length(2);

    const inbound = rows.find((r) => r.direction === 'inbound');
    expect(inbound!.dedupe_key).to.equal('wamid.inbound123:inbound');
    expect(inbound!.wa_id).to.equal('16505551234');
    expect(inbound!.event_kind).to.equal('text');

    const status = rows.find((r) => r.direction === 'status');
    expect(status!.dedupe_key).to.equal('wamid.outbound456:delivered');
    expect(status!.event_kind).to.equal('delivered');
  });

  it('dedupes generic events by content hash', () => {
    const payload: WhatsAppWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '1',
          changes: [{ field: 'account_update', value: { event: 'VERIFIED' } }],
        },
      ],
    };

    const a = extractLogEntries(payload);
    const b = extractLogEntries(payload);
    expect(a).to.have.length(1);
    expect(b[0].dedupe_key).to.equal(a[0].dedupe_key);
    expect(a[0].direction).to.equal('event');
  });
});
