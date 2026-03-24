import { useEffect, useState, useRef } from 'react'
import { getDisputeHub, startConnection, stopConnection } from '@/lib/signalr'
import { queryKeys } from '@/lib/queryClient'
import { useQueryClient } from '@tanstack/react-query'
import type {
  DisputeMessageDto,
  DisputeThreadMetaDto,
  DisputeParticipantReadStateDto,
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
  const connectionRef = useRef(getDisputeHub())
  const qc = useQueryClient()

  useEffect(() => {
    if (!disputeId) return

    const connection = connectionRef.current

    const connect = async () => {
      await startConnection(connection)
      await connection.invoke('JoinDispute', disputeId)
      setState((prev) => ({ ...prev, connected: true }))
    }

    connection.on('MessageReceived', (data: DisputeMessageDto) => {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, data],
      }))
      qc.invalidateQueries({ queryKey: queryKeys.disputes.messages(disputeId) })
    })

    connection.on('ReadStateUpdated', (data: DisputeParticipantReadStateDto) => {
      setState((prev) => ({ ...prev, readState: data }))
    })

    connection.on('DisputeUpdated', (data: DisputeThreadMetaDto) => {
      setState((prev) => ({ ...prev, disputeMeta: data }))
      qc.invalidateQueries({ queryKey: queryKeys.disputes.detail(disputeId) })
    })

    connection.on('DisputeUnreadUpdated', (data: DisputeUnreadUpdateDto) => {
      setState((prev) => ({ ...prev, unreadUpdate: data }))
      qc.invalidateQueries({ queryKey: queryKeys.disputes.list() })
    })

    connect()

    return () => {
      connection.invoke('LeaveDispute', disputeId).catch(() => {
        // ignore errors on leave
      })
      connection.off('MessageReceived')
      connection.off('ReadStateUpdated')
      connection.off('DisputeUpdated')
      connection.off('DisputeUnreadUpdated')
      stopConnection(connection)
      setState(initialState)
    }
  }, [disputeId, qc])

  return state
}
