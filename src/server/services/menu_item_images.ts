import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import sharp from 'sharp';
import { getS3Config, keyFromStoredImageUrl, publicUrlForKey } from '../lib/s3';
import MenuItems from '../models/menu_items';

const MAX_BYTES = 2 * 1024 * 1024;
const RESIZE_THRESHOLD_BYTES = 200 * 1024;
const RESIZE_MAX_WIDTH = 800;

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function requireS3() {
  const config = getS3Config();
  if (!config.enabled || !config.client) {
    const err = new Error('Object storage is not configured');
    (err as any).status = 503;
    throw err;
  }
  return config;
}

function buildObjectKey(hashId: string, menuItemId: number, contentType: string): string {
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  if (!ext) throw invalidTypeError();
  const id = crypto.randomUUID();
  return `menu-items/${hashId}/${menuItemId}/${id}.${ext}`;
}

function invalidTypeError() {
  const err = new Error('Only JPG, PNG, and WebP images are allowed');
  (err as any).status = 400;
  return err;
}

function invalidSizeError() {
  const err = new Error('Image must be 2 MB or smaller');
  (err as any).status = 400;
  return err;
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function createMenuItemImagePresign(params: {
  hashId: string;
  menuItemId: number;
  contentType: string;
  contentLength: number;
}) {
  const config = requireS3();
  const { hashId, menuItemId, contentType, contentLength } = params;

  if (!ALLOWED_CONTENT_TYPES[contentType]) throw invalidTypeError();
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > MAX_BYTES) {
    throw invalidSizeError();
  }

  const key = buildObjectKey(hashId, menuItemId, contentType);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(config.client!, command, { expiresIn: 900 });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrlForKey(config, key),
    maxBytes: MAX_BYTES,
  };
}

export async function completeMenuItemImageUpload(params: {
  hashId: string;
  menuItemId: number;
  key: string;
}) {
  const config = requireS3();
  const { hashId, menuItemId, key } = params;
  const expectedPrefix = `menu-items/${hashId}/${menuItemId}/`;
  if (!key.startsWith(expectedPrefix)) {
    const err = new Error('Invalid image key');
    (err as any).status = 400;
    throw err;
  }

  const head = await config.client!.send(
    new HeadObjectCommand({ Bucket: config.bucket, Key: key })
  );
  const size = head.ContentLength ?? 0;
  if (size > MAX_BYTES) throw invalidSizeError();

  const item = await MenuItems.getById(menuItemId);
  if (!item) {
    const err = new Error('Menu item not found');
    (err as any).status = 404;
    throw err;
  }

  let finalKey = key;
  let contentType = head.ContentType || 'application/octet-stream';

  if (size > RESIZE_THRESHOLD_BYTES) {
    const object = await config.client!.send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key })
    );
    const input = await streamToBuffer(object.Body);
    const output = await sharp(input)
      .rotate()
      .resize({ width: RESIZE_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    finalKey = key.replace(/\.[^.]+$/, '.webp');
    await config.client!.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: finalKey,
        Body: output,
        ContentType: 'image/webp',
      })
    );
    contentType = 'image/webp';
    if (finalKey !== key) {
      await config.client!.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key })
      );
    }
  }

  const publicUrl = publicUrlForKey(config, finalKey);
  const oldKey = keyFromStoredImageUrl(item.image_url, config);
  if (oldKey && oldKey !== finalKey) {
    await deleteObjectKey(oldKey);
  }

  await MenuItems.update(menuItemId, { image_url: publicUrl });

  return { imageUrl: publicUrl, key: finalKey, contentType };
}

export async function deleteMenuItemImage(menuItemId: number) {
  const config = requireS3();
  const item = await MenuItems.getById(menuItemId);
  if (!item) {
    const err = new Error('Menu item not found');
    (err as any).status = 404;
    throw err;
  }

  const oldKey = keyFromStoredImageUrl(item.image_url, config);
  if (oldKey) await deleteObjectKey(oldKey);
  await MenuItems.update(menuItemId, { image_url: null });
  return { ok: true };
}

export async function deleteMenuItemImageByUrl(imageUrl: string | null | undefined) {
  const config = getS3Config();
  if (!config.enabled || !imageUrl) return;
  const key = keyFromStoredImageUrl(imageUrl, config);
  if (key) await deleteObjectKey(key);
}

async function deleteObjectKey(key: string) {
  const config = requireS3();
  try {
    await config.client!.send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key })
    );
  } catch {
    // Ignore missing objects when replacing or cleaning up.
  }
}
