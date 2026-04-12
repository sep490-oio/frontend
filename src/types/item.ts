import type { ItemCondition, ItemStatus } from './enums'

export interface ItemDto {
  id: string
  sellerId: string
  categoryId?: string
  title: string
  description?: string
  condition: ItemCondition
  status: ItemStatus
  quantity: number
  images: ItemMediaDto[]
  createdAt: string
  /**
   * True when the item's latest auction has VerifyByPlatform = true. Source
   * of truth is Auction.VerifyByPlatform, NOT item.status.
   */
  requiresPlatformInspection?: boolean
}

export interface ItemMediaDto {
  id: string
  url: string
  thumbnailUrl?: string
  type: 'image' | 'video'
  isPrimary: boolean
  uploadedAt: string
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
