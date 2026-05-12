#!/usr/bin/env node
/**
 * Capture screenshots of i18n (Chinese) UI for documentation.
 * Requires dev servers to be running: ./dev.sh --sqlite (or pnpm run dev)
 *
 * Usage: pnpm run screenshots:i18n
 * Output: docs/screenshots/i18n-*.jpg
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const MERCHANT_UUID = 'mc_m4zun00d';
const OUTPUT_DIR = path.join(__dirname, '../docs/screenshots');

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const contextOptions = {
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);

  // Ensure Chinese is used
  await context.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'zh');
  });

  const page = await context.newPage();

  try {
    // 1. Home landing (Chinese hero + contact form)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('.hero', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-home-landing.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-home-landing.jpg');

    // 2. About page
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-about.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-about.jpg');

    // 3. Customer order online
    await page.goto(`${BASE_URL}/order-online/3`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-customer-order-online.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-customer-order-online.jpg');

    // 4. Merchant orders list
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.OrdersGrid', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-merchant-orders-list.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-merchant-orders-list.jpg');

    // 5. Merchant order detail (click first order if exists)
    const orderCard = await page.$('.OrderCard');
    if (orderCard) {
      await orderCard.click();
      await page.waitForSelector('.OrderDetail', { timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'i18n-merchant-order-detail.jpg'),
        type: 'jpeg',
        quality: 65,
        fullPage: true,
      });
      console.log('Saved: i18n-merchant-order-detail.jpg');
    } else {
      console.log('Skipped: i18n-merchant-order-detail.jpg (no orders)');
    }

    // 6. Merchant menu items list
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-merchant-menu-items.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-merchant-menu-items.jpg');

    // 7. Merchant add menu item form
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/menuitems/add`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems__form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-merchant-add-menu-item.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-merchant-add-menu-item.jpg');

    // 8. Modifiers modal (open from menu items)
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    const modifiersBtn = await page.getByRole('button', { name: '管理配料' }).first();
    try {
      await modifiersBtn.click();
      await page.waitForSelector('.ModifiersModal', { timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'i18n-merchant-modifiers-modal.jpg'),
        type: 'jpeg',
        quality: 65,
      });
      console.log('Saved: i18n-merchant-modifiers-modal.jpg');
    } catch {
      console.log('Skipped: i18n-merchant-modifiers-modal.jpg (button not found)');
    }

    // 9. Mobile view - home
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('.hero', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'i18n-home-mobile.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: i18n-home-mobile.jpg');

    console.log('');
    console.log('Screenshots saved to docs/screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Make sure dev servers are running: ./dev.sh --sqlite');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
