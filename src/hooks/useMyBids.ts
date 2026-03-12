/**
 * TanStack Query hooks for the My Bids page.
 *
 * Architecture: One shared query fetches ALL bids from the BE, then
 * two derived hooks split them into active vs ended client-side.
 * This is a workaround for the BE status filter bug (returns 500).
 *
 * Watchlist uses a separate query since it's a different endpoint.
 *
 * Active bids poll every 30s to keep bid status fresh.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getMyBids,
  getMyWatchlist,
  filterActiveBids,
  filterEndedBids,
} from '@/services/myBidsService';

// ─── Shared base query (fetches all bids once) ─────────────────

/**
 * Internal hook — fetches ALL of the user's bids.
 * Active bids poll every 30s so the user sees status changes
 * (winning → outbid) without manually refreshing.
 */
function useAllMyBids() {
  return useQuery({
    queryKey: ['myBids', 'all'],
    queryFn: getMyBids,
    // Poll every 30s — active bid statuses change frequently
    refetchInterval: 30_000,
  });
}

// ─── Derived hooks (split from shared query) ───────────────────

/**
 * Active bids — auctions where user has an active/winning/outbid status.
 * Derived from the shared base query via client-side filtering.
 */
export function useMyActiveBidsFull() {
  const query = useAllMyBids();
  return {
    ...query,
    data: query.data ? filterActiveBids(query.data) : undefined,
  };
}

/**
 * Ended bids — auctions where user won or was cancelled.
 * Derived from the shared base query via client-side filtering.
 */
export function useMyEndedBids() {
  const query = useAllMyBids();
  return {
    ...query,
    data: query.data ? filterEndedBids(query.data) : undefined,
  };
}

/**
 * Watched auctions — separate endpoint, separate query.
 * No polling needed — watchlist doesn't change as rapidly as bids.
 */
export function useMyWatchedAuctions() {
  return useQuery({
    queryKey: ['myBids', 'watching'],
    queryFn: getMyWatchlist,
    // Poll every 30s to keep watchlist fresh across browser tabs.
    // TanStack Query cache is per-tab, so watch/unwatch actions in
    // another tab won't update this one without polling or focus refetch.
    refetchInterval: 30_000,
  });
}

/**
 * Checks if a specific auction is in the user's watchlist.
 *
 * BE doesn't return `isWatching` in GET /api/auctions/{id}, so we
 * cross-reference with the cached watchlist data. This lets the
 * WatchButton show the correct filled/unfilled heart on page load.
 */
export function useIsWatching(auctionId: string | undefined): boolean {
  const { data: watchlist } = useMyWatchedAuctions();
  if (!auctionId || !watchlist) return false;
  return watchlist.some((item) => item.id === auctionId);
}
