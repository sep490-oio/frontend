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

export interface WalletTransactionDto {
  id: string
  type: WalletTransactionType
  amount: number
  currency: string
  status: TransactionStatus
  reason?: string
  createdAt: string
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
}

export interface PaymentSummaryDto {
  totalRevenue: number
  totalPayouts: number
  pendingWithdrawals: number
  platformBalance: number
}

export interface EscrowDto {
  id: string
  orderId: string
  amount: number
  currency: string
  status: EscrowStatus
  createdAt: string
  releasedAt?: string
}
