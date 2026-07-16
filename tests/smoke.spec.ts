import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Aplikasi SIRAYA', () => {

  test('Halaman Login merender dengan benar', async ({ page }) => {
    // Kita arahkan ke root, middleware harusnya melempar ke /login
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
    
    // Pastikan form login muncul
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

    // Pastikan tetap di halaman login atau muncul pesan error
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('Alur Admin: Login & Akses Rute Admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@albasyariah.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Harus dialihkan ke halaman utama (Dashboard)
    await expect(page).toHaveURL('/');
    
    // Pastikan Sidebar muncul dengan nama Admin
    await expect(page.locator('.sidebar-user-role', { hasText: 'ADMIN' })).toBeVisible();

    // Pastikan Admin bisa masuk ke halaman Manajemen User
    await page.goto('/manajemen-user');
    await expect(page).toHaveURL('/manajemen-user');
    await expect(page.locator('h1', { hasText: 'Manajemen User' })).toBeVisible();

    // Uji Logout
    await page.click('button[title="Keluar"]');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Alur Tata Usaha: Login & Diblokir dari Rute Admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'tu@albasyariah.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Harus dialihkan ke halaman utama
    await expect(page).toHaveURL('/');
    await expect(page.locator('.sidebar-user-role', { hasText: 'TATA_USAHA' })).toBeVisible();

    // Memaksa masuk ke rute Admin (harus ditolak oleh Middleware)
    await page.goto('/manajemen-user');
    // Karena ditolak, middleware akan melempar kembali ke '/'
    await expect(page).toHaveURL('/');

    // Uji Logout
    await page.click('button[title="Keluar"]');
    await expect(page).toHaveURL(/.*\/login/);
  });

});
