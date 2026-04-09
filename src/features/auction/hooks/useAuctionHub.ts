import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { upsertItemQuestionCaches } from '@/features/item/api'
import { queryKeys } from '@/lib/queryClient'
import { getAuctionHub, startConnection } from '@/lib/signalr'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import { BidStatus } from '@/types/enums'
import type {
  AuctionDetailDto,
  AuctionStartedNotification,
  AuctionEndedNotification,
  AuctionExtendedNotification,
  AuctionStateChangedNotification,
  AuctionCancelledNotification,
  BidDto,
  BidNotification,
  BuyNowNotification,
  BuyNowReservedNotification,
  BuyNowReservationReleasedNotification,
  HubCommandResult,
  ItemQuestionNotification,
  OutbidNotification,
  PagedList,
  PlaceBidResultDto,
  PriceHistoryPoint,
} from '@/types'

interface AuctionHubState {
  lastBid: BidNotification | null
  outbid: OutbidNotification | null
  auctionStarted: AuctionStartedNotification | null
  auctionEnded: AuctionEndedNotification | null
  auctionExtended: AuctionExtendedNotification | null
  auctionCancelled: AuctionCancelledNotification | null
  buyNowReserved: BuyNowReservedNotification | null
  buyNowReservationReleased: BuyNowReservationReleasedNotification | null
  buyNowExecuted: BuyNowNotification | null
  lastError: { message: string; code?: string } | null
  connected: boolean
  lastSyncedAt: number | null
  serverTimeOffset: number
}

const initialState: AuctionHubState = {
  lastBid: null,
  outbid: null,
  auctionStarted: null,
  auctionEnded: null,
  auctionExtended: null,
  auctionCancelled: null,
  buyNowReserved: null,
  buyNowReservationReleased: null,
  buyNowExecuted: null,
  lastError: null,
  connected: false,
  lastSyncedAt: null,
  serverTimeOffset: 0,
}

function appendPriceHistory(
  history: AuctionDetailDto['priceHistory'] | undefined,
  point: PriceHistoryPoint,
): AuctionDetailDto['priceHistory'] {
  const arr = history ?? []
  const nextTimestamp = point.recordedAt ?? point.timestamp ?? ''
  const nextPrice = typeof point.price === 'object' ? point.price.amount : point.price

  const exists = arr.some((item) => {
    const itemTimestamp = item.recordedAt ?? item.timestamp ?? ''
    const itemPrice = typeof item.price === 'object' ? item.price.amount : item.price

    if (point.bidId && item.bidId) {
      return item.bidId === point.bidId
    }

    return itemTimestamp === nextTimestamp && itemPrice === nextPrice && item.type === point.type
  })

  if (exists) {
    return arr
  }

  return [point, ...arr]
}

function upsertBidPage(
  current: PagedList<BidDto> | undefined,
  bid: BidDto,
  totalBids: number,
): PagedList<BidDto> | undefined {
  if (!current) {
    return current
  }

  const existingIndex = current.items.findIndex((item) => item.id === bid.id)
  if (existingIndex >= 0) {
    return {
      ...current,
      items: current.items.map((item, index) => (index === existingIndex ? bid : item)),
    }
  }

  const pageSize = current.metadata.pageSize || current.items.length || 1

  return {
    items: [bid, ...current.items].slice(0, pageSize),
    metadata: {
      ...current.metadata,
      totalCount: totalBids,
      hasNext: totalBids > current.metadata.currentPage * pageSize,
    },
  }
}

function applyAuctionRealtimePatch(
  qc: Pick<QueryClient, 'setQueryData' | 'getQueryData'>,
  data: AuctionStateChangedNotification,
  userScope: string | null | undefined,
) {
  const currency = data.currency || DEFAULT_CURRENCY
  const bid: BidDto | null = data.lastBid
    ? {
        id: data.lastBid.bidId,
        auctionId: data.auctionId,
        bidderId: data.lastBid.bidderId,
        bidderDisplayName: data.lastBid.bidderDisplayName,
        amount: { amount: data.lastBid.amount, currency, symbol: currency },
        isAutoBid: data.lastBid.isAutoBid,
        status: BidStatus.Winning,
        createdAt: data.lastBid.timestamp,
      }
    : null

  qc.setQueryData(queryKeys.auctions.detailFor(data.auctionId, userScope), (current: AuctionDetailDto | undefined) => {
    if (!current) return current

    return {
      ...current,
      auction: {
        ...current.auction,
        status: data.status,
        currentPrice: {
          ...current.auction.currentPrice,
          amount: data.currentPrice,
          currency,
        },
        minimumBidAmount: {
          ...current.auction.minimumBidAmount,
          amount: data.minimumNextBid,
          currency,
        },
        bidCount: data.bidCount,
        endTime: data.endTime,
        currentWinnerId: data.winnerId ?? current.auction.currentWinnerId,
        isBuyNowReserved: data.isBuyNowReserved,
        buyNowReservedUntil: data.buyNowReservedUntil ?? undefined,
        autoExtend: data.autoExtend,
        extensionMinutes: data.extensionMinutes,
        extensionCount: data.extensionCount,
        isEndingSoon: data.isEndingSoon,
      },
      recentBids: bid
        ? [bid, ...current.recentBids.filter((item) => item.id !== bid.id)].slice(0, 20)
        : current.recentBids,
      priceHistory: data.newPriceHistoryPoint
        ? appendPriceHistory(
            current.priceHistory,
            {
              price: data.newPriceHistoryPoint.price,
              type: data.newPriceHistoryPoint.type,
              bidId: data.newPriceHistoryPoint.bidId,
              bidderDisplayName: data.newPriceHistoryPoint.bidderDisplayName,
              recordedAt: data.newPriceHistoryPoint.recordedAt,
            },
          )
        : current.priceHistory,
    }
  })

  // Update bid page if lastBid is present
  if (bid) {
    qc.setQueryData(queryKeys.auctions.bids(data.auctionId), (current: PagedList<BidDto> | undefined) =>
      upsertBidPage(current, bid, data.bidCount),
    )
  }
}

export function useAuctionHub(auctionId?: string, itemId?: string, currentUserId?: string) {
  const [state, setState] = useState<AuctionHubState>(initialState)
  const connectionRef = useRef<ReturnType<typeof getAuctionHub> | null>(null)
  const latestStateVersionRef = useRef(0)
  const qc = useQueryClient()

  useEffect(() => {
    if (!auctionId && !itemId) {
      return
    }

    const connection = getAuctionHub()
    connectionRef.current = connection
    latestStateVersionRef.current = 0
    let isActive = true

    const markConnected = () => {
      if (!isActive) {
        return
      }

      setState((prev) => ({
        ...prev,
        connected: true,
        lastError: null,
        lastSyncedAt: Date.now(),
      }))
    }

    const markDisconnected = () => {
      if (!isActive) {
        return
      }

      setState((prev) => ({
        ...prev,
        connected: false,
      }))
    }

    const joinRooms = async () => {
      const started = await startConnection(connection)
      if (!started || !isActive) {
        return
      }

      try {
        if (auctionId) {
          await connection.invoke('JoinAuction', auctionId)
        }

        if (itemId) {
          await connection.invoke('JoinItem', itemId)
        }

        markConnected()

        try {
          const serverTime = await connection.invoke<string>('GetServerTime')
          const serverMs = new Date(serverTime).getTime()
          const clientMs = Date.now()
          const offset = serverMs - clientMs
          setState((prev) => ({ ...prev, serverTimeOffset: offset }))
        } catch {
          // Ignore — fallback to client time
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        setState((prev) => ({
          ...prev,
          connected: false,
          lastError: {
            message: error instanceof Error ? error.message : 'Failed to join realtime room',
          },
        }))
      }
    }

    const bidPlacedHandler = (data: BidNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detailFor(data.auctionId, currentUserId))
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      setState((prev) => ({
        ...prev,
        lastBid: {
          ...data,
          bidderName: data.bidderDisplayName,
          bidCount: data.totalBids,
          currency: eventCurrency,
        },
        // Clear outbid only when the current user placed a new bid
        outbid: currentUserId && data.bidderId === currentUserId ? null : prev.outbid,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged — only keep wallet invalidation
      qc.invalidateQueries({ queryKey: queryKeys.wallet.summary() })
    }

    const outbidHandler = (data: OutbidNotification) => {
      const detail = auctionId
        ? qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detailFor(auctionId, currentUserId))
        : undefined
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      setState((prev) => ({
        ...prev,
        outbid: {
          ...data,
          newAmount: data.newHighAmount,
          currency: eventCurrency,
        },
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged
    }

    const auctionStartedHandler = (data: AuctionStartedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      setState((prev) => ({
        ...prev,
        auctionStarted: data,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged
    }

    const auctionEndedHandler = (data: AuctionEndedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detailFor(data.auctionId, currentUserId))
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      setState((prev) => ({
        ...prev,
        auctionEnded: {
          ...data,
          winnerName: data.winnerDisplayName,
          currency: eventCurrency,
        },
        outbid: null, // Clear outbid — auction is no longer active
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged — only keep wallet invalidation
      qc.invalidateQueries({ queryKey: queryKeys.wallet.summary() })
    }

    const auctionExtendedHandler = (data: AuctionExtendedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      setState((prev) => ({
        ...prev,
        auctionExtended: data,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged
    }

    const auctionCancelledHandler = (data: AuctionCancelledNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      setState((prev) => ({
        ...prev,
        auctionCancelled: data,
        outbid: null, // Clear outbid — auction is cancelled
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged
    }

    const buyNowReservedHandler = (data: BuyNowReservedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      setState((prev) => ({
        ...prev,
        buyNowReserved: data,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged
    }

    const buyNowReservationReleasedHandler = (data: BuyNowReservationReleasedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      setState((prev) => ({
        ...prev,
        buyNowReservationReleased: data,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged
    }

    const buyNowExecutedHandler = (data: BuyNowNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detailFor(data.auctionId, currentUserId))
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      setState((prev) => ({
        ...prev,
        buyNowExecuted: {
          ...data,
          currency: eventCurrency,
        },
        outbid: null, // Clear outbid — auction sold via buy now
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      // Cache patching handled by AuctionStateChanged — only keep wallet invalidation
      qc.invalidateQueries({ queryKey: queryKeys.wallet.summary() })
    }

    const errorHandler = (data: { message: string; code?: string }) => {
      setState((prev) => ({
        ...prev,
        lastError: data,
      }))
    }

    const questionAskedHandler = (data: ItemQuestionNotification) => {
      if (itemId && data.itemId !== itemId) {
        return
      }

      setState((prev) => ({
        ...prev,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      upsertItemQuestionCaches(qc, data.itemId, data)
      qc.invalidateQueries({ queryKey: queryKeys.items.questionsRoot(data.itemId) })
    }

    const auctionStateChangedHandler = (data: AuctionStateChangedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const versionMs = Date.parse(data.versionTimestamp || data.serverTimestamp)
      if (Number.isFinite(versionMs) && versionMs < latestStateVersionRef.current) {
        return
      }

      if (Number.isFinite(versionMs)) {
        latestStateVersionRef.current = versionMs
      }

      applyAuctionRealtimePatch(qc, data, currentUserId)

      setState((prev) => ({
        ...prev,
        connected: true,
        lastSyncedAt: Date.now(),
      }))
    }

    const questionAnsweredHandler = (data: ItemQuestionNotification) => {
      if (itemId && data.itemId !== itemId) {
        return
      }

      setState((prev) => ({
        ...prev,
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      upsertItemQuestionCaches(qc, data.itemId, data)
      qc.invalidateQueries({ queryKey: queryKeys.items.questionsRoot(data.itemId) })
    }

    connection.on('AuctionStateChanged', auctionStateChangedHandler)
    connection.on('BidPlaced', bidPlacedHandler)
    connection.on('Outbid', outbidHandler)
    connection.on('AuctionStarted', auctionStartedHandler)
    connection.on('AuctionEnded', auctionEndedHandler)
    connection.on('AuctionExtended', auctionExtendedHandler)
    connection.on('AuctionCancelled', auctionCancelledHandler)
    connection.on('BuyNowReserved', buyNowReservedHandler)
    connection.on('BuyNowReservationReleased', buyNowReservationReleasedHandler)
    connection.on('BuyNowExecuted', buyNowExecutedHandler)
    connection.on('Error', errorHandler)
    connection.on('QuestionAsked', questionAskedHandler)
    connection.on('QuestionAnswered', questionAnsweredHandler)

    connection.onreconnecting(() => {
      markDisconnected()
    })
    connection.onreconnected(() => {
      void joinRooms()
      // Reconcile any events missed during disconnection
      if (auctionId) qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
      if (itemId) qc.invalidateQueries({ queryKey: queryKeys.items.detail(itemId) })
    })
    connection.onclose(() => {
      markDisconnected()
      // signalr.ts may restart the connection after onclose (manual retry).
      // That path does NOT trigger onreconnected, so we must rejoin rooms ourselves.
      // Wait for the restart attempt (signalr.ts retries after 3-5s) then rejoin.
      setTimeout(() => {
        if (isActive) void joinRooms()
      }, 6000)
    })

    void joinRooms()

    return () => {
      isActive = false
      latestStateVersionRef.current = 0

      if (auctionId) {
        void connection.invoke('LeaveAuction', auctionId).catch(() => undefined)
      }

      if (itemId) {
        void connection.invoke('LeaveItem', itemId).catch(() => undefined)
      }

      connection.off('AuctionStateChanged', auctionStateChangedHandler)
      connection.off('BidPlaced', bidPlacedHandler)
      connection.off('Outbid', outbidHandler)
      connection.off('AuctionStarted', auctionStartedHandler)
      connection.off('AuctionEnded', auctionEndedHandler)
      connection.off('AuctionExtended', auctionExtendedHandler)
      connection.off('AuctionCancelled', auctionCancelledHandler)
      connection.off('BuyNowReserved', buyNowReservedHandler)
      connection.off('BuyNowReservationReleased', buyNowReservationReleasedHandler)
      connection.off('BuyNowExecuted', buyNowExecutedHandler)
      connection.off('Error', errorHandler)
      connection.off('QuestionAsked', questionAskedHandler)
      connection.off('QuestionAnswered', questionAnsweredHandler)

      setState(initialState)
    }
  }, [auctionId, itemId, qc, currentUserId])

  const placeBid = useCallback(
    async (amount: number, currency: string, idempotencyKey: string) => {
      const connection = connectionRef.current
      if (!connection || !auctionId) {
        throw new Error('SignalR not connected')
      }

      return connection.invoke<HubCommandResult<PlaceBidResultDto>>('PlaceBid', auctionId, amount, currency, idempotencyKey)
    },
    [auctionId],
  )

  const buyNow = useCallback(async () => {
    const connection = connectionRef.current
    if (!connection || !auctionId) {
      throw new Error('SignalR not connected')
    }

    return connection.invoke<HubCommandResult<unknown>>('BuyNow', auctionId)
  }, [auctionId])

  const configureAutoBid = useCallback(
    async (maxAmount: number, currency: string) => {
      const connection = connectionRef.current
      if (!connection || !auctionId) {
        throw new Error('SignalR not connected')
      }

      return connection.invoke<HubCommandResult<unknown>>('ConfigureAutoBid', auctionId, maxAmount, currency)
    },
    [auctionId],
  )

  const watchAuction = useCallback(
    async (notifyOnBid: boolean, notifyOnEnd: boolean) => {
      const connection = connectionRef.current
      if (!connection || !auctionId) {
        throw new Error('SignalR not connected')
      }

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
