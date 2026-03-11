/**
 * Mock dashboard data — simulates dashboard API responses.
 *
 * TEMPORARY: Will be replaced by dedicated dashboard endpoints.
 * Derives data from existing mock auctions, bids, and wallet.
 *
 * The "current user" is user-00000100-mock (matches MOCK_WALLET.userId).
 * We simulate that this user:
 * - Is actively bidding on auctions #1, #3, #4
 * - Won auction #8 (PS5), lost auction #9 (Giant bike)
 * - Is watching auctions #2, #6, #12
 */

import type { MyBidItem, BidderDashboardStats } from '@/types';
import type { AuctionListItem } from '@/types';
import { MOCK_AUCTION_LIST } from './auctions';
import { mockId, mockDate } from './helpers';

// The "current user" — matches MOCK_WALLET.userId
const CURRENT_USER_ID = mockId('user', 100);

// ─── Active Bids (auctions the user is currently bidding on) ─────

export const MOCK_MY_ACTIVE_BIDS: MyBidItem[] = [
  {
    auction: MOCK_AUCTION_LIST[0], // iPhone 15 Pro Max — active
    myLatestBid: {
      id: mockId('bid', 100),
      auctionId: mockId('auction', 1),
      bidderId: CURRENT_USER_ID,
      bidderName: 'Bạn',
      amount: 24_500_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'winning',
      createdAt: mockDate(-1),
    },
    myBidStatus: 'winning',
  },
  {
    auction: MOCK_AUCTION_LIST[2], // MacBook Air M2 — active
    myLatestBid: {
      id: mockId('bid', 101),
      auctionId: mockId('auction', 3),
      bidderId: CURRENT_USER_ID,
      bidderName: 'Bạn',
      amount: 20_500_000,
      isAutoBid: true,
      autoBidId: mockId('autobid', 3),
      status: 'outbid',
      createdAt: mockDate(-2),
    },
    myBidStatus: 'outbid',
  },
  {
    auction: MOCK_AUCTION_LIST[3], // Pokemon Cards — active (ending soon)
    myLatestBid: {
      id: mockId('bid', 102),
      auctionId: mockId('auction', 4),
      bidderId: CURRENT_USER_ID,
      bidderName: 'Bạn',
      amount: 4_000_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'outbid',
      createdAt: mockDate(-5),
    },
    myBidStatus: 'outbid',
  },
];

// ─── Recently Ended (auctions user participated in that finished) ─

export const MOCK_RECENTLY_ENDED: MyBidItem[] = [
  {
    auction: MOCK_AUCTION_LIST[7], // PS5 Slim — sold (user won)
    myLatestBid: {
      id: mockId('bid', 110),
      auctionId: mockId('auction', 8),
      bidderId: CURRENT_USER_ID,
      bidderName: 'Bạn',
      amount: 12_800_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'won',
      createdAt: mockDate(-50),
    },
    myBidStatus: 'won',
  },
  {
    auction: MOCK_AUCTION_LIST[8], // Giant bike — sold (user lost)
    myLatestBid: {
      id: mockId('bid', 111),
      auctionId: mockId('auction', 9),
      bidderId: CURRENT_USER_ID,
      bidderName: 'Bạn',
      amount: 7_000_000,
      isAutoBid: false,
      autoBidId: null,
      status: 'outbid',
      createdAt: mockDate(-80),
    },
    myBidStatus: 'outbid',
  },
];

// ─── Watching ─────────────────────────────────────────────────────

export const MOCK_WATCHED_AUCTION_IDS: string[] = [
  mockId('auction', 2),  // Jordan 1
  mockId('auction', 6),  // Canon R6
  mockId('auction', 12), // G-Shock
];

// ─── Pre-computed stats ───────────────────────────────────────────

export const MOCK_DASHBOARD_STATS: BidderDashboardStats = {
  activeBidsCount: MOCK_MY_ACTIVE_BIDS.length,
  wonCount: MOCK_RECENTLY_ENDED.filter((b) => b.myBidStatus === 'won').length,
  watchingCount: MOCK_WATCHED_AUCTION_IDS.length,
};

// ─── Featured auctions for the "Recommended" section ──────────────

export const MOCK_FEATURED_FOR_DASHBOARD: AuctionListItem[] =
  MOCK_AUCTION_LIST.filter(
    (a) =>
      a.status === 'active' && a.isFeatured,
  ).slice(0, 4);
