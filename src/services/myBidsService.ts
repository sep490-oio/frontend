/**
 * My Bids service — data fetching for the My Bids page.
 *
 * Calls real backend API:
 *   GET /api/me/bids              → getMyBids() — all user's bids (no status filter — BE bug)
 *   GET /api/me/auctions/watch-list → getMyWatchlist() — user's watched auctions
 *
 * NOTE: The BE status filter on /api/me/bids returns HTTP 500 (bug reported to Tân).
 * Workaround: fetch all bids without filter, split client-side in hooks.
 */

import { api } from './api';
import type { MyBidItem, AuctionListItem } from '@/types';
import type { BidStatus, AuctionStatus } from '@/types/enums';

// ─── BE Response Shapes ──────────────────────────────────────────

/** BE MoneyDto — wraps monetary values */
interface ApiMoneyDto {
  amount: number;
  currency: string;
  symbol: string;
}

/** Shape of GET /api/me/bids response items */
interface ApiMyBidDto {
  id: string;
  auctionId: string;
  itemTitle: string;
  amount: ApiMoneyDto;
  currentPrice: ApiMoneyDto;
  status: string;
  auctionStatus: string;
  isHighestBid: boolean;
  bidPlacedAt: string;
  auctionEndTime: string | null;
}

/** Shape of GET /api/me/auctions/watch-list response items */
interface ApiWatchlistDto {
  auctionId: string;
  itemTitle: string;
  primaryImageUrl?: string | null;
  currentPrice: number; // Plain number, NOT MoneyDto (BE inconsistency)
  currency: string;
  auctionStatus: string;
  bidCount: number;
  endTime: string;
  remainingTime: string;
  notifyOnBid: boolean;
  notifyOnEnd: boolean;
  watchedAt: string;
}

// ─── Adapters (BE shape → FE types) ─────────────────────────────

/**
 * Maps BE flat MyBidDto → FE nested MyBidItem.
 *
 * The FE components expect { auction, myLatestBid, myBidStatus } shape,
 * but BE returns a flat DTO. This adapter reconstructs the nested structure
 * with sensible defaults for fields the BE doesn't provide.
 */
function mapMyBid(dto: ApiMyBidDto): MyBidItem {
  return {
    auction: {
      id: dto.auctionId,
      status: dto.auctionStatus as AuctionStatus,
      itemTitle: dto.itemTitle,
      primaryImageUrl: null, // BE /api/me/bids doesn't return image URLs
      startingPrice: 0,     // Not available from this endpoint
      currentPrice: dto.currentPrice.amount,
      buyNowPrice: null,
      currency: dto.currentPrice.currency,
      startTime: '',         // Not available from this endpoint
      endTime: dto.auctionEndTime ?? '',
      bidCount: 0,           // Not available from this endpoint
      watchCount: 0,         // Not available from this endpoint
      isFeatured: false,
      isEndingSoon: false,
      sellerId: '',          // Not available from this endpoint
    },
    myLatestBid: {
      id: dto.id,
      auctionId: dto.auctionId,
      bidderId: '',          // Current user — not needed for display
      bidderName: null,
      amount: dto.amount.amount,
      isAutoBid: false,      // Not available from this endpoint
      autoBidId: null,
      status: dto.status as BidStatus,
      createdAt: dto.bidPlacedAt,
    },
    myBidStatus: dto.status as BidStatus,
  };
}

/**
 * Maps BE watchlist DTO → FE AuctionListItem.
 *
 * NOTE: BE returns currentPrice as a plain number (not MoneyDto) —
 * inconsistent with other endpoints. The adapter normalizes this.
 */
function mapWatchlistItem(dto: ApiWatchlistDto): AuctionListItem {
  return {
    id: dto.auctionId,
    status: dto.auctionStatus as AuctionStatus,
    itemTitle: dto.itemTitle,
    primaryImageUrl: dto.primaryImageUrl ?? null,
    startingPrice: 0,        // Not available from watchlist endpoint
    currentPrice: dto.currentPrice,
    buyNowPrice: null,
    currency: dto.currency,
    startTime: '',            // Not available from watchlist endpoint
    endTime: dto.endTime,
    bidCount: dto.bidCount,
    watchCount: 0,            // Not available from watchlist endpoint
    isFeatured: false,
    isEndingSoon: false,
    sellerId: '',             // Not available from watchlist endpoint
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Unwraps a paginated BE response, handling two inconsistencies:
 * 1. BE sometimes wraps in { data: { items, metadata }, message, success }
 * 2. BE sometimes returns auth errors as HTTP 200 with problem+json body
 *    (e.g., { type: "...", title: "Access token is revoked.", status: 401 })
 *
 * Throws on invalid responses so TanStack Query retries automatically.
 */
function unwrapPaginated<T>(data: unknown): { items: T[]; } {
  const obj = data as Record<string, unknown>;
  // Detect problem+json error disguised as 200 (BE auth bug)
  if (obj.type && obj.title && typeof obj.status === 'number') {
    throw new Error(`BE error: ${obj.title} (${obj.detail ?? obj.status})`);
  }
  // Handle wrapped { data: { items, metadata } } vs direct { items, metadata }
  const paginated = (obj.data && typeof obj.data === 'object' && 'items' in (obj.data as Record<string, unknown>))
    ? obj.data as { items: T[] }
    : obj as { items: T[] };
  return paginated;
}

// ─── API Functions ───────────────────────────────────────────────

/**
 * Deduplicates bids so we show ONE row per auction (the latest bid).
 *
 * BE returns every individual bid the user placed — a user who bid 38
 * times on one auction gets 38 rows. The My Bids page wants one row
 * per auction showing the most recent bid. We group by auctionId and
 * keep the one with the latest createdAt (= bidPlacedAt).
 *
 * Within the same auction, a "winning" bid always wins over "outbid"
 * regardless of timestamp, because the user cares about their current
 * standing, not their latest attempt.
 */
function deduplicateByAuction(bids: MyBidItem[]): MyBidItem[] {
  const map = new Map<string, MyBidItem>();
  for (const bid of bids) {
    const existing = map.get(bid.auction.id);
    if (!existing) {
      map.set(bid.auction.id, bid);
      continue;
    }
    // Prefer "winning" status over anything else
    const bidIsWinning = bid.myBidStatus === 'winning';
    const existingIsWinning = existing.myBidStatus === 'winning';
    if (bidIsWinning && !existingIsWinning) {
      map.set(bid.auction.id, bid);
    } else if (!bidIsWinning && existingIsWinning) {
      // Keep existing — it's the winning one
    } else {
      // Same status tier — keep the more recent bid
      const bidTime = new Date(bid.myLatestBid.createdAt).getTime();
      const existingTime = new Date(existing.myLatestBid.createdAt).getTime();
      if (bidTime > existingTime) {
        map.set(bid.auction.id, bid);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Fetches ALL of the current user's bids (no status filter).
 *
 * Why no status filter? The BE has a bug — GET /api/me/bids?status=X
 * returns HTTP 500 for any valid status value. We fetch all and
 * split client-side in the hooks layer.
 *
 * Uses pageSize=200 to fetch as many bids as possible in one call.
 * BE returns every individual bid (not one per auction), so a user
 * who bid 38 times on one auction generates 38 items. We deduplicate
 * client-side to show one row per auction with the latest bid.
 */
export async function getMyBids(): Promise<MyBidItem[]> {
  try {
    const { data } = await api.get('/api/me/bids', {
      params: { PageNumber: 1, PageSize: 200, SortBy: 'bidPlacedAt' },
    });
    const paginated = unwrapPaginated<ApiMyBidDto>(data);
    const allBids = (paginated.items ?? []).map(mapMyBid);
    return deduplicateByAuction(allBids);
  } catch {
    return [];
  }
}

/**
 * Fetches the current user's watched auctions.
 * Uses the dedicated GET /api/me/auctions/watch-list endpoint.
 */
export async function getMyWatchlist(): Promise<AuctionListItem[]> {
  const { data } = await api.get('/api/me/auctions/watch-list', {
    params: { PageNumber: 1, PageSize: 50 },
  });
  const paginated = unwrapPaginated<ApiWatchlistDto>(data);
  return (paginated.items ?? []).map(mapWatchlistItem);
}

// ─── Derived Filters (used by hooks) ────────────────────────────

/** Statuses that count as "active" participation */
const ACTIVE_STATUSES: string[] = ['active', 'winning', 'outbid'];

/** Statuses that count as "ended" participation */
const ENDED_STATUSES: string[] = ['won', 'cancelled'];

/** Splits bids into active participation */
export function filterActiveBids(bids: MyBidItem[]): MyBidItem[] {
  return bids.filter((b) => ACTIVE_STATUSES.includes(b.myBidStatus));
}

/** Splits bids into ended participation */
export function filterEndedBids(bids: MyBidItem[]): MyBidItem[] {
  return bids.filter((b) => ENDED_STATUSES.includes(b.myBidStatus));
}
