/**
 * TanStack Query hooks for auctions and categories.
 *
 * These are the first React Query hooks in the project — they establish
 * the pattern that all future hooks will follow:
 *
 *   1. Wrap a service function with useQuery / useMutation
 *   2. Use a descriptive queryKey array (enables smart cache invalidation)
 *   3. Export a named function (not default export)
 *
 * When the backend API is ready, only the service functions change —
 * these hooks and all UI components stay the same.
 */

import { useQuery } from '@tanstack/react-query';
import type { AuctionFilters } from '@/types';
import {
  getAuctions,
  getAuctionById,
  getAuctionBids,
  getCategories,
} from '@/services/auctionService';

// ─── Auction List (Browse page) ─────────────────────────────────

/**
 * Fetches a paginated, filterable list of auctions.
 *
 * The queryKey includes the full filters object so TanStack Query
 * automatically refetches when any filter value changes (search text,
 * selected category, page number, etc.).
 */
export function useAuctions(filters: AuctionFilters = {}) {
  return useQuery({
    queryKey: ['auctions', filters],
    queryFn: () => getAuctions(filters),
  });
}

// ─── Single Auction (Detail page) ───────────────────────────────

/**
 * Fetches a single auction by ID.
 * Disabled when no ID is provided (e.g., before route params resolve).
 */
export function useAuction(id: string | undefined) {
  return useQuery({
    queryKey: ['auction', id],
    queryFn: () => getAuctionById(id!),
    enabled: !!id,
    // Poll every 10s as fallback — SignalR should push updates faster,
    // but polling catches cases where the hub connection drops or misses events
    refetchInterval: 10_000,
  });
}

// ─── Bid History (Detail page) ───────────────────────────────────

/**
 * Fetches bid history for a specific auction.
 * Separate from useAuction so bids can be refreshed independently
 * (e.g., polling for new bids on active auctions in Layer 2).
 */
export function useAuctionBids(auctionId: string | undefined) {
  return useQuery({
    queryKey: ['auctionBids', auctionId],
    queryFn: () => getAuctionBids(auctionId!),
    enabled: !!auctionId,
  });
}

// ─── Categories (filter dropdown) ───────────────────────────────

/**
 * Fetches the category tree for the filter dropdown.
 * Categories rarely change, so we use a longer staleTime.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
  });
}
