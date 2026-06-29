const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const MerchantUsers = require('../models/merchant_users').default;

let supabaseClient = null;
let supabaseUserResolverForTest = null;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

function getSupabaseClient() {
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

function extractBearerToken(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function resolveSupabaseUser(token) {
  if (supabaseUserResolverForTest) {
    return supabaseUserResolverForTest(token);
  }

  const client = getSupabaseClient();
  if (!client) {
    const err = new Error('Supabase Auth is not configured');
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

async function requireSupabaseUser(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await resolveSupabaseUser(token);
    if (!user?.id) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.supabaseUser = user;
    next();
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Authentication failed' });
  }
}

async function requireMerchantAccess(req, res, next) {
  await requireSupabaseUser(req, res, async () => {
    try {
      const merchantId = parseInt(req.params.merchantId, 10);
      if (Number.isNaN(merchantId)) {
        return res.status(400).json({ error: 'Invalid merchant ID' });
      }

      const isLinked = await MerchantUsers.isUserLinkedToMerchant(
        merchantId,
        req.supabaseUser.id
      );
      if (!isLinked) {
        return res.status(403).json({ error: 'Merchant access denied' });
      }

      req.merchantAuth = {
        merchantId,
        supabaseUserId: req.supabaseUser.id,
      };
      next();
    } catch (err) {
      res.status(500).json({ error: err.message || 'Merchant authorization failed' });
    }
  });
}

function getStreamSecret() {
  return (
    process.env.MERCHANT_AUTH_STREAM_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  );
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createMerchantStreamToken({ merchantId, supabaseUserId, ttlMs = 60_000 }) {
  const secret = getStreamSecret();
  if (!secret) {
    const err = new Error('Merchant stream auth is not configured');
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

function verifyMerchantStreamToken(token) {
  const secret = getStreamSecret();
  if (!secret) {
    const err = new Error('Merchant stream auth is not configured');
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

async function requireMerchantStreamAccess(req, res, next) {
  try {
    const merchantId = parseInt(req.params.merchantId, 10);
    if (Number.isNaN(merchantId)) return res.sendStatus(400);

    const token = req.query.token;
    const payload = verifyMerchantStreamToken(token);
    if (!payload || payload.merchantId !== merchantId || !payload.supabaseUserId) {
      return res.sendStatus(401);
    }

    const isLinked = await MerchantUsers.isUserLinkedToMerchant(
      merchantId,
      payload.supabaseUserId
    );
    if (!isLinked) return res.sendStatus(403);

    req.merchantAuth = {
      merchantId,
      supabaseUserId: payload.supabaseUserId,
    };
    next();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Stream authorization failed' });
  }
}

function setSupabaseUserResolverForTest(resolver) {
  supabaseUserResolverForTest = resolver;
}

module.exports = {
  createMerchantStreamToken,
  requireMerchantAccess,
  requireMerchantStreamAccess,
  requireSupabaseUser,
  setSupabaseUserResolverForTest,
  verifyMerchantStreamToken,
};
