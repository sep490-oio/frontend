import type { ShipmentStatus } from './enums'

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

export interface WarehouseItemDto {
  id: string
  itemId: string
  inboundShipmentId?: string
  storageLocationId?: string
  status: string
  receivedAt?: string
  createdAt: string
  modifiedAt?: string
  media?: { id: string; secureUrl: string; resourceType: string }[]
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
