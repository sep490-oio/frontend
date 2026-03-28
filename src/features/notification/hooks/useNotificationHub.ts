import { useEffect, useState, useRef } from 'react'
import { getNotificationHub, startConnection } from '@/lib/signalr'
import { queryKeys } from '@/lib/queryClient'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { NotificationPushDto } from '@/types'

interface NotificationHubState {
  unreadCount: number
  latestNotification: NotificationPushDto | null
  connected: boolean
}

const initialState: NotificationHubState = {
  unreadCount: 0,
  latestNotification: null,
  connected: false,
}

export function useNotificationHub() {
  const [state, setState] = useState<NotificationHubState>(initialState)
  const connectionRef = useRef<ReturnType<typeof getNotificationHub> | null>(null)
  const qc = useQueryClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    connectionRef.current = getNotificationHub()
    const connection = connectionRef.current

    const connect = async () => {
      await startConnection(connection)
      setState((prev) => ({ ...prev, connected: true }))
    }

    connection.on('ReceiveNotification', (data: NotificationPushDto) => {
      setState((prev) => ({ ...prev, latestNotification: data }))
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list() })
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
    })

    connection.on('UnreadCountUpdated', (countOrObj: number | { count: number }) => {
      const count = typeof countOrObj === 'number' ? countOrObj : countOrObj?.count ?? 0
      setState((prev) => ({ ...prev, unreadCount: count }))
      qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
    })

    connect()

    return () => {
      connection.off('ReceiveNotification')
      connection.off('UnreadCountUpdated')
      setState(initialState)
    }
  }, [isAuthenticated, qc])

  return state
}
