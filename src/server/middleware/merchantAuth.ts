import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import MerchantUsers from '../models/merchant_users';

export type SupabaseAuthUser = {
  id: string;
  email: string | null;
};

export type MerchantAuthContext = {
  merchantId: number;
  supabaseUserId: string;
};

type SupabaseUserResolver = (token: string) => Promise<SupabaseAuthUser | null>;

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: SupabaseAuthUser;
      merchantAuth?: MerchantAuthContext;
    }
  }
}

let supabaseClient: SupabaseClient | null = null;
let supabaseUserResolverForTest: SupabaseUserResolver | null = null;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return { url, key };
}

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  supabaseClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseClient;
}

function extractBearerToken(req: Request): string | null {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function resolveSupabaseUser(token: string): Promise<SupabaseAuthUser | null> {
  if (supabaseUserResolverForTest) {
    return supabaseUserResolverForTest(token);
  }

  const client = getSupabaseClient();
  if (!client) {
    const err = new Error(
      'Supabase Auth is not configured. Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY.'
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return {
    id: data.user.id,
    email: data.user.email || null,
  };
}

export async function requireSupabaseUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await resolveSupabaseUser(token);
    if (!user?.id) {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    req.supabaseUser = user;
    next();
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Authentication failed' });
  }
}

export async function requireMerchantAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireSupabaseUser(req, res, async () => {
    try {
      const merchantId = parseInt(req.params.merchantId, 10);
      if (Number.isNaN(merchantId)) {
        res.status(400).json({ error: 'Invalid merchant ID' });
        return;
      }

      const isLinked = await MerchantUsers.isUserLinkedToMerchant(
        merchantId,
        req.supabaseUser!.id
      );
      if (!isLinked) {
        res.status(403).json({ error: 'Merchant access denied' });
        return;
      }

      req.merchantAuth = {
        merchantId,
        supabaseUserId: req.supabaseUser!.id,
      };
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Merchant authorization failed' });
    }
  });
}

function getStreamSecret(): string | undefined {
  return (
    process.env.MERCHANT_AUTH_STREAM_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SECRET_KEY
  );
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createMerchantStreamToken({
  merchantId,
  supabaseUserId,
  ttlMs = 60_000,
}: {
  merchantId: number;
  supabaseUserId: string;
  ttlMs?: number;
}): string {
  const secret = getStreamSecret();
  if (!secret) {
    const err = new Error('Merchant stream auth is not configured') as Error & {
      status?: number;
    };
    err.status = 503;
    throw err;
  }

  const payload = encodeBase64Url(
    JSON.stringify({
      merchantId,
      supabaseUserId,
      expiresAt: Date.now() + ttlMs,
    })
  );
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyMerchantStreamToken(
  token: unknown
): { merchantId: number; supabaseUserId: string; expiresAt: number } | null {
  const secret = getStreamSecret();
  if (!secret) {
    const err = new Error('Merchant stream auth is not configured') as Error & {
      status?: number;
    };
    err.status = 503;
    throw err;
  }

  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) return null;

  const expected = signPayload(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function requireMerchantStreamAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const merchantId = parseInt(req.params.merchantId, 10);
    if (Number.isNaN(merchantId)) {
      res.sendStatus(400);
      return;
    }

    const token = req.query.token;
    const payload = verifyMerchantStreamToken(token);
    if (!payload || payload.merchantId !== merchantId || !payload.supabaseUserId) {
      res.sendStatus(401);
      return;
    }

    const isLinked = await MerchantUsers.isUserLinkedToMerchant(
      merchantId,
      payload.supabaseUserId
    );
    if (!isLinked) {
      res.sendStatus(403);
      return;
    }

    req.merchantAuth = {
      merchantId,
      supabaseUserId: payload.supabaseUserId,
    };
    next();
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Stream authorization failed' });
  }
}

export function setSupabaseUserResolverForTest(
  resolver: SupabaseUserResolver | null
): void {
  supabaseUserResolverForTest = resolver;
}
