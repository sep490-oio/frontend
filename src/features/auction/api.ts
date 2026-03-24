import apiClient, { idempotentPost } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AuctionListItemDto,
  AuctionDetailDto,
  AuctionDto,
  BidDto,
  AutoBidDto,
  SealedBidDto,
  WinnerOfferDto,
  BuyNowCheckoutDto,
  AuctionFilterParams,
  PagedList,
  PaginationParams,
  MoneyDto,
} from '@/types'

// ── Auctions ─────────────────────────────────────────────────────────

export function useAuctions(params?: AuctionFilterParams) {
  return useQuery({
    queryKey: queryKeys.auctions.list(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<AuctionListItemDto>>('/auctions', { params })
      return res.data
    },
  })
}

export function useAuctionDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.auctions.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<AuctionDetailDto>(`/auctions/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useAuctionBids(auctionId: string) {
  return useQuery({
    queryKey: queryKeys.auctions.bids(auctionId),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<BidDto>>(`/auctions/${auctionId}/bids`)
      return res.data
    },
    enabled: !!auctionId,
  })
}

export function useMyAuctions(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.auctions.myAuctions(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<AuctionListItemDto>>('/me/auctions', { params })
      return res.data
    },
  })
}

export function useWatchlist(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.auctions.watchlist(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<AuctionListItemDto>>('/me/auctions/watch-list', { params })
      return res.data
    },
  })
}

// ── My Bids ─────────────────────────────────────────────────────────

export interface MyBidDto {
  id: string
  auctionId: string
  auctionTitle: string
  amount: MoneyDto
  isAutoBid: boolean
  status: string
  isHighestBid: boolean
  auctionStatus: string
  createdAt: string
}

export function useMyBids(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: ['myBids', params] as const,
    queryFn: async () => {
      const res = await apiClient.get<PagedList<MyBidDto>>('/me/bids', { params })
      return res.data
    },
  })
}

// ── Mutations ────────────────────────────────────────────────────────

export interface CreateAuctionMediaAttachment {
  mediaUploadId: string
  isPrimary?: boolean
  sortOrder?: number
}

export interface CreateAuctionRequest {
  // Item fields
  title: string
  condition: string
  categoryId?: string
  description?: string
  quantity?: number
  attributes?: string
  media?: CreateAuctionMediaAttachment[]
  // Auction pricing fields
  startingPrice?: number
  bidIncrement?: number
  reservePrice?: number
  buyNowPrice?: number
  extensionMinutes?: number
  currency?: string
  auctionType?: string
}

export function useCreateAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAuctionRequest) => {
      const res = await apiClient.post<AuctionDto>('/auctions', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
    },
  })
}

export function usePlaceBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      auctionId,
      amount,
      currency,
    }: {
      auctionId: string
      amount: number
      currency?: string
    }) => {
      const res = await idempotentPost<BidDto>(`/auctions/${auctionId}/bids`, { amount, currency })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.bids(variables.auctionId) })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(variables.auctionId) })
    },
  })
}

export function useWatchAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, notifyOnBid = true, notifyOnEnd = true }: { auctionId: string; notifyOnBid?: boolean; notifyOnEnd?: boolean }) => {
      await apiClient.post(`/auctions/${auctionId}/watch`, { notifyOnBid, notifyOnEnd })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.watchlist() })
    },
  })
}

export function useUnwatchAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      await apiClient.delete(`/auctions/${auctionId}/watch`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.watchlist() })
    },
  })
}

export function useConfigureAutoBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      auctionId,
      maxAmount,
      currency,
      incrementAmount,
    }: {
      auctionId: string
      maxAmount: number
      currency?: string
      incrementAmount?: number
    }) => {
      const res = await apiClient.put<AutoBidDto>(`/auctions/${auctionId}/auto-bid`, { maxAmount, currency, incrementAmount })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.myAutoBid(variables.auctionId) })
    },
  })
}

export function useMyAutoBid(auctionId: string) {
  return useQuery({
    queryKey: queryKeys.auctions.myAutoBid(auctionId),
    queryFn: async () => {
      const res = await apiClient.get<AutoBidDto>(`/auctions/${auctionId}/auto-bid/my`)
      return res.data
    },
    enabled: !!auctionId,
  })
}

// Submit auction for admin review
export function useSubmitAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      await apiClient.post(`/auctions/${auctionId}/submit`)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.auctions.all }) },
  })
}

// Publish approved auction
export function usePublishAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      await apiClient.post(`/auctions/${auctionId}/publish`)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.auctions.all }) },
  })
}

// Update auction (draft only)
export function useUpdateAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, ...data }: { auctionId: string } & Record<string, unknown>) => {
      const res = await apiClient.put<AuctionDto>(`/auctions/${auctionId}`, data)
      return res.data
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
    },
  })
}

// Cancel auction
export function useCancelAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, reason }: { auctionId: string; reason: string }) => {
      await apiClient.post(`/auctions/${auctionId}/cancel`, { reason })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.auctions.all }) },
  })
}

// Set auction timing
export function useSetAuctionTiming() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, ...timing }: { auctionId: string; startTime: string; endTime: string; qualificationStartAt?: string; qualificationEndAt?: string }) => {
      await apiClient.put(`/auctions/${auctionId}/timing`, timing)
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    },
  })
}

// Submit sealed bid
export function useSubmitSealedBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, amount }: { auctionId: string; amount: number }) => {
      const res = await apiClient.post<SealedBidDto>(`/auctions/${auctionId}/sealed-bids`, { amount })
      return res.data
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    },
  })
}

// Pause auto-bid
export function usePauseAutoBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      await apiClient.post(`/auctions/${auctionId}/auto-bid/pause`)
    },
    onSuccess: (_, auctionId) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.myAutoBid(auctionId) })
    },
  })
}

// Resume auto-bid
export function useResumeAutoBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      await apiClient.post(`/auctions/${auctionId}/auto-bid/resume`)
    },
    onSuccess: (_, auctionId) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.myAutoBid(auctionId) })
    },
  })
}

// Offer to runner-up
export function useOfferRunnerUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      const res = await apiClient.post<WinnerOfferDto>(`/auctions/${auctionId}/runner-up-offers`)
      return res.data
    },
    onSuccess: (_, auctionId) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    },
  })
}

// Respond to runner-up offer
export function useRespondRunnerUpOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, accept }: { auctionId: string; accept: boolean }) => {
      const res = await apiClient.post<WinnerOfferDto>(`/auctions/${auctionId}/runner-up-offers/respond`, { accept })
      return res.data
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    },
  })
}

// Close auction
export function useCloseAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      await apiClient.post(`/auctions/${auctionId}/close`)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.auctions.all }) },
  })
}

// Relist auction
export function useRelistAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      const res = await apiClient.post<AuctionDto>(`/auctions/${auctionId}/relist`)
      return res.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.auctions.all }) },
  })
}

// Choose auction shipping
export function useChooseAuctionShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, shippingOptionId }: { auctionId: string; shippingOptionId: string }) => {
      await apiClient.post(`/auctions/${auctionId}/shipping`, { shippingOptionId })
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    },
  })
}

// Buy now via REST
export function useBuyNow() {
  return useMutation({
    mutationFn: async (auctionId: string) => {
      const res = await idempotentPost<BuyNowCheckoutDto>(`/auctions/${auctionId}/buy-now`)
      return res.data
    },
  })
}
