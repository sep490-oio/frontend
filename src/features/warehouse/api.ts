import apiClient, { extractArray } from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { invalidateAndRefetchActive } from '@/lib/mutationFreshness'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InboundShipmentDto,
  OutboundShipmentDto,
  WarehouseItemDto,
  WarehouseItemDetailDto,
  SellerWarehouseItemListItemDto,
  SellerWarehouseItemDetailDto,
  WarehouseStaffOutboundOrderDetailDto,
  WarehouseStaffOutboundQueueItemDto,
  BuyerOutboundShipmentDetailDto,
  WarehouseStaffOutboundShipmentDetailDto,
  WarehouseStaffOutboundShipmentListItemDto,
  InboundPackageDto,
  InboundPackageDetailDto,
  ReceiveInboundPackageRequest,
  PagedList,
  PaginationParams,
  GhnMetadata,
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
  /**
   * Ignored by the inbound batch flow — the backend uses the top-level
   * `weightGrams` as the single source of truth and distributes carrier
   * metadata internally. Kept optional for legacy payload compatibility.
   */
  weightGrams?: number
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
  senderMetadata?: GhnMetadata
}

export function useBookInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BookInboundShipmentRequest) => {
      const isGhn = data.shipmentMode === 'platform_managed' || data.providerCode === 'ghn'
      const url = isGhn ? '/warehouse/ghn/book-inbound' : '/warehouse/inbound-shipments'
      const res = await apiClient.post<InboundShipmentDto[]>(url, data)
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

// ── Inbound Packages (package-level receiving) ─────────────────────

export function useInboundPackages(params?: PaginationParams & { packageState?: string; search?: string }) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.all, 'packages', 'list', params] as const,
    queryFn: async () => {
      const res = await apiClient.get<PagedList<InboundPackageDto>>('/warehouse/inbound-packages', { params })
      return res.data
    },
  })
}

export function useInboundPackage(clientOrderCode: string) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.all, 'packages', 'detail', clientOrderCode] as const,
    queryFn: async () => {
      const res = await apiClient.get<InboundPackageDetailDto>(
        `/warehouse/inbound-packages/${encodeURIComponent(clientOrderCode)}`,
      )
      return res.data
    },
    enabled: !!clientOrderCode,
  })
}

export function useReceiveInboundPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ReceiveInboundPackageRequest) => {
      const form = new FormData()
      form.append('frontPhoto', data.frontPhoto)
      if (data.shippingLabelPhoto) form.append('shippingLabelPhoto', data.shippingLabelPhoto)
      if (data.sealConditionPhoto) form.append('sealConditionPhoto', data.sealConditionPhoto)
      if (data.insideContentsPhoto) form.append('insideContentsPhoto', data.insideContentsPhoto)
      if (data.notes) form.append('notes', data.notes)
      const res = await apiClient.post<InboundPackageDetailDto>(
        `/warehouse/inbound-packages/${encodeURIComponent(data.clientOrderCode)}/receive/multipart`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return res.data
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useCancelInboundPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientOrderCode, reason }: { clientOrderCode: string; reason?: string }) => {
      await apiClient.post(
        `/warehouse/inbound-packages/${encodeURIComponent(clientOrderCode)}/cancel`,
        { reason: reason ?? '' },
      )
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useSetInboundPackageTracking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientOrderCode, trackingNumber }: { clientOrderCode: string; trackingNumber: string }) => {
      await apiClient.patch(
        `/warehouse/inbound-packages/${encodeURIComponent(clientOrderCode)}/tracking`,
        { trackingNumber },
      )
    },
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.warehouse.all])
    },
  })
}

export function useUpdateInboundPackageExternalStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientOrderCode, status }: { clientOrderCode: string; status: string }) => {
      await apiClient.patch(
        `/warehouse/inbound-packages/${encodeURIComponent(clientOrderCode)}/status`,
        { status },
      )
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
  recipientMetadata?: GhnMetadata
  senderName?: string
  senderPhone?: string
  senderAddress?: string
  senderWard?: string
  senderDistrict?: string
  senderProvince?: string
  senderMetadata?: GhnMetadata
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
  /**
   * v1 note: backend-defaulted in platform-managed mode — the handler resolves
   * the first active default ShippingProviderConfig when omitted. Left unset
   * by the warehouse-staff booking UI.
   */
  providerCode?: string
  /** v1: backend defaults to GHN "shop pays" — FE does not surface this. */
  ghnPaymentTypeId?: string
  ghnHandlingNote?: string
  shippingMethod?: string
  /** v1: backend only reads this for GHN; FE does not surface a JSON editor. */
  recipientCarrierAddressDataJson?: string
  /** v1: backend uses default manifest; FE does not surface an extraData editor. */
  extraDataJson?: string
  // ── Shipment mode (v1: platform_managed | external_carrier) ──────
  shipmentMode?: 'platform_managed' | 'external_carrier'
  externalCarrierName?: string
  carrierTrackingNumber?: string
  // ── Evidence photos ────────────────────────────────────────────────
  packagePhotoMediaUploadIds: string[]
  handoverPhotoMediaUploadIds?: string[]
}

export function useBookOutbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: BookOutboundRequest) => {
      const isGhn = data.shipmentMode === 'platform_managed' || data.providerCode === 'ghn'
      const url = isGhn ? '/warehouse/ghn/book-outbound' : '/warehouse/outbound-shipments'
      const res = await apiClient.post<OutboundShipmentDto>(url, data)
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

export function useWarehouseItems(
  params?: PaginationParams & { status?: string; search?: string },
) {
  const { search, ...rest } = params ?? {}
  const outgoing = { ...rest, ...(search ? { searchTerm: search } : {}) }
  return useQuery({
    queryKey: queryKeys.warehouse.items(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WarehouseItemDto>>('/warehouse/warehouse-items', { params: outgoing })
      return res.data
    },
  })
}

// ── Seller-scoped warehouse items ──────────────────────────────────
export interface SellerWarehouseItemsParams {
  pageNumber?: number
  pageSize?: number
  warehouseFlowStatus?: string
  search?: string
}

export function useSellerWarehouseItems(params?: SellerWarehouseItemsParams) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.itemsRoot(), 'seller', 'list', params] as const,
    queryFn: async () => {
      const res = await apiClient.get<PagedList<SellerWarehouseItemListItemDto>>(
        '/seller/warehouse/items',
        { params },
      )
      return res.data
    },
  })
}

export function useSellerWarehouseItem(warehouseItemId: string) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.itemsRoot(), 'seller', 'detail', warehouseItemId] as const,
    queryFn: async () => {
      const res = await apiClient.get<SellerWarehouseItemDetailDto>(
        `/seller/warehouse/items/${warehouseItemId}`,
      )
      return res.data
    },
    enabled: !!warehouseItemId,
  })
}

export function useWarehouseItemDetail(id: string) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.itemsRoot(), 'detail', id] as const,
    queryFn: async () => {
      const res = await apiClient.get<WarehouseItemDetailDto>(`/warehouse/warehouse-items/${id}`)
      return res.data
    },
    enabled: !!id,
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
      const res = await apiClient.get<WarehouseStaffOutboundOrderDetailDto>(
        `/warehouse-staff/outbound-orders/${orderId}`,
      )
      return res.data
    },
    enabled: !!orderId,
  })
}

// ── Warehouse Staff Outbound Shipments (shipment-centric) ──────────

export interface StaffOutboundShipmentsParams extends PaginationParams {
  status?: string
  shipmentMode?: string
  search?: string
}

const staffOutboundShipmentsKey = (params?: StaffOutboundShipmentsParams) =>
  ['warehouse-staff', 'outbound-shipments', 'list', params] as const

const staffOutboundShipmentDetailKey = (id: string) =>
  ['warehouse-staff', 'outbound-shipments', 'detail', id] as const

export function useStaffOutboundShipments(params?: StaffOutboundShipmentsParams) {
  return useQuery({
    queryKey: staffOutboundShipmentsKey(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<WarehouseStaffOutboundShipmentListItemDto>>(
        '/warehouse-staff/outbound-shipments',
        { params },
      )
      return res.data
    },
  })
}

/**
 * GET /api/me/outbound-shipments/{shipmentId}
 * Buyer-scoped detail for a single outbound shipment by ID.
 */
export function useBuyerOutboundShipment(shipmentId: string) {
  return useQuery({
    queryKey: ['buyer', 'outbound-shipments', 'detail', shipmentId] as const,
    queryFn: async () => {
      const res = await apiClient.get<BuyerOutboundShipmentDetailDto>(
        `/me/outbound-shipments/${shipmentId}`,
      )
      return res.data
    },
    enabled: !!shipmentId,
  })
}

/**
 * POST /api/me/outbound-shipments/{shipmentId}/proof-of-receipt
 * Buyer submits receipt proof photos. Invalidates buyer outbound detail
 * and order queries on success.
 */
export function useSubmitReceiptProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shipmentId,
      receiptPhotoMediaUploadIds,
    }: {
      shipmentId: string
      orderId: string
      receiptPhotoMediaUploadIds: string[]
    }) => {
      const res = await apiClient.post<BuyerOutboundShipmentDetailDto>(
        `/me/outbound-shipments/${shipmentId}/proof-of-receipt`,
        { receiptPhotoMediaUploadIds },
      )
      return res.data
    },
    onSuccess: async (data, variables) => {
      qc.setQueryData(
        ['buyer', 'outbound-shipments', 'detail', variables.shipmentId] as const,
        data,
      )
      await invalidateAndRefetchActive(qc, [
        ['buyer', 'outbound-shipments'] as const,
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

export function useBuyerOutboundShipmentByToken(token: string) {
  return useQuery({
    queryKey: ['buyer', 'outbound-shipments', 'by-token', token] as const,
    queryFn: async () => {
      const res = await apiClient.get<BuyerOutboundShipmentDetailDto>(
        `/buyer/outbound-shipments/by-token`,
        { params: { token } },
      )
      return res.data
    },
    enabled: !!token,
    retry: false,
  })
}

/**
 * POST /api/me/outbound-shipments/{shipmentId}/acknowledge-received
 * Buyer acknowledges they physically received the package. Source tracks
 * whether acknowledgement came from the QR deep link or the order page.
 * Invalidates the token detail query and the buyer order detail query.
 */
export function useAcknowledgeReceivedOutboundShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shipmentId,
      source = 'qr_scan',
      orderId,
    }: {
      shipmentId: string
      source?: 'qr_scan' | 'order_page'
      orderId?: string
    }) => {
      const res = await apiClient.post<BuyerOutboundShipmentDetailDto>(
        `/me/outbound-shipments/${shipmentId}/acknowledge-received`,
        { source },
      )
      return { data: res.data, orderId }
    },
    onSuccess: async (_result) => {
      await invalidateAndRefetchActive(qc, [
        ['buyer', 'outbound-shipments', 'by-token'] as const,
        queryKeys.orders.all,
      ])
    },
  })
}

export function useStaffOutboundShipment(shipmentId: string) {
  return useQuery({
    queryKey: staffOutboundShipmentDetailKey(shipmentId),
    queryFn: async () => {
      const res = await apiClient.get<WarehouseStaffOutboundShipmentDetailDto>(
        `/warehouse-staff/outbound-shipments/${shipmentId}`,
      )
      return res.data
    },
    enabled: !!shipmentId,
  })
}

export function useUpdateExternalOutboundStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId, status }: { shipmentId: string; status: string }) => {
      const res = await apiClient.patch<WarehouseStaffOutboundShipmentDetailDto>(
        `/warehouse-staff/outbound-shipments/${shipmentId}/status`,
        { status },
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        ['warehouse-staff', 'outbound-shipments'] as const,
        staffOutboundShipmentDetailKey(variables.shipmentId),
      ])
    },
  })
}

// ── Storage Locations (warehouse-staff owned) ───────────────────────

export interface StorageLocationDto {
  id: string
  zone: string
  aisle: string
  shelf: string
  bin: string
  label: string
  isOccupied: boolean
  createdAt: string
}

export interface StorageLocationsParams {
  vacantOnly?: boolean
  zone?: string
  search?: string
}

export function useStorageLocations(params?: StorageLocationsParams) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.locations(), params],
    queryFn: async () => {
      const res = await apiClient.get('/warehouse/storage-locations', { params })
      return extractArray<StorageLocationDto>(res.data)
    },
  })
}

export function useCreateStorageLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { zone: string; aisle: string; shelf: string; bin: string }) => {
      const res = await apiClient.post<StorageLocationDto>('/warehouse/storage-locations', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.locations() })
    },
  })
}

export function useUpdateStorageLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; zone: string; aisle: string; shelf: string; bin: string }) => {
      const res = await apiClient.put<StorageLocationDto>(`/warehouse/storage-locations/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.locations() })
    },
  })
}

export function useDeleteStorageLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/warehouse/storage-locations/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.locations() })
    },
  })
}

export function useStoreWarehouseItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { warehouseItemId: string; storageLocationId: string }) => {
      const { warehouseItemId, ...body } = data
      const res = await apiClient.post(
        `/warehouse/warehouse-items/${warehouseItemId}/store`,
        body,
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}
