/**
 * Shared enums (union types) mirroring PostgreSQL enum types.
 *
 * All enums from the DB schema are collected here so there's ONE place
 * to find every status/type value. They're exported as TypeScript union
 * types (not the `enum` keyword) because:
 *   - Union types work naturally with JSON API responses (no runtime object)
 *   - Better tree-shaking (unused types are stripped from the bundle)
 *   - Easier to compare: `status === 'active'` just works
 *
 * Organized by domain to match CORE_FLOW_SUMMARY.md sections.
 */

// ─── User & Auth ────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type Gender = 'male' | 'female' | 'other';

export type AddressType = 'home' | 'work' | 'other';

// ─── Items & Catalog ────────────────────────────────────────────────

/** Physical condition of the item being auctioned */
export type ItemCondition = 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable';

/**
 * Moderator review status — every item must be approved before it can
 * be auctioned. This is the Moderator's workflow (not Admin).
 */
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Verified vs Non-verified listing badge (professor requirement).
 * Separate from moderation — this is about product authenticity verification.
 */
export type ListingVerificationStatus = 'unverified' | 'pending_verification' | 'verified';

// ─── Auctions & Bidding ─────────────────────────────────────────────

/**
 * Auction lifecycle status (matches BE domain enum).
 * draft → pending → active → ended → sold/failed
 * Can also go to: cancelled
 */
export type AuctionStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'ended'
  | 'sold'
  | 'cancelled'
  | 'failed';

/** Seller chooses: open (English ascending) or sealed (hidden single bid) */
export type AuctionType = 'open' | 'sealed';

/** Individual bid status within an auction */
export type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'cancelled';

/** Auto-bid (proxy bidding) status — bidder sets a max, system bids for them */
export type AutoBidStatus = 'active' | 'paused' | 'exhausted' | 'won' | 'outbid';

/**
 * Deposit lifecycle — bidders pay a deposit to qualify for an auction.
 * held → converted_to_payment (winner) or returned (loser) or forfeited (non-payment)
 * Values match BE domain enum exactly.
 */
export type DepositStatus = 'held' | 'returned' | 'forfeited' | 'converted_to_payment';

/** How the deposit was funded */
export type DepositSourceType = 'wallet' | 'payment_gateway' | 'bank_transfer';

/** What happened to the bidder after the auction ended */
export type AuctionResult = 'winner' | 'outbid' | 'auction_cancelled';

// ─── Orders & Payment ───────────────────────────────────────────────

/**
 * Order lifecycle. Created after auction ends with a winner.
 * pending_payment → paid → processing → shipped → delivered → completed
 */
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'bank_account' | 'e_wallet';

export type TransactionType = 'payment' | 'refund' | 'deposit' | 'withdrawal' | 'fee' | 'payout';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

/** Wallet-level transaction direction */
export type WalletTransactionType = 'credit' | 'debit' | 'hold' | 'release';

/** Escrow holds payment until delivery is confirmed */
export type EscrowStatus = 'holding' | 'released_to_seller' | 'refunded_to_buyer' | 'disputed';

export type WithdrawalRequestStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';

export type InvoiceStatus = 'issued' | 'draft' | 'paid' | 'cancelled';

// ─── Disputes ───────────────────────────────────────────────────────

export type DisputeType =
  | 'item_not_received'
  | 'item_not_as_described'
  | 'damaged_item'
  | 'counterfeit'
  | 'payment_issue'
  | 'shipping_issue'
  | 'seller_unresponsive'
  | 'other';

export type DesiredResolution = 'refund' | 'replacement' | 'partial_refund' | 'other';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_response'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ResolutionType =
  | 'refund_full'
  | 'refund_partial'
  | 'replacement'
  | 'favor_buyer'
  | 'favor_seller'
  | 'mutual_agreement'
  | 'no_action'
  | 'cancelled';

export type EvidenceType = 'image' | 'video' | 'document' | 'screenshot' | 'receipt' | 'tracking' | 'other';

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── Notifications ──────────────────────────────────────────────────

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook' | 'signalR';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// ─── Reviews ────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'removed';

export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'irrelevant' | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

// ─── Promotions ─────────────────────────────────────────────────────

export type PromotionType = 'featured_listing' | 'homepage_banner' | 'category_highlight';

export type PromotionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

// ─── Admin ──────────────────────────────────────────────────────────

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'status_change'
  | 'permission_change'
  | 'system';
