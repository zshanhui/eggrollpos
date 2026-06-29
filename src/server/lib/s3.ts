import { S3Client } from '@aws-sdk/client-s3';

export interface S3Config {
  enabled: boolean;
  bucket: string;
  publicBaseUrl: string;
  client: S3Client | null;
}

export const MEDIA_PATH_PREFIX = '/media/';

function env(name: string, fallback = ''): string {
  return process.env[name] || fallback;
}

export function getS3Config(): S3Config {
  const accessKeyId = env('S3_ACCESS_KEY_ID') || env('AWS_ACCESS_KEY_ID');
  const secretAccessKey = env('S3_SECRET_ACCESS_KEY') || env('AWS_SECRET_ACCESS_KEY');
  const bucket = env('S3_BUCKET') || env('AWS_S3_BUCKET_NAME');
  const endpoint = env('S3_ENDPOINT') || env('AWS_ENDPOINT_URL');
  const region = env('S3_REGION') || env('AWS_REGION') || 'auto';

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    return { enabled: false, bucket: '', publicBaseUrl: '', client: null };
  }

  const endpointUrl = endpoint.replace(/\/$/, '');
  const publicBaseUrl = (env('S3_PUBLIC_URL') || `${endpointUrl}/${bucket}`).replace(/\/$/, '');
  const forcePathStyle = env('S3_FORCE_PATH_STYLE') === 'true';

  const client = new S3Client({
    region,
    endpoint: endpointUrl,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { enabled: true, bucket, publicBaseUrl, client };
}

/** Stable app URL for a stored object key (served via GET /media/*). */
export function publicUrlForKey(_config: S3Config, key: string): string {
  return `${MEDIA_PATH_PREFIX}${key.replace(/^\//, '')}`;
}

export function keyFromPublicUrl(config: S3Config, url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(MEDIA_PATH_PREFIX)) {
    return url.slice(MEDIA_PATH_PREFIX.length);
  }
  const prefix = `${config.publicBaseUrl}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}

/** Parse object key from any stored image_url (proxy path, path-style, or virtual-hosted S3 URL). */
export function keyFromStoredImageUrl(
  url: string | null | undefined,
  config?: S3Config
): string | null {
  if (!url) return null;

  if (url.startsWith(MEDIA_PATH_PREFIX)) {
    return url.slice(MEDIA_PATH_PREFIX.length);
  }

  const cfg = config?.enabled ? config : getS3Config();
  if (cfg.publicBaseUrl && url.startsWith(`${cfg.publicBaseUrl}/`)) {
    return url.slice(cfg.publicBaseUrl.length + 1);
  }

  if (cfg.bucket) {
    const virtualHostedPrefix = `https://${cfg.bucket}.`;
    if (url.startsWith(virtualHostedPrefix)) {
      try {
        return new URL(url).pathname.replace(/^\//, '');
      } catch {
        // fall through
      }
    }
  }

  const menuItemsIdx = url.indexOf('menu-items/');
  if (menuItemsIdx >= 0) {
    return url.slice(menuItemsIdx).split('?')[0];
  }

  return null;
}

/** Normalize stored image_url for API responses (rewrites legacy direct S3 URLs to /media/*). */
export function normalizeMenuItemImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(MEDIA_PATH_PREFIX)) return url;

  const key = keyFromStoredImageUrl(url, getS3Config());
  if (key) {
    return publicUrlForKey(getS3Config(), key);
  }

  return url;
}
