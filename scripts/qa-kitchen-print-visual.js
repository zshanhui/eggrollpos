#!/usr/bin/env node
/**
 * Visual QA for kitchen ticket print layout (works offline without Supabase).
 * Uses SQLite + supertest to build a real ticket, renders HTML with print CSS, screenshots.
 *
 * Usage: pnpm run qa:kitchen-print-visual
 * Output: docs/screenshots/kitchen-print/
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { createRequire } = require('module');

const requireTs = createRequire(__filename);
const db = requireTs('../src/server/models/db');
const { setSupabaseUserResolverForTest } = requireTs('../src/server/middleware/merchantAuth');
const { buildKitchenTicket } = requireTs('../src/server/services/kitchen_ticket');
const { submitMenuCheckout } = requireTs('../src/server/services/checkout');

const migrationsDir = path.resolve(__dirname, '../db/migrations');
const OUTPUT_DIR = path.join(__dirname, '../docs/screenshots/kitchen-print');
const CSS_PATH = path.join(__dirname, '../src/client/css/pages/KitchenTicketPrint.css');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTicketHtml(ticket) {
  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const items = ticket.lineItems
    .map((item) => {
      const mods = item.modifiers
        .map((m) => `<li class="KitchenTicketPrint__modifier">${escapeHtml(m.name)}</li>`)
        .join('');
      return `
        <li class="KitchenTicketPrint__item">
          <div class="KitchenTicketPrint__item-line">
            <span class="KitchenTicketPrint__item-qty">${item.quantity}×</span>
            <span>${escapeHtml(item.name)}</span>
          </div>
          ${mods ? `<ul class="KitchenTicketPrint__modifiers">${mods}</ul>` : ''}
        </li>`;
    })
    .join('');

  const note = ticket.comments?.trim()
    ? `<hr class="KitchenTicketPrint__rule" />
       <p class="KitchenTicketPrint__note"><span class="KitchenTicketPrint__note-label">Note:</span> ${escapeHtml(ticket.comments.trim())}</p>`
    : '';

  const customer = ticket.customerName?.trim()
    ? `<hr class="KitchenTicketPrint__rule" /><p class="KitchenTicketPrint__customer">${escapeHtml(ticket.customerName.trim())}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Kitchen ticket QA</title>
  <style>${css}</style>
</head>
<body class="KitchenTicketPrint">
  <div class="KitchenTicketPrint__toolbar">
    <button type="button" class="KitchenTicketPrint__btn">Print Kitchen Ticket</button>
    <button type="button" class="KitchenTicketPrint__btn KitchenTicketPrint__btn--secondary">← Back to Orders</button>
  </div>
  <article class="KitchenTicketPrint__paper">
    <h1 class="KitchenTicketPrint__merchant">${escapeHtml(ticket.merchantName)}</h1>
    <hr class="KitchenTicketPrint__rule" />
    <div class="KitchenTicketPrint__header-row">
      <span class="KitchenTicketPrint__order-num">Order #${ticket.displayNumber}</span>
      <span class="KitchenTicketPrint__order-type">${ticket.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
    </div>
    <p class="KitchenTicketPrint__time">${new Date(ticket.createdAt).toLocaleString()}</p>
    <hr class="KitchenTicketPrint__rule" />
    <ul class="KitchenTicketPrint__items">${items}</ul>
    ${note}
    ${customer}
    <hr class="KitchenTicketPrint__rule" />
  </article>
</body>
</html>`;
}

function renderOrderDetailHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Order detail QA</title>
  <link rel="stylesheet" href="../../../src/client/css/pages/MerchantRoutes.css" />
  <style>body { margin: 0; background: #121212; }</style>
</head>
<body class="Merchant Merchant--theme-dark">
  <div class="OrderDetail">
    <div class="OrderDetail__toolbar">
      <button type="button" class="OrderDetail__back">← Back to Orders</button>
    </div>
    <div class="OrderDetail__header">
      <span class="OrderDetail__orderNum">Order #3</span>
      <div class="OrderDetail__status">
        <span class="OrderTypeTag OrderTypeTag--pickup">Pickup</span>
        <span class="StatusBadge StatusBadge--waiting_for_acceptance">New Order</span>
      </div>
    </div>
    <div class="OrderDetail__actions">
      <a class="OrderDetail__action-btn OrderDetail__action-btn--secondary" href="#">Print Kitchen Ticket</a>
      <button type="button" class="OrderDetail__action-btn OrderDetail__action-btn--primary">→ Accept Order</button>
    </div>
  </div>
</body>
</html>`;
}

function renderKdsBoardHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>KDS board QA</title>
  <link rel="stylesheet" href="../../../src/client/css/pages/MerchantRoutes.css" />
  <style>body { margin: 0; background: #121212; }</style>
</head>
<body class="Merchant Merchant--theme-dark">
  <div class="OrdersGrid">
    <div class="OrderCard OrderCard--waiting_for_acceptance OrderCard--highlight">
      <div class="OrderCard__top"><span class="OrderCard__orderNum">#3</span><span class="OrderCard__time">Just now</span></div>
      <div class="OrderCard__items"><div class="OrderCard__item"><span class="OrderCard__item-qty">2×</span><span>Egg Roll</span></div></div>
      <div class="OrderCard__customer">Kitchen QA Customer</div>
    </div>
  </div>
</body>
</html>`;
}

function renderSettingsHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Kitchen printing settings QA</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f6f6f7; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 12px; padding: 20px; max-width: 640px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    h2 { margin: 0 0 8px; font-size: 1.1rem; }
    .checkbox { display: flex; gap: 12px; align-items: flex-start; margin-top: 16px; }
    .checkbox input { width: 18px; height: 18px; margin-top: 2px; }
    .help { color: #6d7175; font-size: 0.9rem; margin-top: 8px; line-height: 1.4; }
    .label { font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Kitchen printing</h2>
    <div class="checkbox">
      <input type="checkbox" checked id="auto" />
      <div>
        <div class="label">Auto-print kitchen tickets on new orders</div>
        <div class="help">When enabled, a kitchen ticket opens in the print dialog each time a new order arrives on the KDS. Keep this dashboard tab open. Manual reprint is always available from order detail.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function seedTicketData() {
  process.env.MERCHANT_AUTH_STREAM_SECRET = 'qa-visual-secret';
  setSupabaseUserResolverForTest(async () => null);

  await db.raw('PRAGMA foreign_keys = ON');
  await db.migrate.latest({ directory: migrationsDir, tableName: 'knex_migrations' });

  await db('line_item_modifiers').del();
  await db('line_items').del();
  await db('receipts').del();
  await db('orders').del();
  await db('menu_menu_items').del();
  await db('menus').del();
  await db('menu_items').del();
  await db('customers').del();
  await db('merchant_users').del();
  await db('modifiers').del();
  await db('merchants').del();

  const [merchantId] = await db('merchants').insert({
    business_name: 'INSTEP Cafe',
    type: 'cafe',
    hash_id: 'mc_n1c0ffee',
    kitchen_auto_print: true,
  });

  const [menuItemId] = await db('menu_items').insert({
    merchant_id: merchantId,
    name: 'Egg Roll',
    price_cents: 599,
    is_active: true,
  });

  const [modifierId] = await db('modifiers').insert({
    merchant_id: merchantId,
    name: 'Extra spicy',
    price_adjustment_cents: 0,
    sort_order: 0,
  });

  await db('menu_item_modifiers').insert({
    menu_item_id: menuItemId,
    modifier_id: modifierId,
  });

  const slug = 'qa-kitchen-print-menu';
  const [menuId] = await db('menus').insert({
    merchant_id: merchantId,
    name: 'QA Menu',
    slug,
    is_published: true,
    business_hours: null,
  });
  await db('menu_menu_items').insert({ menu_id: menuId, menu_item_id: menuItemId, sort_order: 0 });

  const checkout = await submitMenuCheckout(slug, {
    lineItems: [{ menuItemId, quantity: 2 }],
    contact: { name: 'Kitchen QA Customer', phone: '+15559876543' },
    paymentMethod: 'mock_pay_at_pickup',
    comments: 'No peanuts',
  });

  const ticket = await buildKitchenTicket(merchantId, checkout.orderUuid);
  return { ticket, orderUuid: checkout.orderUuid, merchantId };
}

async function screenshotHtml(browser, html, filename, viewport) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, filename),
    fullPage: true,
  });
  console.log(`Saved: ${filename}`);
  await page.close();
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const { ticket, orderUuid } = await seedTicketData();
  const ticketHtml = renderTicketHtml(ticket);
  const settingsHtml = renderSettingsHtml();

  const previewPath = path.join(OUTPUT_DIR, 'kitchen-ticket-preview.html');
  fs.writeFileSync(previewPath, ticketHtml);

  const browser = await chromium.launch({ headless: true });

  await screenshotHtml(browser, settingsHtml, '01-settings-kitchen-printing-desktop.png', {
    width: 1280,
    height: 900,
  });
  await screenshotHtml(browser, settingsHtml, '02-settings-kitchen-printing-mobile.png', {
    width: 390,
    height: 844,
  });

  const kdsPath = path.join(OUTPUT_DIR, 'kds-board-qa.html');
  const detailPath = path.join(OUTPUT_DIR, 'order-detail-qa.html');
  fs.writeFileSync(kdsPath, renderKdsBoardHtml());
  fs.writeFileSync(detailPath, renderOrderDetailHtml());

  const kdsPage = await browser.newPage();
  await kdsPage.setViewportSize({ width: 1280, height: 900 });
  await kdsPage.goto(`file://${kdsPath}`, { waitUntil: 'load' });
  await kdsPage.screenshot({ path: path.join(OUTPUT_DIR, '03-kds-orders-board-desktop.png'), fullPage: true });
  console.log('Saved: 03-kds-orders-board-desktop.png');
  await kdsPage.close();

  const detailPage = await browser.newPage();
  await detailPage.setViewportSize({ width: 1280, height: 900 });
  await detailPage.goto(`file://${detailPath}`, { waitUntil: 'load' });
  await detailPage.screenshot({ path: path.join(OUTPUT_DIR, '04-order-detail-print-button-desktop.png'), fullPage: true });
  console.log('Saved: 04-order-detail-print-button-desktop.png');
  await detailPage.close();

  await screenshotHtml(browser, ticketHtml, '05-kitchen-ticket-print-page-desktop.png', {
    width: 1280,
    height: 900,
  });
  await screenshotHtml(browser, ticketHtml, '07-kitchen-ticket-print-page-mobile.png', {
    width: 390,
    height: 844,
  });

  // Print media preview
  const printPage = await browser.newPage();
  await printPage.setViewportSize({ width: 400, height: 1200 });
  await printPage.setContent(ticketHtml, { waitUntil: 'load' });
  await printPage.emulateMedia({ media: 'print' });
  await printPage.screenshot({
    path: path.join(OUTPUT_DIR, '08-kitchen-ticket-print-media-desktop.png'),
    fullPage: true,
  });
  console.log('Saved: 08-kitchen-ticket-print-media-desktop.png');
  await printPage.close();

  await browser.close();

  console.log(`\nQA ticket orderUuid: ${orderUuid}`);
  console.log(`Preview HTML: ${previewPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
