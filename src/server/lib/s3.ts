import { S3Client } from '@aws-sdk/client-s3';

export interface S3Config {
  enabled: boolean;
  bucket: string;
  publicBaseUrl: string;
  client: S3Client | null;
}

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

  const client = new S3Client({
    region,
    endpoint: endpointUrl,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { enabled: true, bucket, publicBaseUrl, client };
}

export function publicUrlForKey(config: S3Config, key: string): string {
  return `${config.publicBaseUrl}/${key.replace(/^\//, '')}`;
}

export function keyFromPublicUrl(config: S3Config, url: string | null | undefined): string | null {
  if (!url) return null;
  const prefix = `${config.publicBaseUrl}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}
