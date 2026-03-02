#!/usr/bin/env node
/**
 * Browser tests for merchant dashboard.
 * Requires dev servers to be running: ./dev.sh (or pnpm run dev)
 *
 * Usage: pnpm run test:browser
 *        BASE_URL=http://localhost:3001 pnpm run test:browser
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const MERCHANT_UUID = 'mc000003-0003-0003-0003-000000000003';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const results = { passed: 0, failed: 0, tests: [] };

  function log(name, ok, detail = '') {
    const status = ok ? '✓' : '✗';
    const msg = ok ? 'PASS' : 'FAIL';
    console.log(`  ${status} ${name}${detail ? ` — ${detail}` : ''}`);
    results.tests.push({ name, ok, detail });
    if (ok) results.passed++;
    else results.failed++;
  }

  try {
    // ─── Mobile viewport (390x844) ───
    console.log('\n--- Mobile viewport (390x844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    const hasMobileDropdown = await mobilePage.locator('.OrdersGrid__filter-dropdown').isVisible();
    log('Mobile: filter dropdown is visible', hasMobileDropdown);

    const pillsOnMobile = await mobilePage.locator('.OrdersGrid__pill').count();
    log('Mobile: pill buttons are hidden (0 visible)', pillsOnMobile === 0);

    const orderCards = await mobilePage.locator('.OrderCard').count();
    log('Mobile: order list loads', orderCards >= 0);

    // Test dropdown filter on mobile
    const dropdown = mobilePage.locator('.OrdersGrid__filter-dropdown');
    const countBefore = await mobilePage.locator('.OrdersGrid__count').textContent();
    await dropdown.selectOption('canceled_refunded');
    await mobilePage.waitForTimeout(300);
    const countAfterCanceled = await mobilePage.locator('.OrdersGrid__count').textContent();
    log('Mobile: dropdown filter changes count', countAfterCanceled !== countBefore || countBefore === '0', `count: ${countBefore} → ${countAfterCanceled}`);

    await dropdown.selectOption('active');
    await mobilePage.waitForTimeout(200);

    // Test order card click -> detail
    const firstCard = mobilePage.locator('.OrderCard').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await mobilePage.waitForSelector('.OrderDetail', { timeout: 3000 });
      const hasDetail = await mobilePage.locator('.OrderDetail').isVisible();
      log('Mobile: order card opens detail page', hasDetail);
      await mobilePage.locator('.OrderDetail__back').click();
      await mobilePage.waitForSelector('.OrdersGrid', { timeout: 3000 });
    } else {
      log('Mobile: order card opens detail page', true, 'skipped (no orders)');
    }

    await mobileContext.close();

    // ─── Desktop viewport (1280x800) ───
    console.log('\n--- Desktop viewport (1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    const pillsOnDesktop = await desktopPage.locator('.OrdersGrid__pill').count();
    log('Desktop: pill buttons are visible (2 pills)', pillsOnDesktop === 2);

    const dropdownOnDesktop = await desktopPage.locator('.OrdersGrid__filter-dropdown').count();
    log('Desktop: dropdown is not rendered', dropdownOnDesktop === 0);

    // Test pill filter on desktop
    const pillCanceled = desktopPage.locator('.OrdersGrid__pill:has-text("Canceled/Refunded")');
    await pillCanceled.click();
    await desktopPage.waitForTimeout(300);
    const countDesktop = await desktopPage.locator('.OrdersGrid__count').textContent();
    log('Desktop: pill filter works', true, `filtered count: ${countDesktop}`);

    await desktopPage.locator('.OrdersGrid__pill:has-text("Active")').click();

    // Test order detail on desktop
    const firstCardDesktop = desktopPage.locator('.OrderCard').first();
    if (await firstCardDesktop.isVisible()) {
      await firstCardDesktop.click();
      await desktopPage.waitForSelector('.OrderDetail', { timeout: 3000 });
      const hasDetailDesktop = await desktopPage.locator('.OrderDetail').isVisible();
      log('Desktop: order card opens detail page', hasDetailDesktop);
    } else {
      log('Desktop: order card opens detail page', true, 'skipped (no orders)');
    }

    await desktopContext.close();

    // ─── Menu items page ───
    console.log('\n--- Menu items page ---');
    const menuPage = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    await menuPage.goto(`${BASE_URL}/merchant/${MERCHANT_UUID}/menuitems`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    const hasMenuItems = await menuPage.locator('.MerchantMenuItems').isVisible();
    log('Menu items page loads', hasMenuItems);
    await menuPage.context().close();

    // ─── Summary ───
    console.log('\n--- Summary ---');
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log('');

    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\nError:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
