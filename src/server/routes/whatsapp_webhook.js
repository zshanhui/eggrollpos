const express = require('express');
const router = express.Router();
const debug = require('debug')('sqc_app:whatsapp:webhook');

const config = require('../services/whatsapp/config');
const { verifyWebhookSignature, getSignatureHeader } = require('../services/whatsapp/signature');
const { ingestWebhookPayload } = require('../services/whatsapp/ingest');

/**
 * Meta webhook verification (GET).
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode !== 'subscribe') {
    return res.sendStatus(403);
  }

  if (!config.isWebhookConfigured()) {
    debug('verification rejected: WHATSAPP_VERIFY_TOKEN not set');
    return res.sendStatus(503);
  }

  if (token !== config.getVerifyToken()) {
    debug('verification rejected: token mismatch');
    return res.sendStatus(403);
  }

  debug('verification succeeded');
  res.status(200).type('text/plain').send(challenge || '');
});

/**
 * Meta webhook events (POST). Respond immediately; persist asynchronously.
 */
router.post('/', (req, res) => {
  if (!config.isIngestReady()) {
    debug('ingest skipped: WHATSAPP_ENABLED or WHATSAPP_APP_SECRET not set');
    return res.sendStatus(503);
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    return res.sendStatus(400);
  }

  const signature = getSignatureHeader(req);
  if (!verifyWebhookSignature(rawBody, signature, config.getAppSecret())) {
    debug('signature verification failed');
    return res.sendStatus(403);
  }

  res.sendStatus(200);

  setImmediate(() => {
    ingestWebhookPayload(rawBody)
      .then((result) => {
        debug('stored %d log row(s) from %d parsed entries', result.stored, result.entries.length);
      })
      .catch((err) => {
        console.error('[whatsapp webhook] ingest failed:', err);
      });
  });
});

module.exports = router;
