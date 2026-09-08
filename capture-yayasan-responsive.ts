import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/Users/rifqiardhani/.gemini/antigravity-ide/brain/850ea179-3887-44d5-b499-8519939ed6de';

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 },
];

async function capture() {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Login as yayasan
    await page.goto('http://localhost:3001/login');
    await page.fill('input[name="email"]', 'yayasan@albasyariah.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3001/');
    await page.waitForTimeout(1500);

    // Full page screenshot of 360 Yayasan Cockpit
    const outPath = path.join(ARTIFACT_DIR, `yayasan-cockpit-${vp.name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captured ${vp.name} to ${outPath}`);

    // Capture mobile with side menu toggled if mobile
    if (vp.name === 'mobile-375') {
      const menuBtn = page.locator('button:has(svg.lucide-menu)');
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(600);
        const drawerPath = path.join(ARTIFACT_DIR, `yayasan-sidebar-mobile-375.png`);
        await page.screenshot({ path: drawerPath });
        console.log(`Captured mobile sidebar to ${drawerPath}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('All responsive captures complete!');
}

capture().catch(console.error);
