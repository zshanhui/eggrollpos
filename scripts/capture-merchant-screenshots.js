#!/usr/bin/env node
/**
 * Capture screenshots of merchant admin screens for demo/documentation.
 * Requires dev servers to be running: pnpm run dev (or ./dev.sh)
 *
 * Usage: pnpm run screenshots:merchant
 *        VIDEO=1 pnpm run screenshots:merchant   # also record demo video
 * Output: docs/screenshots/merchant-*.jpg
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const MERCHANT_UUID = 'mc000003-0003-0003-0003-000000000003';
const SAMPLE_MENU_ITEM_ID = 11; // First menu item for merchant 3
const OUTPUT_DIR = path.join(__dirname, '../docs/screenshots');
const RECORD_VIDEO = process.env.VIDEO === '1';

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const contextOptions = {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
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

  // Force Chinese language for all screenshots
  await context.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'zh');
  });

  const page = await context.newPage();

  try {
    // Orders list (mobile view)
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.OrdersGrid', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-orders-list-mobile.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: merchant-orders-list-mobile.jpg');

    // Order detail (skip if no orders)
    const hasOrderCard = await page.locator('.OrderCard').first().isVisible().catch(() => false);
    if (hasOrderCard) {
      await page.click('.OrderCard');
      await page.waitForSelector('.OrderDetail', { timeout: 5000 });
      await page.waitForTimeout(RECORD_VIDEO ? 1500 : 500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'merchant-order-detail-mobile.jpg'),
        type: 'jpeg',
        quality: 65,
        fullPage: true,
      });
      console.log('Saved: merchant-order-detail-mobile.jpg');
    } else {
      console.log('Skipped: merchant-order-detail-mobile.jpg (no orders)');
    }

    // Menu items list
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-items-list-mobile.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: merchant-menu-items-list-mobile.jpg');

    // Menu item add form
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems/add`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems__form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-item-add-mobile.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: merchant-menu-item-add-mobile.jpg');

    // Menu item edit form
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems/${SAMPLE_MENU_ITEM_ID}/edit`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems__form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-item-edit-mobile.jpg'),
      type: 'jpeg',
      quality: 65,
      fullPage: true,
    });
    console.log('Saved: merchant-menu-item-edit-mobile.jpg');

    // Modifiers modal (Chinese: 管理配料)
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    const modifiersBtnMobile = page.getByRole('button', { name: '管理配料' }).first();
    try {
      await modifiersBtnMobile.click();
      await page.waitForSelector('.ModifiersModal', { timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'merchant-modifiers-modal-mobile.jpg'),
        type: 'jpeg',
        quality: 65,
      });
      console.log('Saved: merchant-modifiers-modal-mobile.jpg');
    } catch {
      console.log('Skipped: merchant-modifiers-modal-mobile.jpg (button not found)');
    }

    // Desktop view - orders list (960x600 for smaller file size)
    await page.setViewportSize({ width: 960, height: 600 });
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.OrdersGrid', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-orders-list-desktop.jpg'),
      type: 'jpeg',
      quality: 65,
    });
    console.log('Saved: merchant-orders-list-desktop.jpg');

    // Desktop view - order detail (skip if no orders)
    const hasOrderCardDesktop = await page.locator('.OrderCard').first().isVisible().catch(() => false);
    if (hasOrderCardDesktop) {
      await page.click('.OrderCard');
      await page.waitForSelector('.OrderDetail', { timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'merchant-order-detail-desktop.jpg'),
        type: 'jpeg',
        quality: 65,
        fullPage: true,
      });
      console.log('Saved: merchant-order-detail-desktop.jpg');
    } else {
      console.log('Skipped: merchant-order-detail-desktop.jpg (no orders)');
    }

    // Desktop - menu items list
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-items-list-desktop.jpg'),
      type: 'jpeg',
      quality: 65,
    });
    console.log('Saved: merchant-menu-items-list-desktop.jpg');

    // Desktop - menu item add form
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems/add`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems__form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-item-add-desktop.jpg'),
      type: 'jpeg',
      quality: 65,
    });
    console.log('Saved: merchant-menu-item-add-desktop.jpg');

    // Desktop - menu item edit form
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems/${SAMPLE_MENU_ITEM_ID}/edit`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems__form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'merchant-menu-item-edit-desktop.jpg'),
      type: 'jpeg',
      quality: 65,
    });
    console.log('Saved: merchant-menu-item-edit-desktop.jpg');

    // Desktop - modifiers modal
    await page.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForSelector('.MerchantMenuItems', { timeout: 5000 });
    const modifiersBtnDesktop = page.getByRole('button', { name: '管理配料' }).first();
    try {
      await modifiersBtnDesktop.click();
      await page.waitForSelector('.ModifiersModal', { timeout: 5000 });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'merchant-modifiers-modal-desktop.jpg'),
        type: 'jpeg',
        quality: 65,
      });
      console.log('Saved: merchant-modifiers-modal-desktop.jpg');
    } catch {
      console.log('Skipped: merchant-modifiers-modal-desktop.jpg (button not found)');
    }

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
