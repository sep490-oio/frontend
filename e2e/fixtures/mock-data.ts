/**
 * Centralized mock data for E2E tests.
 *
 * Provides reusable, realistic data constants matching the BE API response shapes.
 * The FE service layer maps these (MoneyDto → number, paginated wrapper → flat),
 * so mock data here uses the RAW BE shapes that Playwright route intercepts return.
 *
 * Naming convention:
 *   MOCK_<DOMAIN>_<VARIANT> — e.g., MOCK_WALLET_EMPTY, MOCK_AUCTION_ACTIVE
 */

// ─── Helpers ──────────────────────────────────────────────────────────

/** BE MoneyDto — wraps all monetary values with currency info */
export function money(amount: number, currency = 'VND') {
  return { amount, currency, symbol: '₫' };
}

/** BE paginated response wrapper */
export function paginated<T>(items: T[], page = 1, pageSize = 20) {
  return {
    items,
    metadata: {
      currentPage: page,
      totalPages: Math.ceil(items.length / pageSize) || 1,
      pageSize,
      totalCount: items.length,
      hasPrevious: page > 1,
      hasNext: items.length > pageSize,
    },
  };
}

// ─── Users ────────────────────────────────────────────────────────────

export const MOCK_BIDDER_USER = {
  id: 'e2e-bidder-001',
  email: 'bidder@oio.vn',
  fullName: 'Bidder Test',
  avatarUrl: null,
  roles: ['bidder'],
  isEmailVerified: true,
  hasSellerPermission: false,
  createdAt: '2026-01-15T00:00:00Z',
};

export const MOCK_SELLER_USER = {
  id: 'e2e-seller-001',
  email: 'seller@oio.vn',
  fullName: 'Seller Test',
  avatarUrl: null,
  roles: ['bidder', 'seller'],
  isEmailVerified: true,
  hasSellerPermission: true,
  createdAt: '2026-01-10T00:00:00Z',
};

export const MOCK_UNVERIFIED_USER = {
  id: 'e2e-unverified-001',
  email: 'unverified@oio.vn',
  fullName: 'Unverified User',
  avatarUrl: null,
  roles: ['bidder'],
  isEmailVerified: false,
  hasSellerPermission: false,
  createdAt: '2026-03-01T00:00:00Z',
};

// ─── Wallet ──────────────────────────────────────────────────────────

export const MOCK_WALLET = {
  id: 'wallet-001',
  userId: 'e2e-bidder-001',
  availableBalance: 50_000_000,
  lockedBalance: 5_000_000,
  heldBalance: 0,
  refundBalance: 2_000_000,
  currency: 'VND',
  isActive: true,
  createdAt: '2026-01-15T00:00:00Z',
  modifiedAt: '2026-03-16T12:00:00Z',
};

export const MOCK_WALLET_EMPTY = {
  id: 'wallet-002',
  userId: 'e2e-bidder-001',
  availableBalance: 0,
  lockedBalance: 0,
  heldBalance: 0,
  refundBalance: 0,
  currency: 'VND',
  isActive: true,
  createdAt: '2026-01-15T00:00:00Z',
  modifiedAt: '2026-03-16T12:00:00Z',
};

export const MOCK_WALLET_TRANSACTIONS = [
  {
    id: 'tx-001',
    walletId: 'wallet-001',
    transactionId: null,
    type: 'credit' as const,
    amount: 50_000_000,
    balanceBefore: 0,
    balanceAfter: 50_000_000,
    description: 'Add funds via VNPay',
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'tx-002',
    walletId: 'wallet-001',
    transactionId: null,
    type: 'hold' as const,
    amount: 5_000_000,
    balanceBefore: 50_000_000,
    balanceAfter: 45_000_000,
    description: 'Auction deposit — iPhone 15 Pro Max',
    createdAt: '2026-03-12T14:00:00Z',
  },
  {
    id: 'tx-003',
    walletId: 'wallet-001',
    transactionId: null,
    type: 'release' as const,
    amount: 2_000_000,
    balanceBefore: 45_000_000,
    balanceAfter: 47_000_000,
    description: 'Deposit refund — MacBook auction lost',
    createdAt: '2026-03-14T10:00:00Z',
  },
];

// ─── Dashboard ───────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS = {
  activeBidsCount: 3,
  wonCount: 1,
  watchingCount: 5,
};

export const MOCK_ACTIVE_BIDS = [
  {
    auction: {
      id: 'auction-dash-001',
      status: 'active',
      itemTitle: 'iPhone 15 Pro Max 256GB',
      primaryImageUrl: null,
      startingPrice: 10_000_000,
      currentPrice: 15_000_000,
      buyNowPrice: null,
      currency: 'VND',
      startTime: '2026-03-15T10:00:00Z',
      endTime: '2026-03-20T10:00:00Z',
      bidCount: 5,
      watchCount: 12,
      isFeatured: true,
      isEndingSoon: false,
      sellerId: 'seller-other',
    },
    myLatestBid: {
      id: 'bid-dash-001',
      auctionId: 'auction-dash-001',
      bidderId: 'e2e-bidder-001',
      bidderName: 'Bidder Test',
      amount: 15_000_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'winning',
      createdAt: '2026-03-16T14:00:00Z',
    },
    myBidStatus: 'winning',
  },
  {
    auction: {
      id: 'auction-dash-002',
      status: 'active',
      itemTitle: 'MacBook Pro M3 14"',
      primaryImageUrl: null,
      startingPrice: 25_000_000,
      currentPrice: 32_000_000,
      buyNowPrice: null,
      currency: 'VND',
      startTime: '2026-03-14T08:00:00Z',
      endTime: '2026-03-19T08:00:00Z',
      bidCount: 8,
      watchCount: 20,
      isFeatured: false,
      isEndingSoon: false,
      sellerId: 'seller-other',
    },
    myLatestBid: {
      id: 'bid-dash-002',
      auctionId: 'auction-dash-002',
      bidderId: 'e2e-bidder-001',
      bidderName: 'Bidder Test',
      amount: 30_000_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'outbid',
      createdAt: '2026-03-16T10:00:00Z',
    },
    myBidStatus: 'outbid',
  },
  {
    auction: {
      id: 'auction-dash-003',
      status: 'active',
      itemTitle: 'Samsung Galaxy Watch 6',
      primaryImageUrl: null,
      startingPrice: 3_000_000,
      currentPrice: 4_500_000,
      buyNowPrice: 8_000_000,
      currency: 'VND',
      startTime: '2026-03-15T12:00:00Z',
      endTime: '2026-03-22T12:00:00Z',
      bidCount: 3,
      watchCount: 5,
      isFeatured: false,
      isEndingSoon: false,
      sellerId: 'seller-other',
    },
    myLatestBid: {
      id: 'bid-dash-003',
      auctionId: 'auction-dash-003',
      bidderId: 'e2e-bidder-001',
      bidderName: 'Bidder Test',
      amount: 4_500_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'active',
      createdAt: '2026-03-16T08:00:00Z',
    },
    myBidStatus: 'active',
  },
];

export const MOCK_RECENTLY_ENDED = [
  {
    auction: {
      id: 'auction-ended-001',
      status: 'sold',
      itemTitle: 'Nike Air Jordan 1 Retro High',
      primaryImageUrl: null,
      startingPrice: 5_000_000,
      currentPrice: 12_000_000,
      buyNowPrice: null,
      currency: 'VND',
      startTime: '2026-03-01T10:00:00Z',
      endTime: '2026-03-10T10:00:00Z',
      bidCount: 15,
      watchCount: 30,
      isFeatured: false,
      isEndingSoon: false,
      sellerId: 'seller-other',
    },
    myLatestBid: {
      id: 'bid-ended-001',
      auctionId: 'auction-ended-001',
      bidderId: 'e2e-bidder-001',
      bidderName: 'Bidder Test',
      amount: 12_000_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'won',
      createdAt: '2026-03-10T09:55:00Z',
    },
    myBidStatus: 'won',
  },
  {
    auction: {
      id: 'auction-ended-002',
      status: 'sold',
      itemTitle: 'Sony WH-1000XM5 Headphones',
      primaryImageUrl: null,
      startingPrice: 3_000_000,
      currentPrice: 6_000_000,
      buyNowPrice: null,
      currency: 'VND',
      startTime: '2026-03-05T08:00:00Z',
      endTime: '2026-03-12T08:00:00Z',
      bidCount: 10,
      watchCount: 15,
      isFeatured: false,
      isEndingSoon: false,
      sellerId: 'seller-other',
    },
    myLatestBid: {
      id: 'bid-ended-002',
      auctionId: 'auction-ended-002',
      bidderId: 'e2e-bidder-001',
      bidderName: 'Bidder Test',
      amount: 5_500_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'outbid',
      createdAt: '2026-03-12T07:50:00Z',
    },
    myBidStatus: 'outbid',
  },
];

// ─── Items ───────────────────────────────────────────────────────────

export const MOCK_SELLER_ITEMS_MIXED = [
  {
    id: 'item-active-001',
    title: 'iPhone 15 Pro Max 256GB',
    condition: 'like_new',
    status: 'active',
    primaryImageUrl: null,
    categoryId: 'cat-1',
    quantity: 1,
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'item-active-002',
    title: 'Samsung Galaxy Watch 6',
    condition: 'new',
    status: 'active',
    primaryImageUrl: null,
    categoryId: 'cat-1',
    quantity: 1,
    createdAt: '2026-03-11T00:00:00Z',
  },
  {
    id: 'item-draft-001',
    title: 'Nike Air Jordan 1 (Draft)',
    condition: 'new',
    status: 'draft',
    primaryImageUrl: null,
    categoryId: 'cat-2',
    quantity: 1,
    createdAt: '2026-03-12T00:00:00Z',
  },
  {
    id: 'item-inauction-001',
    title: 'MacBook Pro M3 14" (In Auction)',
    condition: 'like_new',
    status: 'in_auction',
    primaryImageUrl: null,
    categoryId: 'cat-1',
    quantity: 1,
    createdAt: '2026-03-09T00:00:00Z',
  },
  {
    id: 'item-sold-001',
    title: 'Sony WH-1000XM5 (Sold)',
    condition: 'new',
    status: 'sold',
    primaryImageUrl: null,
    categoryId: 'cat-1',
    quantity: 1,
    createdAt: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_CATEGORIES = [
  { id: 'cat-1', parentId: null, name: 'Electronics', slug: 'electronics', description: null, iconUrl: null, isActive: true, sortOrder: 1, count: 10, children: [
    { id: 'cat-1-1', parentId: 'cat-1', name: 'Phones', slug: 'phones', description: null, iconUrl: null, isActive: true, sortOrder: 1, count: 5 },
    { id: 'cat-1-2', parentId: 'cat-1', name: 'Laptops', slug: 'laptops', description: null, iconUrl: null, isActive: true, sortOrder: 2, count: 3 },
  ]},
  { id: 'cat-2', parentId: null, name: 'Fashion', slug: 'fashion', description: null, iconUrl: null, isActive: true, sortOrder: 2, count: 5 },
];

// ─── Auctions in Different States ─────────────────────────────────────

/** Shared item detail for auction responses */
const SHARED_ITEM_DETAIL = {
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
};

const SHARED_RECENT_BIDS = [
  { id: 'bid-1', auctionId: 'auction-001', bidderId: 'bidder-001', bidderDisplayName: 'Nguyễn A', amount: money(15_000_000), isAutoBid: false, autoBidId: null, status: 'winning', createdAt: '2026-03-16T14:00:00Z' },
  { id: 'bid-2', auctionId: 'auction-001', bidderId: 'bidder-002', bidderDisplayName: 'Trần B', amount: money(14_000_000), isAutoBid: false, autoBidId: null, status: 'outbid', createdAt: '2026-03-16T12:00:00Z' },
  { id: 'bid-3', auctionId: 'auction-001', bidderId: 'bidder-003', bidderDisplayName: 'Lê C', amount: money(13_000_000), isAutoBid: true, autoBidId: 'ab-001', status: 'outbid', createdAt: '2026-03-16T10:00:00Z' },
];

export const MOCK_AUCTION_ACTIVE = {
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
  item: SHARED_ITEM_DETAIL,
  recentBids: SHARED_RECENT_BIDS,
  priceHistory: [],
};

export const MOCK_AUCTION_ACTIVE_NO_BIDS = {
  auction: {
    ...MOCK_AUCTION_ACTIVE.auction,
    id: 'auction-no-bids',
    currentPrice: money(10_000_000),
    bidCount: 0,
    watchCount: 2,
    viewCount: 10,
    minimumBidAmount: money(10_500_000),
    isReserveMet: false,
    currentWinnerId: null,
  },
  item: SHARED_ITEM_DETAIL,
  recentBids: [],
  priceHistory: [],
};

export const MOCK_AUCTION_ENDED_WON = {
  auction: {
    ...MOCK_AUCTION_ACTIVE.auction,
    id: 'auction-won',
    status: 'sold',
    currentWinnerId: 'e2e-test-user-001', // matches auth fixture default user
    currentPrice: money(20_000_000),
    endTime: '2026-03-16T10:00:00Z',
    actualEndTime: '2026-03-16T10:00:00Z',
    isEndingSoon: false,
    hasBuyNow: false,
    bidCount: 12,
  },
  item: SHARED_ITEM_DETAIL,
  recentBids: [
    { id: 'bid-w1', auctionId: 'auction-won', bidderId: 'e2e-test-user-001', bidderDisplayName: 'E2E Test User', amount: money(20_000_000), isAutoBid: false, autoBidId: null, status: 'won', createdAt: '2026-03-16T09:55:00Z' },
    ...SHARED_RECENT_BIDS.slice(1),
  ],
  priceHistory: [],
};

export const MOCK_AUCTION_ENDED_LOST = {
  auction: {
    ...MOCK_AUCTION_ACTIVE.auction,
    id: 'auction-lost',
    status: 'sold',
    currentWinnerId: 'bidder-001', // someone else won
    currentPrice: money(22_000_000),
    endTime: '2026-03-16T10:00:00Z',
    actualEndTime: '2026-03-16T10:00:00Z',
    isEndingSoon: false,
    hasBuyNow: false,
    bidCount: 15,
  },
  item: SHARED_ITEM_DETAIL,
  recentBids: SHARED_RECENT_BIDS,
  priceHistory: [],
};

export const MOCK_AUCTION_CANCELLED = {
  auction: {
    ...MOCK_AUCTION_ACTIVE.auction,
    id: 'auction-cancelled',
    status: 'cancelled',
    currentWinnerId: null,
    endTime: '2026-03-16T10:00:00Z',
    actualEndTime: '2026-03-16T08:00:00Z',
    hasBuyNow: false,
  },
  item: SHARED_ITEM_DETAIL,
  recentBids: [],
  priceHistory: [],
};

export const MOCK_AUCTION_FAILED = {
  auction: {
    ...MOCK_AUCTION_ACTIVE.auction,
    id: 'auction-failed',
    status: 'failed',
    currentWinnerId: null,
    bidCount: 0,
    endTime: '2026-03-16T10:00:00Z',
    actualEndTime: '2026-03-16T10:00:00Z',
    hasBuyNow: false,
    isReserveMet: false,
  },
  item: SHARED_ITEM_DETAIL,
  recentBids: [],
  priceHistory: [],
};

export const MOCK_AUCTION_SEALED = {
  auction: {
    ...MOCK_AUCTION_ACTIVE.auction,
    id: 'auction-sealed',
    auctionType: 'sealed',
    bidCount: 3,
    autoExtend: false,
    hasBuyNow: false,
    buyNowPrice: null,
  },
  item: SHARED_ITEM_DETAIL,
  recentBids: [], // sealed bids hidden during active
  priceHistory: [],
};

// ─── Auction List (Browse page) ──────────────────────────────────────

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
    sellerId: 'seller-001',
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
  {
    id: 'auction-003',
    itemTitle: 'Nike Air Jordan 1 Retro High',
    primaryImageUrl: null,
    currentPrice: money(8_000_000),
    startingPrice: money(5_000_000),
    buyNowPrice: null,
    currency: 'VND',
    status: 'active',
    bidCount: 10,
    watchCount: 25,
    startTime: '2026-03-13T10:00:00Z',
    endTime: '2026-03-18T10:00:00Z',
    remainingTime: '12h 30m',
    isEndingSoon: true,
    isFeatured: false,
    sellerId: 'seller-003',
  },
  {
    id: 'auction-004',
    itemTitle: 'Sony WH-1000XM5',
    primaryImageUrl: null,
    currentPrice: money(4_000_000),
    startingPrice: money(3_000_000),
    buyNowPrice: money(7_000_000),
    currency: 'VND',
    status: 'active',
    bidCount: 2,
    watchCount: 4,
    startTime: '2026-03-16T06:00:00Z',
    endTime: '2026-03-23T06:00:00Z',
    remainingTime: '6d 18h',
    isEndingSoon: false,
    isFeatured: false,
    sellerId: 'seller-004',
  },
  {
    id: 'auction-005',
    itemTitle: 'Rolex Submariner Date',
    primaryImageUrl: null,
    currentPrice: money(250_000_000),
    startingPrice: money(200_000_000),
    buyNowPrice: null,
    currency: 'VND',
    status: 'active',
    bidCount: 7,
    watchCount: 50,
    startTime: '2026-03-10T10:00:00Z',
    endTime: '2026-03-20T22:00:00Z',
    remainingTime: '3d 10h',
    isEndingSoon: false,
    isFeatured: true,
    sellerId: 'seller-005',
  },
];

// ─── My Bids ──────────────────────────────────────────────────────────

export const MOCK_MY_ACTIVE_BIDS = MOCK_ACTIVE_BIDS;

export const MOCK_MY_ENDED_BIDS = MOCK_RECENTLY_ENDED;

export const MOCK_MY_WATCHLIST = [
  {
    auctionId: 'auction-w-001',
    itemTitle: 'Vintage Polaroid Camera',
    primaryImageUrl: null,
    currentPrice: 2_000_000,
    currency: 'VND',
    auctionStatus: 'active',
    bidCount: 4,
    endTime: '2026-03-25T10:00:00Z',
    remainingTime: '8d 10h',
    notifyOnBid: true,
    notifyOnEnd: true,
    watchedAt: '2026-03-14T08:00:00Z',
  },
  {
    auctionId: 'auction-w-002',
    itemTitle: 'Dyson V15 Detect',
    primaryImageUrl: null,
    currentPrice: 10_000_000,
    currency: 'VND',
    auctionStatus: 'active',
    bidCount: 6,
    endTime: '2026-03-22T18:00:00Z',
    remainingTime: '5d 6h',
    notifyOnBid: false,
    notifyOnEnd: true,
    watchedAt: '2026-03-15T10:00:00Z',
  },
];

// ─── Orders ──────────────────────────────────────────────────────────

export const MOCK_ORDERS_ACTIVE = [
  {
    id: 'order-001',
    orderNumber: 'ORD-2026-001',
    auctionId: 'auction-ended-001',
    status: 'pending_payment',
    totalAmount: 12_600_000,
    currency: 'VND',
    itemTitle: 'Nike Air Jordan 1 Retro High',
    primaryImageUrl: null,
    sellerName: 'Seller A',
    paidAt: null,
    shippedAt: null,
    deliveredAt: null,
    createdAt: '2026-03-10T10:30:00Z',
  },
  {
    id: 'order-002',
    orderNumber: 'ORD-2026-002',
    auctionId: 'auction-ended-003',
    status: 'shipped',
    totalAmount: 35_000_000,
    currency: 'VND',
    itemTitle: 'MacBook Air M2',
    primaryImageUrl: null,
    sellerName: 'Seller B',
    paidAt: '2026-03-08T12:00:00Z',
    shippedAt: '2026-03-09T10:00:00Z',
    deliveredAt: null,
    createdAt: '2026-03-07T15:00:00Z',
  },
];

export const MOCK_ORDERS_COMPLETED = [
  {
    id: 'order-003',
    orderNumber: 'ORD-2026-003',
    auctionId: 'auction-ended-004',
    status: 'completed',
    totalAmount: 5_500_000,
    currency: 'VND',
    itemTitle: 'Sony WH-1000XM4',
    primaryImageUrl: null,
    sellerName: 'Seller C',
    paidAt: '2026-02-20T08:00:00Z',
    shippedAt: '2026-02-21T09:00:00Z',
    deliveredAt: '2026-02-24T14:00:00Z',
    createdAt: '2026-02-19T12:00:00Z',
  },
];

export const MOCK_ORDER_DETAIL = {
  id: 'order-001',
  orderNumber: 'ORD-2026-001',
  auctionId: 'auction-ended-001',
  buyerId: 'e2e-bidder-001',
  sellerId: 'seller-other',
  itemPrice: 12_000_000,
  shippingFee: 50_000,
  platformFee: 600_000,
  taxAmount: 0,
  totalAmount: 12_650_000,
  currency: 'VND',
  status: 'pending_payment',
  paidAt: null,
  shippedAt: null,
  deliveredAt: null,
  completedAt: null,
  cancelledAt: null,
  notes: null,
  item: {
    id: 'item-001',
    title: 'Nike Air Jordan 1 Retro High',
    condition: 'new',
    primaryImageUrl: null,
    verificationStatus: 'unverified',
    estimatedValue: null,
    categoryId: 'cat-2',
    categoryName: 'Fashion',
  },
  seller: {
    userId: 'seller-other',
    storeName: 'Premium Store',
    avatarUrl: null,
    ratingAverage: 4.8,
    ratingCount: 25,
    trustScore: 92,
    status: 'verified',
  },
  shippingAddress: null,
  billingAddress: null,
  escrow: null,
  tracking: {
    carrier: 'GHN',
    trackingNumber: 'GHN123456789',
    trackingUrl: 'https://ghn.vn/track/GHN123456789',
    estimatedDelivery: '2026-03-20T12:00:00Z',
    events: [
      { status: 'picked_up', description: 'Package picked up from seller', location: 'Ho Chi Minh City', timestamp: '2026-03-15T10:00:00Z' },
      { status: 'in_transit', description: 'Package in transit to sorting center', location: 'Binh Duong', timestamp: '2026-03-16T08:00:00Z' },
    ],
  },
  createdAt: '2026-03-10T10:30:00Z',
  modifiedAt: '2026-03-10T10:30:00Z',
};

// ─── User profile & related ──────────────────────────────────────────

export const MOCK_USER_PROFILE = {
  firstName: 'Test',
  lastName: 'User',
  displayName: 'E2E Test User',
  fullName: 'Test User',
  avatarUrl: null,
  dateOfBirth: '1995-06-15',
  gender: 'male',
};

export const MOCK_USER_ADDRESSES = [
  {
    id: 'addr-001',
    type: 'home',
    recipientName: 'Test User',
    street: '123 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    postalCode: '70000',
    phoneNumber: '0901234567',
    isDefault: true,
  },
  {
    id: 'addr-002',
    type: 'work',
    recipientName: 'Test User Office',
    street: '456 Lê Lợi',
    ward: 'Phường Bến Thành',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    postalCode: '70000',
    phoneNumber: '0907654321',
    isDefault: false,
  },
];

// ─── Sessions & Login History ─────────────────────────────────────────

/** Matches UserSessionDto shape from GET /api/me/sessions */
export const MOCK_USER_SESSIONS = [
  {
    sessionId: 'session-001',
    deviceId: 'device-001',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122',
    ipAddress: '192.168.x.x',
    isActive: true,
    isCurrentDevice: true,
    createdAt: '2026-03-10T08:00:00Z',
    lastRotatedAt: '2026-03-18T09:00:00Z',
    slidingExpiresAt: '2026-03-19T09:00:00Z',
    absoluteExpiresAt: '2026-03-25T08:00:00Z',
    isNearingAbsoluteExpiration: false,
    remainingAbsoluteTime: '7d',
  },
  {
    sessionId: 'session-002',
    deviceId: 'device-002',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604',
    ipAddress: '10.0.x.x',
    isActive: false,
    isCurrentDevice: false,
    createdAt: '2026-03-05T14:00:00Z',
    lastRotatedAt: '2026-03-15T10:00:00Z',
    slidingExpiresAt: '2026-03-16T10:00:00Z',
    absoluteExpiresAt: '2026-03-20T14:00:00Z',
    isNearingAbsoluteExpiration: true,
    remainingAbsoluteTime: '2d',
  },
];

/** Matches LoginHistoryDto shape from GET /api/me/login-history */
export const MOCK_LOGIN_HISTORY = [
  {
    id: 'lh-001',
    ipAddress: '192.168.x.x',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122',
    loginAt: '2026-03-18T09:00:00Z',
    status: 'success',
  },
  {
    id: 'lh-002',
    ipAddress: '10.0.x.x',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604',
    loginAt: '2026-03-17T22:00:00Z',
    status: 'failed',
  },
  {
    id: 'lh-003',
    ipAddress: '192.168.x.x',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122',
    loginAt: '2026-03-16T08:30:00Z',
    status: 'success',
  },
];

// ─── Auction list for My Auctions (seller) ────────────────────────────

export const MOCK_MY_AUCTIONS_LIST = [
  {
    id: 'my-auction-001',
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
    id: 'my-auction-002',
    itemTitle: 'Samsung Galaxy Watch 6',
    primaryImageUrl: null,
    currentPrice: money(3_000_000),
    startingPrice: money(3_000_000),
    buyNowPrice: null,
    currency: 'VND',
    status: 'draft',
    bidCount: 0,
    watchCount: 0,
    startTime: '2026-03-20T10:00:00Z',
    endTime: '2026-03-27T10:00:00Z',
    remainingTime: '—',
    isEndingSoon: false,
    isFeatured: false,
    sellerId: 'e2e-test-user-001',
  },
];
