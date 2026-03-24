import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InboundShipmentDto,
  OutboundShipmentDto,
  WarehouseItemDto,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Inbound Shipments ───────────────────────────────────────────────

export function useInboundShipments(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.warehouse.inbound(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<InboundShipmentDto>>('/warehouse/inbound-shipments', { params })
      return res.data
    },
  })
}

export function useInboundShipmentById(id: string) {
  return useQuery({
    queryKey: queryKeys.warehouse.inboundDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<InboundShipmentDto>(`/warehouse/inbound-shipments/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useBookInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      itemId: string
      providerCode: string
      shipmentMode: string
      senderName: string
      senderPhone: string
      senderAddress: string
      weightGrams: number
      lengthCm?: number
      widthCm?: number
      heightCm?: number
      notes?: string
    }) => {
      const res = await apiClient.post<InboundShipmentDto>('/warehouse/inbound-shipments', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}

export function useCancelInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<InboundShipmentDto>(`/warehouse/inbound-shipments/${id}/cancel`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}

// ── Outbound Shipments ──────────────────────────────────────────────

export function useOutboundShipments(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.warehouse.outbound(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<OutboundShipmentDto>>('/warehouse/outbound-shipments', { params })
      return res.data
    },
  })
}

export function useBookOutbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      orderId: string
      shippingProvider: string
      recipientAddress: string
    }) => {
      const res = await apiClient.post<OutboundShipmentDto>('/warehouse/outbound-shipments', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.outbound() })
    },
  })
}

// ── Warehouse Items ─────────────────────────────────────────────────

export function useWarehouseItems(params?: PaginationParams & { condition?: string }) {
  return useQuery({
    queryKey: queryKeys.warehouse.items(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WarehouseItemDto>>('/warehouse/warehouse-items', { params })
      return res.data
    },
  })
}
