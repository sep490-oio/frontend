import { useEffect, useRef, useCallback } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { startConnection, stopConnection } from '@/lib/signalr'

export function useSignalR(getConnection: () => HubConnection, autoConnect = true) {
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!autoConnect) return

    const connection = getConnection()
    connectionRef.current = connection

    startConnection(connection)

    return () => {
      stopConnection(connection)
    }
  }, [getConnection, autoConnect])

  const invoke = useCallback(async <T = void>(method: string, ...args: unknown[]): Promise<T> => {
    const connection = connectionRef.current
    if (!connection) throw new Error('SignalR not connected')
    return connection.invoke<T>(method, ...args)
  }, [])

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    const connection = connectionRef.current ?? getConnection()
    connectionRef.current = connection
    connection.on(event, callback)
    return () => connection.off(event, callback)
  }, [getConnection])

  return { invoke, on, connection: connectionRef }
}
