const { expect } = require('chai');
const crypto = require('crypto');
const {
  verifyWebhookSignature,
} = require('../../src/server/services/whatsapp/signature');

describe('WhatsApp webhook signature', () => {
  const secret = 'test-app-secret';
  const body = Buffer.from('{"object":"whatsapp_business_account"}', 'utf8');

  function sign(payload, appSecret) {
    const digest = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');
    return `sha256=${digest}`;
  }

  it('accepts a valid signature', () => {
    const header = sign(body, secret);
    expect(verifyWebhookSignature(body, header, secret)).to.equal(true);
  });

  it('rejects an invalid signature', () => {
    expect(verifyWebhookSignature(body, 'sha256=deadbeef', secret)).to.equal(false);
  });

  it('rejects missing prefix', () => {
    expect(verifyWebhookSignature(body, sign(body, secret).slice(7), secret)).to.equal(false);
  });

  it('rejects when secret is empty', () => {
    expect(verifyWebhookSignature(body, sign(body, secret), '')).to.equal(false);
  });
});
