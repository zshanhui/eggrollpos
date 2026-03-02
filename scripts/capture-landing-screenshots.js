#!/usr/bin/env node
/**
 * Capture screenshots of the landing page (English) for documentation.
 * Requires Vite dev server: npx vite
 *
 * Usage: pnpm run screenshots:landing
 * Output: docs/screenshots/landing-*.png
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, '../docs/screenshots');

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    locale: 'en-US',
    colorScheme: 'light',
  });

  await context.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });

  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('.LandingPage', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'landing-desktop.png'),
      fullPage: true,
    });
    console.log('Saved: landing-desktop.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('.LandingPage', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'landing-mobile.png'),
      fullPage: true,
    });
    console.log('Saved: landing-mobile.png');

    console.log('\nScreenshots saved to docs/screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
