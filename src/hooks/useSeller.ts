/**
 * Seller hooks — TanStack Query wrappers for seller profile data.
 *
 * Three parallel queries for the Seller Profile page:
 * - useSellerProfile: seller info + rating summary
 * - useSellerAuctions: seller's auction listings
 * - useSellerReviews: buyer reviews about this seller
 *
 * All queries are disabled when userId is undefined (before route
 * params are available), following the same pattern as useAuction.
 */

import { useQuery } from '@tanstack/react-query';
import { getSellerProfile, getSellerAuctions, getSellerReviews } from '@/services/sellerService';

/** Fetch the full seller profile (info + rating breakdown) */
export function useSellerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['seller', userId],
    queryFn: () => getSellerProfile(userId!),
    enabled: !!userId,
  });
}

/** Fetch the seller's auction listings */
export function useSellerAuctions(userId: string | undefined) {
  return useQuery({
    queryKey: ['seller', userId, 'auctions'],
    queryFn: () => getSellerAuctions(userId!),
    enabled: !!userId,
  });
}

/** Fetch buyer reviews about this seller */
export function useSellerReviews(userId: string | undefined) {
  return useQuery({
    queryKey: ['seller', userId, 'reviews'],
    queryFn: () => getSellerReviews(userId!),
    enabled: !!userId,
  });
}

/**
 * Fetch seller dashboard data (stats, wallet, active auctions)
 * For the seller's own dashboard page
 */
export function useSellerDashboard() {
  return useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        stats: {
          trustScore: 99.8,
          rating: 4.9,
          totalRevenue: 2400000000,
          totalItems: 142,
        },
        wallet: {
          balance: 45000000,
          balanceUSD: 1850,
        },
        activeAuctions: [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
