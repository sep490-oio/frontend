import { useEffect, useState, useRef } from 'react'
import { getUserHub, startConnection } from '@/lib/signalr'
import { queryKeys } from '@/lib/queryClient'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { WalletSummaryDto } from '@/types'

const ENABLED = import.meta.env.VITE_ENABLE_USER_HUB !== 'false'

interface UserHubState {
  connected: boolean
}

export function useUserHub() {
  const [state, setState] = useState<UserHubState>({ connected: false })
  const connectionRef = useRef<ReturnType<typeof getUserHub> | null>(null)
  const qc = useQueryClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !ENABLED) return

    const connection = getUserHub()
    connectionRef.current = connection

    const connect = async () => {
      const started = await startConnection(connection)
      if (started) {
        setState({ connected: true })
      }
    }

    // Wallet events — patch cache directly
    connection.on('WalletUpdated', (data: { availableBalance: number; pendingBalance: number; totalBalance: number }) => {
      qc.setQueryData<WalletSummaryDto>(queryKeys.wallet.summary(), (old) =>
        old
          ? {
              ...old,
              availableBalance: data.availableBalance,
              pendingBalance: data.pendingBalance,
              totalBalance: data.totalBalance,
            }
          : old,
      )
      qc.invalidateQueries({ queryKey: queryKeys.wallet.transactions() })
    })

    // Bid events — invalidate to trigger refetch
    connection.on('BidStatusChanged', () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.myBids() })
    })

    connection.on('AuctionOutcomeForBidder', () => {
      qc.invalidateQueries({ queryKey: queryKeys.auctions.myBids() })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.watchlist() })
    })

    // Order events — invalidate to trigger refetch
    connection.on('OrderStatusChanged', (data: { orderId: string }) => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(data.orderId) })
    })

    connection.onreconnecting(() => setState({ connected: false }))
    connection.onreconnected(() => setState({ connected: true }))
    connection.onclose(() => setState({ connected: false }))

    connect()

    return () => {
      connection.off('WalletUpdated')
      connection.off('BidStatusChanged')
      connection.off('AuctionOutcomeForBidder')
      connection.off('OrderStatusChanged')
      setState({ connected: false })
    }
  }, [isAuthenticated, qc])

  return state
}
