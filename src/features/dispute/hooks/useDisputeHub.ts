import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/useAuth'
import { queryKeys } from '@/lib/queryClient'
import { getDisputeHub, startConnection } from '@/lib/signalr'
import type {
  DisputeMessageDto,
  DisputeParticipantReadStateDto,
  DisputeThreadMetaDto,
  DisputeUnreadUpdateDto,
} from '@/types'

interface DisputeHubState {
  messages: DisputeMessageDto[]
  disputeMeta: DisputeThreadMetaDto | null
  readState: DisputeParticipantReadStateDto | null
  unreadUpdate: DisputeUnreadUpdateDto | null
  connected: boolean
}

const initialState: DisputeHubState = {
  messages: [],
  disputeMeta: null,
  readState: null,
  unreadUpdate: null,
  connected: false,
}

export function useDisputeHub(disputeId: string) {
  const [state, setState] = useState<DisputeHubState>(initialState)
  const connectionRef = useRef<ReturnType<typeof getDisputeHub> | null>(null)
  const qc = useQueryClient()
  const { isAuthenticated } = useAuth()

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

    const messageReceivedHandler = (data: DisputeMessageDto) => {
      setState((prev) => ({
        ...prev,
        connected: true,
        messages: [...prev.messages, data],
      }))
      qc.invalidateQueries({ queryKey: queryKeys.disputes.messages(disputeId) })
    }

    const readStateUpdatedHandler = (data: DisputeParticipantReadStateDto) => {
      setState((prev) => ({ ...prev, connected: true, readState: data }))
    }

    const disputeUpdatedHandler = (data: DisputeThreadMetaDto) => {
      setState((prev) => ({ ...prev, connected: true, disputeMeta: data }))
      qc.invalidateQueries({ queryKey: queryKeys.disputes.detail(disputeId) })
    }

    const disputeUnreadUpdatedHandler = (data: DisputeUnreadUpdateDto) => {
      setState((prev) => ({ ...prev, connected: true, unreadUpdate: data }))
      qc.invalidateQueries({ queryKey: queryKeys.disputes.list() })
    }

    connection.on('MessageReceived', messageReceivedHandler)
    connection.on('ReadStateUpdated', readStateUpdatedHandler)
    connection.on('DisputeUpdated', disputeUpdatedHandler)
    connection.on('DisputeUnreadUpdated', disputeUnreadUpdatedHandler)

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
      connection.off('ReadStateUpdated', readStateUpdatedHandler)
      connection.off('DisputeUpdated', disputeUpdatedHandler)
      connection.off('DisputeUnreadUpdated', disputeUnreadUpdatedHandler)
      setState(initialState)
    }
  }, [disputeId, isAuthenticated, qc])

  return state
}
