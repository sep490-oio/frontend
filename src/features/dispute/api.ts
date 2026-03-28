import apiClient, { idempotentPost } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DisputeDto,
  DisputeThreadDto,
  DisputeMessageDto,
  ReportDto,
  CreateReportRequest,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Queries ─────────────────────────────────────────────────────────

export interface DisputeFilterParams extends PaginationParams {
  status?: string
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

export function useDisputeMessages(disputeId: string, params?: DisputeMessageCursorParams) {
  return useQuery({
    queryKey: queryKeys.disputes.messages(disputeId, params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<DisputeMessageDto>>(`/disputes/${disputeId}/messages`, { params })
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
