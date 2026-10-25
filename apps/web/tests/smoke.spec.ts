import { test, expect } from '@playwright/test';

test.describe('Parakeet AI Web Platform Smoke Tests', () => {
  test('1. Homepage renders brand, hero, and action buttons', async ({ page }) => {
    await page.goto('/');

    // Check title and branding
    await expect(page).toHaveTitle(/Parakeet AI/i);
    await expect(page.getByText('Parakeet AI').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sub-Second Stealth AI');

    // Check action buttons
    const tryFreeBtn = page.getByRole('link', { name: /Try for Free/i });
    await expect(tryFreeBtn).toBeVisible();
  });

  test('2. Login page loads all authentication controls', async ({ page }) => {
    await page.goto('/login');

    // Check headings and tabs
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome Back');
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();

    // Check Google OAuth button
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();

    // Check form inputs
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('3. Unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // Middleware redirects unauthenticated user
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('4. Unauthenticated access to /dashboard/vault redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/vault');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('5. Unauthenticated access to /dashboard/mock redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/mock');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('6. Unauthenticated access to /dashboard/questions redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/questions');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('7. /api/health endpoint returns 200 with status ok and version', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('1.0.0');
    expect(body.service).toBe('Parakeet AI Web Platform');
  });
});
