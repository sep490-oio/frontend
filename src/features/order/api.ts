import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrderDto, OrderReturnDto, CreateReturnRequest, PagedList, PaginationParams } from '@/types'

// ── Queries ──────────────────────────────────────────────────────────

export function useMyOrders(params?: PaginationParams & { status?: string }, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<OrderDto>>('/me/orders', { params })
      return res.data
    },
    ...options,
  })
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<OrderDto>(`/orders/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

// ── Mutations ────────────────────────────────────────────────────────

export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...data }: CreateReturnRequest & { orderId: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}

export function useApproveReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, returnId }: { orderId: string; returnId: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns/${returnId}/approve`)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
    },
  })
}

export function useRejectReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, returnId, reason }: { orderId: string; returnId: string; reason: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns/${returnId}/reject`, { reason })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
    },
  })
}

export function useShipReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, returnId, providerCode, trackingNumber }: { orderId: string; returnId: string; providerCode: string; trackingNumber: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns/${returnId}/ship`, { providerCode, trackingNumber })
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
    },
  })
}

export function useConfirmReturnReceived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, returnId }: { orderId: string; returnId: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns/${returnId}/confirm-received`)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
    },
  })
}

// ── Seller Reviews ──────────────────────────────────────────────────

export function useCreateSellerReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      orderId: string
      overallRating: number
      communicationRating?: number
      shippingSpeedRating?: number
      itemAccuracyRating?: number
      title?: string
      comment?: string
    }) => apiClient.post('/api/reviews', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}
