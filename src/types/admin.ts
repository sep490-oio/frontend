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
  winnerDisplayName?: string | null
  sellerDisplayName?: string | null
  finalPrice: number
  orderId?: string | null
  orderNumber?: string | null
  orderStatus?: string | null
  paymentStatus?: AdminAuctionPaymentStatus | null
  fulfillmentFlow?: AdminAuctionFulfillmentFlow | null
  fulfillmentStatus?: AdminAuctionFulfillmentStatus | null
  shipByAt?: string | null
  isShippingOverdue?: boolean
  escalatedAt?: string | null
  escalationReason?: string | null
}

export interface AdminCompletedAuctionDetailDto {
  summary: AdminCompletedAuctionListItemDto
  order: OrderDto
  outboundShipment?: OutboundShipmentDto | null
  monitoringAlerts: MonitoringAlertDto[]
}
