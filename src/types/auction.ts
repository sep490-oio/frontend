/**
 * Auction & Bidding domain types — the core of the platform.
 *
 * Auction lifecycle (matches BE state machine):
 * 1. Seller creates auction for an approved item (draft)
 * 2. Auction goes to "pending" after configuration / publish
 * 3. Scheduled job activates at startTime (active) — bidders deposit & bid
 * 4. Auction ends (ended) → winner determined → order created (sold)
 *    Or: failed (reserve not met), cancelled (seller/admin)
 *
 * Two auction types (seller chooses):
 * - Open (English): ascending bids, live feed, auto-bid available
 * - Sealed: each bidder submits ONE hidden bid, revealed at end
 *
 * Anti-sniping: if a bid is placed in the final X minutes,
 * the timer extends by X minutes (Open auctions only).
 */

import type {
  AuctionStatus,
  AuctionType,
  BidStatus,
  AutoBidStatus,
  DepositStatus,
  DepositSourceType,
  AuctionResult,
} from './enums';
import type { ItemSummary } from './item';
import type { SellerSummary } from './user';

// ─── Bid ────────────────────────────────────────────────────────────

/** A single bid placed by a qualified bidder during the final bidding phase */
export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  /** Display name of the bidder (may be anonymized in sealed auctions) */
  bidderName: string | null;
  amount: number;
  /** True if this bid was placed automatically by the auto-bid system */
  isAutoBid: boolean;
  autoBidId: string | null;
  status: BidStatus;
  createdAt: string;
}

// ─── Auto-Bid (Proxy Bidding) ───────────────────────────────────────

/**
 * Auto-bid configuration — bidder sets a maximum amount and the system
 * automatically places the minimum winning bid on their behalf.
 * Only available in Open auctions.
 */
export interface AutoBid {
  id: string;
  auctionId: string;
  userId: string;
  isEnabled: boolean;
  /** The maximum amount the bidder is willing to pay */
  maxAmount: number;
  /** The amount the system is currently bidding at */
  currentAmount: number;
  /**
   * Custom increment per auto-bid step.
   * null = use the auction's default bid increment.
   */
  incrementAmount: number | null;
  status: AutoBidStatus;
  /** How many times the system has bid on this user's behalf */
  totalAutoBids: number;
  lastAutoBidAt: string | null;
  createdAt: string;
  modifiedAt: string;
}

// ─── Auction Deposit ────────────────────────────────────────────────

/**
 * Deposit paid by a bidder during the qualification phase.
 * Default: 10% of Starting Price, deducted from wallet.
 *
 * After auction ends:
 * - Winner: deposit applied to order payment
 * - Losers: deposit refunded to wallet (Refund Balance)
 * - Non-payment winner: deposit forfeited (70% seller / 30% platform)
 */
export interface AuctionDeposit {
  id: string;
  auctionId: string;
  userId: string;
  amount: number;
  currency: string;
  sourceType: DepositSourceType;
  status: DepositStatus;
  auctionResult: AuctionResult | null;
  depositedAt: string;
  refundedAt: string | null;
  forfeitedAt: string | null;
}

// ─── Qualified Bidder ───────────────────────────────────────────────

/** A bidder who has paid their deposit and is qualified to bid */
export interface QualifiedBidder {
  id: string;
  auctionId: string;
  userId: string;
  userName: string | null; // Denormalized for display
  userAvatarUrl: string | null;
  depositId: string | null;
  qualifiedAt: string;
  isActive: boolean;
  disqualifiedAt: string | null;
  disqualificationReason: string | null;
}

// ─── Auction Watcher ────────────────────────────────────────────────

/** Users watching an auction for notifications */
export interface AuctionWatcher {
  auctionId: string;
  userId: string;
  notifyOnBid: boolean;
  notifyOnEnd: boolean;
}

// ─── Auction (Full Detail) ──────────────────────────────────────────

/**
 * Full auction detail — returned by GET /auctions/:id.
 * This is the most data-rich type in the system, used by the
 * Auction Detail page. Includes nested item, seller, and bid data.
 */
export interface Auction {
  id: string;
  itemId: string;
  sellerId: string;
  /** Seller chooses: 'open' (ascending, live) or 'sealed' (hidden, one bid) */
  auctionType: AuctionType;
  // ─── Pricing (4 fields from Decision #10) ─────────────────────
  /** Where bidding starts (required) */
  startingPrice: number;
  /** Minimum amount each bid must increase by (required) */
  bidIncrement: number;
  /** Minimum price seller will accept; if not met, no winner (optional) */
  reservePrice: number | null;
  /** Allows immediate purchase without bidding (optional) */
  buyNowPrice: number | null;
  /** The current highest bid amount (startingPrice if no bids yet) */
  currentPrice: number;
  // ─── Deposit ──────────────────────────────────────────────────
  /** Percentage of starting price required as deposit (default 10%) */
  depositPercentage: number;
  /** Calculated deposit amount in VND */
  depositAmount: number | null;
  currency: string;
  // ─── Timing ───────────────────────────────────────────────────
  /** When bidding starts */
  startTime: string;
  /** Scheduled end time */
  endTime: string;
  /** Actual end time (may differ from endTime due to anti-sniping extensions) */
  actualEndTime: string | null;
  /** When the qualification/deposit window opens */
  qualificationStartAt: string | null;
  /** When the qualification/deposit window closes (must be before startTime) */
  qualificationEndAt: string | null;
  // ─── Status & Participants ────────────────────────────────────
  status: AuctionStatus;
  /** Minimum qualified bidders required for auction to proceed (default 2) */
  minimumParticipants: number;
  /** Current number of qualified bidders */
  qualifiedCount: number;
  winnerId: string | null;
  winningBidId: string | null;
  // ─── Computed fields from BE ──────────────────────────────────
  /** Minimum amount for the next valid bid (from BE) */
  minimumBidAmount: number;
  /** Whether reserve price has been met */
  isReserveMet: boolean;
  /** Whether buy-now option is available */
  hasBuyNow: boolean;
  /** Whether auction is ending soon (within threshold) */
  isEndingSoon: boolean;
  // ─── Anti-sniping ─────────────────────────────────────────────
  /** Whether anti-sniping timer extension is enabled */
  autoExtend: boolean;
  /** Minutes to extend when a last-minute bid arrives (default 5) */
  extensionMinutes: number;
  // ─── Engagement metrics ───────────────────────────────────────
  isFeatured: boolean;
  viewCount: number;
  bidCount: number;
  watchCount: number;
  // ─── Nested data (populated by API) ───────────────────────────
  item: ItemSummary | null;
  seller: SellerSummary | null;
  /** Recent bids (Open auctions show live feed; Sealed show after end) */
  recentBids: Bid[];
  /** The current user's qualification status (null if not logged in) */
  currentUserDeposit: AuctionDeposit | null;
  /** The current user's auto-bid config (null if not set) */
  currentUserAutoBid: AutoBid | null;
  /** Whether the current user is watching this auction */
  isWatching: boolean;
  createdAt: string;
  modifiedAt: string;
}

// ─── Auction List Item (for Browse page cards) ──────────────────────

/**
 * Lightweight auction summary for the Browse/Catalog page.
 * Much smaller than the full Auction type — only what's needed
 * to render an auction card in a grid.
 */
export interface AuctionListItem {
  id: string;
  status: AuctionStatus;
  // ─── From the item ────────────────────────────────────────────
  itemTitle: string;
  primaryImageUrl: string | null;
  // ─── From the auction ─────────────────────────────────────────
  startingPrice: number;
  currentPrice: number;
  buyNowPrice: number | null;
  currency: string;
  startTime: string;
  endTime: string;
  bidCount: number;
  watchCount: number;
  isFeatured: boolean;
  isEndingSoon: boolean;
  // ─── From the seller ──────────────────────────────────────────
  sellerId: string;
  // ─── Optional fields (not returned by BE list endpoint) ───────
  auctionType?: AuctionType;
  itemCondition?: ItemCondition;
  verificationStatus?: ListingVerificationStatus;
  categoryName?: string | null;
  qualifiedCount?: number;
  sellerName?: string | null;
  sellerRating?: number;
  sellerTrustScore?: number;
}

// Need these imports for AuctionListItem
import type { ItemCondition, ListingVerificationStatus } from './enums';

// ─── Paginated Response ─────────────────────────────────────────────

/**
 * Generic paginated response wrapper.
 * The Browse page will use PaginatedResponse<AuctionListItem>.
 */
export interface PaginatedResponse<T> {
  items: T[];
  /** Current page number (1-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages after the current one */
  hasNextPage: boolean;
  /** Whether there are pages before the current one */
  hasPreviousPage: boolean;
}

// ─── Auction Filters (for Browse page search/filter) ────────────────

/** Query parameters for the GET /auctions endpoint */
export interface AuctionFilters {
  /** Text search across item title and description */
  search?: string;
  /** Filter by category ID */
  categoryId?: string;
  /** Filter by auction type */
  auctionType?: AuctionType;
  /** Filter by status (e.g., 'active', 'ended') */
  status?: AuctionStatus | AuctionStatus[];
  /** Minimum current price */
  priceMin?: number;
  /** Maximum current price */
  priceMax?: number;
  /** Filter by item condition */
  condition?: ItemCondition | ItemCondition[];
  /** Only show verified listings */
  verifiedOnly?: boolean;
  /** Only show auctions with buy-now option */
  buyNowOnly?: boolean;
  /** Sort field */
  sortBy?: 'endTime' | 'startTime' | 'currentPrice' | 'bidCount' | 'createdAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

// ─── Mutation Responses (Layer 2: Interactive Bidding) ─────────────

/** Response after joining auction qualification (paying deposit) */
export interface JoinAuctionResponse {
  deposit: AuctionDeposit;
  newQualifiedCount: number;
}

/** Response after placing a bid (open) or sealed bid */
export interface PlaceBidResponse {
  bid: Bid;
  newCurrentPrice: number;
}

/** Response after buy-now instant purchase */
export interface BuyNowResponse {
  orderId: string;
  finalPrice: number;
}

/** Response after toggling watch/unwatch */
export interface ToggleWatchResponse {
  isWatching: boolean;
  newWatchCount: number;
}

// ─── Create Auction — All-in-One (Seller Flow) ──────────────────────

/**
 * Request payload for POST /api/auctions (all-in-one).
 * Creates BOTH item AND auction in a single call.
 * Used by the unified CreateAuctionWizardPage (/sell).
 *
 * The BE handler:
 * 1. Creates Item via Item.Create() (draft)
 * 2. Attaches media
 * 3. Creates Auction via AuctionDraftCreationService (draft)
 * 4. Raises AuctionCreatedEvent
 */
export interface CreateAuctionAllInOneRequest {
  // Item fields
  title: string;
  condition: string;
  categoryId?: string;
  description?: string;
  quantity: number;
  media: Array<{
    mediaUploadId: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  // Auction fields
  startingPrice: number;
  bidIncrement: number;
  reservePrice?: number;
  buyNowPrice?: number;
  extensionMinutes: number;
  currency: string;          // "VND"
  auctionType: string;       // "regular" | "sealed"
}

/** Response from POST /api/auctions — returns AuctionDto with nested item */
export interface CreateAuctionAllInOneResponse {
  id: string;
  itemId: string;
  status: AuctionStatus;
}

// ─── Create Auction — From Existing Item (Seller Flow) ──────────────

/**
 * Request payload for POST /api/items/{itemId}/auctions.
 * Creates an auction from an EXISTING item (correct endpoint for our flow).
 *
 * BE validation: startingPrice ≥ 0, bidIncrement ≥ 0,
 * reservePrice ≥ startingPrice, buyNowPrice ≥ startingPrice,
 * extensionMinutes 1–30, currency 3 chars.
 */
export interface CreateAuctionFromItemRequest {
  startingPrice: number;
  bidIncrement: number;
  reservePrice?: number;
  buyNowPrice?: number;
  extensionMinutes?: number;  // 1-30, default 5
  currency?: string;          // 3 chars, default "VND"
  auctionType?: string;       // "regular" | "sealed", default "regular"
}

/**
 * Request payload for PUT /api/auctions/{id}/timing.
 * Sets the auction schedule and qualification window.
 * All fields required. Qualification must be BEFORE auction start.
 */
export interface SetAuctionTimingRequest {
  startTime: string;              // ISO 8601
  endTime: string;                // ISO 8601
  qualificationStartAt: string;   // ISO 8601
  qualificationEndAt: string;     // ISO 8601
  autoExtend: boolean;
  extensionMinutes: number;
}

/** Response from POST /api/items/{itemId}/auctions — returns AuctionDto */
export interface CreateAuctionFromItemResponse {
  id: string;
  status: AuctionStatus;
}
