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
    enabled: !!params,
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
