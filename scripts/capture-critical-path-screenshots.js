#!/usr/bin/env node
/**
 * Capture critical-path route screenshots (dev servers on :3001 / :3000).
 * Usage: node scripts/capture-critical-path-screenshots.js
 * Env: OUTPUT_DIR, BASE_URL (default http://localhost:3001)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '../docs/screenshots');
const MERCHANT_UUID = 'a0000001-0001-0001-0001-000000000001';
const MENU_SLUG = 'instep-cafe-new-york-10001-lunch-menu';

const routes = [
  { file: '01-home.png', url: '/', wait: 'body' },
  {
    file: '02-merchant-dashboard.png',
    url: `/merchant-dashboard/${MERCHANT_UUID}`,
    wait: '.OrdersGrid, .MerchantDashboard, [class*="Order"]',
  },
  {
    file: '03-online-menu.png',
    url: `/online-ordering/${MENU_SLUG}`,
    wait: 'button, [class*="Menu"]',
    timeout: 20000,
  },
  {
    file: '04-checkout.png',
    url: `/online-ordering/${MENU_SLUG}/checkout`,
    wait: 'h1',
    prep: async (page) => {
      const cart = {
        slug: MENU_SLUG,
        merchantName: 'INSTEP Cafe',
        lines: [
          { menuItemId: 1, name: 'Drip Coffee', priceCents: 350, quantity: 2 },
          { menuItemId: 3, name: 'Avocado Toast', priceCents: 1100, quantity: 1 },
        ],
        updatedAt: Date.now(),
      };
      await page.addInitScript((data) => {
        localStorage.setItem(`eggroll_cart_${data.slug}`, JSON.stringify(data.cart));
      }, { slug: MENU_SLUG, cart });
    },
  },
  {
    file: '05-merchant-online-menus.png',
    url: `/merchant-dashboard/${MERCHANT_UUID}/online-menus`,
    wait: '.MerchantMenus, table, [class*="Menu"]',
  },
  {
    file: '06-receipt.png',
    url: '/receipts/a0000009-0009-0009-0009-000000000009',
    wait: 'body',
    timeout: 15000,
  },
];

async function capture(page, { file, url, wait, prep, timeout = 15000 }) {
  if (prep) await prep(page);
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout });
  if (wait) {
    try {
      await page.waitForSelector(wait, { timeout: 10000 });
    } catch {
      await page.waitForTimeout(1500);
    }
  }
  await page.waitForTimeout(500);
  const out = path.join(OUTPUT_DIR, file);
  await page.screenshot({ path: out, fullPage: true });
  console.log('Saved:', out);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  try {
    for (const route of routes) {
      await capture(page, route);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
