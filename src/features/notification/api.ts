import apiClient from '@/lib/axios'
import { queryKeys } from '@/lib/queryClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificationDto, PagedList, PaginationParams } from '@/types'

// ── Queries ─────────────────────────────────────────────────────────

export interface NotificationFilterParams extends PaginationParams {
  status?: string
}

export function useNotifications(params?: NotificationFilterParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: async () => {
      const res = await apiClient.get<PagedList<NotificationDto>>('/notifications', { params })
      return res.data
    },
    enabled: true,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const res = await apiClient.get<{ count: number }>('/notifications/unread-count')
      return res.data
    },
    refetchInterval: 60_000, // poll every 60s as fallback
  })
}

// ── Mutations ────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

// ── Action Parsing ──────────────────────────────────────────────────

export interface NotificationAction {
  type: string
  label: string
  method?: string
  endpoint?: string
  payload?: Record<string, unknown>
}

export function parseNotificationActions(actionsJson?: string | null): NotificationAction[] {
  if (!actionsJson) return []
  try {
    const parsed = JSON.parse(actionsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getActionRoute(action: NotificationAction, entityId?: string): string | null {
  switch (action.type) {
    case 'checkout_order':
      return action.payload?.orderId ? `/checkout/${action.payload.orderId}` : '/me/orders'
    case 'view_auction':
      return entityId ? `/auctions/${entityId}` : null
    case 'accept_offer':
    case 'decline_offer':
      return entityId ? `/auctions/${entityId}` : null
    default:
      return entityId ? `/auctions/${entityId}` : null
  }
}

export function getEntityRoute(entityType?: string, entityId?: string): string | null {
  if (!entityId) return null
  switch (entityType?.toLowerCase()) {
    case 'auction': return `/auctions/${entityId}`
    case 'order': return `/me/orders/${entityId}`
    case 'item': return `/items/${entityId}`
    default: return null
  }
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
