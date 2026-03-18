/**
 * Seller management hooks — TanStack Query wrappers for seller's own
 * item and auction management.
 *
 * Used by CreateAuctionPage and MyListingsPage.
 * Separate from useSeller.ts which handles PUBLIC seller profiles.
 *
 * Cache keys:
 *   ['myItems']               — seller's items (for item selector)
 *   ['myAuctions', filters]   — seller's auctions (for My Listings)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyItems,
  getMyAuctions,
  createAuction,
  submitAuction,
  publishAuction,
} from '@/services/auctionService';
import type { CreateAuctionRequest } from '@/types';
import type { AuctionStatus } from '@/types/enums';

// ─── Queries ──────────────────────────────────────────────────────────

/** Fetch the current seller's items (for item selector in Create Auction) */
export function useMyItems() {
  return useQuery({
    queryKey: ['myItems'],
    queryFn: getMyItems,
    staleTime: 30_000, // 30s — items don't change often
  });
}

/** Fetch the current seller's auctions (for My Listings page) */
export function useMyAuctions(filters: {
  status?: AuctionStatus;
  page?: number;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: ['myAuctions', filters],
    queryFn: () => getMyAuctions(filters),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────

/** Create a new auction for an active item */
export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAuctionRequest) => createAuction(request),
    onSuccess: () => {
      // Item status changes to in_auction, auction list updates
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.invalidateQueries({ queryKey: ['myAuctions'] });
    },
  });
}

/** Submit a draft auction for admin review (Draft → PendingReview) */
export function useSubmitAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => submitAuction(auctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAuctions'] });
    },
  });
}

/** Publish an approved auction — admin action, not for sellers */
export function usePublishAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => publishAuction(auctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAuctions'] });
    },
  });
}
