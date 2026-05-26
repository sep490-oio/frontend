import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { invalidateAndRefetchActive } from '@/lib/mutationFreshness'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { OrderDto, OrderReturnDto, OrderReturnEvidenceDto, CreateReturnRequest, PagedList, PaginationParams, UpdateOrderShippingRequest, SellerDirectShipmentDto, PackageCondition, SellerDirectShipmentListItem, MyDirectShipmentListItem, BuyerShipmentListItemDto, SellerOrderStats } from '@/types'
import type { OrderReturnEvidenceCategory } from '@/types/enums'

// ── Queries ──────────────────────────────────────────────────────────

export function useMyOrders(params?: PaginationParams & { status?: string; role?: string; escrowStatus?: string }, options?: { refetchInterval?: number }) {
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

/**
 * Seller direct-ship orders list.
 * Dedicated endpoint so the seller fulfillment UI never shares cache
 * or filtering state with the buyer-oriented `useMyOrders`.
 *
 * Returns orders where the caller is the seller, status is paid/processing,
 * and the item is not currently in the platform warehouse.
 */
export function useSellerDirectShipOrders(
  params?: PaginationParams & { status?: string; escrowStatus?: string },
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['orders', 'seller-direct-ship', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<OrderDto>>('/me/orders/seller-direct-ship', { params })
      return res.data
    },
    ...options,
  })
}

/**
 * Rich seller outbound shipment DTO — contains product, recipient,
 * and order context so the seller list + detail pages render context
 * without round-tripping to auctions/orders.
 */
export interface SellerOutboundShipmentDto {
  shipmentId: string
  orderId: string
  orderNumber: string
  status: string
  providerCode?: string | null
  providerDisplayName?: string | null
  carrierTrackingNumber?: string | null
  shipmentMode: string
  createdAt: string
  modifiedAt?: string | null
  packedAt?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  item?: {
    itemId: string
    auctionId: string
    itemTitle: string
    primaryImageUrl?: string | null
    finalPrice: number
    currency: string
  } | null
  recipient?: {
    recipientName?: string | null
    phoneNumber?: string | null
    composedAddress?: string | null
  } | null
  trackingEvents?: Array<{
    status: string
    description?: string | null
    occurredAt: string
  }> | null
}

/**
 * Seller-safe paged list of outbound shipments owned by the current seller.
 * Dedicated endpoint — never reuses the warehouse-generic useOutboundShipments
 * because that payload lacks product/recipient/order context.
 */
export function useSellerOutboundShipments(
  params?: PaginationParams,
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['orders', 'seller-direct-ship', 'outbound', 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<SellerOutboundShipmentDto>>(
        '/me/orders/seller-direct-ship/outbound-shipments',
        { params },
      )
      return res.data
    },
    ...options,
  })
}

/**
 * Seller-safe read path for a single outbound shipment owned by one of
 * the caller's orders. Uses the new `/me/orders/seller-direct-ship/...`
 * endpoint so seller pages never touch warehouse-permissioned hooks.
 */
export function useSellerOutboundShipmentById(shipmentId: string) {
  return useQuery({
    queryKey: ['orders', 'seller-direct-ship', 'outbound', shipmentId],
    queryFn: async () => {
      const res = await apiClient.get<SellerOutboundShipmentDto>(
        `/me/orders/seller-direct-ship/outbound-shipments/${shipmentId}`,
      )
      return res.data
    },
    enabled: !!shipmentId,
  })
}

export interface ShippingProviderOption {
  code: string
  displayName: string
  isDefault: boolean
}

/**
 * Active shipping provider options the seller can pick when booking an
 * outbound shipment. Excludes "external" — that path is handled by self-ship.
 */
export function useSellerShippingProviderOptions() {
  return useQuery({
    queryKey: ['orders', 'seller-direct-ship', 'shipping-provider-options'],
    queryFn: async () => {
      const res = await apiClient.get<ShippingProviderOption[]>(
        '/me/orders/seller-direct-ship/shipping-provider-options',
      )
      return res.data
    },
  })
}

// ── Mutations ────────────────────────────────────────────────────────

/**
 * POST /api/orders/{orderId}/cancel-payment
 * Buyer cancels payment for a pending order.
 * Auction-win: 50% deposit penalty + runner-up flow.
 * Buy-now: releases reservation with time compensation.
 */
export function useCancelOrderPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      await apiClient.post(`/orders/${orderId}/cancel-payment`, { reason: reason || undefined })
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

export function useCreateReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...data }: CreateReturnRequest & { orderId: string }) => {
      const res = await apiClient.post<OrderReturnDto>(`/orders/${orderId}/returns`, data)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
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
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
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
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
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
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

/**
 * Seller self-ship progression hooks. Each one transitions the order one
 * step forward: Processing → PickedUp → OnDelivering → Delivered. They are
 * only valid for `seller_self_ship` orders — BE enforces flow + seller
 * ownership. On success we patch the cached detail and refresh list views.
 */
function useSellerOrderProgressionMutation(endpoint: 'mark-picked-up' | 'mark-on-delivering' | 'mark-delivered') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await apiClient.post<OrderDto>(`/orders/${orderId}/${endpoint}`)
      return res.data
    },
    onSuccess: async (data, variables) => {
      qc.setQueryData(queryKeys.orders.detail(variables.orderId), data)
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.sellerDirectShipRoot(),
        queryKeys.orders.all,
      ])
    },
  })
}

export const useMarkOrderPickedUp = () => useSellerOrderProgressionMutation('mark-picked-up')
export const useMarkOrderOnDelivering = () => useSellerOrderProgressionMutation('mark-on-delivering')
export const useMarkOrderDelivered = () => useSellerOrderProgressionMutation('mark-delivered')

/**
 * Seller confirms a paid order and begins fulfillment (Paid → Processing).
 * POST /api/orders/{orderId}/confirm (no body).
 * BE enforces seller-only + status==paid preconditions.
 */
export function useConfirmSellerOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await apiClient.post<OrderDto>(`/orders/${orderId}/confirm`)
      return res.data
    },
    onSuccess: async (data, variables) => {
      qc.setQueryData(queryKeys.orders.detail(variables.orderId), data)
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.sellerDirectShipRoot(),
        queryKeys.orders.all,
      ])
    },
  })
}

/**
 * Updates the shipping snapshot on a pending-payment order.
 * BE gates this on order status and buyer ownership, so the mutation
 * simply PUTs the structured address and refreshes the order cache.
 * Must succeed before any payment flow runs.
 */
export function useUpdateOrderShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...payload }: UpdateOrderShippingRequest & { orderId: string }) => {
      const res = await apiClient.put<OrderDto>(`/orders/${orderId}/shipping`, payload)
      return res.data
    },
    onSuccess: (data, variables) => {
      // Write-through the fresh OrderDto so Checkout sees the saved snapshot
      // without a refetch roundtrip.
      qc.setQueryData(queryKeys.orders.detail(variables.orderId), data)
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
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

// ── Seller Direct Shipments ──────────────────────────────────────────

/** Invalidation helper shared by all direct shipment mutations. */
async function invalidateDirectShipmentCaches(
  qc: ReturnType<typeof useQueryClient>,
  orderId: string,
  shipmentId?: string,
) {
  const keys = [
    queryKeys.orders.detail(orderId),
    queryKeys.orders.sellerDirectShipRoot(),
    queryKeys.orders.all,
    queryKeys.directShipments.all,
    ...(shipmentId ? [queryKeys.directShipments.detail(shipmentId)] : []),
  ]
  await invalidateAndRefetchActive(qc, keys)
}

/** POST /api/orders/{orderId}/self-shipments */
export function useCreateSellerDirectShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(`/orders/${orderId}/self-shipments`)
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateDirectShipmentCaches(qc, variables.orderId)
    },
  })
}

/** PUT /api/orders/{orderId}/self-shipments/{shipmentId}/carrier-info */
export function useSetDirectShipmentCarrierInfo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      shipmentId,
      externalCarrierName,
      externalTrackingCode,
    }: {
      orderId: string
      shipmentId: string
      externalCarrierName: string
      externalTrackingCode: string
    }) => {
      const res = await apiClient.put<SellerDirectShipmentDto>(
        `/orders/${orderId}/self-shipments/${shipmentId}/carrier-info`,
        { externalCarrierName, externalTrackingCode },
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateDirectShipmentCaches(qc, variables.orderId, variables.shipmentId)
    },
  })
}

/** POST /api/orders/{orderId}/self-shipments/{shipmentId}/mark-picked-up */
export function useMarkDirectShipmentPickedUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, shipmentId }: { orderId: string; shipmentId: string }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(
        `/orders/${orderId}/self-shipments/${shipmentId}/mark-picked-up`,
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateDirectShipmentCaches(qc, variables.orderId, variables.shipmentId)
    },
  })
}

/** POST /api/orders/{orderId}/self-shipments/{shipmentId}/mark-on-delivering */
export function useMarkDirectShipmentOnDelivering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, shipmentId }: { orderId: string; shipmentId: string }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(
        `/orders/${orderId}/self-shipments/${shipmentId}/mark-on-delivering`,
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateDirectShipmentCaches(qc, variables.orderId, variables.shipmentId)
    },
  })
}

/** POST /api/orders/{orderId}/self-shipments/{shipmentId}/mark-delivered */
export function useMarkDirectShipmentDelivered() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, shipmentId }: { orderId: string; shipmentId: string }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(
        `/orders/${orderId}/self-shipments/${shipmentId}/mark-delivered`,
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateDirectShipmentCaches(qc, variables.orderId, variables.shipmentId)
    },
  })
}

/** GET /api/me/shipments/{shipmentId} — buyer read path */
export function useMyDirectShipment(shipmentId: string) {
  return useQuery({
    queryKey: queryKeys.directShipments.detail(shipmentId),
    queryFn: async () => {
      const res = await apiClient.get<SellerDirectShipmentDto>(`/me/shipments/${shipmentId}`)
      return res.data
    },
    enabled: !!shipmentId,
  })
}

/**
 * Seller read path for a single direct shipment.
 * Uses the dedicated seller-scoped endpoint
 * GET /api/me/orders/seller-direct-ship/shipments/{shipmentId}.
 * Query key stays seller-scoped so it never collides with the buyer
 * `useMyDirectShipment` cache.
 */
export function useSellerDirectShipmentById(shipmentId: string) {
  return useQuery({
    queryKey: [...queryKeys.directShipments.detail(shipmentId), 'seller'] as const,
    queryFn: async () => {
      const res = await apiClient.get<SellerDirectShipmentDto>(
        `/me/orders/seller-direct-ship/shipments/${shipmentId}`,
      )
      return res.data
    },
    enabled: !!shipmentId,
  })
}

/**
 * Seller-scoped paged list of direct shipments owned by the current seller.
 * Backed by GET /api/me/orders/seller-direct-ship/shipments. Optional status
 * filter mirrors the shipment status string (draft, carrier_booked, ...).
 */
export function useSellerDirectShipments(
  params?: PaginationParams & { status?: string },
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['orders', 'seller-direct-ship', 'shipments', 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<SellerDirectShipmentListItem>>(
        '/me/orders/seller-direct-ship/shipments',
        { params },
      )
      return res.data
    },
    ...options,
  })
}

/**
 * Buyer-scoped paged list of direct shipments against the current user's
 * orders. Backed by GET /api/me/shipments. Optional status filter.
 */
export function useMyDirectShipments(
  params?: PaginationParams & { status?: string },
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['me', 'shipments', 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<MyDirectShipmentListItem>>(
        '/me/direct-shipments',
        { params },
      )
      return res.data
    },
    ...options,
  })
}

/**
 * Unified buyer shipment feed — merges seller-direct and warehouse-outbound
 * shipments into a single paged list. Backed by GET /api/me/shipments.
 * Filters: `status` (raw shipment status), `shipmentKind`, `search`.
 */
export function useMyShipments(
  params?: PaginationParams & { status?: string; shipmentKind?: 'seller_direct' | 'warehouse_outbound'; search?: string },
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['me', 'shipments', 'unified', 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<BuyerShipmentListItemDto>>(
        '/me/shipments',
        { params },
      )
      return res.data
    },
    ...options,
  })
}

/** POST /api/me/shipments/{shipmentId}/acknowledge-received — buyer action */
export function useAcknowledgeDirectShipmentReceived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ shipmentId }: { shipmentId: string; orderId: string }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(
        `/me/shipments/${shipmentId}/acknowledge-received`,
      )
      return res.data
    },
    onSuccess: async (shipment, variables) => {
      // Write-through fresh shipment + patch any in-flight order detail cache
      // so the UI flips to "received" without waiting for the refetch.
      qc.setQueryData(queryKeys.directShipments.detail(variables.shipmentId), shipment)
      const existingOrder = qc.getQueryData<OrderDto>(queryKeys.orders.detail(variables.orderId))
      if (existingOrder) {
        qc.setQueryData(queryKeys.orders.detail(variables.orderId), {
          ...existingOrder,
          directShipment: shipment,
        })
      }
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
        queryKeys.directShipments.detail(variables.shipmentId),
        queryKeys.directShipments.all,
      ])
    },
  })
}

/**
 * POST /api/orders/{orderId}/confirm-receipt — buyer confirms receipt after
 * inspection. Releases escrow to the seller. Invalidates order caches.
 */
export function useConfirmOrderReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      await apiClient.post(`/orders/${orderId}/confirm-receipt`)
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

// ── Seller Direct Shipment — Dispatch Details ────────────────────────

/**
 * PUT /api/orders/{orderId}/self-shipments/{shipmentId}/dispatch-details
 * Seller records carrier, tracking number, ship date, and photo evidence.
 * Invalidates seller shipment list + the parent order detail.
 */
export function useSetDirectShipmentDispatchDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      shipmentId,
      carrierName,
      trackingNumber,
      shippedAt,
      packagePhotoMediaUploadIds,
    }: {
      orderId: string
      shipmentId: string
      carrierName: string
      trackingNumber: string
      shippedAt: string
      packagePhotoMediaUploadIds: string[]
    }) => {
      const res = await apiClient.put<SellerDirectShipmentDto>(
        `/orders/${orderId}/self-shipments/${shipmentId}/dispatch-details`,
        { carrierName, trackingNumber, shippedAt, packagePhotoMediaUploadIds },
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateDirectShipmentCaches(qc, variables.orderId, variables.shipmentId)
    },
  })
}

/**
 * POST /api/orders/{orderId}/self-shipments/{shipmentId}/handover-proofs
 * Seller adds handover proof photos after the package is in transit. Allowed
 * while the shipment is CarrierBooked, PickedUp, or OnDelivering. Patches the
 * shipment detail cache and invalidates related queries.
 */
export function useAddDirectShipmentHandoverProofs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      shipmentId,
      handoverProofMediaUploadIds,
    }: {
      orderId: string
      shipmentId: string
      handoverProofMediaUploadIds: string[]
    }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(
        `/orders/${orderId}/self-shipments/${shipmentId}/handover-proofs`,
        { handoverProofMediaUploadIds },
      )
      return res.data
    },
    onSuccess: async (shipment, variables) => {
      qc.setQueryData(queryKeys.directShipments.detail(variables.shipmentId), shipment)
      qc.setQueryData(
        [...queryKeys.directShipments.detail(variables.shipmentId), 'seller'] as const,
        shipment,
      )
      await invalidateDirectShipmentCaches(qc, variables.orderId, variables.shipmentId)
    },
  })
}

// ── Buyer — Proof of Delivery ─────────────────────────────────────────

/**
 * POST /api/me/shipments/{shipmentId}/proof-of-delivery
 * Buyer submits delivery photos and package condition.
 * Write-through patches both the shipment and order detail caches, then
 * invalidates active queries so stale views refresh.
 */
export function useSubmitProofOfDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shipmentId,
      orderId: _orderId,
      deliveryPhotoMediaUploadIds,
      packageCondition,
      conditionNotes,
      source,
    }: {
      shipmentId: string
      orderId: string
      deliveryPhotoMediaUploadIds: string[]
      packageCondition: PackageCondition
      conditionNotes?: string
      source: 'qr_scan' | 'order_page'
    }) => {
      const res = await apiClient.post<SellerDirectShipmentDto>(
        `/me/shipments/${shipmentId}/proof-of-delivery`,
        { deliveryPhotoMediaUploadIds, packageCondition, conditionNotes, source },
      )
      return res.data
    },
    onSuccess: async (shipment, variables) => {
      qc.setQueryData(queryKeys.directShipments.detail(variables.shipmentId), shipment)
      const existingOrder = qc.getQueryData<OrderDto>(queryKeys.orders.detail(variables.orderId))
      if (existingOrder) {
        qc.setQueryData(queryKeys.orders.detail(variables.orderId), {
          ...existingOrder,
          directShipment: shipment,
        })
      }
      await invalidateAndRefetchActive(qc, [
        queryKeys.directShipments.detail(variables.shipmentId),
        queryKeys.directShipments.all,
        queryKeys.orders.all,
      ])
      // Guarantee the order detail cache is fully refreshed from BE
      // before navigation happens — prevents a dead-end on `/me/orders/:id`
      // when the buyer lands there right after submitting proof-of-delivery.
      await qc.fetchQuery({
        queryKey: queryKeys.orders.detail(variables.orderId),
        queryFn: async () => {
          const res = await apiClient.get<OrderDto>(`/orders/${variables.orderId}`)
          return res.data
        },
      })
    },
  })
}

// ── QR Scan — Validate Token ──────────────────────────────────────────

/**
 * POST /api/me/shipments/scan/validate
 * Validates a QR token scanned by the buyer and returns the resolved
 * shipmentId + orderId. No cache side-effects — purely a lookup call.
 */
export function useValidateDirectShipmentScan() {
  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const res = await apiClient.post<{ shipmentId: string; orderId: string }>(
        '/me/shipments/scan/validate',
        { token },
      )
      return res.data
    },
  })
}

// ── OrderReturn Evidence + Scan (chain-of-custody) ───────────────────

/**
 * Buyer uploads a PickupByBuyer photo on an OrderReturn. Required before
 * `POST /returns/{id}/ship` will succeed — BE enforces the guard.
 */
export function useAddOrderReturnEvidence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      returnId,
      mediaUploadId,
      category,
    }: {
      orderId: string
      returnId: string
      mediaUploadId: string
      category: OrderReturnEvidenceCategory
    }) => {
      const res = await apiClient.post<OrderReturnEvidenceDto>(
        `/me/orders/${orderId}/returns/${returnId}/evidence`,
        { mediaUploadId, category },
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

/**
 * Seller uploads a ReceiptBySeller photo on an OrderReturn. Required
 * before `POST /returns/{id}/confirm-received` will succeed — BE guards
 * at Resolve() time.
 */
export function useAddOrderReturnEvidenceSeller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      returnId,
      mediaUploadId,
      category,
    }: {
      orderId: string
      returnId: string
      mediaUploadId: string
      category: OrderReturnEvidenceCategory
    }) => {
      const res = await apiClient.post<OrderReturnEvidenceDto>(
        `/seller/orders/${orderId}/returns/${returnId}/evidence`,
        { mediaUploadId, category },
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
    },
  })
}

/**
 * Seller scans the return-shipment QR token. Server asserts the return
 * is in `ReturnInTransit` status and flips it to `SellerReceived` with
 * NO photo requirement — scan is identity-proof only. Photo gate lives
 * on the subsequent confirm-received call.
 */
export function useScanOrderReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      returnId,
      qrToken,
    }: {
      orderId: string
      returnId: string
      qrToken: string
    }) => {
      const res = await apiClient.post<OrderReturnDto>(
        `/seller/orders/${orderId}/returns/${returnId}/scan`,
        { qrToken },
      )
      return res.data
    },
    onSuccess: async (_data, variables) => {
      await invalidateAndRefetchActive(qc, [
        queryKeys.orders.detail(variables.orderId),
        queryKeys.orders.all,
      ])
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
    }) => apiClient.post('/reviews', data),
    onSuccess: async () => {
      await invalidateAndRefetchActive(qc, [queryKeys.orders.all])
    },
  })
}

export function useSellerOrderStats() {
  return useQuery({
    queryKey: queryKeys.orders.sellerStats(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<SellerOrderStats>('/api/orders/me/stats', { signal })
      return res.data
    }
  })
}

