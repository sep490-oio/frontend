import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { invalidateAndRefetchActive } from '@/lib/mutationFreshness'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InboundShipmentDto,
  OutboundShipmentDto,
  WarehouseItemDto,
  WarehouseStaffOutboundQueueItemDto,
  PagedList,
  PaginationParams,
} from '@/types'

// ── Inbound Shipments ───────────────────────────────────────────────

export function useInboundShipments(params?: PaginationParams & { status?: string; search?: string; requiresPlatformInspection?: string }) {
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

export interface BookInboundShipmentItem {
  itemId: string
  itemPrice?: number
  weightGrams: number
}

export interface BookInboundShipmentRequest {
  items: BookInboundShipmentItem[]
  weightGrams: number
  insuranceValue: number
  senderName?: string
  senderPhone?: string
  senderAddress?: string
  senderWard?: string
  senderDistrict?: string
  senderProvince?: string
  shipmentMode?: string
  externalCarrierName?: string
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  providerCode?: string
  notes?: string
  ghnHandlingNote?: string
}

export function useBookInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BookInboundShipmentRequest) => {
      const res = await apiClient.post<InboundShipmentDto[]>('/warehouse/inbound-shipments', data)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useCancelInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await apiClient.post<InboundShipmentDto>(`/warehouse/inbound-shipments/${id}/cancel`, { reason })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useInboundShipmentQr(id: string) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.inboundDetail(id), 'qr'],
    queryFn: async () => {
      const res = await apiClient.get(`/warehouse/inbound-shipments/${id}/qr`, {
        responseType: 'blob',
      })
      return URL.createObjectURL(res.data as Blob)
    },
    enabled: !!id,
    staleTime: Infinity,
  })
}

export function useScanShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { code?: string; trackingNumber?: string }) => {
      const res = await apiClient.get<InboundShipmentDto[]>('/warehouse/inbound-shipments/scan', { params })
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useSetExternalTracking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId, trackingNumber }: { shipmentId: string; trackingNumber: string }) => {
      await apiClient.patch(`/warehouse/inbound-shipments/${shipmentId}/tracking`, { trackingNumber })
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useUpdateExternalStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId, status }: { shipmentId: string; status: string }) => {
      await apiClient.patch(`/warehouse/inbound-shipments/${shipmentId}/status`, { status })
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
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

export function useOutboundShipmentById(id: string) {
  return useQuery({
    queryKey: queryKeys.warehouse.outboundDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<OutboundShipmentDto>(`/warehouse/outbound-shipments/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

/**
 * Book an outbound shipment for a warehouse-stored order.
 * Must match BookOutboundShipmentCommand on the BE exactly.
 */
export interface BookOutboundRequest {
  orderId: string
  warehouseItemId: string
  // Recipient
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientWard: string
  recipientDistrict: string
  recipientProvince: string
  // Package
  weightGrams: number
  insuranceValue: number
  codAmount: number
  // Item
  itemName: string
  itemPrice: number
  // Optional
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  providerCode?: string
  ghnPaymentTypeId?: string
  ghnHandlingNote?: string
  shippingMethod?: string
}

export function useBookOutbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BookOutboundRequest) => {
      const res = await apiClient.post<OutboundShipmentDto>('/warehouse/outbound-shipments', data)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.warehouse.outboundRoot(),
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.sellerDirectShipRoot(),
        queryKeys.orders.all,
      ])
    },
  })
}

export function useCancelOutbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/warehouse/outbound-shipments/${id}/cancel`)
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.outboundRoot()])
    },
  })
}

/**
 * Self-ship: seller directly creates an outbound shipment for a direct-ship order.
 * Must match the BE SelfShipOrderCommand contract exactly:
 *   - orderId
 *   - externalCarrierName
 *   - carrierTrackingNumber
 *   - optional weightGrams, insuranceValue, shippingMethod
 *
 * After success, invalidates both the warehouse outbound cache AND the order
 * caches so MyOrders / OrderDetail / SellerOrders reflect the new shipment.
 */
export interface SelfShipRequest {
  orderId: string
  externalCarrierName: string
  carrierTrackingNumber: string
  weightGrams?: number
  insuranceValue?: number
  shippingMethod?: string
}

export function useSelfShip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SelfShipRequest) => {
      const res = await apiClient.post('/warehouse/outbound-shipments/self-ship', data)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.warehouse.outboundRoot(),
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.sellerDirectShipRoot(),
        queryKeys.orders.all,
      ])
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

// Shipping fee calculation
export function useCalculateShippingFee() {
  return useMutation({
    mutationFn: async (data: {
      providerCode: string
      weightGrams: number
      insuranceValue?: number
      codAmount?: number
      recipientIsWarehouse?: boolean
      recipientUserId?: string
      recipientDistrict?: string
      recipientProvince?: string
    }) => {
      const res = await apiClient.post<number>('/warehouse/shipping/calculate-fee', data)
      return res.data
    },
  })
}

// Expected delivery time calculation
export function useCalculateDeliveryTime() {
  return useMutation({
    mutationFn: async (data: {
      providerCode: string
      senderUserId?: string
      senderDistrict?: string
      senderProvince?: string
      recipientIsWarehouse?: boolean
      recipientUserId?: string
      recipientDistrict?: string
      recipientProvince?: string
    }) => {
      const res = await apiClient.post<string | null>('/warehouse/shipping/calculate-lead-time', data)
      return res.data
    },
  })
}

// ── Warehouse Staff Outbound Queue ──────────────────────────────────

export function useWarehouseStaffOutboundQueue(params?: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: queryKeys.warehouse.staffOutboundQueue(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WarehouseStaffOutboundQueueItemDto>>(
        '/warehouse-staff/outbound-orders',
        { params },
      )
      return res.data
    },
  })
}

/**
 * Single-order detail for the warehouse-staff outbound queue.
 * Backed by GET /warehouse-staff/outbound-orders/{orderId} which returns the
 * same DTO shape as the queue rows.
 */
export function useWarehouseStaffOutboundOrder(orderId: string) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.staffOutboundQueueRoot(), 'order', orderId] as const,
    queryFn: async () => {
      const res = await apiClient.get<WarehouseStaffOutboundQueueItemDto>(
        `/warehouse-staff/outbound-orders/${orderId}`,
      )
      return res.data
    },
    enabled: !!orderId,
  })
}
