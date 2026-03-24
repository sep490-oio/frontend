import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrderDto, OrderReturnDto, CreateReturnRequest, PagedList, PaginationParams } from '@/types'

// ── Queries ──────────────────────────────────────────────────────────

export function useMyOrders(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<OrderDto>>('/me/orders', { params })
      return res.data
    },
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
    mutationFn: async ({ orderId, returnId }: { orderId: string; returnId: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns/${returnId}/reject`)
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
    mutationFn: async ({ orderId, returnId }: { orderId: string; returnId: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns/${returnId}/ship`)
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
