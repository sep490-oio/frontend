import type { EscrowStatus, OrderReturnStatus, OrderStatus } from './enums'
import type { GhnMetadata } from './address'

export interface ShipmentEvidenceDto {
  id: string
  mediaUploadId: string
  mediaUrl: string
  createdAt: string
}

export type PackageCondition =
  | 'sealed_intact'
  | 'outer_damage'
  | 'wet_or_torn'
  | 'tamper_suspected'
  | 'wrong_parcel'
  | 'other'

export type SellerDirectShipmentStatus =
  | 'draft'
  | 'carrier_booked'
  | 'picked_up'
  | 'on_delivering'
  | 'delivered'
  | 'accepted'
  | 'disputed'
  | 'completed'

export interface SellerDirectShipmentDto {
  id: string
  orderId: string
  shipmentIdDisplay: string
  internalTrackingCode: string
  qrPayload: string
  qrCodeUrl: string
  externalCarrierName?: string | null
  externalTrackingCode?: string | null
  status: SellerDirectShipmentStatus
  deliveredAt?: string | null
  buyerReceivedPackageAt?: string | null
  buyerAcceptedAt?: string | null
  createdAt: string
  modifiedAt: string
  /** When the seller declared the package shipped (dispatch-details flow). */
  sellerDeclaredShippedAt?: string | null
  /** Photos of the package taken by the seller before dispatch. */
  sellerPackagePhotos: ShipmentEvidenceDto[]
  /** Handover proof photos taken by the seller at drop-off/pickup. */
  sellerHandoverProofs: ShipmentEvidenceDto[]
  /** Delivery photos submitted by the buyer as proof of delivery. */
  buyerDeliveryPhotos: ShipmentEvidenceDto[]
  /** Buyer-reported package condition on delivery. */
  buyerPackageCondition?: PackageCondition | null
  /** Free-text notes from the buyer about the package condition. */
  buyerConditionNotes?: string | null
  /** True when the shipment has been flagged for manual staff review. */
  manualReviewRequired: boolean
  /** Human-readable reason for the manual review flag. */
  manualReviewReason?: string | null
  /** Monotonically increasing version counter for the QR token. */
  qrTokenVersion: number
  /** When the current QR token was issued. */
  qrTokenIssuedAt?: string | null
  /** When the current QR token was revoked (null = still valid). */
  qrTokenRevokedAt?: string | null
}

export interface ShipmentListItemItem {
  itemId: string
  itemTitle: string
  primaryImageUrl?: string | null
  finalPrice: number
  currency: string
}

export interface ShipmentListItemRecipient {
  recipientName?: string | null
  phoneNumber?: string | null
  composedAddress?: string | null
}

/** Seller-scoped row returned by GET /api/me/orders/seller-direct-ship/shipments. */
export interface SellerDirectShipmentListItem {
  shipmentId: string
  shipmentIdDisplay: string
  orderId: string
  orderNumber: string
  internalTrackingCode: string
  externalCarrierName?: string | null
  externalTrackingCode?: string | null
  status: SellerDirectShipmentStatus
  createdAt: string
  sellerDeclaredShippedAt?: string | null
  deliveredAt?: string | null
  buyerReceivedPackageAt?: string | null
  buyerAcceptedAt?: string | null
  manualReviewRequired: boolean
  item?: ShipmentListItemItem | null
  recipient?: ShipmentListItemRecipient | null
}

/**
 * Buyer-safe row in the unified shipment feed (`GET /api/me/shipments`).
 * Discriminated by `shipmentKind`:
 *   - `seller_direct`     — row is a SellerDirectShipment.
 *   - `warehouse_outbound` — row is a warehouse-booked OutboundShipment.
 * Action flags are precomputed BE-side so the list UI can gate CTAs without
 * fetching per-row detail.
 */
export type BuyerShipmentKind = 'seller_direct' | 'warehouse_outbound'

export interface BuyerShipmentListItemDto {
  shipmentKind: BuyerShipmentKind
  shipmentId: string
  orderId: string
  orderNumber: string
  status: string
  itemTitle?: string | null
  itemImageUrl?: string | null
  carrierName?: string | null
  carrierTrackingNumber?: string | null
  internalTrackingCode?: string | null
  decisionWindowEndsAt?: string | null
  canAcknowledgeReceived: boolean
  canAccept: boolean
  canDispute: boolean
  hasActiveDispute: boolean
  createdAt: string
  updatedAt: string
  qrAvailable: boolean
  canSubmitProof: boolean
}

/** Buyer-scoped row returned by the legacy GET /api/me/direct-shipments feed. */
export interface MyDirectShipmentListItem {
  shipmentId: string
  shipmentIdDisplay: string
  orderId: string
  orderNumber: string
  internalTrackingCode: string
  externalCarrierName?: string | null
  externalTrackingCode?: string | null
  status: SellerDirectShipmentStatus
  createdAt: string
  sellerDeclaredShippedAt?: string | null
  deliveredAt?: string | null
  buyerReceivedPackageAt?: string | null
  buyerAcceptedAt?: string | null
  manualReviewRequired: boolean
  item?: ShipmentListItemItem | null
  recipient?: ShipmentListItemRecipient | null
  sellerDisplayName?: string | null
  decisionWindowEndsAt?: string | null
  canSubmitProofOfDelivery: boolean
  canAccept: boolean
  canDispute: boolean
}

export interface OrderDto {
  id: string
  orderNumber: string
  auctionId: string
  buyerId: string
  sellerId: string
  status: OrderStatus
  totalAmount: number
  currency: string
  createdAt: string
  paymentDueAt?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  decisionWindowEndsAt?: string
  completedAt?: string
  cancelledAt?: string
  escrowStatus?: EscrowStatus
  /** Total amount the buyer actually paid (after all offsets). */
  amountPaid?: number | null
  /** Portion of totalAmount covered by deposit. */
  depositAppliedAmount?: number | null
  /** Portion paid via wallet balance. */
  walletAppliedAmount?: number | null
  /** Portion paid via payment gateway. */
  gatewayPaidAmount?: number | null
  trackingNumber?: string
  return?: OrderReturnDto
  /** Display name for the buyer (profile display/full name, else username). */
  buyerDisplayName?: string | null
  /** Display name for the seller (SellerProfile.StoreName, else profile/username). */
  sellerDisplayName?: string | null
  /** Shipping snapshot. Null/placeholder until buyer saves from checkout. */
  shipping?: OrderShippingDto
  /** Compact auction item summary (image, title, price context). */
  item?: OrderItemSummaryDto
  /** Seller-side fulfillment metadata (populated only on seller-scoped queries). */
  sellerFulfillment?: SellerFulfillmentDto
  /** Viewer-scoped: BE signals when the buyer may edit shipping on this order. */
  buyerCanUpdateShipping?: boolean
  /** Direct shipment created by the seller for self-ship orders. */
  directShipment?: SellerDirectShipmentDto | null
  /** Warehouse outbound shipment snapshot — buyer-viewer only, null otherwise. */
  warehouseOutboundShipment?: OrderWarehouseOutboundShipmentDto | null
}

export interface OrderWarehouseOutboundShipmentDto {
  shipmentId: string
  status: string
  shipmentMode: string
  providerCode: string
  externalCarrierName?: string | null
  carrierTrackingNumber?: string | null
  clientOrderCode?: string | null
  qrPayload?: string | null
  qrAvailable: boolean
  dispatchedAt?: string | null
  deliveredAt?: string | null
  buyerReceivedPackageAt?: string | null
  buyerAcceptedAt?: string | null
  canAcknowledgeReceived: boolean
  canAccept: boolean
  canOpenDispute: boolean
  hasActiveDispute: boolean
  decisionWindowEndsAt?: string | null
  canSubmitProof: boolean
  hasBuyerReceiptProof: boolean
  canSubmitReceiptProof: boolean
}

/**
 * Fulfillment flow values — ownership-aware.
 *   - seller_self_ship: seller ships to buyer directly.
 *   - warehouse_managed: goods held at platform warehouse; only warehouse staff book outbound.
 * Legacy values `book_outbound` / `self_ship` are kept in the union for compat only —
 * new code must read `fulfillmentFlow` (canonical) and not branch on `fulfillmentMode`.
 */
export type SellerFulfillmentMode = 'seller_self_ship' | 'warehouse_managed' | 'book_outbound' | 'self_ship'
export type SellerFulfillmentFlow = 'seller_self_ship' | 'warehouse_managed'

export interface SellerFulfillmentDto {
  fulfillmentMode: SellerFulfillmentMode
  fulfillmentFlow: SellerFulfillmentFlow
  sellerCanCreateShipment: boolean
  warehouseStaffMustBookOutbound: boolean
  warehouseItemId?: string | null
  hasActiveOutboundShipment: boolean
  outboundShipmentId?: string | null
  packageDefaults?: {
    weightGrams?: number | null
    lengthCm?: number | null
    widthCm?: number | null
    heightCm?: number | null
    insuranceValue?: number | null
  } | null
  /** Deadline for the seller/warehouse to ship the order. */
  shipByAt?: string
  /** True when the current time has passed shipByAt without shipment. */
  isShippingOverdue?: boolean
  /** When the order was escalated to platform intervention. */
  escalatedAt?: string | null
  /** Human-readable reason for escalation. */
  escalationReason?: string | null
}

/** Compact product summary attached to every OrderDto by the BE. */
export interface OrderItemSummaryDto {
  itemId: string
  auctionId: string
  itemTitle: string
  /** Null when item has no primary image; FE falls back to placeholder. */
  primaryImageUrl?: string | null
  startingPrice: number
  finalPrice: number
  currency: string
}

/** Shipping address snapshot attached to an Order. Mirrors the address-book shape. */
export interface OrderShippingDto {
  recipientName?: string
  phoneNumber?: string
  street?: string
  ward?: string
  district?: string
  city?: string
  postalCode?: string
  composedAddress: string
  /** True when the snapshot carries a real, fully-populated structured address. */
  isStructured: boolean
  recipientMetadata?: GhnMetadata
}

export interface UpdateOrderShippingRequest {
  recipientName: string
  phoneNumber: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  recipientMetadata?: GhnMetadata
}

export interface OrderReturnDto {
  id: string
  status: OrderReturnStatus
  reasonCode: string
  description?: string
  decisionReason?: string
  providerCode?: string
  trackingNumber?: string
  requestedAt: string
  approvedAt?: string
  rejectedAt?: string
  shippedAt?: string
  sellerReceivedAt?: string
  buyerDecisionDueAt?: string
}

export interface CreateReturnRequest {
  reasonCode: string
  description?: string
}
