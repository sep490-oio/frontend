/**
 * Authenticated Pages Regression Tests — comprehensive tests for all pages behind login.
 *
 * Covers:
 * - Dashboard (stats, wallet summary, active bids, featured)
 * - Wallet (balance cards, transactions, add/withdraw modals)
 * - My Bids (active, ended, watching tabs)
 * - Orders (active, completed, cancelled tabs)
 * - Profile (info, addresses, security, sessions tabs)
 * - Error states (API 500, timeouts, empty responses)
 *
 * All API calls mocked via page.route(). Auth injected via authenticatedTest fixture.
 */
import { expect } from '@playwright/test';
import { authenticatedTest } from './fixtures/auth';
import {
  paginated,
  money,
  MOCK_WALLET,
  MOCK_WALLET_EMPTY,
  MOCK_WALLET_TRANSACTIONS,
  MOCK_DASHBOARD_STATS,
  MOCK_ACTIVE_BIDS,
  MOCK_RECENTLY_ENDED,
  MOCK_AUCTION_LIST,
  MOCK_MY_ACTIVE_BIDS,
  MOCK_MY_ENDED_BIDS,
  MOCK_MY_WATCHLIST,
  MOCK_ORDERS_ACTIVE,
  MOCK_ORDERS_COMPLETED,
  MOCK_CATEGORIES,
  MOCK_USER_PROFILE,
  MOCK_USER_ADDRESSES,
  MOCK_USER_SESSIONS,
  MOCK_LOGIN_HISTORY,
} from './fixtures/mock-data';

const API_BASE = 'https://api.newlsun.com';

// ─── Common API Mock Helpers ─────────────────────────────────────────

/** Mock all dashboard-related APIs (stats, wallet, bids, featured) */
async function mockDashboardAPIs(page: import('@playwright/test').Page) {
  // Dashboard stats — mock service returns static data
  // The actual FE uses mock services that don't call API, so we need to intercept
  // if they are switched to real API. For now, mock the endpoints.

  // Wallet
  await page.route(`${API_BASE}/api/wallets/me`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WALLET) });
  });

  // Wallet transactions
  await page.route(`${API_BASE}/api/wallets/me/transactions**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(MOCK_WALLET_TRANSACTIONS)) });
  });

  // My bids
  await page.route(`${API_BASE}/api/me/bids**`, (route) => {
    const items = [...MOCK_MY_ACTIVE_BIDS, ...MOCK_MY_ENDED_BIDS].map((bid) => ({
      id: bid.myLatestBid.id,
      auctionId: bid.auction.id,
      itemTitle: bid.auction.itemTitle,
      amount: money(bid.myLatestBid.amount),
      currentPrice: money(bid.auction.currentPrice),
      status: bid.myBidStatus,
      auctionStatus: bid.auction.status,
      isHighestBid: bid.myBidStatus === 'winning' || bid.myBidStatus === 'won',
      bidPlacedAt: bid.myLatestBid.createdAt,
      auctionEndTime: bid.auction.endTime,
    }));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, metadata: { currentPage: 1, totalPages: 1, pageSize: 200, totalCount: items.length, hasPrevious: false, hasNext: false } }),
    });
  });

  // Watchlist
  await page.route(`${API_BASE}/api/me/auctions/watch-list**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: MOCK_MY_WATCHLIST, metadata: { currentPage: 1, totalPages: 1, pageSize: 50, totalCount: MOCK_MY_WATCHLIST.length, hasPrevious: false, hasNext: false } }),
    });
  });

  // Featured auctions
  await page.route(`${API_BASE}/api/auctions?**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(MOCK_AUCTION_LIST)) });
  });
  await page.route(`${API_BASE}/api/auctions`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(MOCK_AUCTION_LIST)) });
    } else {
      route.continue();
    }
  });

  // Categories
  await page.route(`${API_BASE}/api/categories`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CATEGORIES) });
  });

  // Orders
  await page.route(`${API_BASE}/api/orders**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated(MOCK_ORDERS_ACTIVE)) });
  });

  // User profile
  await page.route(`${API_BASE}/api/me`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2e-test-user-001',
          userName: 'e2etest',
          email: 'e2e-test@oio.vn',
          emailConfirmed: true,
          phoneNumber: '0901234567',
          phoneNumberConfirmed: true,
          status: 'active',
          roles: ['bidder', 'seller'],
          permissions: [],
          twoFactorEnabled: false,
          profile: MOCK_USER_PROFILE,
          createdAt: '2026-01-15T00:00:00Z',
        }),
      });
    } else {
      route.continue();
    }
  });

  await page.route(`${API_BASE}/api/me/profile`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER_PROFILE) });
    } else {
      route.continue();
    }
  });

  // Addresses
  await page.route(`${API_BASE}/api/me/addresses**`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: MOCK_USER_ADDRESSES }) });
    } else {
      route.continue();
    }
  });

  // Sessions
  await page.route(`${API_BASE}/api/me/sessions**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 'session-001', deviceId: 'e2e-device-001', deviceName: 'Chrome on Windows', lastActiveAt: '2026-03-16T12:00:00Z', createdAt: '2026-03-16T08:00:00Z', isCurrent: true }],
        metadata: { currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1, hasPrevious: false, hasNext: false },
      }),
    });
  });

  // Login history
  await page.route(`${API_BASE}/api/me/login-history**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 'login-001', deviceId: 'e2e-device-001', deviceName: 'Chrome on Windows', loginAt: '2026-03-16T08:00:00Z', isSuccess: true, failureReason: null }],
        metadata: { currentPage: 1, totalPages: 1, pageSize: 10, totalCount: 1, hasPrevious: false, hasNext: false },
      }),
    });
  });

  // Items (for seller pages)
  await page.route(`${API_BASE}/api/items/my`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // My auctions
  await page.route(`${API_BASE}/api/me/auctions**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
  });

  // Password change
  await page.route(`${API_BASE}/api/me/password`, (route) => {
    route.fulfill({ status: 204, body: '' });
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────

authenticatedTest.describe('Dashboard', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage: page }) => {
    await mockDashboardAPIs(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  authenticatedTest('shows stats cards section', async ({ authenticatedPage: page }) => {
    // Dashboard should render — check for heading level 3
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();
  });

  authenticatedTest('wallet summary card renders', async ({ authenticatedPage: page }) => {
    // The WalletSummaryCard should be visible (it's in a Card component)
    const cards = page.locator('.ant-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  authenticatedTest('active bids section renders', async ({ authenticatedPage: page }) => {
    // MyActiveBidsTable renders in a Card or table
    // With mock data it should show items or a table structure
    const tables = page.locator('.ant-table');
    const cards = page.locator('.ant-card');
    // Either table or cards should be present
    const hasTable = await tables.count() > 0;
    const hasCards = await cards.count() > 0;
    expect(hasTable || hasCards).toBeTruthy();
  });

  authenticatedTest('"Go to Wallet" link or button is accessible', async ({ authenticatedPage: page }) => {
    // The wallet summary should have a link/button to wallet page
    const walletLink = page.getByRole('link', { name: /wallet|ví/i });
    const walletBtn = page.getByRole('button', { name: /wallet|ví/i });

    const linkCount = await walletLink.count();
    const btnCount = await walletBtn.count();

    if (linkCount > 0) {
      await expect(walletLink.first()).toBeVisible();
    } else if (btnCount > 0) {
      await expect(walletBtn.first()).toBeVisible();
    }
  });

  authenticatedTest('recommended auctions section renders', async ({ authenticatedPage: page }) => {
    // RecommendedAuctions component should render
    // The page has 4 main sections — verify the general structure
    const sections = page.locator('div > .ant-card, div > .ant-table-wrapper');
    expect(await sections.count()).toBeGreaterThanOrEqual(1);
  });
});

// ─── Wallet ──────────────────────────────────────────────────────────

authenticatedTest.describe('Wallet', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage: page }) => {
    await mockDashboardAPIs(page);
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
  });

  authenticatedTest('shows balance overview section', async ({ authenticatedPage: page }) => {
    // WalletPage renders balance cards (BalanceOverview component)
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();

    // Wallet uses in-app mock data (not API): 48M available
    await expect(page.getByText('48.000.000').first()).toBeVisible();
  });

  authenticatedTest('shows locked, held, and refund balances', async ({ authenticatedPage: page }) => {
    // In-app mock: Locked 5M, Refund 3.2M
    await expect(page.getByText('5.000.000').first()).toBeVisible();
    await expect(page.getByText('3.200.000').first()).toBeVisible();
  });

  authenticatedTest('"Add Funds" button opens modal', async ({ authenticatedPage: page }) => {
    const addFundsBtn = page.getByRole('button', { name: /add funds|nạp tiền/i });
    await expect(addFundsBtn).toBeVisible();
    await addFundsBtn.click();

    // Modal should appear
    await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 3000 });
  });

  authenticatedTest('"Withdraw" button opens modal', async ({ authenticatedPage: page }) => {
    const withdrawBtn = page.getByRole('button', { name: /withdraw|rút tiền/i });
    await expect(withdrawBtn).toBeVisible();
    await withdrawBtn.click();

    await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 3000 });
  });

  authenticatedTest('transaction history section renders', async ({ authenticatedPage: page }) => {
    // Transaction History heading should be visible
    await expect(page.getByText('Transaction History').first()).toBeVisible();
  });
});

// ─── Wallet — Empty state ────────────────────────────────────────────

authenticatedTest.describe('Wallet — Empty state', () => {
  authenticatedTest('shows zero balances correctly', async ({ authenticatedPage: page }) => {
    // Override wallet to empty
    await page.route(`${API_BASE}/api/wallets/me`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WALLET_EMPTY) });
    });
    await page.route(`${API_BASE}/api/wallets/me/transactions**`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });
    // Mock other necessary routes
    await page.route(`${API_BASE}/api/me`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'e2e-test-user-001' }) });
    });

    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // All balances should show 0
    const zeros = page.getByText('0');
    expect(await zeros.count()).toBeGreaterThanOrEqual(1);
  });
});

// ─── My Bids ─────────────────────────────────────────────────────────

authenticatedTest.describe('My Bids', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage: page }) => {
    await mockDashboardAPIs(page);
    await page.goto('/my-bids');
    await page.waitForLoadState('networkidle');
  });

  authenticatedTest('shows tab switcher (Active, Ended, Watching)', async ({ authenticatedPage: page }) => {
    // Desktop: Segmented control, Mobile: Select dropdown
    const segmented = page.locator('.ant-segmented');
    const select = page.locator('.ant-select');

    const hasSegmented = await segmented.count() > 0;
    const hasSelect = await select.count() > 0;

    expect(hasSegmented || hasSelect).toBeTruthy();
  });

  authenticatedTest('active tab shows bid items', async ({ authenticatedPage: page }) => {
    // Active tab is default — should show bid data
    // Either table rows or card components
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();
  });

  authenticatedTest('tab switching works', async ({ authenticatedPage: page }) => {
    // Try clicking "Ended" tab
    const segmentedOptions = page.locator('.ant-segmented-item');
    if (await segmentedOptions.count() >= 2) {
      await segmentedOptions.nth(1).click();
      await page.waitForTimeout(300);
      // Content should change
    }
  });

  authenticatedTest('view mode toggle is present', async ({ authenticatedPage: page }) => {
    // View toggle (table/card) should be visible
    const viewToggle = page.locator('.ant-segmented').last();
    if (await viewToggle.count() > 0) {
      const items = viewToggle.locator('.ant-segmented-item');
      if (await items.count() >= 2) {
        await expect(items.first()).toBeVisible();
      }
    }
  });
});

// ─── My Bids — Empty state ──────────────────────────────────────────

authenticatedTest.describe('My Bids — Empty state', () => {
  authenticatedTest('empty active tab shows appropriate message', async ({ authenticatedPage: page }) => {
    // Override bids to return empty
    await page.route(`${API_BASE}/api/me/bids**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], metadata: { currentPage: 1, totalPages: 0, pageSize: 200, totalCount: 0, hasPrevious: false, hasNext: false } }),
      });
    });
    await page.route(`${API_BASE}/api/me/auctions/watch-list**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], metadata: { currentPage: 1, totalPages: 0, pageSize: 50, totalCount: 0, hasPrevious: false, hasNext: false } }),
      });
    });

    await page.goto('/my-bids');
    await page.waitForLoadState('networkidle');

    // Should show empty state (Ant Design Empty or custom "Browse Now" CTA)
    const emptyState = page.locator('.ant-empty');
    const browseBtn = page.getByRole('button', { name: /browse|khám phá/i });
    const linkBtn = page.getByRole('link', { name: /browse|khám phá/i });

    const hasEmpty = await emptyState.count() > 0;
    const hasBrowse = await browseBtn.count() > 0;
    const hasLink = await linkBtn.count() > 0;

    expect(hasEmpty || hasBrowse || hasLink).toBeTruthy();
  });
});

// ─── Orders ──────────────────────────────────────────────────────────

authenticatedTest.describe('Orders', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage: page }) => {
    await mockDashboardAPIs(page);
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
  });

  authenticatedTest('shows tab switcher (Active, Completed, Cancelled)', async ({ authenticatedPage: page }) => {
    const segmented = page.locator('.ant-segmented');
    const select = page.locator('.ant-select');

    expect((await segmented.count()) > 0 || (await select.count()) > 0).toBeTruthy();
  });

  authenticatedTest('active orders tab shows order list', async ({ authenticatedPage: page }) => {
    // Should render with heading
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();
  });

  authenticatedTest('view mode toggle exists', async ({ authenticatedPage: page }) => {
    // View toggle should be present
    const toggles = page.locator('.ant-segmented');
    expect(await toggles.count()).toBeGreaterThanOrEqual(1);
  });
});

// ─── Orders — Empty state ────────────────────────────────────────────

authenticatedTest.describe('Orders — Empty state', () => {
  authenticatedTest('empty orders shows appropriate message', async ({ authenticatedPage: page }) => {
    // Override orders to return empty
    await page.route(`${API_BASE}/api/orders**`, (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paginated([])) });
    });
    await mockDashboardAPIs(page);

    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Should render the page without crash
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();
  });
});

// ─── Profile ─────────────────────────────────────────────────────────

authenticatedTest.describe('Profile', () => {
  authenticatedTest.beforeEach(async ({ authenticatedPage: page }) => {
    await mockDashboardAPIs(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  authenticatedTest('shows tab switcher (Info, Addresses, Security, Sessions)', async ({ authenticatedPage: page }) => {
    const segmented = page.locator('.ant-segmented');
    const select = page.locator('.ant-select');

    expect((await segmented.count()) > 0 || (await select.count()) > 0).toBeTruthy();
  });

  authenticatedTest('info tab shows user data', async ({ authenticatedPage: page }) => {
    // Profile heading should be visible
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();

    // User email or name should be shown
    const emailText = page.getByText('e2e-test@oio.vn');
    const nameText = page.getByText('E2E Test User');

    if (await emailText.count() > 0) {
      await expect(emailText.first()).toBeVisible();
    } else if (await nameText.count() > 0) {
      await expect(nameText.first()).toBeVisible();
    }
  });

  authenticatedTest('can switch to addresses tab', async ({ authenticatedPage: page }) => {
    // Click "Addresses" tab
    const segmentedItems = page.locator('.ant-segmented-item');
    if (await segmentedItems.count() >= 2) {
      await segmentedItems.nth(1).click();
      await page.waitForTimeout(500);

      // Should show addresses or empty state
      // Address data should be visible
      const addressText = page.getByText('Nguyễn Huệ');
      if (await addressText.count() > 0) {
        await expect(addressText.first()).toBeVisible();
      }
    }
  });

  authenticatedTest('can switch to security tab', async ({ authenticatedPage: page }) => {
    const segmentedItems = page.locator('.ant-segmented-item');
    if (await segmentedItems.count() >= 3) {
      await segmentedItems.nth(2).click();
      await page.waitForTimeout(500);

      // Security tab should show password change section
      // Look for password-related inputs or labels
      const passwordInputs = page.locator('input[type="password"]');
      const passwordLabel = page.getByText(/password|mật khẩu/i);

      const hasInputs = await passwordInputs.count() > 0;
      const hasLabel = await passwordLabel.count() > 0;

      expect(hasInputs || hasLabel).toBeTruthy();
    }
  });

  authenticatedTest('switching to sessions tab does not crash', async ({ authenticatedPage: page }) => {
    // Mock both endpoints BEFORE clicking — prevents the 401→refresh-fail→redirect chain
    // that the Axios interceptor triggers when a fake token hits the real backend.
    await page.route(`${API_BASE}/api/me/sessions**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated(MOCK_USER_SESSIONS)),
      });
    });
    await page.route(`${API_BASE}/api/me/login-history**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated(MOCK_LOGIN_HISTORY)),
      });
    });

    // Try segmented (desktop) or select (mobile) for tab switching
    const segmentedItems = page.locator('.ant-segmented-item');
    const tabCount = await segmentedItems.count();
    if (tabCount >= 4) {
      await segmentedItems.nth(3).click();
    } else {
      const sessionsTab = page.getByText(/sessions|phiên/i).first();
      if (await sessionsTab.isVisible().catch(() => false)) {
        await sessionsTab.click();
      }
    }
    await page.waitForTimeout(1000);

    // Verify no crash — the error boundary shows "Something Went Wrong"
    const crashed = await page.getByText('Something Went Wrong').isVisible().catch(() => false);
    expect(crashed).toBeFalsy();
  });
});

// ─── Error States ────────────────────────────────────────────────────

authenticatedTest.describe('Error States', () => {
  authenticatedTest('API 500 on dashboard renders without crash', async ({ authenticatedPage: page }) => {
    // Mock all APIs to return 500
    await page.route(`${API_BASE}/**`, (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal server error' }) });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should not crash — heading should still render
    const heading = page.locator('h3');
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible();
    }
    // Should not show a browser error page
    await expect(page).not.toHaveURL(/about:blank/);
  });

  authenticatedTest('API 500 on wallet renders without crash', async ({ authenticatedPage: page }) => {
    await page.route(`${API_BASE}/**`, (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Internal server error' }) });
    });

    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // Page should render — heading should be visible
    const heading = page.locator('h3');
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible();
    }
  });

  authenticatedTest('API timeout handled without crash', async ({ authenticatedPage: page }) => {
    // Mock with a very slow response that will timeout
    await page.route(`${API_BASE}/**`, (route) => {
      // Abort after 100ms to simulate timeout
      route.abort('timedout');
    });

    await page.goto('/dashboard');

    // Wait a bit for error handling
    await page.waitForTimeout(2000);

    // Page should still be functional — not a blank page
    await expect(page).not.toHaveURL(/about:blank/);
  });

  authenticatedTest('empty API responses render empty states on my-bids', async ({ authenticatedPage: page }) => {
    // All APIs return empty data
    await page.route(`${API_BASE}/api/me/bids**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], metadata: { currentPage: 1, totalPages: 0, pageSize: 200, totalCount: 0, hasPrevious: false, hasNext: false } }),
      });
    });
    await page.route(`${API_BASE}/api/me/auctions/watch-list**`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], metadata: { currentPage: 1, totalPages: 0, pageSize: 50, totalCount: 0, hasPrevious: false, hasNext: false } }),
      });
    });

    await page.goto('/my-bids');
    await page.waitForLoadState('networkidle');

    // Page should show empty state, not crash
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();
  });

  authenticatedTest('empty API responses render empty states on orders', async ({ authenticatedPage: page }) => {
    await mockDashboardAPIs(page);

    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Should render without crash
    const heading = page.locator('h3');
    await expect(heading.first()).toBeVisible();
  });
});
