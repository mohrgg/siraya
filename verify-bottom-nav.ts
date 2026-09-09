import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/Users/rifqiardhani/.gemini/antigravity-ide/brain/f5c75121-8aa0-4219-b099-7a0b8a6f1cfe';

async function verify() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Login as admin
  await page.goto('http://localhost:3001/login');
  await page.fill('input[name="email"]', 'admin@albasyariah.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3001/');
  await page.waitForTimeout(1000);

  // 1. Capture Dashboard Bottom Nav
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bottom-nav-dashboard.png') });
  console.log('1. Captured bottom-nav-dashboard.png');

  // 2. Click / Navigate to Pembayaran
  await page.click('a[href="/pembayaran-tagihan"]');
  await page.waitForURL('**/pembayaran-tagihan*');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bottom-nav-pembayaran.png') });
  console.log('2. Captured bottom-nav-pembayaran.png');

  // 3. Click / Navigate to Kelas
  await page.click('a[href="/kelas"]');
  await page.waitForURL('**/kelas*');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bottom-nav-kelas.png') });
  console.log('3. Captured bottom-nav-kelas.png');

  // 4. Click Central Menu button
  const menuButton = page.locator('button[aria-label="Buka Semua Menu & Modul"]');
  await menuButton.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bottom-nav-menu-modal.png') });
  console.log('4. Captured bottom-nav-menu-modal.png');

  await context.close();
  await browser.close();
  console.log('Verification completed successfully!');
}

verify().catch(console.error);
