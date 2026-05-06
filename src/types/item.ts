import type { ItemCondition, ItemStatus } from './enums'

export interface ItemDto {
  id: string
  sellerId: string
  sellerName?: string
  categoryId?: string
  title: string
  description?: string
  condition: ItemCondition
  status: ItemStatus
  quantity: number
  images: ItemMediaDto[]
  createdAt: string
  hasLiveAuction?: boolean
  auction?: {
    auctionId: string
    auctionStatus: string
    auctionType: string
    currentPrice: number
    currency: string
    startTime: string
    endTime: string
  }
  /**
   * Indicates if the item currently has an active or completed inbound shipment record.
   * Use this to hide UI elements like "Send to floor".
   */
  hasInboundShipment?: boolean
  /** Set when the item is linked to a warehouse item (platform inspection flow). */
  warehouseItemId?: string | null
}

export interface ItemMediaDto {
  id: string
  url: string
  thumbnailUrl?: string
  type?: 'image' | 'video'
  resourceType?: string
  publicId?: string
  isPrimary: boolean
  sortOrder?: number
  fileName?: string
  bytes?: number
  format?: string
  width?: number
  height?: number
  uploadedAt?: string
}

export interface CreateItemRequest {
  title: string
  condition: ItemCondition
  description?: string
  categoryId?: string
  quantity: number
  images?: { mediaUploadId: string; isPrimary?: boolean; sortOrder?: number }[]
}

export interface ItemQuestionDto {
  id: string
  itemId: string
  questionerId: string
  question: string
  answer?: string
  createdAt: string
  answeredAt?: string
  askerDisplayName?: string
  answererDisplayName?: string
}

export interface CategoryDto {
  id: string
  parentId?: string
  name: string
  slug: string
  description?: string
  iconUrl?: string
  isActive: boolean
  sortOrder: number
  path: string
  createdAt: string
}
