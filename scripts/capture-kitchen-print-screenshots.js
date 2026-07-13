#!/usr/bin/env node
/**
 * Capture kitchen ticket printing UX on staging or local dev.
 *
 * Usage:
 *   BASE_URL=https://eggrollpos-staging.up.railway.app pnpm run screenshots:kitchen-print
 *   BASE_URL=http://localhost:3001 pnpm run screenshots:kitchen-print
 *
 * Env:
 *   BASE_URL              default https://eggrollpos-staging.up.railway.app
 *   STAGING_MERCHANT_KEY  default mc_n1c0ffee
 *   MERCHANT_EMAIL        default demo@eggrollpos.com
 *   MERCHANT_PASSWORD     default eggroll123
 *   ORDER_UUID            optional; creates staging order if unset
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const BASE_URL = (process.env.BASE_URL || 'https://eggrollpos-staging.up.railway.app').replace(/\/$/, '');
const MERCHANT_KEY = process.env.STAGING_MERCHANT_KEY || 'mc_n1c0ffee';
const MERCHANT_EMAIL = process.env.MERCHANT_EMAIL || 'demo@eggrollpos.com';
const MERCHANT_PASSWORD = process.env.MERCHANT_PASSWORD || 'eggroll123';
const OUTPUT_DIR = path.join(__dirname, '../docs/screenshots/kitchen-print');

async function ensureOrderUuid() {
  if (process.env.ORDER_UUID) return process.env.ORDER_UUID;

  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'add-staging-order.js'), '--name', 'Kitchen Print QA'],
    {
      env: { ...process.env, BASE_URL, STAGING_MERCHANT_KEY: MERCHANT_KEY },
      encoding: 'utf8',
    }
  );

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  const match = output.match(/orderUuid[:\s]+([0-9a-f-]{36})/i)
    || output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);

  if (!match) {
    console.error(output);
    throw new Error('Could not create or parse staging order UUID');
  }

  console.log(`Created staging order: ${match[1]}`);
  return match[1];
}

async function loginIfNeeded(page) {
  const loginHeading = page.locator('text=Merchant sign in');
  if (await loginHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Signing in...');
    await page.getByLabel('Email').fill(MERCHANT_EMAIL);
    await page.getByLabel('Password').fill(MERCHANT_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
  }

  const configError = page.locator('text=Supabase Auth is not configured');
  if (await configError.isVisible({ timeout: 1000 }).catch(() => false)) {
    throw new Error('Supabase Auth is not configured on this environment');
  }
}

async function screenshot(page, name) {
  const filePath = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Saved: ${name}`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const orderUuid = await ensureOrderUuid();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    // 1. Settings — kitchen auto-print toggle
    await page.goto(`${BASE_URL}/md/${MERCHANT_KEY}/settings`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await loginIfNeeded(page);
    await page.waitForSelector('text=Kitchen printing', { timeout: 30000 });
    await screenshot(page, '01-settings-kitchen-printing-desktop.png');

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(`${BASE_URL}/md/${MERCHANT_KEY}/settings`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await loginIfNeeded(mobilePage);
    await mobilePage.waitForSelector('text=Kitchen printing', { timeout: 30000 });
    await mobilePage.screenshot({
      path: path.join(OUTPUT_DIR, '02-settings-kitchen-printing-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: 02-settings-kitchen-printing-mobile.png');
    await mobile.close();

    // 2. KDS order board
    await page.goto(`${BASE_URL}/md/${MERCHANT_KEY}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForSelector('.OrdersGrid, .Merchant__no-orders', { timeout: 30000 });
    await screenshot(page, '03-kds-orders-board-desktop.png');

    // 3. Order detail with Print Kitchen Ticket button
    const orderCard = page.locator('.OrderCard').first();
    if (await orderCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderCard.click();
    } else {
      await page.goto(`${BASE_URL}/md/${MERCHANT_KEY}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await page.locator('.OrderCard').first().click({ timeout: 10000 });
    }
    await page.waitForSelector('.OrderDetail', { timeout: 15000 });
    await page.waitForSelector('text=Print Kitchen Ticket', { timeout: 15000 });
    await screenshot(page, '04-order-detail-print-button-desktop.png');

    // 4. Kitchen ticket print page (no auto-print dialog in headless)
    await page.goto(`${BASE_URL}/md/${MERCHANT_KEY}/kitchenticket/${orderUuid}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForSelector('.KitchenTicketPrint__paper', { timeout: 30000 });
    await screenshot(page, '05-kitchen-ticket-print-page-desktop.png');

    // 5. Short alias /kt/
    await page.goto(`${BASE_URL}/md/${MERCHANT_KEY}/kt/${orderUuid}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForSelector('.KitchenTicketPrint__paper', { timeout: 30000 });
    await screenshot(page, '06-kitchen-ticket-kt-alias-desktop.png');

    // 6. Mobile kitchen ticket
    const mobileTicket = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
    });
    const ticketPage = await mobileTicket.newPage();
    await ticketPage.goto(`${BASE_URL}/md/${MERCHANT_KEY}/kitchenticket/${orderUuid}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await loginIfNeeded(ticketPage);
    await ticketPage.waitForSelector('.KitchenTicketPrint__paper', { timeout: 30000 });
    await ticketPage.screenshot({
      path: path.join(OUTPUT_DIR, '07-kitchen-ticket-print-page-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: 07-kitchen-ticket-print-page-mobile.png');
    await mobileTicket.close();

    console.log(`\nKitchen print screenshots saved to ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
