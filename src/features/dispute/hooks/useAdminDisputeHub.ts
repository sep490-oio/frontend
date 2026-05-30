import { useEffect, useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/useAuth'
import { queryKeys } from '@/lib/queryClient'
import { getDisputeHub, startConnection } from '@/lib/signalr'
import type {
  DisputeMessageDto,
  DisputeThreadMetaDto,
} from '@/types'

interface AdminDisputeHubState {
  /** New messages received via SignalR since the component mounted. */
  newMessages: DisputeMessageDto[]
  /** Latest meta update received via SignalR. */
  disputeMeta: DisputeThreadMetaDto | null
  connected: boolean
}

const initialState: AdminDisputeHubState = {
  newMessages: [],
  disputeMeta: null,
  connected: false,
}

/**
 * SignalR hook for the admin dispute detail page.
 *
 * Joins the dispute room and listens for new messages and dispute meta updates.
 * On every new event, it invalidates the admin-specific query cache so the page
 * re-fetches automatically.
 */
export function useAdminDisputeHub(disputeId: string) {
  const [state, setState] = useState<AdminDisputeHubState>(initialState)
  const connectionRef = useRef<ReturnType<typeof getDisputeHub> | null>(null)
  const qc = useQueryClient()
  const { isAuthenticated } = useAuth()

  // Expose a manual refetch trigger the page can call after sending its own messages
  const invalidateDetail = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(disputeId) })
  }, [qc, disputeId])

  useEffect(() => {
    if (!disputeId || !isAuthenticated) {
      return
    }

    const connection = getDisputeHub()
    connectionRef.current = connection
    let isActive = true

    const joinDispute = async () => {
      const started = await startConnection(connection)
      if (!started || !isActive) {
        return
      }

      await connection.invoke('JoinDispute', disputeId)
      if (isActive) {
        setState((prev) => ({ ...prev, connected: true }))
      }
    }

    // ── Event handlers ──────────────────────────────────────────────

    const messageReceivedHandler = (data: DisputeMessageDto) => {
      setState((prev) => ({
        ...prev,
        connected: true,
        newMessages: [...prev.newMessages, data],
      }))
      // Invalidate admin detail so the full dispute object (including messages array) is refetched
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(disputeId) })
    }

    const disputeUpdatedHandler = (data: DisputeThreadMetaDto) => {
      setState((prev) => ({ ...prev, connected: true, disputeMeta: data }))
      qc.invalidateQueries({ queryKey: queryKeys.admin.disputeDetail(disputeId) })
    }

    connection.on('MessageReceived', messageReceivedHandler)
    connection.on('DisputeUpdated', disputeUpdatedHandler)

    connection.onreconnecting(() => {
      if (isActive) {
        setState((prev) => ({ ...prev, connected: false }))
      }
    })
    connection.onreconnected(() => {
      void joinDispute()
    })
    connection.onclose(() => {
      if (isActive) {
        setState((prev) => ({ ...prev, connected: false }))
      }
    })

    void joinDispute()

    return () => {
      isActive = false
      void connection.invoke('LeaveDispute', disputeId).catch(() => undefined)
      connection.off('MessageReceived', messageReceivedHandler)
      connection.off('DisputeUpdated', disputeUpdatedHandler)
      setState(initialState)
    }
  }, [disputeId, isAuthenticated, qc])

  return { ...state, invalidateDetail }
}
