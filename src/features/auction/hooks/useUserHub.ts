import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import { getUserHub, startConnection } from '@/lib/signalr'
import type { AuctionDetailDto, AuctionPositionChangedNotification } from '@/types'

interface AutoBidStateChangedData {
  auctionId: string
  bidderId: string
  isEnabled: boolean
  maxAmount: number
  currentAmount: number
  remainingBudget: number
  incrementAmount?: number
  status: string
  currency: string
  totalAutoBids: number
  lastAutoBidAt?: string
  stopReason?: string
  stoppedAt?: string
  lastValidationAt?: string
  serverTimestamp: string
}

/**
 * Subscribes to user-scoped realtime events on UserHub:
 * - AutoBidStateChanged → patches myAutoBid query cache
 * - AuctionPositionChanged → patches AuctionDetailDto.currentUserBidState
 *
 * UserHub auto-joins user:{userId} group on connect — no manual join needed.
 */
export function useUserHub(auctionId?: string) {
  const qc = useQueryClient()
  const connectionRef = useRef<ReturnType<typeof getUserHub> | null>(null)

  useEffect(() => {
    if (!auctionId) return

    const connection = getUserHub()
    connectionRef.current = connection
    let isActive = true

    const autoBidStateChangedHandler = (data: AutoBidStateChangedData) => {
      if (data.auctionId !== auctionId) return

      // Patch myAutoBid query cache directly
      qc.setQueryData(queryKeys.auctions.myAutoBid(data.auctionId), (current: any) => {
        if (!current && data.status === 'removed') return current

        return {
          ...current,
          id: current?.id ?? data.bidderId,
          auctionId: data.auctionId,
          bidderId: data.bidderId,
          isEnabled: data.isEnabled,
          maxAmount: { amount: data.maxAmount, currency: data.currency },
          currentAmount: { amount: data.currentAmount, currency: data.currency },
          remainingBudget: { amount: data.remainingBudget, currency: data.currency },
          incrementAmount:
            data.incrementAmount != null
              ? { amount: data.incrementAmount, currency: data.currency }
              : (current?.incrementAmount ?? null),
          status: data.status,
          totalAutoBids: data.totalAutoBids,
          lastAutoBidAt: data.lastAutoBidAt,
          stopReason: data.stopReason,
          stoppedAt: data.stoppedAt,
          lastValidationAt: data.lastValidationAt,
        }
      })

      // If terminal status (removed/cancelled), clear cache
      if (data.status === 'removed') {
        qc.setQueryData(queryKeys.auctions.myAutoBid(data.auctionId), null)
      }
    }

    const auctionPositionChangedHandler = (data: AuctionPositionChangedNotification) => {
      if (data.auctionId !== auctionId) return

      // Patch currentUserBidState in auction detail cache
      qc.setQueryData(queryKeys.auctions.detail(data.auctionId), (current: AuctionDetailDto | undefined) => {
        if (!current) return current

        return {
          ...current,
          currentUserBidState: {
            position: data.position,
            isCurrentWinner: data.isCurrentWinner,
            latestBidId: data.latestBidId,
            latestBidAmount: data.latestBidAmount,
            latestBidStatus: data.latestBidStatus,
            latestBidAt: data.timestamp,
            hasAutoBid: current.currentUserBidState?.hasAutoBid ?? false,
            autoBidStatus: current.currentUserBidState?.autoBidStatus,
          },
        }
      })
    }

    connection.on('AutoBidStateChanged', autoBidStateChangedHandler)
    connection.on('AuctionPositionChanged', auctionPositionChangedHandler)

    // Start connection (UserHub auto-joins user group on connect)
    void startConnection(connection)

    connection.onreconnected(() => {
      // Reconcile missed events
      if (isActive && auctionId) {
        qc.invalidateQueries({ queryKey: queryKeys.auctions.detail(auctionId) })
        qc.invalidateQueries({ queryKey: queryKeys.auctions.myAutoBid(auctionId) })
      }
    })

    return () => {
      isActive = false
      connection.off('AutoBidStateChanged', autoBidStateChangedHandler)
      connection.off('AuctionPositionChanged', auctionPositionChangedHandler)
    }
  }, [auctionId, qc])
}
