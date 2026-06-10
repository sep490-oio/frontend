import apiClient, { extractArray, normalizePagedList } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { invalidateAndRefetchActive } from '@/lib/mutationFreshness'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  SellerWalletOverviewDto,
  SellerFinanceOverviewDto,
  SellerEscrowLedgerRowDto,
  SellerAuctionDepositRowDto,
  WalletSummaryDto,
  WalletTransactionDto,
  PaymentMethodDto,
  WithdrawalRequestDto,
  CreateWithdrawalRequest,
  CheckoutRequest,
  VnPayUrlRequest,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Wallet ───────────────────────────────────────────────────────────

export function useWallet(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.wallet.summary(),
    queryFn: async () => {
      const res = await apiClient.get<WalletSummaryDto>('/me/wallet')
      return res.data
    },
    ...options,
  })
}

export function useSellerWalletOverview(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.wallet.sellerOverview(),
    queryFn: async () => {
      const res = await apiClient.get<SellerWalletOverviewDto>('/seller/wallet/overview')
      return res.data
    },
    ...options,
  })
}

// ── Seller Finance Transparency ─────────────────────────────────────
// Two BE endpoints (`/seller/finance/overview` and `/seller/finance/escrow-ledger`)
// power the seller finance dashboard. Both queries default to a 30s stale
// window so summary cards stay reasonably fresh without hammering BE.

export function useSellerFinanceOverview(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.sellerFinance.overview(),
    queryFn: async () => {
      const res = await apiClient.get<SellerFinanceOverviewDto>('/seller/finance/overview')
      return res.data
    },
    staleTime: 30_000,
    ...options,
  })
}

export function useSellerEscrowLedger(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.sellerFinance.escrowLedger(),
    queryFn: async () => {
      const res = await apiClient.get<SellerEscrowLedgerRowDto[]>('/seller/finance/escrow-ledger')
      return extractArray<SellerEscrowLedgerRowDto>(res.data)
    },
    staleTime: 30_000,
    ...options,
  })
}

export function useSellerAuctionDeposits(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.sellerFinance.auctionDeposits(),
    queryFn: async () => {
      const res = await apiClient.get<SellerAuctionDepositRowDto[]>('/seller/finance/auction-deposits')
      return extractArray<SellerAuctionDepositRowDto>(res.data)
    },
    staleTime: 30_000,
    ...options,
  })
}

export function usePendingSellerFees(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.sellerFinance.pendingFees(),
    queryFn: async () => {
      const res = await apiClient.get<import('@/types').PendingSellerFee[]>('/seller/finance/pending-fees')
      return extractArray<import('@/types').PendingSellerFee>(res.data)
    },
    staleTime: 30_000,
    ...options,
  })
}

export function useWalletTransactions(params?: PaginationParams & { type?: string }, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: async () => {
      const res = await apiClient.get<any>('/me/wallet/transactions', { params })
      return normalizePagedList<WalletTransactionDto>(res.data) as PagedList<WalletTransactionDto>
    },
    ...options,
  })
}

// ── Active Deposits (authoritative, from AuctionDeposit entities) ────

export interface ActiveDepositDto {
  depositId: string
  auctionId: string
  auctionTitle?: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export function useActiveDeposits(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.wallet.activeDeposits(),
    queryFn: async () => {
      const res = await apiClient.get<ActiveDepositDto[]>('/me/deposits/active')
      return extractArray<ActiveDepositDto>(res.data)
    },
    staleTime: 30_000,
    ...options,
  })
}

// ── Reserved-funds breakdown (deposits + auto-bid reservations, itemised) ────

export interface ReservationItemDto {
  type: string // 'auction_deposit' | 'auto_bid'
  referenceId: string
  title?: string | null
  amount: number
  currency: string
  status: string
  createdAt: string
}

export function useMyReservations(options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.wallet.activeDeposits(), 'reservations'],
    queryFn: async () => {
      const res = await apiClient.get<ReservationItemDto[]>('/me/reservations')
      return extractArray<ReservationItemDto>(res.data)
    },
    staleTime: 30_000,
    ...options,
  })
}

export function useWalletTransactionById(id: string) {
  return useQuery({
    queryKey: [...queryKeys.wallet.transactions(), 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<WalletTransactionDto>(`/me/wallet/transactions/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

// ── Payment Methods ──────────────────────────────────────────────────

export type PaymentMethodStatusFilter = 'active' | 'disabled' | 'all'

export function usePaymentMethods(options?: { status?: PaymentMethodStatusFilter }) {
  const status = options?.status
  return useQuery({
    queryKey: [...queryKeys.paymentMethods.list(), { status: status ?? 'active' }],
    queryFn: async () => {
      const res = await apiClient.get('/payments/methods', {
        params: status ? { status } : undefined,
      })
      return extractArray<PaymentMethodDto>(res.data)
    },
  })
}

export function useAddPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { type: string; provider?: string; lastFour?: string; expiryMonth?: number; expiryYear?: number; holderName?: string; tokenReference?: string; isDefault?: boolean }) => {
      const res = await apiClient.post<PaymentMethodDto>('/payments/methods', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.paymentMethods.all])
    },
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/methods/${id}`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.paymentMethods.all])
    },
  })
}

export function useHardDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/methods/${id}/hard`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.paymentMethods.all])
    },
  })
}

export function useReactivatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/payments/methods/${id}/reactivate`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.paymentMethods.all])
    },
  })
}

export interface DuplicatePaymentMethodError {
  code: 'PaymentMethod.Duplicate'
  description: string
  metadata?: {
    conflictingMethodId?: string
    existingIsActive?: boolean
  }
}

export function isDuplicatePaymentMethodError(err: unknown): err is { response: { data: DuplicatePaymentMethodError } } {
  const resp = (err as any)?.response?.data
  return resp?.code === 'PaymentMethod.Duplicate'
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/payments/methods/${id}/default`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.paymentMethods.all])
    },
  })
}

export function useLinkCardVnPay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { cardType: string }) => {
      const res = await apiClient.post<{ redirectUrl: string }>('/payments/methods/link-card', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.paymentMethods.all])
    },
  })
}

// ── Checkout ─────────────────────────────────────────────────────────

export function useCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CheckoutRequest) => {
      const res = await apiClient.post<{ success: boolean; transactionId?: string; paymentUrl?: string }>('/payments/checkout', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.all,
        queryKeys.wallet.all,
        queryKeys.auctions.all,
      ])
    },
  })
}

export function useCreateVnPayUrl() {
  return useMutation({
    mutationFn: async (data: VnPayUrlRequest) => {
      const res = await apiClient.post<{ paymentUrl: string }>('/payments/vnpay/create-url', data)
      return res.data
    },
  })
}

// ── Withdrawals ──────────────────────────────────────────────────────

export function useMyWithdrawals(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.wallet.withdrawals(params),
    queryFn: async () => {
      const res = await apiClient.get<any>('/me/wallet/withdrawals', { params })
      return normalizePagedList<WithdrawalRequestDto>(res.data) as PagedList<WithdrawalRequestDto>
    },
  })
}

export function useCreateWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateWithdrawalRequest) => {
      const res = await apiClient.post<WithdrawalRequestDto>('/me/wallet/withdrawals', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.wallet.all])
    },
  })
}

export function useCancelWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/me/wallet/withdrawals/${id}/cancel`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.wallet.all])
    },
  })
}

// ── Deposit Payment ─────────────────────────────────────────────────

export function useCreateDepositPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { amount: number; currency: string; auctionId: string; description: string; clientReturnPath?: string }) => {
      const res = await apiClient.post<{ transactionId: string; transactionRef: string; paymentUrl: string }>('/payments/vnpay/create-url', {
        amount: data.amount,
        currency: data.currency,
        purpose: 'auction_deposit',
        description: data.description,
        auctionId: data.auctionId,
        clientReturnPath: data.clientReturnPath,
      })
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.wallet.all,
        queryKeys.auctions.detail(variables.auctionId),
      ])
    },
  })
}

// ── Deposit from Wallet ──────────────────────────────────────────────

export function useDepositFromWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { auctionId: string; amount: number; currency: string }) => {
      await apiClient.post(`/auctions/${data.auctionId}/deposit`, {
        amount: data.amount,
        currency: data.currency,
      })
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.wallet.all,
        queryKeys.auctions.all,
        queryKeys.auctions.detail(variables.auctionId),
      ])
    },
  })
}

// ── Wallet Top-up ───────────────────────────────────────────────────

export function useWalletTopup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ amount, currency, returnUrl, clientReturnPath }: { amount: number; currency?: string; returnUrl?: string; clientReturnPath?: string }) => {
      const res = await apiClient.post<{ paymentUrl: string }>('/payments/vnpay/create-url', {
        amount,
        currency: currency ?? 'VND',
        purpose: 'wallet_top_up',
        description: 'Nạp tiền vào ví OIO',
        returnUrl,
        clientReturnPath,
      })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.wallet.all])
    },
  })
}
