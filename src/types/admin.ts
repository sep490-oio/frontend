import type { AlertSeverity, AlertStatus } from './enums'

export interface RoleDto {
  name: string
  permissions: string[]
}

// Permissions endpoint returns PagedList<string>, not objects
export type PermissionName = string

export interface MonitoringAlertDto {
  id: string
  type: string
  severity: AlertSeverity
  status: AlertStatus
  message: string
  entityType?: string
  entityId?: string
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
}

export interface UserRiskFlagDto {
  id: string
  userId: string
  severity: AlertSeverity
  reason: string
  createdAt: string
}

export interface AuctionEmergencyDto {
  id: string
  auctionId: string
  reason: string
  triggeredAt: string
  resolvedAt?: string
  resolution?: string
}

export interface ReviewQueueItemDto {
  id: string
  itemId: string
  title: string
  sellerId: string
  sellerName: string
  submittedAt: string
  assignedTo?: string
  status: string
}

export interface ItemReviewDto {
  id: string
  reviewerId: string
  action: string
  reason?: string
  createdAt: string
}

export interface UserListItemDto {
  id: string
  userName: string
  email: string
  status: string
  roles: string[]
  createdAt: string
}

export interface PaymentTransactionDto {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  orderId?: string
  userId?: string
  createdAt: string
}

export interface TermsDocumentDto {
  id: string
  type: string
  version: number
  isActive: boolean
  publishedAt?: string
  createdAt: string
  contentUrl?: string
  fileName?: string
  fileSize?: number
  format?: string
  storagePublicId?: string
  storageFolder?: string
}

export interface TermsAcceptanceDto {
  documentId: string
  userId: string
  acceptedAt: string
  version: string
}
