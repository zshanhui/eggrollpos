import crypto from 'crypto';
import type { Request } from 'express';

export const SIGNATURE_HEADER = 'x-hub-signature-256';
const PREFIX = 'sha256=';

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string,
  appSecret: string
): boolean {
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

export function getSignatureHeader(req: Request): string {
  return req.get(SIGNATURE_HEADER) || req.get('X-Hub-Signature-256') || '';
}
