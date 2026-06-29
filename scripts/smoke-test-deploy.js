#!/usr/bin/env node
/**
 * Post-deploy smoke test for eggroll-pos (staging/production).
 *
 * Usage:
 *   pnpm run smoke:staging
 *   BASE_URL=https://eggrollpos-staging.up.railway.app node scripts/smoke-test-deploy.js
 *
 * Optional env (required for merchant/menu/receipt checks on non-seeded DBs):
 *   STAGING_MERCHANT_KEY   hash_id or UUID (e.g. mc_abc123)
 *   STAGING_MENU_SLUG      published menu slug
 *   STAGING_RECEIPT_UUID   order UUID for receipt page
 *
 * Deploy wait (Railway needs time to finish rolling out):
 *   SMOKE_WAIT_SECONDS     seconds to wait before checks (default 0; smoke:staging sets 120)
 */

const BASE_URL = (process.env.BASE_URL || 'https://eggrollpos-staging.up.railway.app').replace(/\/$/, '');
const MERCHANT_KEY = process.env.STAGING_MERCHANT_KEY || process.env.SMOKE_MERCHANT_KEY || 'mc_n1c0ffee';
const MENU_SLUG = process.env.STAGING_MENU_SLUG || process.env.SMOKE_MENU_SLUG || 'instep-cafe-new-york-10001-lunch-menu';
const RECEIPT_UUID = process.env.STAGING_RECEIPT_UUID || process.env.SMOKE_RECEIPT_UUID || '';
const WAIT_SECONDS = Math.max(0, parseInt(process.env.SMOKE_WAIT_SECONDS || '0', 10) || 0);

const failures = [];
const passes = [];

function pass(name, detail) {
  passes.push({ name, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
  failures.push({ name, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDeploy() {
  if (WAIT_SECONDS <= 0) return;

  console.log(`Waiting ${WAIT_SECONDS}s for Railway deploy to finish...`);
  for (let remaining = WAIT_SECONDS; remaining > 0; remaining--) {
    process.stdout.write(`\r  ${remaining}s remaining...`);
    await sleep(1000);
  }
  process.stdout.write('\n\n');
}

async function fetchResponse(path, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    redirect: 'follow',
    ...opts,
    headers: { Accept: opts.accept || '*/*', ...(opts.headers || {}) },
  });
  const contentType = res.headers.get('content-type') || '';
  let body = '';
  if (opts.readBody !== false) {
    body = await res.text();
  }
  return { url, res, status: res.status, contentType, body };
}

async function checkHealth() {
  const { status, body, contentType } = await fetchResponse('/health');
  if (status !== 200) return fail('GET /health', `status ${status}`);
  if (!contentType.includes('json')) return fail('GET /health', `expected JSON, got ${contentType}`);
  try {
    const data = JSON.parse(body);
    if (data.status !== 'ok') return fail('GET /health', `body ${body}`);
  } catch {
    return fail('GET /health', 'invalid JSON');
  }
  pass('GET /health', 'database ok');
}

async function checkSpaPage(name, path, mustInclude = []) {
  const { status, body, contentType } = await fetchResponse(path, {
    headers: { Accept: 'text/html' },
  });
  if (status !== 200) return fail(name, `status ${status}`);
  if (!contentType.includes('html')) return fail(name, `expected HTML, got ${contentType}`);
  if (!body.includes('id="app-root"') && !body.includes("id='app-root'")) {
    return fail(name, 'missing #app-root');
  }
  for (const needle of mustInclude) {
    if (!body.includes(needle)) return fail(name, `missing "${needle}"`);
  }

  const scriptMatch = body.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
  if (!scriptMatch) return fail(name, 'no module script tag in HTML');
  const scriptPath = scriptMatch[1];
  const asset = await fetchResponse(scriptPath, { accept: 'application/javascript' });
  if (asset.status !== 200) return fail(name, `JS asset ${scriptPath} status ${asset.status}`);
  if (asset.contentType.includes('text/html')) {
    return fail(name, `JS asset ${scriptPath} returned HTML (MIME bug)`);
  }
  pass(name, scriptPath);
}

async function checkJsonApi(name, path, predicate) {
  const { status, body, contentType } = await fetchResponse(path, {
    headers: { Accept: 'application/json' },
  });
  if (status !== 200) return fail(name, `status ${status}`);
  if (!contentType.includes('json')) return fail(name, `expected JSON, got ${contentType}`);
  try {
    const data = JSON.parse(body);
    if (predicate && !predicate(data)) return fail(name, 'unexpected response shape');
  } catch {
    return fail(name, 'invalid JSON');
  }
  pass(name);
}

async function main() {
  console.log(`Smoke test: ${BASE_URL}\n`);

  await waitForDeploy();

  await checkHealth();

  await checkSpaPage('GET /', '/');
  await checkSpaPage('GET /about', '/about');
  await checkSpaPage('GET / (title)', '/', ['eggroll pos demo']);

  if (MERCHANT_KEY) {
    await checkJsonApi(`GET /api/merchants/${MERCHANT_KEY}`, `/api/merchants/${MERCHANT_KEY}`, (d) => d && d.id);
    await checkSpaPage('GET /md', `/md/${MERCHANT_KEY}`);
    await checkSpaPage('GET /md/menuitems', `/md/${MERCHANT_KEY}/menuitems`);
    await checkSpaPage('GET /md/settings', `/md/${MERCHANT_KEY}/settings`);
    await checkSpaPage('GET /md/online-menus', `/md/${MERCHANT_KEY}/online-menus`);
    await checkSpaPage('GET /merchant-dashboard alias', `/merchant-dashboard/${MERCHANT_KEY}`);
  } else {
    console.log('○ Skipping merchant routes (set STAGING_MERCHANT_KEY)');
  }

  if (MENU_SLUG) {
    await checkJsonApi(`GET /api/menus/${MENU_SLUG}`, `/api/menus/${MENU_SLUG}`, (d) => d && d.menu);
    await checkSpaPage('GET /online-ordering', `/online-ordering/${MENU_SLUG}`);
    await checkSpaPage('GET /online-ordering/checkout', `/online-ordering/${MENU_SLUG}/checkout`);
  } else {
    console.log('○ Skipping online ordering routes (set STAGING_MENU_SLUG)');
  }

  if (RECEIPT_UUID) {
    await checkSpaPage('GET /receipts', `/receipts/${RECEIPT_UUID}`);
    await checkJsonApi(`GET /r/${RECEIPT_UUID}`, `/r/${RECEIPT_UUID}`, (d) => d && d.receipt);
  } else {
    console.log('○ Skipping receipt routes (set STAGING_RECEIPT_UUID)');
  }

  console.log(`\n${passes.length} passed, ${failures.length} failed`);
  if (failures.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
