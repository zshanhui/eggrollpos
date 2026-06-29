#!/usr/bin/env node
/**
 * Create test orders on staging (or any deployed eggroll-pos instance).
 *
 * Usage:
 *   pnpm run order:staging
 *   pnpm run order:staging -- --count 3
 *   pnpm run order:staging -- --name "Test Customer" --type delivery
 *   pnpm run order:staging -- --items "1:2,21:1"
 *   pnpm run order:staging -- --list-items
 *
 * Environment:
 *   BASE_URL              default https://eggrollpos-staging.up.railway.app
 *   STAGING_MERCHANT_KEY  default mc_n1c0ffee (INSTEP Cafe)
 *   STAGING_ORDER_ITEMS   default auto (Latte x1 + Croissant x1 when available)
 *                         format: menuItemId:qty,menuItemId:qty
 */

const BASE_URL = (process.env.BASE_URL || 'https://eggrollpos-staging.up.railway.app').replace(/\/$/, '');
const MERCHANT_KEY = process.env.STAGING_MERCHANT_KEY || process.env.ORDER_MERCHANT_KEY || 'mc_n1c0ffee';

function usage(exitCode = 0) {
  console.log(`Create orders on ${BASE_URL}

Usage:
  node scripts/add-staging-order.js [options]

Options:
  --list-items          List menu items for the merchant and exit
  --count <n>           Number of orders to create (default 1)
  --name <name>         Customer name (default "Staging Test")
  --phone <phone>       Customer phone (optional)
  --type pickup|delivery Order type (default pickup)
  --items <spec>        menuItemId:qty pairs, comma-separated (e.g. "1:2,21:1")
  --merchant <hash>     Merchant hash_id (default ${MERCHANT_KEY})
  --base-url <url>      Override BASE_URL
  --dry-run             Print payload without POSTing
  -h, --help            Show this help

Examples:
  pnpm run order:staging
  pnpm run order:staging -- --count 5 --name "Kitchen Test"
  pnpm run order:staging -- --items "21:2,28:1" --type delivery
  BASE_URL=http://localhost:3000 pnpm run order:staging
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const opts = {
    listItems: false,
    count: 1,
    name: 'Staging Test',
    phone: '',
    orderType: 'pickup',
    itemsSpec: process.env.STAGING_ORDER_ITEMS || '',
    merchantKey: MERCHANT_KEY,
    baseUrl: BASE_URL,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') usage(0);
    else if (arg === '--list-items') opts.listItems = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--count' && argv[i + 1]) opts.count = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (arg === '--name' && argv[i + 1]) opts.name = argv[++i];
    else if (arg === '--phone' && argv[i + 1]) opts.phone = argv[++i];
    else if (arg === '--type' && argv[i + 1]) opts.orderType = argv[++i];
    else if (arg === '--items' && argv[i + 1]) opts.itemsSpec = argv[++i];
    else if (arg === '--merchant' && argv[i + 1]) opts.merchantKey = argv[++i];
    else if (arg === '--base-url' && argv[i + 1]) opts.baseUrl = argv[++i].replace(/\/$/, '');
    else {
      console.error(`Unknown argument: ${arg}`);
      usage(1);
    }
  }

  if (!['pickup', 'delivery'].includes(opts.orderType)) {
    console.error('--type must be pickup or delivery');
    process.exit(1);
  }

  return opts;
}

async function fetchJson(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.error || data.message || text || res.statusText;
    throw new Error(`${options?.method || 'GET'} ${url} → ${res.status}: ${msg}`);
  }
  return data;
}

function parseItemsSpec(spec) {
  if (!spec.trim()) return null;
  return spec.split(',').map((part) => {
    const [idStr, qtyStr] = part.trim().split(':');
    const menuItemId = parseInt(idStr, 10);
    const quantity = parseInt(qtyStr, 10);
    if (!menuItemId || !quantity || quantity < 1 || quantity > 10) {
      throw new Error(`Invalid item spec "${part}" — use menuItemId:qty (qty 1-10)`);
    }
    return { menuItemId, quantity };
  });
}

function defaultItemsFromMenu(menuItems) {
  const active = menuItems.filter((item) => item.is_active !== false && item.is_active !== 0);
  const byName = (names) =>
    active.find((item) => names.some((n) => item.name.toLowerCase().includes(n.toLowerCase())));

  const latte = byName(['latte']) || active[0];
  const croissant = byName(['croissant']) || active[1] || active[0];

  if (!latte) {
    throw new Error('No active menu items found for this merchant');
  }

  const items = [{ menuItemId: latte.id, quantity: 1 }];
  if (croissant && croissant.id !== latte.id) {
    items.push({ menuItemId: croissant.id, quantity: 1 });
  }
  return items;
}

async function loadMerchant(baseUrl, merchantKey) {
  return fetchJson(`${baseUrl}/api/merchants/${merchantKey}`);
}

async function loadMenuItems(baseUrl, merchantId) {
  const data = await fetchJson(`${baseUrl}/api/merchants/${merchantId}/menu-items`);
  return data.menuItems || [];
}

function formatMenuItemsTable(menuItems) {
  const rows = menuItems
    .filter((item) => item.is_active !== false && item.is_active !== 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: `$${((item.price_cents || 0) / 100).toFixed(2)}`,
    }));

  if (rows.length === 0) {
    console.log('No active menu items.');
    return;
  }

  const idW = Math.max(2, ...rows.map((r) => String(r.id).length));
  const nameW = Math.max(4, ...rows.map((r) => r.name.length));
  console.log(`${'ID'.padEnd(idW)}  ${'Name'.padEnd(nameW)}  Price`);
  console.log(`${'-'.repeat(idW)}  ${'-'.repeat(nameW)}  -----`);
  for (const row of rows) {
    console.log(`${String(row.id).padEnd(idW)}  ${row.name.padEnd(nameW)}  ${row.price}`);
  }
}

async function createOrder(baseUrl, merchantKey, payload) {
  return fetchJson(`${baseUrl}/api/orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = opts.baseUrl;

  console.log(`Target: ${baseUrl}`);
  console.log(`Merchant: ${opts.merchantKey}\n`);

  const merchant = await loadMerchant(baseUrl, opts.merchantKey);
  const menuItems = await loadMenuItems(baseUrl, merchant.id);

  if (opts.listItems) {
    console.log(`${merchant.business_name} — menu items:\n`);
    formatMenuItemsTable(menuItems);
    process.exit(0);
  }

  let items;
  try {
    items = parseItemsSpec(opts.itemsSpec) || defaultItemsFromMenu(menuItems);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const itemSummary = items
    .map(({ menuItemId, quantity }) => {
      const item = menuItems.find((m) => m.id === menuItemId);
      const label = item ? item.name : `#${menuItemId}`;
      return `${quantity}x ${label}`;
    })
    .join(', ');

  console.log(`Creating ${opts.count} order(s): ${opts.name} (${opts.orderType})`);
  console.log(`Items: ${itemSummary}\n`);

  const results = [];

  for (let n = 0; n < opts.count; n++) {
    const customerName = opts.count > 1 ? `${opts.name} ${n + 1}` : opts.name;
    const payload = {
      merchantId: opts.merchantKey,
      customerName,
      orderType: opts.orderType,
      items,
    };
    if (opts.phone) payload.customerPhone = opts.phone;

    if (opts.dryRun) {
      console.log(`[dry-run] POST /api/orders`, JSON.stringify(payload, null, 2));
      continue;
    }

    const result = await createOrder(baseUrl, opts.merchantKey, payload);
    results.push(result);
    const dashboardUrl = `${baseUrl}/md/${opts.merchantKey}`;
    console.log(`✓ Order #${result.orderId} created (${result.orderUuid})`);
    console.log(`  Dashboard: ${dashboardUrl}`);
  }

  if (!opts.dryRun && results.length > 0) {
    console.log(`\nDone — ${results.length} order(s) added. Open the merchant dashboard to see them.`);
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
