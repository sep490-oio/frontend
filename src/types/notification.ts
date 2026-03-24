import type { NotificationStatus } from './enums'

export interface NotificationDto {
  id: string
  userId: string
  notificationType: string
  eventType: string
  title: string
  message: string
  priority: string
  status: NotificationStatus
  entityType?: string
  entityId?: string
  metadata?: string
  relatedEntities?: string
  actions?: string
  createdAt: string
  readAt?: string
  expiresAt?: string
}

export interface NotificationPushDto {
  id: string
  notificationType: string
  eventType: string
  title: string
  message: string
  createdAt: string
}
