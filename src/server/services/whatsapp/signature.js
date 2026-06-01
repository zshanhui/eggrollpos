const crypto = require('crypto');

const SIGNATURE_HEADER = 'x-hub-signature-256';
const PREFIX = 'sha256=';

/**
 * @param {Buffer|string} rawBody
 * @param {string} signatureHeader value of X-Hub-Signature-256
 * @param {string} appSecret Meta app secret
 */
function verifyWebhookSignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) {
    return false;
  }
  if (!signatureHeader.startsWith(PREFIX)) {
    return false;
  }
  const expected = signatureHeader.slice(PREFIX.length);
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const digest = crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  if (expected.length !== digest.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(digest, 'utf8'));
}

function getSignatureHeader(req) {
  return req.get(SIGNATURE_HEADER) || req.get('X-Hub-Signature-256') || '';
}

module.exports = {
  verifyWebhookSignature,
  getSignatureHeader,
  SIGNATURE_HEADER,
};
