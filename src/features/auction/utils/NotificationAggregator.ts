import type { BidNotification } from '@/types/auction'

export interface AggregatedBidNotification {
  count: number
  startPrice: number
  endPrice: number
  hasAutoBids: boolean
  userPosition: 'winning' | 'outbid' | 'unknown'
}

type FlushCallback = (
  aggregated: AggregatedBidNotification | null,
  individual: BidNotification | null,
) => void

/**
 * Buffers BidPlaced events within a time window.
 * If >3 events in window: renders single summary.
 * If <=3: passes through individually.
 */
export class NotificationAggregator {
  private buffer: BidNotification[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private windowMs: number
  private onFlush: FlushCallback

  constructor(windowMs: number, onFlush: FlushCallback) {
    this.windowMs = windowMs
    this.onFlush = onFlush
  }

  push(notification: BidNotification): void {
    this.buffer.push(notification)

    // Reset the flush timer on each new event
    if (this.timer !== null) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      this.flush()
    }, this.windowMs)
  }

  private flush(): void {
    this.timer = null

    if (this.buffer.length === 0) return

    if (this.buffer.length > 3) {
      // Aggregate into a single summary
      const sorted = [...this.buffer].sort((a, b) => a.amount - b.amount)
      const hasAutoBids = this.buffer.length > 1 // rapid succession implies auto-bids
      const aggregated: AggregatedBidNotification = {
        count: this.buffer.length,
        startPrice: sorted[0].amount,
        endPrice: sorted[sorted.length - 1].amount,
        hasAutoBids,
        userPosition: 'unknown',
      }
      this.buffer = []
      this.onFlush(aggregated, null)
    } else {
      // Pass through individually
      const items = [...this.buffer]
      this.buffer = []
      for (const item of items) {
        this.onFlush(null, item)
      }
    }
  }

  destroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.buffer = []
  }
}
