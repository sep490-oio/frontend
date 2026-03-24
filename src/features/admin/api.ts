import apiClient, { extractArray } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  UserListItemDto,
  UserDto,
  RoleDto,
  VerificationDto,
  SellerProfileDto,
  ReviewQueueItemDto,
  ItemDto,
  ItemReviewDto,
  ReportDto,
  MonitoringAlertDto,
  UserRiskFlagDto,
  AuctionEmergencyDto,
  DisputeDto,
  WithdrawalRequestDto,
  PaymentTransactionDto,
  PaymentSummaryDto,
  WalletSummaryDto,
  EscrowDto,
  TermsDocumentDto,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Users ────────────────────────────────────────────────────────────

export function useAdminUsers(params?: PaginationParams & { search?: string; status?: string; role?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<UserListItemDto>>('/admin/users', { params })
      return res.data
    },
  })
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.userDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<UserDto>(`/admin/users/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useAdminCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userName: string; email: string; password: string; roles?: string[] }) => {
      const res = await apiClient.post<UserDto>('/admin/users', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

export function useChangeUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.post(`/admin/users/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

export function useUnlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/users/${id}/unlock`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

export function useAssignRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiClient.post(`/admin/users/${userId}/roles/${role}`)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) })
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

export function useRevokeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiClient.delete(`/admin/users/${userId}/roles/${role}`)
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) })
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() })
    },
  })
}

// ── Roles & Permissions ──────────────────────────────────────────────

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.admin.roles(),
    queryFn: async () => {
      const res = await apiClient.get('/admin/roles')
      return extractArray<RoleDto>(res.data)
    },
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.admin.permissions(),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<string>>('/admin/permissions')
      return res.data
    },
  })
}

export function useTogglePermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ role, permission }: { role: string; permission: string }) => {
      const res = await apiClient.put(`/admin/roles/${role}/permissions/${permission}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.roles() })
    },
  })
}

// ── Verifications ────────────────────────────────────────────────────

export function usePendingVerifications(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.verifications(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<VerificationDto>>('/admin/verifications', { params })
      return res.data
    },
  })
}

export function useAdminVerificationDetail(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.verifications(), 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<VerificationDto>(`/admin/verifications/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useApproveVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/verifications/${id}/approve`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.verifications() })
    },
  })
}

export function useRejectVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/admin/verifications/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.verifications() })
    },
  })
}

// ── Sellers ──────────────────────────────────────────────────────────

export function useAdminSellerProfiles(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.sellerProfiles(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<SellerProfileDto>>('/admin/seller-profiles', { params })
      return res.data
    },
  })
}

export function useVerifySellerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/seller-profiles/${id}/verify`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.sellerProfiles() })
    },
  })
}

export function useRejectSellerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/admin/seller-profiles/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.sellerProfiles() })
    },
  })
}

// ── Items ────────────────────────────────────────────────────────────

export function useReviewQueue(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.reviewQueue(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ReviewQueueItemDto>>('/admin/items/review-queue', { params })
      return res.data
    },
  })
}

export function useAdminItemDetail(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.reviewQueue(), 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<ItemDto & { reviews?: ItemReviewDto[] }>(`/admin/items/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useApproveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/items/${id}/approve`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reviewQueue() })
    },
  })
}

export function useRejectItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/admin/items/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reviewQueue() })
    },
  })
}

export function useAssignReviewer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, reviewerId }: { itemId: string; reviewerId: string }) => {
      const res = await apiClient.post(`/admin/items/${itemId}/assign`, { reviewerId })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reviewQueue() })
    },
  })
}

// ── Auctions ─────────────────────────────────────────────────────────

export function useSetCuration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, isFeatured, priority }: { auctionId: string; isFeatured: boolean; priority: number }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/curation`, { isFeatured, priority })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
    },
  })
}

export function useTriggerEmergency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, reason }: { auctionId: string; reason: string }) => {
      const res = await apiClient.post<AuctionEmergencyDto>(`/admin/auctions/${auctionId}/emergencies`, { reason })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
    },
  })
}

export function useResolveEmergency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, emergencyId, resolution }: { auctionId: string; emergencyId: string; resolution: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/emergencies/${emergencyId}/resolve`, { resolution })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
    },
  })
}

export function useCancelBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, bidId, reason }: { auctionId: string; bidId: string; reason?: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/bids/${bidId}/cancel`, { reason })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.bids(variables.auctionId) })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(variables.auctionId) })
    },
  })
}

// ── Reports ──────────────────────────────────────────────────────────

export function useAdminReports(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.reports(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ReportDto>>('/admin/reports', { params })
      return res.data
    },
  })
}

export function useAssignReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string }) => {
      const res = await apiClient.post(`/admin/reports/${id}/assign`, { assigneeId })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reports() })
    },
  })
}

export function useResolveReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await apiClient.post(`/admin/reports/${id}/resolve`, { notes })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reports() })
    },
  })
}

// ── Monitoring ───────────────────────────────────────────────────────

export function useMonitoringAlerts(params?: PaginationParams & { severity?: string; status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.alerts(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<MonitoringAlertDto>>('/admin/monitoring-alerts', { params })
      return res.data
    },
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/monitoring-alerts/${id}/acknowledge`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.alerts() })
    },
  })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await apiClient.post(`/admin/monitoring-alerts/${id}/resolve`, { notes })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.alerts() })
    },
  })
}

export function useFlagUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, severity, reason }: { userId: string; severity: string; reason: string }) => {
      const res = await apiClient.post<UserRiskFlagDto>(`/admin/users/${userId}/risk-flags`, { severity, reason })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) })
    },
  })
}

export function useFlagAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, severity, message }: { auctionId: string; severity: string; message: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/alerts`, { severity, message })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.alerts() })
    },
  })
}

// ── Disputes ─────────────────────────────────────────────────────────

export function useAdminDisputes(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.disputes(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<DisputeDto>>('/admin/disputes', { params })
      return res.data
    },
  })
}

export function useAdminResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      resolutionType,
      refundAmount,
      notes,
    }: {
      id: string
      resolutionType: string
      refundAmount?: number
      notes?: string
    }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/resolve`, { resolutionType, refundAmount, notes })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputes() })
      qc.invalidateQueries({ queryKey: queryKeys.disputes.all })
    },
  })
}

// ── Payments ─────────────────────────────────────────────────────────

export function useAdminWithdrawals(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.withdrawals(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WithdrawalRequestDto>>('/admin/payments/withdrawals', { params })
      return res.data
    },
  })
}

export function useAdminWithdrawalDetail(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.withdrawals(), 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<WithdrawalRequestDto>(`/admin/payments/withdrawals/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useApproveWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/admin/payments/withdrawals/${id}/approve`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.withdrawals() })
      qc.invalidateQueries({ queryKey: queryKeys.admin.paymentSummary() })
    },
  })
}

export function useRejectWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/admin/payments/withdrawals/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.withdrawals() })
    },
  })
}

export function useAdminTransactions(params?: PaginationParams & { status?: string; type?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.transactions(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<PaymentTransactionDto>>('/admin/payments/transactions', { params })
      return res.data
    },
  })
}

export function useAdminEscrows(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.escrows(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<EscrowDto>>('/admin/payments/escrows', { params })
      return res.data
    },
  })
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: queryKeys.admin.paymentSummary(),
    queryFn: async () => {
      const res = await apiClient.get<PaymentSummaryDto>('/admin/payments/summary')
      return res.data
    },
  })
}

export function usePlatformWallet() {
  return useQuery({
    queryKey: queryKeys.admin.platformWallet(),
    queryFn: async () => {
      const res = await apiClient.get<WalletSummaryDto>('/admin/payments/platform-wallet')
      return res.data
    },
  })
}

// ── Terms ────────────────────────────────────────────────────────────

export function useAdminTerms(params?: { type?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.admin.terms(params),
    queryFn: async () => {
      const res = await apiClient.get('/admin/terms', { params })
      return extractArray<TermsDocumentDto>(res.data)
    },
  })
}

export function useCreateTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { type: string; mediaUploadId: string }) => {
      const res = await apiClient.post<TermsDocumentDto>('/admin/terms', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.terms() })
    },
  })
}

export function useActivateTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.put(`/admin/terms/${id}/activate`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.terms() })
    },
  })
}

// ── Permissions ──────────────────────────────────────────────────────

// Grant permission to user
export function useGrantPermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: string }) => {
      await apiClient.post(`/admin/users/${userId}/permissions/${permission}`)
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(userId) })
    },
  })
}

// Revoke permission from user
export function useRevokePermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: string }) => {
      await apiClient.delete(`/admin/users/${userId}/permissions/${permission}`)
    },
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(userId) })
    },
  })
}

// Escalate report to emergency
export function useEscalateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: string) => {
      await apiClient.post(`/admin/reports/${reportId}/escalate-emergency`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.reports() })
    },
  })
}

// Reveal sealed bid
export function useRevealSealedBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, sealedBidId }: { auctionId: string; sealedBidId: string }) => {
      await apiClient.post(`/admin/auctions/${auctionId}/sealed-bids/${sealedBidId}/reveal`)
    },
    onSuccess: (_, { auctionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    },
  })
}

// Get item review history
export function useItemReviewHistory(itemId: string) {
  return useQuery({
    queryKey: ['admin', 'items', itemId, 'reviews'],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/items/${itemId}/reviews`)
      return extractArray<ItemReviewDto>(res.data)
    },
    enabled: !!itemId,
  })
}
