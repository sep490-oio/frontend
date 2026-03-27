import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { upsertItemQuestionCaches } from '@/features/item/api'
import { useAuth } from '@/hooks/useAuth'
import { queryKeys } from '@/lib/queryClient'
import { getAuctionHub, startConnection } from '@/lib/signalr'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import { AuctionStatus, BidStatus } from '@/types/enums'
import type {
  AuctionDetailDto,
  AuctionStartedNotification,
  AuctionEndedNotification,
  AuctionExtendedNotification,
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
  PriceUpdateNotification,
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
  lastError: { message: string; code?: string } | null
  connected: boolean
  lastSyncedAt: number | null
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
  lastError: null,
  connected: false,
  lastSyncedAt: null,
}

function toBidDto(data: BidNotification, currency: string): BidDto {
  return {
    id: data.bidId,
    auctionId: data.auctionId,
    bidderId: data.bidderId,
    amount: {
      amount: data.amount,
      currency,
      symbol: currency,
    },
    isAutoBid: data.isAutoBid,
    status: BidStatus.Winning,
    createdAt: data.timestamp,
  }
}

function appendPriceHistory(
  history: AuctionDetailDto['priceHistory'],
  timestamp: string,
  price: number,
): AuctionDetailDto['priceHistory'] {
  const lastPoint = history[history.length - 1]
  if (lastPoint && lastPoint.timestamp === timestamp && lastPoint.price === price) {
    return history
  }

  return [...history, { timestamp, price }]
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

function patchAuctionDetail(
  data: AuctionDetailDto,
  updater: (current: AuctionDetailDto) => AuctionDetailDto,
): AuctionDetailDto {
  return updater(data)
}

export function useAuctionHub(auctionId?: string, itemId?: string) {
  const [state, setState] = useState<AuctionHubState>(initialState)
  const connectionRef = useRef<ReturnType<typeof getAuctionHub> | null>(null)
  const outbidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qc = useQueryClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if ((!auctionId && !itemId) || !isAuthenticated) {
      return
    }

    const connection = getAuctionHub()
    connectionRef.current = connection
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

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId))
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      setState((prev) => ({
        ...prev,
        lastBid: {
          ...data,
          bidderName: data.bidderDisplayName,
          bidCount: data.totalBids,
          currency: eventCurrency,
        },
        outbid: null, // Clear stale outbid state — bid situation has changed
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        const currency = current.auction.currency || DEFAULT_CURRENCY
        const bid = toBidDto(data, currency)

        return patchAuctionDetail(current, (detail) => ({
          ...detail,
          auction: {
            ...detail.auction,
            currentPrice: {
              ...detail.auction.currentPrice,
              amount: data.currentPrice,
              currency,
              symbol: detail.auction.currentPrice.symbol || currency,
            },
            minimumBidAmount: {
              ...detail.auction.minimumBidAmount,
              amount: data.minimumNextBid,
              currency,
              symbol: detail.auction.minimumBidAmount.symbol || currency,
            },
            bidCount: data.totalBids,
            currentWinnerId: data.bidderId,
          },
          recentBids: [bid, ...detail.recentBids.filter((item) => item.id !== bid.id)].slice(0, 10),
          priceHistory: appendPriceHistory(detail.priceHistory, data.timestamp, data.currentPrice),
        }))
      })

      qc.setQueryData<PagedList<BidDto>>(queryKeys.auctions.bids(data.auctionId), (current) => {
        const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId))
        const currency = detail?.auction.currency || DEFAULT_CURRENCY
        return upsertBidPage(current, toBidDto(data, currency), data.totalBids)
      })

      qc.invalidateQueries({ queryKey: queryKeys.wallet.summary() })
    }

    const outbidHandler = (data: OutbidNotification) => {
      const detail = auctionId
        ? qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detail(auctionId))
        : undefined
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      // Clear any existing auto-fade timer before setting new outbid
      if (outbidTimerRef.current) {
        clearTimeout(outbidTimerRef.current)
      }

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

      // Auto-fade: clear outbid after 10 seconds if no other event clears it first
      outbidTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, outbid: null }))
        outbidTimerRef.current = null
      }, 10_000)

      if (!auctionId || data.auctionId !== auctionId) {
        return
      }

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            currentPrice: {
              ...current.auction.currentPrice,
              amount: data.newHighAmount,
            },
            minimumBidAmount: {
              ...current.auction.minimumBidAmount,
              amount: data.minimumNextBid,
            },
          },
        }
      })
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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            status: AuctionStatus.Active,
            startTime: data.startTime,
            endTime: data.endTime,
          },
        }
      })
    }

    const auctionEndedHandler = (data: AuctionEndedNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId))
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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            status: data.winnerId ? AuctionStatus.Sold : AuctionStatus.Ended,
            currentPrice: {
              ...current.auction.currentPrice,
              amount: data.finalPrice,
            },
            bidCount: data.totalBids,
            currentWinnerId: data.winnerId,
            isReserveMet: data.reserveMet,
          },
        }
      })

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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            endTime: data.newEndTime,
            extensionCount: (current.auction.extensionCount || 0) + 1,
          },
        }
      })
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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            status: AuctionStatus.Cancelled,
          },
        }
      })
    }

    const priceUpdatedHandler = (data: PriceUpdateNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId))
      const eventCurrency = detail?.auction.currency || DEFAULT_CURRENCY

      setState((prev) => ({
        ...prev,
        priceUpdate: {
          ...data,
          currency: eventCurrency,
        },
        connected: true,
        lastSyncedAt: Date.now(),
      }))

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            currentPrice: {
              ...current.auction.currentPrice,
              amount: data.currentPrice,
            },
            minimumBidAmount: {
              ...current.auction.minimumBidAmount,
              amount: data.minimumNextBid,
            },
            bidCount: data.totalBids,
            remainingTime: data.remainingTime,
          },
        }
      })
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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            isBuyNowReserved: true,
            buyNowReservedUntil: data.expiresAt,
          },
        }
      })
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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            isBuyNowReserved: false,
            buyNowReservedUntil: undefined,
          },
        }
      })
    }

    const buyNowExecutedHandler = (data: BuyNowNotification) => {
      if (auctionId && data.auctionId !== auctionId) {
        return
      }

      const detail = qc.getQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId))
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

      qc.setQueryData<AuctionDetailDto>(queryKeys.auctions.detail(data.auctionId), (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          auction: {
            ...current.auction,
            status: AuctionStatus.Sold,
            currentPrice: {
              ...current.auction.currentPrice,
              amount: data.price,
            },
            currentWinnerId: data.buyerId,
            isBuyNowReserved: false,
          },
        }
      })

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

    connection.on('BidPlaced', bidPlacedHandler)
    connection.on('Outbid', outbidHandler)
    connection.on('AuctionStarted', auctionStartedHandler)
    connection.on('AuctionEnded', auctionEndedHandler)
    connection.on('AuctionExtended', auctionExtendedHandler)
    connection.on('AuctionCancelled', auctionCancelledHandler)
    connection.on('PriceUpdated', priceUpdatedHandler)
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
    })
    connection.onclose(() => {
      markDisconnected()
    })

    void joinRooms()

    return () => {
      isActive = false

      // Clear outbid auto-fade timer
      if (outbidTimerRef.current) {
        clearTimeout(outbidTimerRef.current)
        outbidTimerRef.current = null
      }

      if (auctionId) {
        void connection.invoke('LeaveAuction', auctionId).catch(() => undefined)
      }

      if (itemId) {
        void connection.invoke('LeaveItem', itemId).catch(() => undefined)
      }

      connection.off('BidPlaced', bidPlacedHandler)
      connection.off('Outbid', outbidHandler)
      connection.off('AuctionStarted', auctionStartedHandler)
      connection.off('AuctionEnded', auctionEndedHandler)
      connection.off('AuctionExtended', auctionExtendedHandler)
      connection.off('AuctionCancelled', auctionCancelledHandler)
      connection.off('PriceUpdated', priceUpdatedHandler)
      connection.off('BuyNowReserved', buyNowReservedHandler)
      connection.off('BuyNowReservationReleased', buyNowReservationReleasedHandler)
      connection.off('BuyNowExecuted', buyNowExecutedHandler)
      connection.off('Error', errorHandler)
      connection.off('QuestionAsked', questionAskedHandler)
      connection.off('QuestionAnswered', questionAnsweredHandler)

      setState(initialState)
    }
  }, [auctionId, itemId, isAuthenticated, qc])

  const placeBid = useCallback(
    async (amount: number, currency: string, idempotencyKey: string) => {
      const connection = connectionRef.current
      if (!connection || !auctionId) {
        throw new Error('SignalR not connected')
      }

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
    if (!connection || !auctionId) {
      throw new Error('SignalR not connected')
    }

    return connection.invoke<HubCommandResult<unknown>>('BuyNow', { auctionId })
  }, [auctionId])

  const configureAutoBid = useCallback(
    async (maxAmount: number, currency: string) => {
      const connection = connectionRef.current
      if (!connection || !auctionId) {
        throw new Error('SignalR not connected')
      }

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
