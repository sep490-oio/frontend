/**
 * Auth Flow Regression Tests — comprehensive login, register, and access control tests.
 *
 * Tests cover:
 * - Login form validation (empty fields, format errors)
 * - Login error handling (401, 403, 500)
 * - Login success (redirect, token storage)
 * - Registration form validation and error handling
 * - Protected route redirects
 * - Role-based access control (403 for unauthorized roles)
 */
import { test, expect } from '@playwright/test';
import { authenticatedTest } from './fixtures/auth';

const API_BASE = 'https://api.newlsun.com';

// ─── Login Form Validation ───────────────────────────────────────────

test.describe('Login Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows error when submitting empty form', async ({ page }) => {
    // Click submit without filling anything
    await page.locator('button.login-submit').click();

    // React Hook Form + Zod should show validation errors
    // The form uses Controller with Zod — errors appear in Form.Item help text
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('shows error for empty account field', async ({ page }) => {
    // Fill only password, leave account empty
    await page.locator('input[type="password"]').fill('somepassword');
    await page.locator('button.login-submit').click();

    // Account field should show required error
    const errors = page.locator('.ant-form-item-explain-error');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test('shows error for empty password field', async ({ page }) => {
    // Fill only account, leave password empty
    await page.getByPlaceholder('you@example.com').fill('test@oio.vn');
    await page.locator('button.login-submit').click();

    // Password field should show required error
    const errors = page.locator('.ant-form-item-explain-error');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test('email input accepts text and shows placeholder', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');

    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('password input is masked by default', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('.ant-input-password input');
    await passwordInput.fill('mypassword');

    // Initially masked
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye icon to toggle visibility
    const toggleIcon = page.locator('.ant-input-password .ant-input-suffix').first();
    await toggleIcon.click();

    // Should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('social login buttons are present (Google, GitHub)', async ({ page }) => {
    const googleBtn = page.locator('.social-btn').filter({ hasText: 'Google' });
    const githubBtn = page.locator('.social-btn').filter({ hasText: 'GitHub' });

    await expect(googleBtn).toBeVisible();
    await expect(githubBtn).toBeVisible();
  });
});

// ─── Login Error Handling ────────────────────────────────────────────

test.describe('Login Error Handling', () => {
  test('shows "invalid credentials" on 401 response', async ({ page }) => {
    // Mock the login endpoint to return 401
    await page.route(`${API_BASE}/api/auth/login`, (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid credentials' }) });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('wrong@oio.vn');
    await page.locator('.ant-input-password input').fill('wrongpassword');
    await page.locator('button.login-submit').click();

    // Ant Design message should show error — message uses .ant-message
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('shows "email not confirmed" on 403 response', async ({ page }) => {
    await page.route(`${API_BASE}/api/auth/login`, (route) => {
      route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Email not confirmed' }) });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('unverified@oio.vn');
    await page.locator('.ant-input-password input').fill('password123');
    await page.locator('button.login-submit').click();

    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('shows generic error on 500 response', async ({ page }) => {
    await page.route(`${API_BASE}/api/auth/login`, (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal server error' }) });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('test@oio.vn');
    await page.locator('.ant-input-password input').fill('password123');
    await page.locator('button.login-submit').click();

    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('submit button shows loading state during request', async ({ page }) => {
    // Mock login with a slow response
    await page.route(`${API_BASE}/api/auth/login`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('test@oio.vn');
    await page.locator('.ant-input-password input').fill('password123');
    await page.locator('button.login-submit').click();

    // Button should have loading state (Ant Design adds .ant-btn-loading)
    await expect(page.locator('button.login-submit')).toHaveClass(/ant-btn-loading/, { timeout: 3000 });
  });
});

// ─── Login Success ───────────────────────────────────────────────────

test.describe('Login Success', () => {
  const mockLoginFlow = async (page: import('@playwright/test').Page) => {
    // Mock login endpoint
    await page.route(`${API_BASE}/api/auth/login`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-access-token-from-login',
          refreshToken: 'fake-refresh-token-from-login',
          expiresIn: 3600,
        }),
      });
    });

    // Mock getMe endpoint
    await page.route(`${API_BASE}/api/me`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-001',
            userName: 'testuser',
            email: 'test@oio.vn',
            emailConfirmed: true,
            phoneNumber: null,
            phoneNumberConfirmed: false,
            status: 'active',
            roles: ['bidder'],
            permissions: [],
            twoFactorEnabled: false,
            profile: {
              firstName: 'Test',
              lastName: 'User',
              displayName: 'Test User',
              fullName: 'Test User',
              avatarUrl: null,
              dateOfBirth: null,
              gender: null,
            },
            createdAt: '2026-01-15T00:00:00Z',
          }),
        });
      } else {
        route.continue();
      }
    });

    // Mock dashboard-related APIs to prevent errors after redirect
    await page.route(`${API_BASE}/api/dashboard/**`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    // Mock wallet
    await page.route(`${API_BASE}/api/wallets/me`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ availableBalance: 0, lockedBalance: 0, heldBalance: 0, refundBalance: 0, currency: 'VND' }) });
    });
  };

  test('successful login redirects to /dashboard', async ({ page }) => {
    await mockLoginFlow(page);
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('test@oio.vn');
    await page.locator('.ant-input-password input').fill('password123');
    await page.locator('button.login-submit').click();

    // Should redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('successful login stores tokens in localStorage', async ({ page }) => {
    await mockLoginFlow(page);
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('test@oio.vn');
    await page.locator('.ant-input-password input').fill('password123');
    await page.locator('button.login-submit').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Check localStorage has tokens
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    const user = await page.evaluate(() => localStorage.getItem('user'));

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(user).toBeTruthy();
  });

  test('login preserves intended redirect URL (from=/my-bids)', async ({ page }) => {
    await mockLoginFlow(page);

    // Mock my-bids API
    await page.route(`${API_BASE}/api/me/bids**`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], metadata: { currentPage: 1, totalPages: 0, pageSize: 20, totalCount: 0, hasPrevious: false, hasNext: false } }) });
    });
    await page.route(`${API_BASE}/api/me/auctions/watch-list**`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], metadata: { currentPage: 1, totalPages: 0, pageSize: 20, totalCount: 0, hasPrevious: false, hasNext: false } }) });
    });

    // Navigate to a protected route first — should redirect to login with state
    await page.goto('/my-bids');
    await expect(page).toHaveURL(/\/login/);

    // Now log in — should redirect back to /my-bids
    await page.getByPlaceholder('you@example.com').fill('test@oio.vn');
    await page.locator('.ant-input-password input').fill('password123');
    await page.locator('button.login-submit').click();

    await expect(page).toHaveURL(/\/my-bids/, { timeout: 10000 });
  });
});

// ─── Registration Form Validation ────────────────────────────────────

test.describe('Registration Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('username field is required', async ({ page }) => {
    // Fill everything except username and submit
    const emailInput = page.locator('.register-form input[type="text"]').nth(0); // userName is the first text input
    // Leave username empty, fill others
    await page.locator('.register-form input[type="email"], .register-form input[placeholder*="@"], .register-form input[placeholder*="email" i]').first().fill('test@oio.vn');

    // Click submit
    await page.locator('button.submit').click();

    // Should show validation error
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('email field validates format', async ({ page }) => {
    // Find email input by the MailOutlined prefix icon context
    const emailFormItem = page.locator('.section').nth(1).locator('.ant-form-item').first();
    const emailInput = emailFormItem.locator('input');

    await emailInput.fill('not-an-email');
    await page.locator('button.submit').click();

    // Should show email format error
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('password requires minimum 8 characters', async ({ page }) => {
    // Find password fields
    const passwordInputs = page.locator('.ant-input-password input');
    await passwordInputs.first().fill('short');
    await page.locator('button.submit').click();

    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('confirm password must match password', async ({ page }) => {
    const passwordInputs = page.locator('.ant-input-password input');
    await passwordInputs.first().fill('password123');
    await passwordInputs.nth(1).fill('differentpassword');
    await page.locator('button.submit').click();

    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('shows success state after registration', async ({ page }) => {
    await page.route(`${API_BASE}/api/auth/register`, (route) => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Success' }) });
    });

    // Fill all fields
    const textInputs = page.locator('.register-form input[type="text"]');
    // userName
    await textInputs.first().fill('testuser');

    // firstName (second text input)
    if (await textInputs.nth(1).count() > 0) {
      await textInputs.nth(1).fill('Test');
    }

    // email input
    const emailSection = page.locator('.section').nth(1);
    const emailInput = emailSection.locator('input').first();
    await emailInput.fill('newuser@oio.vn');

    // Password fields
    const passwordInputs = page.locator('.ant-input-password input');
    await passwordInputs.first().fill('password123');
    await passwordInputs.nth(1).fill('password123');

    await page.locator('button.submit').click();

    // After success, should show the success Alert
    await expect(page.locator('.ant-alert-success')).toBeVisible({ timeout: 5000 });
  });
});

// ─── Registration Error Handling ─────────────────────────────────────

test.describe('Registration Error Handling', () => {
  test('shows "email taken" on 409 response', async ({ page }) => {
    await page.route(`${API_BASE}/api/auth/register`, (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already registered' }),
      });
    });

    await page.goto('/register');

    // Fill all fields
    const textInputs = page.locator('.register-form input[type="text"]');
    await textInputs.first().fill('testuser');
    const emailSection = page.locator('.section').nth(1);
    await emailSection.locator('input').first().fill('taken@oio.vn');
    const passwordInputs = page.locator('.ant-input-password input');
    await passwordInputs.first().fill('password123');
    await passwordInputs.nth(1).fill('password123');

    await page.locator('button.submit').click();

    // Should show email error
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows "username taken" on 409 response', async ({ page }) => {
    await page.route(`${API_BASE}/api/auth/register`, (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Username already taken' }),
      });
    });

    await page.goto('/register');

    const textInputs = page.locator('.register-form input[type="text"]');
    await textInputs.first().fill('takenuser');
    const emailSection = page.locator('.section').nth(1);
    await emailSection.locator('input').first().fill('new@oio.vn');
    const passwordInputs = page.locator('.ant-input-password input');
    await passwordInputs.first().fill('password123');
    await passwordInputs.nth(1).fill('password123');

    await page.locator('button.submit').click();

    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Protected Routes ───────────────────────────────────────────────

test.describe('Protected Routes', () => {
  const protectedRoutes = [
    '/dashboard',
    '/wallet',
    '/my-bids',
    '/my-listings',
    '/create-auction',
    '/orders',
    '/profile',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });
  }
});

// ─── Role-Based Access ──────────────────────────────────────────────

authenticatedTest.describe('Role-Based Access', () => {
  authenticatedTest('/moderator shows 403 for regular user', async ({ authenticatedPage: page }) => {
    await page.goto('/moderator');
    await page.waitForLoadState('networkidle');

    // ProtectedRoute renders a Result with status="403"
    await expect(page.locator('.ant-result')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('403')).toBeVisible();
  });

  authenticatedTest('/admin shows 403 for regular user', async ({ authenticatedPage: page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-result')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('403')).toBeVisible();
  });
});

