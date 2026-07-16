import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Aplikasi SIRAYA', () => {

  test('Halaman Login merender dengan benar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
    const loginHeader = page.locator('h1', { hasText: 'SIRAYA' });
    await expect(loginHeader).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('Login gagal dengan kredensial salah', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'salah@email.com');
    await page.fill('input[name="password"]', 'salah123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('Alur Admin: Login, Akses Data Master & Transaksi', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@albasyariah.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Dashboard
    await expect(page).toHaveURL('/');
    const adminText = page.locator('.sidebar-user-role', { hasText: 'ADMIN' });
    await expect(adminText).toBeVisible();

    // Data Master
    await page.goto('/data-master');
    await expect(page).toHaveURL(/.*\/data-master\/tahun-akademik/);
    await expect(page.locator('h1', { hasText: 'Data Master' })).toBeVisible();

    // Transaksi Kas
    await page.goto('/transaksi');
    await expect(page).toHaveURL(/.*\/transaksi\/kas-masuk/);
    await expect(page.locator('h1', { hasText: 'Transaksi Kas' })).toBeVisible();

    // Uji Logout
    await page.click('button[title="Keluar"]');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
