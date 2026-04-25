import type { AlertSeverity, AlertStatus } from './enums'
import type { OrderDto } from './order'
import type { OutboundShipmentDto } from './warehouse'

export interface RoleDto {
  name: string
  permissions: string[]
}

// Permissions endpoint returns PagedList<string>, not objects
export type PermissionName = string

export interface MonitoringAlertDto {
  id: string
  alertType: string
  severity: AlertSeverity
  status: AlertStatus
  payload: string
  entityType: string
  entityId: string
  notes?: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export interface UserRiskFlagDto {
  id: string
  userId: string
  flagType?: string
  severity: AlertSeverity | string
  reason: string
  createdBy?: string
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
  firstName?: string
  lastName?: string
  status: string
  emailConfirmed?: boolean
  roles: string[]
  createdAt: string
}

export interface PaymentTransactionDto {
  id: string
  transactionNumber?: string
  userId?: string
  orderId?: string
  type: string
  amount: number
  fee?: number
  netAmount?: number
  currency: string
  status: string
  gatewayProvider?: string
  description?: string
  createdAt: string
  processedAt?: string
}

/**
 * Lifecycle status for a terms document.
 * One-release compat: BE continues to send `isActive` until Phase H; FE
 * callers prefer `status` but fall back to `isActive ? 'Active' : 'Draft'`.
 */
export type TermsDocumentStatus = 'Draft' | 'Active' | 'Archived'

export interface TermsDocumentDto {
  id: string
  type: string
  version: number
  /** @deprecated One-release compat — read `status` where available. Removed in Phase H. */
  isActive: boolean
  status?: TermsDocumentStatus
  publishedAt?: string
  createdAt: string
  createdBy?: string
  activatedBy?: string
  archivedAt?: string
  archivedBy?: string
  archivedReason?: string
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

// ── Admin Completed Auctions ─────────────────────────────────────────

export type AdminAuctionPaymentStatus = 'pending_payment' | 'paid' | 'payment_overdue'
export type AdminAuctionFulfillmentFlow = 'seller_self_ship' | 'warehouse_managed'
export type AdminAuctionFulfillmentStatus =
  | 'awaiting_seller_ship'
  | 'warehouse_outbound_pending'
  | 'picked_up'
  | 'on_delivering'
  | 'delivered'
  | 'shipping_overdue'
  | 'escalated'

export interface AdminCompletedAuctionListItemDto {
  auctionId: string
  itemTitle: string
  itemPrimaryImageUrl?: string | null
  winnerId?: string | null
  winnerDisplayName?: string | null
  sellerId?: string | null
  sellerDisplayName?: string | null
  finalPrice: number
  currency?: string | null
  orderId?: string | null
  orderNumber?: string | null
  orderStatus?: string | null
  paymentStatus?: AdminAuctionPaymentStatus | null
  fulfillmentFlow?: AdminAuctionFulfillmentFlow | null
  fulfillmentStatus?: AdminAuctionFulfillmentStatus | null
  paymentDueAt?: string | null
  paidAt?: string | null
  shipByAt?: string | null
  isShippingOverdue?: boolean
  escalatedAt?: string | null
  escalationReason?: string | null
  createdAt?: string | null
}

export interface AdminCompletedAuctionDetailDto {
  summary: AdminCompletedAuctionListItemDto
  order: OrderDto
  outboundShipment?: OutboundShipmentDto | null
  monitoringAlerts: MonitoringAlertDto[]
}
