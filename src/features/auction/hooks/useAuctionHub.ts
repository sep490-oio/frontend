import { useEffect, useState, useCallback, useRef } from 'react'
import { getAuctionHub, startConnection, stopConnection } from '@/lib/signalr'
import { queryKeys } from '@/lib/queryClient'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type {
  BidNotification,
  OutbidNotification,
  AuctionStartedNotification,
  AuctionEndedNotification,
  AuctionExtendedNotification,
  AuctionCancelledNotification,
  PriceUpdateNotification,
  BuyNowReservedNotification,
  BuyNowReservationReleasedNotification,
  BuyNowNotification,
  HubCommandResult,
} from '@/types'

interface AuctionHubState {
  lastBid: BidNotification | null
  outbid: OutbidNotification | null
  auctionStarted: AuctionStartedNotification | null
  auctionEnded: AuctionEndedNotification | null
  auctionExtended: AuctionExtendedNotification | null
  auctionCancelled: AuctionCancelledNotification | null
  priceUpdate: PriceUpdateNotification | null
  buyNowReserved: BuyNowReservedNotification | null
  buyNowReservationReleased: BuyNowReservationReleasedNotification | null
  buyNowExecuted: BuyNowNotification | null
  connected: boolean
}

const initialState: AuctionHubState = {
  lastBid: null,
  outbid: null,
  auctionStarted: null,
  auctionEnded: null,
  auctionExtended: null,
  auctionCancelled: null,
  priceUpdate: null,
  buyNowReserved: null,
  buyNowReservationReleased: null,
  buyNowExecuted: null,
  connected: false,
}

export function useAuctionHub(auctionId: string) {
  const [state, setState] = useState<AuctionHubState>(initialState)
  const connectionRef = useRef<ReturnType<typeof getAuctionHub> | null>(null)
  const qc = useQueryClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!auctionId || !isAuthenticated) return

    connectionRef.current = getAuctionHub()

    const connection = connectionRef.current

    const connect = async () => {
      await startConnection(connection)
      await connection.invoke('JoinAuction', auctionId)
      setState((prev) => ({ ...prev, connected: true }))
    }

    // Register event handlers
    connection.on('BidPlaced', (data: BidNotification) => {
      setState((prev) => ({ ...prev, lastBid: data }))
      qc.invalidateQueries({ queryKey: queryKeys.auctions.bids(auctionId) })
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    })

    connection.on('Outbid', (data: OutbidNotification) => {
      setState((prev) => ({ ...prev, outbid: data }))
    })

    connection.on('AuctionStarted', (data: AuctionStartedNotification) => {
      setState((prev) => ({ ...prev, auctionStarted: data }))
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    })

    connection.on('AuctionEnded', (data: AuctionEndedNotification) => {
      setState((prev) => ({ ...prev, auctionEnded: data }))
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    })

    connection.on('AuctionExtended', (data: AuctionExtendedNotification) => {
      setState((prev) => ({ ...prev, auctionExtended: data }))
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    })

    connection.on('AuctionCancelled', (data: AuctionCancelledNotification) => {
      setState((prev) => ({ ...prev, auctionCancelled: data }))
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    })

    connection.on('PriceUpdated', (data: PriceUpdateNotification) => {
      setState((prev) => ({ ...prev, priceUpdate: data }))
    })

    connection.on('BuyNowReserved', (data: BuyNowReservedNotification) => {
      setState((prev) => ({ ...prev, buyNowReserved: data }))
    })

    connection.on('BuyNowReservationReleased', (data: BuyNowReservationReleasedNotification) => {
      setState((prev) => ({ ...prev, buyNowReservationReleased: data }))
    })

    connection.on('BuyNowExecuted', (data: BuyNowNotification) => {
      setState((prev) => ({ ...prev, buyNowExecuted: data }))
      qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
    })

    connect()

    return () => {
      connection.invoke('LeaveAuction', auctionId).catch(() => {
        // ignore errors on leave
      })
      connection.off('BidPlaced')
      connection.off('Outbid')
      connection.off('AuctionStarted')
      connection.off('AuctionEnded')
      connection.off('AuctionExtended')
      connection.off('AuctionCancelled')
      connection.off('PriceUpdated')
      connection.off('BuyNowReserved')
      connection.off('BuyNowReservationReleased')
      connection.off('BuyNowExecuted')
      stopConnection(connection)
      setState(initialState)
    }
  }, [auctionId, isAuthenticated, qc])

  const placeBid = useCallback(
    async (amount: number, currency: string, idempotencyKey: string) => {
      const connection = connectionRef.current
      if (!connection) throw new Error('SignalR not connected')
      return connection.invoke<HubCommandResult<unknown>>('PlaceBid', {
        auctionId,
        amount,
        currency,
        idempotencyKey,
      })
    },
    [auctionId],
  )

  const buyNow = useCallback(async () => {
    const connection = connectionRef.current
    if (!connection) throw new Error('SignalR not connected')
    return connection.invoke<HubCommandResult<unknown>>('BuyNow', { auctionId })
  }, [auctionId])

  const configureAutoBid = useCallback(
    async (maxAmount: number, currency: string) => {
      const connection = connectionRef.current
      if (!connection) throw new Error('SignalR not connected')
      return connection.invoke<HubCommandResult<unknown>>('ConfigureAutoBid', {
        auctionId,
        maxAmount,
        currency,
      })
    },
    [auctionId],
  )

  const watchAuction = useCallback(
    async (notifyOnBid: boolean, notifyOnEnd: boolean) => {
      const connection = connectionRef.current
      if (!connection) throw new Error('SignalR not connected')
      return connection.invoke<HubCommandResult<unknown>>('WatchAuction', {
        auctionId,
        notifyOnBid,
        notifyOnEnd,
      })
    },
    [auctionId],
  )

  return {
    ...state,
    placeBid,
    buyNow,
    configureAutoBid,
    watchAuction,
  }
}
