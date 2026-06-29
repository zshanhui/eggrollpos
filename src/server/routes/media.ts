import { Router } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Config, keyFromStoredImageUrl } from '../lib/s3';

const router = Router();

function isSafeObjectKey(key: string): boolean {
  return (
    key.startsWith('menu-items/') &&
    !key.includes('..') &&
    !key.includes('\\')
  );
}

router.get('/{*splat}', async (req, res) => {
  const config = getS3Config();
  if (!config.enabled || !config.client) {
    return res.status(503).json({ error: 'Object storage is not configured' });
  }

  const rawKey = req.params.splat;
  const key = Array.isArray(rawKey) ? rawKey.join('/') : String(rawKey || '');
  if (!key || !isSafeObjectKey(key)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const object = await config.client.send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key })
    );

    if (object.ContentType) {
      res.set('Content-Type', object.ContentType);
    }
    res.set('Cache-Control', 'public, max-age=86400');

    const body = object.Body;
    if (!body || typeof (body as NodeJS.ReadableStream).pipe !== 'function') {
      return res.status(404).json({ error: 'Not found' });
    }

    (body as NodeJS.ReadableStream).pipe(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/NoSuchKey|NotFound|404/i.test(message)) {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('GET /media failed:', err);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

export { router as mediaRouter };
