import type {
  EscrowStatus,
  PaymentMethodType,
  TransactionStatus,
  WalletTransactionType,
  WithdrawalStatus,
} from './enums'

export interface WalletSummaryDto {
  walletId: string
  currency: string
  availableBalance: number
  pendingBalance: number
  totalBalance: number
  isActive: boolean
  updatedAt: string
}

export type WalletTransactionReferenceType =
  | 'order'
  | 'deposit'
  | 'withdrawal'
  | 'escrow'
  | 'transaction'
  | null

/**
 * Ledger-side status — always non-null. <c>posted</c> for already-recorded
 * rows; only switches to <c>pending|failed|reversed</c> when the originating
 * payment transaction is in the matching upstream state.
 */
export type WalletLedgerStatus = 'posted' | 'pending' | 'failed' | 'reversed'

/**
 * Canonical business-event taxonomy for a wallet ledger row. The FE picks
 * its description string and reference link off this — never off the
 * server-supplied free-text description.
 */
export type WalletEventType =
  | 'wallet_top_up'
  | 'auction_deposit_hold'
  | 'auction_deposit_refund'
  | 'order_payment'
  | 'order_refund'
  | 'withdrawal_hold'
  | 'withdrawal_release'
  | 'seller_payout'
  | 'fee'

export interface WalletTransactionDto {
  id: string
  type: WalletTransactionType
  amount: number
  currency: string
  /** @deprecated Use sourceStatus (same value) or ledgerStatus (never null). */
  status: TransactionStatus
  balanceBefore: number
  balanceAfter: number
  description?: string
  referenceType?: WalletTransactionReferenceType
  referenceId?: string | null
  auctionTitle?: string | null
  itemTitle?: string | null
  createdAt: string
  // Phase-1 enrichment fields. All non-null on rows produced by the new
  // mapper; older cached rows from before deploy may still arrive without
  // them, so consumers must default-handle.
  ledgerStatus?: WalletLedgerStatus
  sourceStatus?: TransactionStatus | null
  eventType?: WalletEventType
  reasonCode?: string
  referenceNumber?: string | null
  referenceTitle?: string | null
}

export interface SellerWalletOverviewDto {
  availableBalance: number
  pendingWithdrawalAmount: number
  escrowHoldingAmount: number
  releasedToWalletAmount: number
  currency: string
  updatedAt: string
}

export interface PendingSellerFee {
  transactionId: string
  transactionNumber: string
  amount: number
  currency: string
  description?: string
  createdAt: string
  orderId?: string
  auctionId?: string
}

export interface PaymentMethodDto {
  id: string
  type: PaymentMethodType
  provider?: string
  lastFour?: string
  expiryMonth?: number
  expiryYear?: number
  holderName?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  maskedCardNumber?: string
  vnPayCardType?: string
  bankCode?: string
}

export interface WithdrawalRequestDto {
  id: string
  amount: number
  fee: number
  netAmount: number
  status: WithdrawalStatus
  bankName?: string
  accountNumberMasked?: string
  accountHolder?: string
  rejectionReason?: string
  transferProofUrl?: string
  transferNote?: string
  createdAt: string
  processedAt?: string
}

/** Admin-facing DTO — includes unmasked account number + transfer proof */
export interface AdminWithdrawalDto {
  id: string
  userId: string
  walletId: string
  amount: number
  fee: number
  netAmount: number
  status: WithdrawalStatus
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  rejectionReason?: string
  transferProofUrl?: string
  transferNote?: string
  processedBy?: string
  processedByDisplayName?: string
  userDisplayName?: string
  createdAt: string
  processedAt?: string
}

export interface CreateWithdrawalRequest {
  amount: number
  bankName: string
  accountNumber: string
  accountHolder: string
}

export interface CheckoutRequest {
  orderId: string
  bankCode?: string
  paymentMethod?: string
}

export interface VnPayUrlRequest {
  amount: number
  currency: string
  purpose: string
  description: string
  bankCode?: string
  auctionId?: string
  orderId?: string
  buyNowReservationId?: string
  paymentMethodId?: string
  saveCard?: boolean
  cardType?: string
  clientReturnPath?: string
}

export interface PaymentSummaryDto {
  completedPayments?: number
  failedPayments?: number
  walletTopUps?: number
  withdrawalPendingCount?: number
  holdingEscrowCount?: number
  releasedEscrowTotal?: number
  refundedEscrowTotal?: number
  totalRevenue?: number
  totalSystemBalance?: number
}

export interface EscrowDto {
  id: string
  orderId: string
  orderNumber?: string | null
  buyerId?: string
  buyerDisplayName?: string | null
  sellerId?: string
  sellerDisplayName?: string | null
  auctionItemTitle?: string | null
  amount: number
  currency: string
  status: EscrowStatus
  holdTransactionId?: string
  createdAt: string
  releasedAt?: string
  refundedAt?: string
  releaseEvents?: any[]
  isDisputed?: boolean
}

// ── Seller Finance Transparency ───────────────────────────────────────
// Mirrors BE `SellerFinanceOverviewDto` returned by GET /api/seller/finance/overview.
// All amounts are denominated in `currency`. Estimate fields are derived by BE
// (do not recompute on FE — display the value verbatim).
export interface SellerFinanceOverviewDto {
  withdrawableBalance: number
  pendingWithdrawalAmount: number
  grossEscrowHolding: number
  readyToReleaseAmount: number
  disputedEscrowAmount: number
  estimatedSellerNetPayout: number
  estimatedPlatformCommission: number
  estimatedInspectionFee: number
  pendingSellerFeeCharges: number
  currency: string
  updatedAt: string
}

// Per-order escrow row exposed to the seller. `escrowStatus` mirrors BE
// (`Holding | ReleasedToSeller | RefundedToBuyer`) and is rendered via StatusBadge.
export type SellerEscrowRowStatus = 'Holding' | 'ReleasedToSeller' | 'RefundedToBuyer'

export interface SellerEscrowLedgerRowDto {
  orderId: string
  orderNumber: string
  auctionId: string | null
  itemTitle: string
  grossPaidAmount: number
  currency: string
  orderStatus: string
  escrowStatus: SellerEscrowRowStatus
  holdReason: string | null
  buyerPaidAt: string | null
  expectedReleaseAt: string | null
  decisionWindowEndsAt: string | null
  isPlatformVerifiedItem: boolean
  platformCommissionAmount: number
  inspectionFeeAmount: number
  estimatedNetPayout: number
  actualReleasedAmount: number | null
  disputeId: string | null
  disputeStatus: string | null
}

// ── Seller Auction Deposit Overview ──────────────────────────────────

export interface DepositDetailDto {
  depositId: string
  bidderId: string
  bidderDisplayName: string
  amount: number
  currency: string
  status: string // held | returned | forfeited | converted_to_payment
  createdAt: string
  releasedAt: string | null
}

export interface SellerAuctionDepositRowDto {
  auctionId: string
  itemTitle: string
  auctionStatus: string
  totalDeposits: number
  activeDeposits: number
  totalHeldAmount: number
  currency: string
  auctionEndTime: string | null
  deposits: DepositDetailDto[]
}

// ── Platform Revenue ─────────────────────────────────────────────────

export interface PlatformRevenueDataPointDto {
  date: string
  commission: number
  inspectionFees: number
  forfeitIncome: number
  refunds: number
  netRevenue: number
}

export interface PlatformRevenueHistoryDto {
  totalRevenue: number
  totalCommission: number
  totalInspectionFees: number
  totalForfeitIncome: number
  totalRefunds: number
  currency: string
  dataPoints: PlatformRevenueDataPointDto[]
}

// ── Platform Wallet Transactions ─────────────────────────────────────

export interface PlatformWalletTransactionDto {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  category: string | null
  createdAt: string
}

export interface PlatformWalletTransactionsResultDto {
  items: PlatformWalletTransactionDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
  currency: string
  totalCreditAmount: number
  totalDebitAmount: number
}
