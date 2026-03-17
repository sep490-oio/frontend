/**
 * Auth fixture — injects fake auth state into localStorage so Playwright
 * can access protected routes without going through the real login flow.
 *
 * The app's authSlice reads from localStorage on init:
 *   - accessToken → used for API Authorization header
 *   - refreshToken → used for token refresh
 *   - user → JSON stringified User object (hydrates Redux state)
 *
 * ProtectedRoute checks `state.auth.user` — if present, access is granted.
 */
import { test as base, type Page } from '@playwright/test';

/** Fake user matching the frontend User interface */
export const MOCK_USER = {
  id: 'e2e-test-user-001',
  email: 'e2e-test@oio.vn',
  fullName: 'E2E Test User',
  avatarUrl: null,
  roles: ['bidder', 'seller'],
  isEmailVerified: true,
  hasSellerPermission: true,
  createdAt: '2026-01-15T00:00:00Z',
};

/** Fake JWT — not a real token, just needs to exist so Axios sends the header */
export const MOCK_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdGVzdC11c2VyLTAwMSIsInJvbGVzIjpbImJpZGRlciIsInNlbGxlciJdLCJwZXJtaXNzaW9uIjpbIlBlcm1pc3Npb25zLkF1Y3Rpb25zLkNyZWF0ZSJdLCJleHAiOjk5OTk5OTk5OTl9.fake-signature';
export const MOCK_REFRESH_TOKEN = 'fake-refresh-token-for-e2e';

/**
 * Injects auth state into localStorage before navigating.
 * Call this before `page.goto()` on any protected route.
 */
export async function injectAuthState(page: Page) {
  await page.addInitScript(({ user, accessToken, refreshToken }) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('deviceId', 'e2e-device-001');
  }, {
    user: MOCK_USER,
    accessToken: MOCK_ACCESS_TOKEN,
    refreshToken: MOCK_REFRESH_TOKEN,
  });
}

/**
 * Extended test fixture that auto-injects auth state.
 * Use `authenticatedTest` instead of `test` for protected route tests.
 */
// eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture, not a React hook
export const authenticatedTest = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await injectAuthState(page);
    await use(page);
  },
});
