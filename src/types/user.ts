/**
 * User domain types — extends the core User type from index.ts
 * with profile details, seller info, and addresses.
 *
 * These represent API response shapes for user-related endpoints,
 * not raw database rows. The API returns pre-joined data
 * (e.g., UserProfile includes the user's addresses).
 */

import type { Gender, AddressType, VerificationStatus, UserStatus, ReviewStatus } from './enums';

// ─── User Profile ───────────────────────────────────────────────────

/**
 * Extended user profile — returned by GET /users/:id/profile.
 * Includes personal info that isn't in the core User type.
 */
export interface UserProfile {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null; // ISO date string
  gender: Gender | null;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  emailConfirmed: boolean;
  status: UserStatus;
  /** User's default auto-bid increment (0 = use auction default) */
  defaultAutoBidIncrement: number;
  autoBidEnabled: boolean;
  createdAt: string; // ISO datetime
}

// ─── User Address ───────────────────────────────────────────────────

/**
 * Shipping/billing address. Users can have multiple addresses
 * with one marked as default per type.
 *
 * Vietnamese address hierarchy: street → ward → district → city
 */
export interface UserAddress {
  id: string;
  type: AddressType;
  recipientName: string | null;
  /** Street number + street name (e.g. "123 Nguyễn Huệ") */
  street: string | null;
  /** Phường/Xã — ward or commune level */
  ward: string | null;
  /** Quận/Huyện — district level */
  district: string | null;
  /** Tỉnh/Thành phố — province or city level */
  city: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  isDefault: boolean;
}

// ─── Seller Profile ─────────────────────────────────────────────────

/**
 * Seller-specific profile data. Created when a user unlocks
 * Seller permissions by creating their first listing.
 *
 * Trust score is a combined metric from:
 * - Average rating (1-5 stars)
 * - Transaction history (total sales, success rate)
 * - Account verification (CCCD verified)
 * - Dispute rate (% of transactions with disputes)
 */
export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string | null;
  storeDescription: string | null;
  status: VerificationStatus;
  verifiedAt: string | null;
  /** Location info for the seller's store */
  city: string | null;
  region: string | null;
  // ─── Reputation metrics (read-only, computed by backend) ──────
  totalSalesCount: number;
  totalSalesAmount: number;
  successfulSalesCount: number;
  ratingAverage: number; // 0.00 - 5.00
  ratingCount: number;
  disputeCount: number;
  /** Percentage of transactions resulting in disputes (0.0000 - 1.0000) */
  disputeRate: number;
  /** Percentage of inquiries the seller responds to (0.0000 - 1.0000) */
  responseRate: number;
  /** Combined trust score (0.00 - 100.00) */
  trustScore: number;
  trustScoreUpdatedAt: string | null;
  createdAt: string;
  modifiedAt: string;
}

/**
 * Lightweight seller summary for embedding in auction cards,
 * item listings, etc. — doesn't include full stats.
 */
export interface SellerSummary {
  userId: string;
  storeName: string | null;
  avatarUrl: string | null;
  ratingAverage: number;
  ratingCount: number;
  trustScore: number;
  status: VerificationStatus;
}

// ─── Seller Reviews ──────────────────────────────────────────────

/** Individual review left by a buyer about a seller after a completed order */
export interface SellerReview {
  id: string;
  orderId: string;
  auctionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  sellerId: string;
  overallRating: number; // 1-5
  communicationRating: number; // 1-5
  shippingSpeedRating: number; // 1-5
  itemAccuracyRating: number; // 1-5
  title: string | null;
  comment: string | null;
  images: { id: string; imageUrl: string; sortOrder: number }[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  sellerResponse: string | null;
  sellerRespondedAt: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
}

/** Aggregated star-rating breakdown for a seller */
export interface SellerRatingSummary {
  sellerId: string;
  totalReviews: number;
  averageRating: number;
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
  avgCommunication: number;
  avgShippingSpeed: number;
  avgItemAccuracy: number;
}

/**
 * Composite type returned by GET /sellers/:id — everything the
 * Seller Profile page needs in a single response.
 */
export interface SellerProfileDetail {
  profile: SellerProfile;
  displayName: string;
  avatarUrl: string | null;
  ratingSummary: SellerRatingSummary;
}
