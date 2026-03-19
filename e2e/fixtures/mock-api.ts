/**
 * API mock helpers — intercepts network requests to api.newlsun.com
 * and returns fake data so E2E tests don't depend on the real backend.
 *
 * Uses Playwright's page.route() for request interception.
 */
import type { Page } from '@playwright/test';

const API_BASE = 'https://api.newlsun.com';

// ─── Mock Data ─────────────────────────────────────────────────────

/** Paginated response wrapper matching BE's ApiPaginatedResponse */
function paginated<T>(items: T[]) {
  return {
    items,
    metadata: {
      currentPage: 1,
      totalPages: 1,
      pageSize: 20,
      totalCount: items.length,
      hasPrevious: false,
      hasNext: false,
    },
  };
}

/** Money DTO matching BE's MoneyDto */
function money(amount: number, currency = 'VND') {
  return { amount, currency, symbol: '₫' };
}

/** Mock auction list items for Browse page and My Auctions */
export const MOCK_AUCTION_LIST = [
  {
    id: 'auction-001',
    itemTitle: 'iPhone 15 Pro Max 256GB',
    primaryImageUrl: null,
    currentPrice: money(15_000_000),
    startingPrice: money(10_000_000),
    buyNowPrice: money(25_000_000),
    currency: 'VND',
    status: 'active',
    bidCount: 5,
    watchCount: 12,
    startTime: '2026-03-15T10:00:00Z',
    endTime: '2026-03-20T10:00:00Z',
    remainingTime: '3d 2h',
    isEndingSoon: false,
    isFeatured: true,
    sellerId: 'e2e-test-user-001',
  },
  {
    id: 'auction-002',
    itemTitle: 'MacBook Pro M3 14"',
    primaryImageUrl: null,
    currentPrice: money(30_000_000),
    startingPrice: money(25_000_000),
    buyNowPrice: null,
    currency: 'VND',
    status: 'active',
    bidCount: 3,
    watchCount: 8,
    startTime: '2026-03-14T08:00:00Z',
    endTime: '2026-03-19T08:00:00Z',
    remainingTime: '1d 22h',
    isEndingSoon: false,
    isFeatured: false,
    sellerId: 'seller-002',
  },
];

/** Mock categories */
export const MOCK_CATEGORIES = [
  { id: 'cat-1', parentId: null, name: 'Electronics', slug: 'electronics', description: null, iconUrl: null, isActive: true, sortOrder: 1, count: 10 },
  { id: 'cat-2', parentId: null, name: 'Fashion', slug: 'fashion', description: null, iconUrl: null, isActive: true, sortOrder: 2, count: 5 },
];

/** Mock seller items for Create Auction and My Listings */
export const MOCK_SELLER_ITEMS = [
  {
    id: 'item-001',
    title: 'iPhone 15 Pro Max 256GB',
    condition: 'like_new',
    status: 'active',
    primaryImageUrl: null,
    categoryId: 'cat-1',
    quantity: 1,
    createdAt: '2026-03-10T00:00:00Z',
    images: [],
  },
  {
    id: 'item-002',
    title: 'Samsung Galaxy Watch 6',
    condition: 'new',
    status: 'active',
    primaryImageUrl: null,
    categoryId: 'cat-1',
    quantity: 1,
    createdAt: '2026-03-11T00:00:00Z',
    images: [],
  },
  {
    id: 'item-003',
    title: 'Nike Air Jordan 1 (Draft)',
    condition: 'new',
    status: 'draft',
    primaryImageUrl: null,
    categoryId: 'cat-2',
    quantity: 1,
    createdAt: '2026-03-12T00:00:00Z',
    images: [],
  },
];

/** Mock auction detail for the Auction Detail page */
export const MOCK_AUCTION_DETAIL = {
  auction: {
    id: 'auction-001',
    itemId: 'item-001',
    sellerId: 'seller-other',
    startingPrice: money(10_000_000),
    reservePrice: money(12_000_000),
    buyNowPrice: money(25_000_000),
    currentPrice: money(15_000_000),
    bidIncrement: money(500_000),
    currency: 'VND',
    startTime: '2026-03-15T10:00:00Z',
    endTime: '2026-03-20T10:00:00Z',
    actualEndTime: null,
    status: 'active',
    currentWinnerId: null,
    autoExtend: true,
    extensionMinutes: 5,
    isFeatured: true,
    viewCount: 150,
    bidCount: 5,
    watchCount: 12,
    minimumBidAmount: money(15_500_000),
    isReserveMet: true,
    hasBuyNow: true,
    remainingTime: '3d 2h',
    isEndingSoon: false,
    createdAt: '2026-03-14T00:00:00Z',
  },
  item: {
    id: 'item-001',
    sellerId: 'seller-other',
    categoryId: 'cat-1',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'Brand new iPhone 15 Pro Max, sealed box.',
    condition: 'like_new',
    status: 'active',
    quantity: 1,
    images: [
      { id: 'img-1', url: 'https://placehold.co/400x400', publicId: 'img-1', resourceType: 'image', isPrimary: true, sortOrder: 0, fileName: 'iphone.jpg', bytes: 50000, format: 'jpg', width: 400, height: 400 },
    ],
    createdAt: '2026-03-10T00:00:00Z',
  },
  recentBids: [
    { id: 'bid-1', auctionId: 'auction-001', bidderId: 'bidder-001', bidderDisplayName: 'Nguyễn A', amount: money(15_000_000), isAutoBid: false, autoBidId: null, status: 'active', createdAt: '2026-03-16T14:00:00Z' },
    { id: 'bid-2', auctionId: 'auction-001', bidderId: 'bidder-002', bidderDisplayName: 'Trần B', amount: money(14_000_000), isAutoBid: false, autoBidId: null, status: 'active', createdAt: '2026-03-16T12:00:00Z' },
  ],
  priceHistory: [],
};

/** Mock auction detail with a winner (ended auction) */
export const MOCK_ENDED_AUCTION = {
  ...MOCK_AUCTION_DETAIL,
  auction: {
    ...MOCK_AUCTION_DETAIL.auction,
    id: 'auction-ended',
    status: 'sold',
    currentWinnerId: 'e2e-test-user-001', // Current user is winner
    currentPrice: money(20_000_000),
    endTime: '2026-03-16T10:00:00Z',
    actualEndTime: '2026-03-16T10:00:00Z',
    isEndingSoon: false,
    hasBuyNow: false,
  },
};

// ─── Route Setup ───────────────────────────────────────────────────

/**
 * Sets up API mocks for public pages (no auth needed).
 * Intercepts GET /api/auctions and GET /api/categories.
 */
export async function mockPublicAPIs(page: Page) {
  // Auctions list
  await page.route(`${API_BASE}/api/auctions?**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(paginated(MOCK_AUCTION_LIST)),
    });
  });

  // Auctions list (no query params)
  await page.route(`${API_BASE}/api/auctions`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated(MOCK_AUCTION_LIST)),
      });
    } else {
      route.continue();
    }
  });

  // Categories
  await page.route(`${API_BASE}/api/categories`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CATEGORIES),
    });
  });
}

/**
 * Sets up API mocks for seller pages (My Items, My Auctions, Create Auction).
 */
export async function mockSellerAPIs(page: Page) {
  await mockPublicAPIs(page);

  // My Items
  await page.route(`${API_BASE}/api/items/my`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SELLER_ITEMS),
    });
  });

  // My Auctions
  await page.route(`${API_BASE}/api/me/auctions**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(paginated(MOCK_AUCTION_LIST)),
    });
  });

  // Create Auction
  await page.route(`${API_BASE}/api/auctions`, (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'new-auction-001',
            status: 'draft',
            startTime: '2026-03-20T10:00:00Z',
            endTime: '2026-03-25T10:00:00Z',
          },
        }),
      });
    } else {
      route.continue();
    }
  });

  // Publish Auction
  await page.route(`${API_BASE}/api/auctions/*/publish`, (route) => {
    route.fulfill({ status: 204, body: '' });
  });
}

/**
 * Sets up API mocks for the Auction Detail page (bidding flow).
 */
export async function mockAuctionDetailAPIs(page: Page, options?: { ended?: boolean }) {
  await mockPublicAPIs(page);

  const detail = options?.ended ? MOCK_ENDED_AUCTION : MOCK_AUCTION_DETAIL;

  // Auction detail
  await page.route(`${API_BASE}/api/auctions/*`, (route) => {
    const url = route.request().url();

    // Skip sub-routes like /bids, /qualify, /publish
    if (url.match(/\/api\/auctions\/[^/]+\/(bids|qualify|publish|watch|buy-now|auto-bid)/)) {
      route.continue();
      return;
    }

    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      });
    } else {
      route.continue();
    }
  });

  // Bids list for auction
  await page.route(`${API_BASE}/api/auctions/*/bids`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(paginated(MOCK_AUCTION_DETAIL.recentBids)),
      });
    } else if (route.request().method() === 'POST') {
      // Place bid response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bid: {
            id: 'new-bid-001',
            auctionId: 'auction-001',
            bidderId: 'e2e-test-user-001',
            amount: { amount: 15_500_000, currency: 'VND', symbol: '₫' },
            isAutoBid: false,
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          newCurrentPrice: 15_500_000,
        }),
      });
    } else {
      route.continue();
    }
  });

  // Qualify for auction
  await page.route(`${API_BASE}/api/auctions/*/qualify`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        deposit: {
          id: 'deposit-001',
          auctionId: 'auction-001',
          userId: 'e2e-test-user-001',
          amount: 1_000_000,
          currency: 'VND',
          status: 'held',
          depositedAt: new Date().toISOString(),
        },
        newQualifiedCount: 3,
      }),
    });
  });
}
