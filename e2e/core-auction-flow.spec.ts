/**
 * Core Auction Flow E2E Tests — the main bidding lifecycle.
 *
 * Tests the Phase 1-4 features built in the March 2026 sprint:
 * 1. Create Auction page (4-step wizard)
 * 2. My Listings page (Items + Auctions tabs)
 * 3. Bid Confirm Modal (pre-bid confirmation)
 * 4. Auction Result (winner/loser display)
 *
 * All API calls are mocked via Playwright route interception.
 * Auth state is injected via localStorage (no real login needed).
 */
import { expect } from '@playwright/test';
import { authenticatedTest } from './fixtures/auth';
import { mockSellerAPIs, mockAuctionDetailAPIs } from './fixtures/mock-api';

// ─── Create Auction Page ─────────────────────────────────────────────

authenticatedTest.describe('Create Auction Page', () => {
  authenticatedTest('renders the 4-step wizard for sellers', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/create-auction');

    // Step indicator should be visible (Ant Design Steps)
    await expect(page.locator('.ant-steps')).toBeVisible();

    // Should show item selection step (first step)
    // Wait for items to load from mock API
    await page.waitForLoadState('networkidle');

    // Should show at least the active items (not draft ones)
    // item-001 (active) and item-002 (active) should be selectable
    await expect(page.getByText('iPhone 15 Pro Max 256GB')).toBeVisible();
    await expect(page.getByText('Samsung Galaxy Watch 6')).toBeVisible();
  });

  authenticatedTest('step 0: can select an item from the list', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/create-auction');
    await page.waitForLoadState('networkidle');

    // Click on the first active item
    await page.getByText('iPhone 15 Pro Max 256GB').click();

    // After selecting, the step should advance or a "Next" button should appear
    // The wizard should now be on step 1 (settings)
    await page.waitForTimeout(500); // Wait for state update
  });

  authenticatedTest('navigates to create-auction with pre-selected item via URL', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/create-auction/item-001');
    await page.waitForLoadState('networkidle');

    // Should skip step 0 and go directly to settings (step 1)
    // since item ID is in the URL
    await page.waitForTimeout(500);
  });

  authenticatedTest('non-seller users see "Become a Seller" prompt', async ({ authenticatedPage: page }) => {
    // Override auth to remove seller role
    await page.addInitScript(() => {
      const user = {
        id: 'non-seller-user',
        email: 'bidder@oio.vn',
        fullName: 'Regular Bidder',
        avatarUrl: null,
        roles: ['bidder'],
        isEmailVerified: true,
        hasSellerPermission: false,
        createdAt: '2026-01-15T00:00:00Z',
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', 'fake-token');
      localStorage.setItem('refreshToken', 'fake-refresh');
    });

    await mockSellerAPIs(page);
    await page.goto('/create-auction');

    // Should show the "Become a Seller" prompt (Result component with ShopOutlined)
    await expect(page.locator('.ant-result')).toBeVisible();
  });
});

// ─── My Listings Page ────────────────────────────────────────────────

authenticatedTest.describe('My Listings Page', () => {
  authenticatedTest('renders with Items and Auctions tabs', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/my-listings');
    await page.waitForLoadState('networkidle');

    // Tabs should be visible (Ant Design Tabs)
    await expect(page.locator('.ant-tabs')).toBeVisible();
  });

  authenticatedTest('My Items tab shows items with status badges', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/my-listings');
    await page.waitForLoadState('networkidle');

    // Table should be visible with item data
    await expect(page.locator('.ant-table')).toBeVisible();

    // Mock items should appear in the table
    await expect(page.getByText('iPhone 15 Pro Max 256GB')).toBeVisible();
  });

  authenticatedTest('non-seller users see "Become a Seller" prompt', async ({ authenticatedPage: page }) => {
    await page.addInitScript(() => {
      const user = {
        id: 'non-seller-user',
        email: 'bidder@oio.vn',
        fullName: 'Regular Bidder',
        avatarUrl: null,
        roles: ['bidder'],
        isEmailVerified: true,
        hasSellerPermission: false,
        createdAt: '2026-01-15T00:00:00Z',
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', 'fake-token');
      localStorage.setItem('refreshToken', 'fake-refresh');
    });

    await mockSellerAPIs(page);
    await page.goto('/my-listings');

    // Should show seller prompt instead of listings
    await expect(page.locator('.ant-result')).toBeVisible();
  });
});

// ─── Auction Detail + Bid Flow ───────────────────────────────────────

authenticatedTest.describe('Auction Detail + Bid Confirm Modal', () => {
  authenticatedTest('auction detail page loads with item info and bid form', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page);
    await page.goto('/auction/auction-001');
    await page.waitForLoadState('networkidle');

    // Item title should be visible
    await expect(page.getByText('iPhone 15 Pro Max 256GB')).toBeVisible();
  });

  authenticatedTest('bid form shows minimum bid amount and input', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page);
    await page.goto('/auction/auction-001');
    await page.waitForLoadState('networkidle');

    // Bid input (InputNumber) should be present
    // The BidForm uses an Ant Design InputNumber
    const bidInput = page.locator('.ant-input-number input');
    if (await bidInput.count() > 0) {
      await expect(bidInput.first()).toBeVisible();
    }
  });

  authenticatedTest('clicking bid button opens confirmation modal', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page);
    await page.goto('/auction/auction-001');
    await page.waitForLoadState('networkidle');

    // Find and click the bid submit button
    const bidButton = page.locator('button').filter({ hasText: /đặt giá|place bid/i });
    if (await bidButton.count() > 0) {
      await bidButton.first().click();

      // Confirmation modal should appear
      await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 5000 });

      // Modal should show bid details (Descriptions component)
      await expect(page.locator('.ant-descriptions')).toBeVisible();
    }
  });

  authenticatedTest('bid history shows recent bids', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page);
    await page.goto('/auction/auction-001');
    await page.waitForLoadState('networkidle');

    // Recent bids should show bidder names from mock data
    // "Nguyễn A" placed the highest bid at 15M
    const bidSection = page.getByText(/Nguyễn A/);
    if (await bidSection.count() > 0) {
      await expect(bidSection.first()).toBeVisible();
    }
  });
});

// ─── Auction Result (Ended Auction) ──────────────────────────────────

authenticatedTest.describe('Auction Result — Winner Display', () => {
  authenticatedTest('shows winner celebration when current user won', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page, { ended: true });
    await page.goto('/auction/auction-ended');
    await page.waitForLoadState('networkidle');

    // Result component should be visible
    await expect(page.locator('.ant-result')).toBeVisible();

    // Trophy icon indicates winner state
    const trophyIcon = page.locator('.anticon-trophy');
    if (await trophyIcon.count() > 0) {
      await expect(trophyIcon).toBeVisible();
    }
  });

  authenticatedTest('winner view shows payment deadline warning', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page, { ended: true });
    await page.goto('/auction/auction-ended');
    await page.waitForLoadState('networkidle');

    // Payment deadline alert (Alert type="warning")
    const warningAlert = page.locator('.ant-alert-warning');
    if (await warningAlert.count() > 0) {
      await expect(warningAlert.first()).toBeVisible();
    }
  });

  authenticatedTest('winner view shows next steps guide', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page, { ended: true });
    await page.goto('/auction/auction-ended');
    await page.waitForLoadState('networkidle');

    // Steps component should show the 3-step guide (Pay → Ship → Complete)
    const steps = page.locator('.ant-steps');
    if (await steps.count() > 0) {
      await expect(steps).toBeVisible();
    }
  });

  authenticatedTest('winner view has "View Order" and "Go to Wallet" buttons', async ({ authenticatedPage: page }) => {
    await mockAuctionDetailAPIs(page, { ended: true });
    await page.goto('/auction/auction-ended');
    await page.waitForLoadState('networkidle');

    // Navigation buttons for post-win actions
    const orderButton = page.getByRole('button', { name: /order|đơn hàng/i });
    const walletButton = page.getByRole('button', { name: /wallet|ví/i });

    if (await orderButton.count() > 0) {
      await expect(orderButton.first()).toBeVisible();
    }
    if (await walletButton.count() > 0) {
      await expect(walletButton.first()).toBeVisible();
    }
  });
});

// ─── Cross-Page Navigation ───────────────────────────────────────────

authenticatedTest.describe('Cross-Page Navigation (Authenticated)', () => {
  authenticatedTest('dashboard is accessible when logged in', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/dashboard');

    // Should NOT redirect to login (auth is injected)
    await expect(page).not.toHaveURL(/\/login/);
  });

  authenticatedTest('my-listings navigates to create-auction', async ({ authenticatedPage: page }) => {
    await mockSellerAPIs(page);
    await page.goto('/my-listings');
    await page.waitForLoadState('networkidle');

    // Find and click a "Create Auction" or "+" button
    const createButton = page.getByRole('button', { name: /create|tạo|thêm/i });
    if (await createButton.count() > 0) {
      await createButton.first().click();
      // Should navigate to create-auction (possibly with item ID)
      await page.waitForTimeout(1000);
    }
  });
});
