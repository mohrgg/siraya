import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/Users/rifqiardhani/.gemini/antigravity-ide/brain/f5c75121-8aa0-4219-b099-7a0b8a6f1cfe';

async function verify() {
  const browser = await chromium.launch();
  
  // 1. MOBILE TEST (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await mobileContext.newPage();

  console.log('Logging in on mobile...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[name="email"]', 'admin@albasyariah.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3001/');
  await page.waitForTimeout(1000);

  // === Test Pembayaran Tagihan ===
  console.log('Testing Pembayaran Tagihan on Mobile...');
  await page.goto('http://localhost:3001/pembayaran-tagihan');
  await page.waitForTimeout(1500);

  // Search 'a' to get student list
  const searchInput = page.locator('input[placeholder*="Ketik Nama Siswa"]');
  await searchInput.fill('a');
  await page.click('button:has-text("Cari Siswa")');
  await page.waitForTimeout(2000);

  // Left position screenshot (showing NO, SISWA/I)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-pembayaran-loaded-left.png') });
  console.log('Saved mobile-pembayaran-loaded-left.png');

  // Scroll table horizontally to middle (showing tagihan columns)
  const tableContainer = page.locator('div.overflow-x-auto').first();
  await tableContainer.evaluate((el) => {
    el.scrollLeft = 250;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-pembayaran-loaded-mid.png') });
  console.log('Saved mobile-pembayaran-loaded-mid.png');

  // Scroll table horizontally to far right (showing TOTAL BERJALAN & PROSES button)
  await tableContainer.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-pembayaran-loaded-right.png') });
  console.log('Saved mobile-pembayaran-loaded-right.png');

  // === Test Pembuatan Tagihan ===
  console.log('Testing Pembuatan Tagihan on Mobile...');
  await page.goto('http://localhost:3001/pembuatan-tagihan');
  await page.waitForTimeout(1500);

  // Switch to "Cari Siswa Langsung" tab
  const tabCari = page.locator('button:has-text("Cari Siswa Langsung")');
  if (await tabCari.isVisible()) {
    await tabCari.click();
    await page.waitForTimeout(500);
    const pemSearchInput = page.locator('input[placeholder*="Ketik Nama Siswa"]');
    await pemSearchInput.fill('a');
    await page.click('button:has-text("Cari Siswa")');
    await page.waitForTimeout(2000);

    // Left
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-pembuatan-loaded-left.png') });
    console.log('Saved mobile-pembuatan-loaded-left.png');

    // Mid
    const pemTableContainer = page.locator('div.overflow-x-auto').first();
    await pemTableContainer.evaluate((el) => {
      el.scrollLeft = 250;
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-pembuatan-loaded-mid.png') });
    console.log('Saved mobile-pembuatan-loaded-mid.png');

    // Right
    await pemTableContainer.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-pembuatan-loaded-right.png') });
    console.log('Saved mobile-pembuatan-loaded-right.png');
  }

  await mobileContext.close();
  await browser.close();
  console.log('Verification finished successfully!');
}

verify().catch(console.error);
