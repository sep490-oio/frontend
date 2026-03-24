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
  buyerId: string
  recipientAddress: string
  shippingProvider: string
  trackingNumber?: string
  status: ShipmentStatus
  shippedAt?: string
  deliveredAt?: string
  createdAt: string
}

export interface WarehouseItemDto {
  id: string
  itemId: string
  quantity: number
  condition: string
  storageLocationId?: string
  arrivedAt: string
  storedAt?: string
}

export interface StorageLocationDto {
  id: string
  name: string
  capacity: number
  currentOccupancy: number
  createdAt: string
}

export interface ShipmentTrackingEventDto {
  timestamp: string
  status: string
  location?: string
  notes?: string
}
