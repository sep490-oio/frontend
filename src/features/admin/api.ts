import apiClient, { extractArray } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { invalidateAndRefetchActive } from '@/lib/mutationFreshness'
import { stripEmpty } from '@/lib/stripEmpty'
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
  AuctionListItemDto,
  AdminCompletedAuctionListItemDto,
  AdminCompletedAuctionDetailDto,
  AdminAuctionPaymentStatus,
  AdminAuctionFulfillmentStatus,
  PlatformRevenueHistoryDto,
  PlatformWalletTransactionsResultDto,
  AdminItemQuestionDto,
  AdminOrderListItemDto,
  AdminOrderDetailDto,
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

export function useAdminUserRiskFlags(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.userRiskFlags(id),
    queryFn: async () => {
      const res = await apiClient.get<UserRiskFlagDto[]>(`/admin/users/${id}/risk-flags`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useAdminCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userName: string; email: string; password: string; currency: string; firstName: string; lastName: string; roles?: string[] }) => {
      const res = await apiClient.post<UserDto>('/admin/users', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.usersRoot()])
    },
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.usersRoot()])
    },
  })
}

export function useChangeUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/admin/users/${id}/status`, { status })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.usersRoot()])
    },
  })
}

export function useUnlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/admin/users/${id}/unlock`)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.usersRoot()])
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
    onSuccess: async (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) })
      await invalidateAndRefetchActive(qc, [queryKeys.admin.usersRoot()])
    },
  })
}

export function useRevokeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiClient.delete(`/admin/users/${userId}/roles/${role}`)
    },
    onSuccess: async (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) })
      await invalidateAndRefetchActive(qc, [queryKeys.admin.usersRoot()])
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
    mutationFn: async ({ role, permission, isActive }: { role: string; permission: string; isActive: boolean }) => {
      const res = await apiClient.put(`/admin/roles/${role}/permissions/${permission}`, { isActive })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.roles()])
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
    queryKey: [...queryKeys.admin.verificationsRoot(), 'detail', id],
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.verificationsRoot()])
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.verificationsRoot()])
    },
  })
}

// ── Sellers ──────────────────────────────────────────────────────────

export function useAdminSellerProfiles(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.sellerProfiles(params),
    queryFn: async () => {
      const res = await apiClient.get<SellerProfileDto[]>('/admin/seller-profiles', { params })
      return extractArray<SellerProfileDto>(res.data)
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.sellerProfilesRoot()])
    },
  })
}

// NOTE: BE does not accept a reason body - rejection reason is not recorded. Consider adding to BE.
export function useRejectSellerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/admin/seller-profiles/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.sellerProfilesRoot()])
    },
  })
}

// ── Items ────────────────────────────────────────────────────────────

export const useAdminItems = (params: any) => {
  return useQuery({
    queryKey: queryKeys.admin.items(params),
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/items', { params })
      return data as { items: ItemDto[], metadata: { totalCount: number, hasNext: boolean } }
    },
    placeholderData: (prev) => prev,
  })
}

export const useAdminItemQuestions = (itemId: string, params?: any) => {
  return useQuery({
    queryKey: [...queryKeys.items.questionsRoot(itemId), 'admin', params],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/items/${itemId}/questions`, { params })
      return data as { items: AdminItemQuestionDto[], metadata: { totalCount: number, hasNext: boolean } }
    },
    enabled: !!itemId,
  })
}

export const useHideItemQuestion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, questionId, reason }: { itemId: string; questionId: string; reason: string }) => {
      await apiClient.post(`/admin/items/${itemId}/questions/${questionId}/hide`, { reason })
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.questionsRoot(itemId) })
    }
  })
}

export const useShowItemQuestion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, questionId }: { itemId: string; questionId: string }) => {
      await apiClient.post(`/admin/items/${itemId}/questions/${questionId}/show`)
    },
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.items.questionsRoot(itemId) })
    }
  })
}

export const useAdminItemLogistics = (itemId: string) => {
  return useQuery({
    queryKey: ['admin', 'items', 'logistics', itemId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/items/${itemId}/logistics`)
      return data
    },
    enabled: !!itemId,
  })
}

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
    queryKey: [...queryKeys.admin.reviewQueueRoot(), 'detail', id],
    queryFn: async () => {
      const [itemRes, reviewsRes, auctionsRes] = await Promise.all([
        apiClient.get<ItemDto>(`/admin/items/${id}`),
        apiClient.get<ItemReviewDto[]>(`/admin/items/${id}/reviews`).catch(() => ({ data: [] })),
        apiClient.get<any[]>(`/items/${id}/auctions`).catch(() => ({ data: [] }))
      ])

      const item = itemRes.data
      const auctions = auctionsRes.data

      const auction = auctions && auctions.length > 0 ? {
        auctionId: auctions[0].id,
        auctionStatus: auctions[0].status,
        auctionType: auctions[0].type,
        currentPrice: auctions[0].currentPrice,
        currency: auctions[0].currency ?? 'VND',
        startTime: auctions[0].startTime,
        endTime: auctions[0].endTime,
      } : undefined

      return {
        ...item,
        reviews: reviewsRes.data,
        auction
      }
    },
    enabled: !!id,
  })
}

export function useAdminItemAuctions(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.reviewQueueRoot(), 'detail', id, 'auctions'],
    queryFn: async () => {
      const res = await apiClient.get<AuctionListItemDto[]>(`/admin/items/${id}/auctions`)
      return res.data
    },
    enabled: !!id,
  })
}

/**
 * Optimistically patches every cached review-queue list page so the row for
 * `itemId` is either removed (approve/reject) or updated (assign reviewer),
 * then returns. The caller then awaits invalidate + active refetch to
 * reconcile with the server.
 */
function patchReviewQueueCache(
  qc: ReturnType<typeof useQueryClient>,
  itemId: string,
  mutator: (item: ReviewQueueItemDto) => ReviewQueueItemDto | null,
) {
  const queries = qc.getQueriesData<PagedList<ReviewQueueItemDto>>({
    queryKey: queryKeys.admin.reviewQueueRoot(),
  })
  for (const [key, data] of queries) {
    if (!data || !Array.isArray(data.items)) continue
    const nextItems: ReviewQueueItemDto[] = []
    for (const item of data.items) {
      if (item.id !== itemId) {
        nextItems.push(item)
        continue
      }
      const next = mutator(item)
      if (next) nextItems.push(next)
    }
    if (nextItems.length !== data.items.length || nextItems.some((it, i) => it !== data.items[i])) {
      const removed = data.items.length - nextItems.length
      const currentTotal = data.metadata?.totalCount ?? data.items.length
      qc.setQueryData<PagedList<ReviewQueueItemDto>>(key, {
        ...data,
        items: nextItems,
        metadata: {
          ...data.metadata,
          totalCount: Math.max(0, currentTotal - removed),
        },
      })
    }
  }
}

export function useApproveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/items/${id}/approve`)
    },
    onSuccess: async (_data, id) => {
      // Row leaves the pending-review queue — drop it immediately for zero flicker.
      patchReviewQueueCache(qc, id, () => null)
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.reviewQueueRoot(),
        queryKeys.items.all,
      ])
    },
  })
}

export function useRejectItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.post(`/admin/items/${id}/reject`, { reason })
    },
    onSuccess: async (_data, variables) => {
      patchReviewQueueCache(qc, variables.id, () => null)
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.reviewQueueRoot(),
        queryKeys.items.all,
      ])
    },
  })
}

export function useAssignReviewer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, adminId }: { itemId: string; adminId: string }) => {
      const res = await apiClient.post(`/admin/items/${itemId}/assign`, { adminId })
      return res.data
    },
    onSuccess: async (_data, variables) => {
      // Patch reviewer in place on the cached row while the awaited refetch lands.
      patchReviewQueueCache(qc, variables.itemId, (item) => ({
        ...item,
        assignedReviewerId: variables.adminId,
      } as ReviewQueueItemDto))
      await invalidateAndRefetchActive(qc, [queryKeys.admin.reviewQueueRoot()])
    },
  })
}

// ── Auctions ─────────────────────────────────────────────────────────

export function useAdminForceStartQualification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId }: { auctionId: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/force-start-qualification`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.auctions.detail(variables.auctionId),
        queryKeys.auctions.all,
      ])
    },
  })
}

export function useAdminForceStartBidding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId }: { auctionId: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/force-start-bidding`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.auctions.detail(variables.auctionId),
        queryKeys.auctions.all,
      ])
    },
  })
}

export function useSetCuration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, isFeatured, priority }: { auctionId: string; isFeatured: boolean; priority: number }) => {
      const res = await apiClient.put(`/admin/auctions/${auctionId}/curation`, { isFeatured, priority })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useTriggerEmergency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, reason, triggerSource, payload }: { auctionId: string; reason: string; triggerSource: string; payload: object }) => {
      const res = await apiClient.post<AuctionEmergencyDto>(`/admin/auctions/${auctionId}/emergencies`, { reason, triggerSource, payload })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useResolveEmergency() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, emergencyId, status, payload }: { auctionId: string; emergencyId: string; status: string; payload: object }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/emergencies/${emergencyId}/resolve`, { status, payload })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useCancelBid() {
  const qc = useQueryClient()
  return useMutation({
    // Reason is REQUIRED by the BE endpoint
    // (CancelInvalidBidEndpoint.Request marks `reason` with [Required]).
    // We type it as a non-nullable string here so callers can't accidentally
    // submit `{ reason: undefined }` which would 400 with a validation error.
    mutationFn: async ({ auctionId, bidId, reason }: { auctionId: string; bidId: string; reason: string }) => {
      const trimmed = reason.trim()
      if (!trimmed) {
        // Defensive guard — UI should already block this, but if a caller
        // bypasses it we fail fast in-process instead of round-tripping a 400.
        throw new Error('Cancel reason is required.')
      }
      const res = await apiClient.post(`/admin/auctions/${auctionId}/bids/${bidId}/cancel`, { reason: trimmed })
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.auctions.bids(variables.auctionId),
        queryKeys.auctions.detail(variables.auctionId),
      ])
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
    mutationFn: async ({ id, assignedToUserId }: { id: string; assignedToUserId: string }) => {
      const res = await apiClient.post(`/admin/reports/${id}/assign`, { assignedToUserId })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.reportsRoot()])
    },
  })
}

export function useResolveReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dismissed, resolutionNotes, enforcementAction }: { id: string; dismissed: boolean; resolutionNotes: string; enforcementAction?: string }) => {
      const res = await apiClient.post(`/admin/reports/${id}/resolve`, { dismissed, resolutionNotes, enforcementAction })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.reportsRoot()])
    },
  })
}

export function useEscalateReportToDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ reportId, title, disputeType, priority }: {
      reportId: string; title?: string; disputeType?: string; priority?: string
    }) => {
      const res = await apiClient.post(`/admin/reports/${reportId}/escalate-to-dispute`, { title, disputeType, priority })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.reportsRoot(),
        queryKeys.admin.disputesRoot(),
      ])
    },
  })
}

// ── Monitoring ───────────────────────────────────────────────────────

export interface MonitoringAlertsParams extends PaginationParams {
  status?: string
  severity?: string
  alertType?: string
  entityType?: string
  entityId?: string
  assignedTo?: string
  createdFrom?: string
  createdTo?: string
  minScore?: number
  keyword?: string
  sortBy?: string
}

export async function fetchMonitoringAlerts(params?: MonitoringAlertsParams) {
  const res = await apiClient.get<PagedList<MonitoringAlertDto>>('/admin/monitoring-alerts', { params })
  return res.data
}

export function useMonitoringAlerts(params?: MonitoringAlertsParams) {
  return useQuery({
    queryKey: queryKeys.admin.alerts(params),
    queryFn: () => fetchMonitoringAlerts(params),
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes, assignToMe }: { id: string; notes?: string; assignToMe?: boolean }) => {
      const res = await apiClient.post(`/admin/monitoring-alerts/${id}/acknowledge`, { notes, assignToMe })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.alertsRoot()])
    },
  })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      notes,
      ignored,
      resolutionOutcome,
      resolutionReason,
    }: {
      id: string
      notes?: string
      ignored: boolean
      resolutionOutcome?: string
      resolutionReason?: string
    }) => {
      const res = await apiClient.post(`/admin/monitoring-alerts/${id}/resolve`, {
        notes,
        ignored,
        resolutionOutcome,
        resolutionReason,
      })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.alertsRoot()])
    },
  })
}

export function useAssignMonitoringAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assignToUserId }: { id: string; assignToUserId: string }) => {
      const res = await apiClient.post<MonitoringAlertDto>(`/admin/monitoring-alerts/${id}/assign`, { assignToUserId })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.alertsRoot()])
    },
  })
}

export function useUnassignMonitoringAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<MonitoringAlertDto>(`/admin/monitoring-alerts/${id}/assign`)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.alertsRoot()])
    },
  })
}

export function useFlagUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, severity, reason, flagType }: { userId: string; severity: string; reason: string; flagType: string }) => {
      const res = await apiClient.post<UserRiskFlagDto>(`/admin/users/${userId}/risk-flags`, { severity, reason, flagType })
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.userDetail(variables.userId)])
    },
  })
}

export function useFlagAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, alertType, payload, severity }: { auctionId: string; alertType: string; payload: object; severity?: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/alerts`, { alertType, payload, severity })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.alertsRoot()])
    },
  })
}

// ── Disputes ─────────────────────────────────────────────────────────

export function useAdminDisputes(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.disputes(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<DisputeDto>>('/disputes', { params })
      return res.data
    },
  })
}


// ── Payments ─────────────────────────────────────────────────────────

export function useAdminWithdrawals(params?: PaginationParams & { status?: string; fromDate?: string; toDate?: string; searchTerm?: string; sortBy?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.withdrawals(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WithdrawalRequestDto>>('/admin/payments/withdrawals', { 
        params: params ? stripEmpty(params as Record<string, unknown>) : undefined 
      })
      return res.data
    },
  })
}

export function useAdminWithdrawalDetail(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.withdrawalsRoot(), 'detail', id],
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.withdrawalsRoot(),
        queryKeys.admin.paymentSummary(),
      ])
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.withdrawalsRoot()])
    },
  })
}

export function useCompleteWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, transferProofUrl, transferNote }: { id: string; transferProofUrl: string; transferNote?: string }) => {
      await apiClient.post(`/admin/payments/withdrawals/${id}/complete`, {
        transferProofUrl,
        transferNote,
      })
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.withdrawalsRoot(),
        queryKeys.admin.paymentSummary(),
      ])
    },
  })
}

export function useAdminTransactions(params?: PaginationParams & { status?: string; type?: string; fromDate?: string; toDate?: string; searchTerm?: string; sortBy?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.transactions(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<PaymentTransactionDto>>('/admin/payments/transactions', { 
        params: params ? stripEmpty(params as Record<string, unknown>) : undefined 
      })
      return res.data
    },
  })
}

export function useAdminTransactionById(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.transactionsRoot(), 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<PaymentTransactionDto>(`/admin/payments/transactions/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useAdminEscrows(params?: PaginationParams & { status?: string; fromDate?: string; toDate?: string; searchTerm?: string; sortBy?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.escrows(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<EscrowDto>>('/admin/payments/escrows', { 
        params: params ? stripEmpty(params as Record<string, unknown>) : undefined 
      })
      return res.data
    },
  })
}

export function useAdminEscrowById(id: string) {
  return useQuery({
    queryKey: [...queryKeys.admin.escrowsRoot(), 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<EscrowDto>(`/admin/payments/escrows/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useAdminForceReleaseEscrow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.post(`/admin/payments/escrows/${id}/force-release`, { reason })
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.escrowsRoot(),
        queryKeys.admin.paymentSummary(),
      ])
    },
  })
}

export function useAdminForceRefundEscrow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.post(`/admin/payments/escrows/${id}/force-refund`, { reason })
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.admin.escrowsRoot(),
        queryKeys.admin.paymentSummary(),
      ])
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.termsRoot()])
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.termsRoot()])
    },
  })
}

export function useUpdateTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, mediaUploadId }: { id: string; mediaUploadId: string }) => {
      const res = await apiClient.put<TermsDocumentDto>(`/admin/terms/${id}`, { mediaUploadId })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.termsRoot()])
    },
  })
}

export function useArchiveTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await apiClient.post<TermsDocumentDto>(`/admin/terms/${id}/archive`, { reason })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.termsRoot()])
    },
  })
}

export function useDeleteTerms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/terms/${id}`)
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.termsRoot()])
    },
  })
}

// ── Categories (Admin) ──────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; parentId?: string; slug?: string; description?: string }) => {
      const res = await apiClient.post('/categories', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.categories.all])
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; slug?: string; description?: string }) => {
      const res = await apiClient.put(`/categories/${id}`, data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.categories.all])
    },
  })
}

// ── Shipping Provider Config ────────────────────────────────────────

export function useUpdateShippingProviderConfig() {
  return useMutation({
    mutationFn: async ({ configId, ...data }: { configId: string; [key: string]: unknown }) => {
      const res = await apiClient.put(`/warehouse/shipping-provider-configs/${configId}`, data)
      return res.data
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
    onSuccess: async (_, { userId }) => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.userDetail(userId)])
    },
  })
}

// Deny permission for user
export function useDenyPermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: string }) => {
      await apiClient.put(`/admin/users/${userId}/permissions/${permission}`, { action: 'deny' })
    },
    onSuccess: async (_, { userId }) => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.userDetail(userId)])
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
    onSuccess: async (_, { userId }) => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.userDetail(userId)])
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
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.reportsRoot()])
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
    onSuccess: async (_, { auctionId }) => {
      await invalidateAndRefetchActive(qc, [queryKeys.auctions.detail(auctionId)])
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

// ── Completed Auctions ───────────────────────────────────────────────

export interface AdminCompletedAuctionsParams extends PaginationParams {
  paymentStatus?: AdminAuctionPaymentStatus
  fulfillmentStatus?: AdminAuctionFulfillmentStatus
  onlyOverdue?: boolean
  search?: string
}

export function useAdminCompletedAuctions(params?: AdminCompletedAuctionsParams) {
  return useQuery({
    queryKey: queryKeys.admin.completedAuctions(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<AdminCompletedAuctionListItemDto>>(
        '/admin/auctions/completed',
        { params },
      )
      return res.data
    },
  })
}

export function useAdminCompletedAuctionDetail(auctionId: string) {
  return useQuery({
    queryKey: queryKeys.admin.completedAuctionDetail(auctionId),
    queryFn: async () => {
      const res = await apiClient.get<AdminCompletedAuctionDetailDto>(
        `/admin/auctions/completed/${auctionId}`,
      )
      return res.data
    },
    enabled: !!auctionId,
  })
}

// Admin VnPay refund
export function useRefundVnPay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      originalTransactionRef: string
      originalVnPayTransactionNo: string
      amount: number
      reason: string
    }) => {
      const res = await apiClient.post('/payments/vnpay/refund', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.admin.transactionsRoot()])
    },
  })
}

// ── Platform Revenue & Income ────────────────────────────────────────

export interface PlatformRevenueParams {
  from?: string
  to?: string
  granularity?: 'day' | 'week' | 'month'
}

export function usePlatformRevenueHistory(params?: PlatformRevenueParams) {
  return useQuery({
    queryKey: queryKeys.admin.revenueHistory(params),
    queryFn: async () => {
      const res = await apiClient.get<PlatformRevenueHistoryDto>('/admin/payments/revenue-history', { params })
      return res.data
    },
  })
}

export function usePlatformWalletTransactions(params?: PaginationParams & { type?: string; fromDate?: string; toDate?: string; searchTerm?: string; category?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.platformWalletTransactions(params),
    queryFn: async () => {
      const res = await apiClient.get<PlatformWalletTransactionsResultDto>('/admin/payments/platform-wallet/transactions', { params })
      return res.data
    },
  })
}

// ── Admin Orders ─────────────────────────────────────────────────────

export interface AdminOrdersParams extends PaginationParams {
  status?: string
  search?: string
  fromDate?: string
  toDate?: string
}

export function useAdminOrders(params?: AdminOrdersParams) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<AdminOrderListItemDto>>('/admin/orders', { params })
      return res.data
    },
  })
}

export function useAdminOrderDetail(orderId: string) {
  return useQuery({
    queryKey: queryKeys.admin.orderDetail(orderId),
    queryFn: async () => {
      const res = await apiClient.get<AdminOrderDetailDto>(`/admin/orders/${orderId}`)
      return res.data
    },
    enabled: !!orderId,
  })
}

export function useAdminForceCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      await apiClient.post(`/admin/orders/${orderId}/force-cancel`, { reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.admin.ordersRoot()])
    },
  })
}

export function useAdminForceRefundOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      await apiClient.post(`/admin/orders/${orderId}/force-refund`, { reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.admin.ordersRoot()])
    },
  })
}

export function useAdminOverrideOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, newStatus, reason }: { orderId: string; newStatus: string; reason: string }) => {
      await apiClient.post(`/admin/orders/${orderId}/override-status`, { newStatus, reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.admin.ordersRoot()])
    },
  })
}

// ── Admin Auction Actions ─────────────────────────────────────────────

export function useAdminForceCancelAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, reason }: { auctionId: string; reason: string }) => {
      await apiClient.post(`/admin/auctions/${auctionId}/force-cancel`, { reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminTerminateAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, reason }: { auctionId: string; reason: string }) => {
      await apiClient.post(`/admin/auctions/${auctionId}/terminate`, { reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminExtendAuctionTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, extensionMinutes, reason }: { auctionId: string; extensionMinutes: number; reason: string }) => {
      await apiClient.post(`/admin/auctions/${auctionId}/extend-time`, { extensionMinutes, reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminOverrideAuctionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, newStatus, reason }: { auctionId: string; newStatus: string; reason: string }) => {
      await apiClient.post(`/admin/auctions/${auctionId}/override-status`, { newStatus, reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminForceEndAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, reason }: { auctionId: string; reason: string }) => {
      await apiClient.post(`/admin/auctions/${auctionId}/force-end`, { reason })
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminRelistAuction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      auctionId: string
      qualificationStartAt: string
      qualificationEndAt: string
      startAt: string
      endAt: string
      startingPrice?: number
      bidIncrement?: number
      reservePrice?: number
      buyNowPrice?: number
      currency?: string
      reason?: string
    }) => {
      const { auctionId, ...body } = data
      const res = await apiClient.post(`/admin/auctions/${auctionId}/relist`, body)
      return res.data
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminRemoveBidWithRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, bidId, reason }: { auctionId: string; bidId: string; reason: string }) => {
      const res = await apiClient.post(`/admin/auctions/${auctionId}/bids/${bidId}/remove`, { reason })
      return res.data
    },
    onSuccess: () => {
      invalidateAndRefetchActive(qc, [queryKeys.auctions.all])
    },
  })
}

export function useAdminProvisionWinnerOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (auctionId: string) => {
      const res = await apiClient.post<string>(`/admin/auctions/completed/${auctionId}/provision-order`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}
