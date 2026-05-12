#!/usr/bin/env node
/**
 * Capture screenshots of merchant admin screens for demo/documentation.
 * Requires dev servers to be running: pnpm run dev (or ./dev.sh)
 *
 * Usage: pnpm run screenshots:merchant
 *        VIDEO=1 pnpm run screenshots:merchant   # also record demo video
 * Output: docs/screenshots/merchant-*.png
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const MERCHANT_UUID = 'mc_m4zun00d';
const OUTPUT_DIR = path.join(__dirname, '../docs/screenshots');
const RECORD_VIDEO = process.env.VIDEO === '1';

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const contextOptions = {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  };
  if (RECORD_VIDEO) {
    contextOptions.recordVideo = {
      dir: OUTPUT_DIR,
      size: { width: 390, height: 844 },
    };
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();

  try {
    // Orders list (mobile view)
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.OrdersGrid', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-orders-list-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: merchant-orders-list-mobile.png');

    // Order detail
    await page.click('.OrderCard');
    await page.waitForSelector('.OrderDetail', { timeout: 5000 });
    await page.waitForTimeout(RECORD_VIDEO ? 1500 : 500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-order-detail-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: merchant-order-detail-mobile.png');

    // Menu items list
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-items-list-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: merchant-menu-items-list-mobile.png');

    // Menu item add form
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/menuitems/add`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems__form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-item-add-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: merchant-menu-item-add-mobile.png');

    // Merchant settings (dark theme)
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/settings`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantSettings', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-settings-dark-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: merchant-settings-dark-mobile.png');

    // Merchant settings (light theme) - switch theme first
    const lightThemeBtn = await page.getByRole('button', { name: /light|浅色/i }).first();
    try {
      await lightThemeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'merchant-settings-light-mobile.png'),
        fullPage: true,
      });
      console.log('Saved: merchant-settings-light-mobile.png');
    } catch {
      console.log('Skipped: merchant-settings-light-mobile.png (theme button not found)');
    }

    // Desktop view - orders list (with Settings link)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.OrdersGrid', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-orders-list-desktop.png'),
    });
    console.log('Saved: merchant-orders-list-desktop.png');

    // Merchant settings desktop
    await page.goto(`${BASE_URL}/merchant-dashboard/${MERCHANT_UUID}/settings`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantSettings', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-settings-desktop.png'),
      fullPage: true,
    });
    console.log('Saved: merchant-settings-desktop.png');

    if (RECORD_VIDEO) {
      const video = page.video();
      if (video) {
        await context.close();
        await video.saveAs(path.join(OUTPUT_DIR, 'merchant-demo-mobile.webm'));
        console.log('Saved: merchant-demo-mobile.webm');
      }
    }
    console.log('');
    console.log('Screenshots saved to docs/screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Make sure dev servers are running: pnpm run dev');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
