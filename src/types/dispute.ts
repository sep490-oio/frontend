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

// ── Phase-3 dispute types ───────────────────────────────────────────

export interface DisputeListItemDto {
  id: string
  disputeNumber: string
  status: string
  domain?: string
  caseType?: string
  primaryTargetType?: string
  title: string
  complainantDisplayName?: string
  respondentDisplayName?: string
  assignedToDisplayName?: string
  createdAt: string
  updatedAt: string
}

export interface DisputeDetailDto extends DisputeListItemDto {
  description?: string
  contextSnapshotJson?: string
  resolutionOutcome?: string
  resolutionReason?: string
  resolutionActionSetJson?: string
  resolvedByDisplayName?: string
  resolvedAt?: string
  orderId?: string
  auctionId?: string
  shipmentId?: string
  warehouseItemId?: string
  paymentId?: string
  messages: DisputeMessageV2Dto[]
  evidence: DisputeEvidenceDto[]
  findings: DisputeFindingDto[]
  assignedToUserId?: string
  assignedAt?: string
  canAssign: boolean
  canRequestEvidence: boolean
  canAddFinding: boolean
  canResolve: boolean
  canReject: boolean
  requestedEvidenceAt?: string
  requestedEvidenceByDisplayName?: string
}

export interface DisputeAssignableUserDto {
  userId: string
  displayName: string
  role: string
  domainCapabilities: string[]
}

export interface DisputeMessageV2Dto {
  id: string
  authorDisplayName: string
  content: string
  visibility: 'external' | 'internal'
  createdAt: string
  attachments?: {
    id: string
    secureUrl: string
    fileName?: string
    resourceType: string
    format?: string
    bytes?: number
    width?: number
    height?: number
    durationSeconds?: number
  }[]
}

export interface DisputeEvidenceDto {
  id: string
  mediaUploadId: string
  secureUrl?: string
  fileName?: string
  resourceType?: string
  format?: string
  bytes?: number
  durationSeconds?: number
  createdAt: string
}

export interface AdminDisputeFindingReferenceDto {
  referenceType: string
  targetId: string
  label: string
  secureUrl?: string
  resourceType?: string
  messagePreview?: string
  createdAt?: string
}

export interface DisputeFindingDto {
  id: string
  domain: string
  authorDisplayName: string
  verdictRecommendation?: string
  summary: string
  findingNote?: string
  references?: AdminDisputeFindingReferenceDto[]
  createdAt: string
}

export interface BuyerDisputeDetailDto extends DisputeListItemDto {
  description?: string
  orderId?: string
  auctionId?: string
  messages: DisputeMessageV2Dto[]
  evidence: DisputeEvidenceDto[]
}

export interface CreateDisputeRequest {
  domain: string
  caseType: string
  title: string
  description: string
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
  lastReadAt?: string
  displayName?: string
  avatarUrl?: string
}

export interface DisputeMessageDto {
  id: string
  disputeId: string
  senderId: string
  senderDisplayName: string
  senderAvatarUrl?: string
  message: string
  isInternal: boolean
  createdAt: string
  attachments?: DisputeMessageAttachmentDto[]
}

export interface DisputeMessageAttachmentDto {
  id: string
  secureUrl: string
  fileName?: string
  bytes?: number
  resourceType?: string
  format?: string
  width?: number
  height?: number
  durationSeconds?: number
}

export interface DisputeThreadMetaDto {
  id: string
  disputeId?: string
  disputeNumber?: string
  title?: string
  description?: string
  domain?: string
  caseType?: string
  status: DisputeStatus
  priority?: string
  complainantId?: string
  respondentId?: string
  assignedTo?: string
  createdAt?: string
  resolvedAt?: string
  modifiedAt?: string
  updatedAt?: string
}

export interface DisputeParticipantReadStateDto {
  disputeId: string
  userId: string
  lastReadMessageId?: string
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
  disputeId?: string
}

export interface CreateReportRequest {
  entityType: string
  entityId: string
  reasonCode: string
  description?: string
}
