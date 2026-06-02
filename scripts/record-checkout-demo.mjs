import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../artifacts');
const menuUrl =
  'http://localhost:3001/online-ordering/instep-cafe-new-york-10001-lunch-menu';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 430, height: 900 } },
    viewport: { width: 430, height: 900 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });

  const pause = (ms) => page.waitForTimeout(ms);

  await page.goto(menuUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await pause(1500);

  const addButtons = page.locator('button', { hasText: /add to cart|加入购物车/i });
  await addButtons.nth(0).click();
  await pause(800);
  await addButtons.nth(1).click();
  await pause(1200);

  await page.locator('button', { hasText: /proceed to checkout|前往结账/i }).click();
  await pause(2000);

  await page.locator('input[type="text"]').first().fill('Demo Customer');
  await page.locator('input[type="tel"]').fill('+15551234567');
  await page.locator('input[type="email"]').fill('demo@example.com');

  const waLabel = page.locator('label').filter({ hasText: /whatsapp/i });
  if (await waLabel.count()) {
    await waLabel.locator('input[type="checkbox"]').check();
    await pause(500);
  }

  await page.locator('label').filter({ hasText: /pay at pickup|到店支付/i }).click();
  await page.locator('textarea').fill('Demo order');
  await pause(1000);

  await page.locator('button', { hasText: /place order|提交订单/i }).click();
  await page.waitForURL(/\/receipts\//, { timeout: 30000 });
  await pause(3500);

  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const webmPath = await video.path();
    const dest = path.join(outDir, 'checkout-flow-demo.webm');
    const fs = await import('fs/promises');
    await fs.rename(webmPath, dest).catch(async () => {
      await fs.copyFile(webmPath, dest);
    });
    console.log('VIDEO_PATH=' + dest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
