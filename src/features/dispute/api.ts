import apiClient, { idempotentPost } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { invalidateAndRefetchActive } from '@/lib/mutationFreshness'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DisputeDto,
  DisputeThreadDto,
  DisputeMessageDto,
  ReportDto,
  CreateReportRequest,
  DisputeListItemDto,
  DisputeDetailDto,
  DisputeAssignableUserDto,
  BuyerDisputeDetailDto,
  CreateDisputeRequest,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Queries ─────────────────────────────────────────────────────────

export interface DisputeFilterParams extends PaginationParams {
  status?: string
  domain?: string
  search?: string
}

export function useDisputes(params?: DisputeFilterParams, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.disputes.list(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<DisputeDto>>('/disputes', { params })
      return res.data
    },
    ...options,
  })
}

export function useDisputeThread(id: string) {
  return useQuery({
    queryKey: queryKeys.disputes.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<DisputeThreadDto>(`/disputes/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export interface DisputeMessageCursorParams {
  beforeCreatedAt?: string
  beforeId?: string
  pageSize?: number
}

interface DisputeMessagePageDto {
  messages: DisputeMessageDto[]
  hasMore: boolean
  nextBeforeCreatedAt?: string
  nextBeforeId?: string
}

export function useDisputeMessages(disputeId: string, params?: DisputeMessageCursorParams) {
  return useQuery({
    queryKey: queryKeys.disputes.messages(disputeId, params),
    queryFn: async () => {
      const res = await apiClient.get<DisputeMessagePageDto>(`/disputes/${disputeId}/messages`, { params })
      return res.data
    },
    enabled: !!disputeId,
  })
}

// ── Mutations ────────────────────────────────────────────────────────

export function useSendDisputeMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ disputeId, message, attachments }: { disputeId: string; message: string; attachments?: string[] }) => {
      const res = await idempotentPost<DisputeMessageDto>(`/disputes/${disputeId}/messages`, { message, mediaUploadIds: attachments })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.disputes.messages(variables.disputeId) })
      qc.invalidateQueries({ queryKey: queryKeys.disputes.detail(variables.disputeId) })
    },
  })
}

export function useMarkDisputeRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ disputeId, lastReadMessageId }: { disputeId: string; lastReadMessageId: string }) => {
      await apiClient.post(`/disputes/${disputeId}/read`, { lastReadMessageId })
    },
    onSuccess: (_data, { disputeId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.disputes.detail(disputeId) })
    },
  })
}

export function useMyReports(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.reports.my(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<ReportDto>>('/me/reports', { params })
      return res.data
    },
  })
}

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const res = await apiClient.post<ReportDto>('/reports', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reports.all })
    },
  })
}

// ── Phase-3: Admin dispute hooks ────────────────────────────────────

export function useAdminDisputesList(params?: DisputeFilterParams) {
  return useQuery({
    queryKey: queryKeys.admin.disputes(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<DisputeListItemDto>>('/admin/disputes', { params })
      return res.data
    },
  })
}

export function useAdminDisputeDetail(id: string, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.admin.disputeDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<DisputeDetailDto>(`/admin/disputes/${id}`)
      return res.data
    },
    enabled: !!id,
    ...options,
  })
}

export function useDisputeAssignableUsers(disputeId: string) {
  return useQuery({
    queryKey: queryKeys.admin.disputeAssignees(disputeId),
    queryFn: async () => {
      const res = await apiClient.get<DisputeAssignableUserDto[]>(`/admin/disputes/${disputeId}/assignees`)
      return res.data
    },
    enabled: !!disputeId,
  })
}

export function useAssignDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assignedToUserId }: { id: string; assignedToUserId: string }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/assign`, { assignToUserId: assignedToUserId })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
      await invalidateAndRefetchActive(qc, [queryKeys.admin.disputesRoot()])
    },
  })
}

export function useTransitionDisputeStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/transition`, { status })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
      await invalidateAndRefetchActive(qc, [queryKeys.admin.disputesRoot()])
    },
  })
}

export function useRequestDisputeEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/request-evidence`, { message })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
    },
  })
}

export function useAddDisputeFinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; domain: string; verdictRecommendation?: string; summary: string; findingNote?: string; references?: { referenceType: string; targetId: string }[] }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/findings`, data)
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
    },
  })
}

export interface ResolutionActionSet {
  escrowAction?: string
  refundAction?: string
  refundAmount?: number
  shipmentAction?: string
  itemAction?: string
  auctionAction?: string
  penaltyAction?: string
}

export function useResolveCaseDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; outcome: string; reason: string; actionSet?: ResolutionActionSet }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/resolve-case`, data)
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
      await invalidateAndRefetchActive(qc, [queryKeys.admin.disputesRoot(), queryKeys.disputes.all])
    },
  })
}

export function useRejectDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/reject`, { reason })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
      await invalidateAndRefetchActive(qc, [queryKeys.admin.disputesRoot(), queryKeys.disputes.all])
    },
  })
}

export function useAddAdminDisputeMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content, visibility }: { id: string; content: string; visibility: 'external' | 'internal' }) => {
      const res = await idempotentPost(`/admin/disputes/${id}/messages`, { content, visibility })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(id) })
    },
  })
}

// ── Phase-3: Buyer dispute hooks ────────────────────────────────────

export function useMyDisputes(params?: DisputeFilterParams) {
  return useQuery({
    queryKey: queryKeys.disputes.myList(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<DisputeListItemDto>>('/me/disputes', { params })
      return res.data
    },
  })
}

export function useMyDisputeDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.disputes.myDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<BuyerDisputeDetailDto>(`/me/disputes/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useAddBuyerDisputeMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await idempotentPost(`/me/disputes/${id}/messages`, { content })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.disputes.myDetail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.disputes.messages(id) })
    },
  })
}

export function useAddBuyerDisputeEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, mediaUploadId }: { id: string; mediaUploadId: string }) => {
      const res = await idempotentPost(`/me/disputes/${id}/evidence`, { mediaUploadId })
      return res.data
    },
    onSuccess: async (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.disputes.myDetail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.disputes.messages(id) })
    },
  })
}

// ── Phase-3: Intake hooks (create dispute from target) ──────────────

export function useCreateOrderDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...data }: { orderId: string } & CreateDisputeRequest) => {
      const res = await apiClient.post<{ id: string }>(`/orders/${orderId}/disputes`, data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.disputes.all])
    },
  })
}

export function useCreateAuctionDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ auctionId, ...data }: { auctionId: string } & CreateDisputeRequest) => {
      const res = await apiClient.post<{ id: string }>(`/auctions/${auctionId}/disputes`, data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.disputes.all])
    },
  })
}

export function useCreatePaymentDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, ...data }: { paymentId: string } & CreateDisputeRequest) => {
      const res = await apiClient.post<{ id: string }>(`/payments/${paymentId}/disputes`, data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.disputes.all])
    },
  })
}

export function useCreateWarehouseItemDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ warehouseItemId, ...data }: { warehouseItemId: string } & CreateDisputeRequest) => {
      const res = await apiClient.post<{ id: string }>(`/warehouse/items/${warehouseItemId}/disputes`, data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.disputes.all])
    },
  })
}

export function useCreateShipmentDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId, ...data }: { shipmentId: string } & CreateDisputeRequest) => {
      const res = await apiClient.post<{ id: string }>(`/shipments/${shipmentId}/disputes`, data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.disputes.all])
    },
  })
}
