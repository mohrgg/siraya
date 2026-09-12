import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/Users/rifqiardhani/.gemini/antigravity-ide/brain/3ee42f43-8ebb-436d-b394-cce650da1da7';

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

  // 1. Click Central Menu button to capture Mobile Modal ("Semua Modul Siraya")
  const menuButton = page.locator('button[aria-label="Buka Semua Menu & Modul"]');
  await menuButton.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile-menu-modal-fixed.png') });
  console.log('1. Captured mobile-menu-modal-fixed.png');

  // Close modal
  await page.click('button[aria-label="Tutup Menu"]');
  await page.waitForTimeout(400);

  // 2. Navigate to Unit Sekolah to verify toolbar refresh button
  await page.goto('http://localhost:3001/unit-sekolah');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'unit-sekolah-mobile-toolbar.png') });
  console.log('2. Captured unit-sekolah-mobile-toolbar.png');

  // 3. Navigate to Kas Masuk to verify toolbar refresh button & export buttons
  await page.goto('http://localhost:3001/kas-masuk');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'kas-masuk-mobile-toolbar.png') });
  console.log('3. Captured kas-masuk-mobile-toolbar.png');

  await context.close();
  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

verify().catch(console.error);
