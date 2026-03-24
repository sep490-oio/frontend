import type { DisputeStatus, ReportStatus } from './enums'

// For list endpoint
export interface DisputeSummaryDto {
  id: string
  disputeNumber: string
  title: string
  status: DisputeStatus
  priority: string
  auctionId?: string
  verificationId?: string
  orderId?: string
  lastMessagePreview?: string
  lastMessageAt?: string
  unreadCount: number
  assignedTo?: string
  createdAt: string
}

// For detail endpoint
export interface DisputeThreadDto {
  meta: DisputeThreadMetaDto
  participants: DisputeParticipantDto[]
  currentUserReadState?: DisputeParticipantReadStateDto
  recentMessages: DisputeMessageDto[]
}

// Keep DisputeDto as alias for backwards compat
export type DisputeDto = DisputeSummaryDto

export interface DisputeParticipantDto {
  userId: string
  role: string
  joinedAt: string
}

export interface DisputeMessageDto {
  id: string
  disputeId: string
  senderId: string
  senderDisplayName: string
  message: string
  isInternal: boolean
  createdAt: string
  attachments?: DisputeMessageAttachmentDto[]
}

export interface DisputeMessageAttachmentDto {
  id: string
  url: string
  fileName?: string
  fileSize?: number
}

export interface DisputeThreadMetaDto {
  disputeId: string
  status: DisputeStatus
  updatedAt: string
}

export interface DisputeParticipantReadStateDto {
  disputeId: string
  userId: string
  lastReadAt: string
}

export interface DisputeUnreadUpdateDto {
  disputeId: string
  unreadCount: number
}

export interface ReportDto {
  id: string
  reporterId: string
  entityType: string
  entityId: string
  reasonCode: string
  description?: string
  status: ReportStatus
  assignedTo?: string
  createdAt: string
  resolvedAt?: string
  resolutionNotes?: string
}

export interface CreateReportRequest {
  entityType: string
  entityId: string
  reasonCode: string
  description?: string
}
