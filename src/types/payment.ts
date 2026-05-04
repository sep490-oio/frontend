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

export interface WalletTransactionDto {
  id: string
  type: WalletTransactionType
  amount: number
  currency: string
  status: TransactionStatus
  balanceBefore: number
  balanceAfter: number
  description?: string
  referenceType?: WalletTransactionReferenceType
  referenceId?: string | null
  auctionTitle?: string | null
  itemTitle?: string | null
  createdAt: string
}

export interface SellerWalletOverviewDto {
  availableBalance: number
  pendingWithdrawalAmount: number
  escrowHoldingAmount: number
  releasedToWalletAmount: number
  currency: string
  updatedAt: string
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
}

export interface EscrowDto {
  id: string
  orderId: string
  buyerId?: string
  sellerId?: string
  amount: number
  currency: string
  status: EscrowStatus
  holdTransactionId?: string
  createdAt: string
  releasedAt?: string
  refundedAt?: string
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
