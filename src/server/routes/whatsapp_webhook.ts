import { Router, type Request, type Response } from 'express';
import debug from 'debug';
import * as config from '../services/whatsapp/config';
import { verifyWebhookSignature, getSignatureHeader } from '../services/whatsapp/signature';
import { ingestWebhookPayload } from '../services/whatsapp/ingest';

const log = debug('sqc_app:whatsapp:webhook');
const router = Router();

/**
 * Meta webhook verification (GET).
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode !== 'subscribe') {
    return res.sendStatus(403);
  }

  if (!config.isWebhookConfigured()) {
    log('verification rejected: WHATSAPP_VERIFY_TOKEN not set');
    return res.sendStatus(503);
  }

  if (token !== config.getVerifyToken()) {
    log('verification rejected: token mismatch');
    return res.sendStatus(403);
  }

  log('verification succeeded');
  res.status(200).type('text/plain').send(String(challenge ?? ''));
});

/**
 * Meta webhook events (POST). Respond immediately; persist asynchronously.
 */
router.post('/', (req: Request, res: Response) => {
  if (!config.isIngestReady()) {
    log('ingest skipped: WHATSAPP_ENABLED or WHATSAPP_APP_SECRET not set');
    return res.sendStatus(503);
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    return res.sendStatus(400);
  }

  const signature = getSignatureHeader(req);
  if (!verifyWebhookSignature(rawBody, signature, config.getAppSecret())) {
    log('signature verification failed');
    return res.sendStatus(403);
  }

  res.sendStatus(200);

  setImmediate(() => {
    ingestWebhookPayload(rawBody)
      .then((result) => {
        log('stored %d log row(s) from %d parsed entries', result.stored, result.entries.length);
      })
      .catch((err) => {
        console.error('[whatsapp webhook] ingest failed:', err);
      });
  });
});

export default router;
export { router as whatsappWebhookRouter };
