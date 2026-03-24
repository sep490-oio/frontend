import type { EscrowStatus, OrderReturnStatus, OrderStatus } from './enums'

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
  trackingNumber?: string
  return?: OrderReturnDto
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
