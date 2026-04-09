import type { ShipmentStatus } from './enums'

export type PackageState = 'pending_arrival' | 'received' | 'stored' | 'inspected'

export interface InboundPackageDto {
  clientOrderCode: string
  providerCode: string
  shipmentMode: string
  externalCarrierName?: string
  carrierTrackingNumber?: string
  senderName?: string
  expectedArrivalAt?: string
  itemCount: number
  packageState: PackageState
  firstReceivedAt?: string
  createdAt: string
  shippingFee?: number
  displayStatus: string
  canCancelPackage: boolean
}

export interface InboundPackageItemDto {
  inboundShipmentId: string
  itemId: string
  itemTitle?: string
  itemImageUrl?: string
  inboundStatus: string
  warehouseItemId?: string
  warehouseItemStatus?: string
  storageLocationId?: string
  storageLocationLabel?: string
}

export interface InboundPackageDetailDto {
  clientOrderCode: string
  providerCode: string
  shipmentMode: string
  externalCarrierName?: string
  carrierTrackingNumber?: string
  senderName?: string
  senderPhone?: string
  senderAddress?: string
  senderWard?: string
  senderDistrict?: string
  senderProvince?: string
  expectedArrivalAt?: string
  packageState: PackageState
  firstReceivedAt?: string
  receiptMedia: string[]
  receiptNotes?: string
  items: InboundPackageItemDto[]
  createdAt: string
  shippingFee?: number
  displayStatus: string
  packageQrToken: string
  canCancelPackage: boolean
}

export interface ReceiveInboundPackageRequest {
  clientOrderCode: string
  frontPhoto: File
  shippingLabelPhoto?: File
  sealConditionPhoto?: File
  insideContentsPhoto?: File
  notes?: string
}

export interface InboundShipmentDto {
  id: string
  itemId: string
  sellerId: string
  providerCode: string
  shipmentMode: string
  externalCarrierName?: string
  clientOrderCode: string
  carrierTrackingNumber?: string
  qrCodeData?: string
  senderName: string
  senderPhone: string
  senderAddress: string
  senderWard: string
  senderDistrict: string
  senderProvince: string
  weightGrams: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  shippingFee: number
  insuranceValue: number
  status: ShipmentStatus
  notes?: string
  expectedArrivalAt?: string
  arrivedAt?: string
  createdAt: string
  modifiedAt?: string
  trackingEvents: ShipmentTrackingEventDto[]
  itemTitle?: string
  itemImageUrl?: string
}

export interface OutboundShipmentDto {
  id: string
  orderId: string
  warehouseItemId?: string
  shipmentMode: string
  externalCarrierName?: string
  providerCode?: string
  clientOrderCode?: string
  carrierTrackingNumber?: string
  shippingLabelUrl?: string
  shippingMethod?: string
  weightGrams?: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  shippingFee?: number
  insuranceValue?: number
  codAmount?: number
  status: string
  estimatedDeliveryAt?: string
  packedAt?: string
  dispatchedAt?: string
  deliveredAt?: string
  createdAt: string
  modifiedAt?: string
  trackingEvents?: TrackingEventDto[]
}

export interface WarehouseItemMediaDto {
  id: string
  resourceType: string
  isPrimary: boolean
  sortOrder: number
  secureUrl: string
  fileName?: string
}

export interface WarehouseItemDto {
  id: string
  itemId: string
  inboundShipmentId: string
  inboundShipmentCode?: string
  storageLocationId?: string
  storageLocationLabel?: string
  itemTitle?: string
  sellerId?: string
  sellerName?: string
  itemImageUrl?: string
  status: string
  receivedAt?: string
  createdAt: string
  modifiedAt?: string
  media?: WarehouseItemMediaDto[]
}

export type WarehouseFlowStatus =
  | 'received'
  | 'stored'
  | 'awaiting_inspection'
  | 'awaiting_review'
  | 'approved'
  | 'rejected'
  | 'condition_confirmation_required'
  | 'outbound_booked'
  | 'dispatched'

export interface SellerWarehouseItemListItemDto {
  warehouseItemId: string
  itemId: string
  itemTitle?: string
  itemImageUrl?: string
  inboundPackageCode?: string
  inboundShipmentId?: string
  storageLocationLabel?: string
  receivedAt?: string
  updatedAt: string
  warehouseFlowStatus: WarehouseFlowStatus | string
  warehouseItemStatusRaw: string
}

export interface SellerWarehouseItemReceiptMediaDto {
  id: string
  url: string
  createdAt: string
}

export interface SellerWarehouseInspectionDetailDto {
  decisionStatus: string
  declaredCondition?: string
  conditionOnArrival?: string
  inspectionNotes?: string
  decisionReason?: string
  inspectedAt?: string
  reviewedAt?: string
  sellerConfirmedAt?: string
  inspectorDisplayName?: string
  reviewerDisplayName?: string
  evidence: { secureUrl: string; publicId?: string; folder?: string; fileName?: string; bytes?: number; format?: string; width?: number; height?: number }[]
}

export interface SellerWarehouseItemDetailDto extends SellerWarehouseItemListItemDto {
  inspection?: SellerWarehouseInspectionDetailDto | null
  outboundShipmentId?: string
  outboundStatus?: string
  outboundCarrierTrackingNumber?: string
  outboundShippingLabelUrl?: string
  outboundDispatchedAt?: string
  outboundDeliveredAt?: string
  receiptMedia: SellerWarehouseItemReceiptMediaDto[]
  canConfirmInspectedCondition?: boolean
}

export interface WarehouseItemDetailDto {
  id: string
  status: string
  receivedAt?: string
  createdAt: string
  modifiedAt?: string
  storageLocationId?: string
  storageLocationLabel?: string
  inboundShipmentId: string
  inboundShipmentCode?: string
  itemId: string
  itemTitle?: string
  itemImageUrl?: string
  condition?: string
  description?: string
  sellerId?: string
  sellerName?: string
  media: WarehouseItemMediaDto[]
  canAssignOrMoveLocation?: boolean
  canBookOutbound?: boolean
  outboundBookingOrderId?: string
  canViewOutboundShipment?: boolean
  outboundShipmentId?: string
}

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

export interface ShipmentTrackingEventDto {
  timestamp: string
  status: string
  location?: string
  notes?: string
}

export interface TrackingEventDto {
  timestamp: string
  status: string
  location?: string
  notes?: string
}

// ── Warehouse Staff Outbound Queue ──────────────────────────────────

export interface WarehouseStaffOutboundQueueItemDto {
  orderId: string
  orderNumber: string
  orderStatus: string
  orderPaidAt?: string | null
  auctionId: string
  warehouseItemId: string
  itemTitle: string
  itemPrimaryImageUrl?: string | null
  buyerRecipientName?: string | null
  buyerShippingAddress?: string | null
  sellerDisplayName?: string | null
  storageLocationLabel?: string | null
}

/**
 * Full detail payload for the warehouse-staff outbound booking screen.
 * Mirrors WarehouseStaffOutboundOrderDetailDto on the BE.
 */
export interface WarehouseStaffOutboundOrderDetailDto {
  orderId: string
  orderNumber: string
  orderStatus: string
  orderPaidAt?: string | null

  warehouseItemId: string
  warehouseItemStatus: string
  storageLocationLabel?: string | null

  itemTitle?: string | null
  itemPrimaryImageUrl?: string | null
  itemPriceDefault: number

  recipientName?: string | null
  recipientPhone?: string | null
  street?: string | null
  ward?: string | null
  district?: string | null
  province?: string | null
  postalCode?: string | null
  composedAddress?: string | null

  sellerDisplayName?: string | null

  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
  insuranceValueDefault: number
  codAmountDefault: number
  defaultProviderCode?: string | null
  defaultProviderLabel?: string | null
}

// ── Warehouse Staff Outbound Shipment (shipment-centric) ────────────

export interface WarehouseStaffOutboundShipmentListItemDto {
  shipmentId: string
  orderId: string
  orderNumber: string
  status: string
  shipmentMode: string
  providerCode: string
  externalCarrierName?: string | null
  carrierTrackingNumber?: string | null
  itemTitle?: string | null
  itemPrimaryImageUrl?: string | null
  storageLocationLabel?: string | null
  recipientName?: string | null
  createdAt: string
  dispatchedAt?: string | null
}

export interface OutboundShipmentTimelineEvent {
  code: string
  label: string
  occurredAt: string
  source: 'system' | 'manual' | 'carrier'
  note?: string | null
}

export interface WarehouseStaffOutboundShipmentDetailDto {
  shipmentId: string
  orderId: string
  orderNumber: string
  status: string
  shipmentMode: string
  providerCode: string
  externalCarrierName?: string | null
  carrierTrackingNumber?: string | null
  shippingLabelUrl?: string | null
  createdAt: string
  packedAt?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null

  warehouseItemId?: string | null
  itemId: string
  itemTitle?: string | null
  itemPrimaryImageUrl?: string | null
  storageLocationLabel?: string | null

  recipientName?: string | null
  recipientPhone?: string | null
  composedAddress?: string | null

  events: OutboundShipmentTimelineEvent[]
  allowedManualStatuses: string[]

  // QR token (external-carrier only; null for platform-managed)
  qrPayload?: string | null
  qrCodeUrl?: string | null
  qrTokenVersion: number
  qrTokenIssuedAt?: string | null
  qrTokenRevokedAt?: string | null
}

export interface EvidencePhotoDto {
  id: string
  url: string
  createdAt: string
}

export interface BuyerOutboundShipmentDetailDto {
  shipmentId: string
  orderId: string
  orderNumber: string
  status: string
  clientOrderCode?: string | null
  carrierTrackingNumber?: string | null
  externalCarrierName?: string | null
  itemTitle?: string | null
  itemPrimaryImageUrl?: string | null
  recipientName?: string | null
  composedAddress?: string | null
  dispatchedAt?: string | null
  deliveredAt?: string | null
  qrAvailable: boolean
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
  packagePhotos: EvidencePhotoDto[]
  handoverPhotos: EvidencePhotoDto[]
  buyerReceiptPhotos: EvidencePhotoDto[]
}
