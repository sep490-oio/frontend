import apiClient, { extractArray } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
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

export function useWalletTransactions(params?: PaginationParams & { type?: string }, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WalletTransactionDto>>('/me/wallet/transactions', { params })
      return res.data
    },
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

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.paymentMethods.list(),
    queryFn: async () => {
      const res = await apiClient.get('/payments/methods')
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.paymentMethods.all })
    },
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/methods/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.paymentMethods.all })
    },
  })
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/payments/methods/${id}/default`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.paymentMethods.all })
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.paymentMethods.all })
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
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
      const res = await apiClient.get<PagedList<WithdrawalRequestDto>>('/me/wallet/withdrawals', { params })
      return res.data
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
    },
  })
}

export function useCancelWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/me/wallet/withdrawals/${id}/cancel`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
    },
  })
}

// ── Deposit Payment ─────────────────────────────────────────────────

export function useCreateDepositPayment() {
  return useMutation({
    mutationFn: async (data: { amount: number; currency: string; auctionId: string; description: string }) => {
      const res = await apiClient.post<{ transactionId: string; transactionRef: string; paymentUrl: string }>('/payments/vnpay/create-url', {
        amount: data.amount,
        currency: data.currency,
        purpose: 'auction_deposit',
        description: data.description,
        auctionId: data.auctionId,
      })
      return res.data
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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(variables.auctionId) })
    },
  })
}

// ── Wallet Top-up ───────────────────────────────────────────────────

export function useWalletTopup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ amount, currency, returnUrl }: { amount: number; currency?: string; returnUrl?: string }) => {
      const res = await apiClient.post<{ paymentUrl: string }>('/payments/vnpay/create-url', {
        amount,
        currency: currency ?? 'VND',
        purpose: 'wallet_top_up',
        description: 'Nạp tiền vào ví OIO',
        returnUrl,
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.all })
    },
  })
}
