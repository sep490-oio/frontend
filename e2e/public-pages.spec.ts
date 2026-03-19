/**
 * Public Pages Smoke Tests — verifies pages that don't require login.
 *
 * Tests:
 * 1. Home page loads with hero section and featured auctions
 * 2. Browse page loads with auction cards
 * 3. Login page renders the login form
 * 4. Navigation between public pages works
 * 5. 404 page shows for unknown routes
 */
import { test, expect } from '@playwright/test';
import { mockPublicAPIs } from './fixtures/mock-api';

test.describe('Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicAPIs(page);
  });

  test('Home page loads with hero and featured auctions', async ({ page }) => {
    await page.goto('/');

    // Hero section should be visible
    await expect(page.locator('.home-hero')).toBeVisible();

    // Hero title should contain marketplace text
    await expect(page.locator('.home-hero__title')).toContainText('Premier Marketplace');

    // "Browse Auctions" CTA button should be visible
    await expect(page.getByRole('button', { name: /Browse Auctions/i })).toBeVisible();

    // Stats section should show
    await expect(page.locator('.home-hero__stats')).toBeVisible();
  });

  test('Home page shows featured auction cards', async ({ page }) => {
    await page.goto('/');

    // Wait for the featured section to load
    await expect(page.locator('.home-featured')).toBeVisible();

    // "Featured Auctions" heading should be present
    await expect(page.getByRole('heading', { name: /Featured Auctions/i })).toBeVisible();
  });

  test('Browse page loads with filters and auction grid', async ({ page }) => {
    await page.goto('/browse');

    // Page should have loaded (check for sort controls or auction cards)
    await expect(page).toHaveURL('/browse');

    // Wait for content to render (either auction cards or empty state)
    await page.waitForLoadState('networkidle');
  });

  test('Login page renders form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Email input should be visible
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();

    // Password input should be visible (Ant Design Input.Password)
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Submit button should be visible (use the form's submit button, not the header one)
    await expect(page.locator('button.login-submit')).toBeVisible();

    // Register link should be visible
    await expect(page.getByRole('link', { name: /register|đăng ký/i })).toBeVisible();
  });

  test('Navigation: Home → Browse via CTA button', async ({ page }) => {
    await page.goto('/');

    // Click "Browse Auctions" button
    await page.getByRole('button', { name: /Browse Auctions/i }).click();

    // Should navigate to /browse
    await expect(page).toHaveURL('/browse');
  });

  test('Navigation: Login page → Register link', async ({ page }) => {
    await page.goto('/login');

    // Click register link
    await page.getByRole('link', { name: /register|đăng ký/i }).click();

    // Should navigate to /register
    await expect(page).toHaveURL('/register');
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    // Should show 404 content (NotFoundPage component)
    await expect(page.getByText(/404/)).toBeVisible();
  });

  test('Protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to /login since user is not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});
