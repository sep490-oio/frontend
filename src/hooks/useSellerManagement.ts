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
  createAuctionFromItem,
  createAuctionAllInOne,
  setAuctionTiming,
  submitAuction,
  publishAuction,
} from '@/services/auctionService';
import type {
  CreateAuctionFromItemRequest,
  CreateAuctionAllInOneRequest,
  SetAuctionTimingRequest,
} from '@/types/auction';
import type { AuctionStatus } from '@/types/enums';

// ─── Queries ──────────────────────────────────────────────────────────

/** Fetch the current seller's items with pagination */
export function useMyItems(filters: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['myItems', filters],
    queryFn: () => getMyItems(filters),
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

/** All-in-one auction creation — creates item + auction in one call (POST /api/auctions) */
export function useCreateAuctionAllInOne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateAuctionAllInOneRequest) =>
      createAuctionAllInOne(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.invalidateQueries({ queryKey: ['myAuctions'] });
    },
  });
}

/** Create auction from an existing item — step 1 of 3-step flow */
export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, request }: { itemId: string; request: CreateAuctionFromItemRequest }) =>
      createAuctionFromItem(itemId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.invalidateQueries({ queryKey: ['myAuctions'] });
    },
  });
}

/** Set auction timing — step 2 of 3-step flow */
export function useSetAuctionTiming() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, timing }: { auctionId: string; timing: SetAuctionTimingRequest }) =>
      setAuctionTiming(auctionId, timing),
    onSuccess: () => {
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
