# 11 - Background Jobs (Frontend)

## Status: BE-Only

All auction background jobs run server-side. The FE receives their effects via SignalR events and polling. This document maps each job to the SignalR events the FE should handle.

---

## Job Summary

| Job | Schedule | What It Does |
|-----|----------|-------------|
| `ActivateAuctionJob` | One-shot at `startTime` | Scheduled -> Active (or auto-cancel if no participants) |
| `EndAuctionJob` | One-shot at `endTime` | Active -> Ended -> Sold/Failed |
| `AuctionPollingFallbackJob` | Every 60 seconds | Safety net: catches missed activation/ending |
| `AuctionAutoCompleteJob` | Every 1 hour | Auto-completes sold auctions 3 days after delivery |
| `ExpireRunnerUpOffersJob` | Every 5 minutes | Expires pending runner-up offers past deadline |

---

## SignalR Events from Background Jobs

### ActivateAuctionJob -> `AuctionStarted`

```typescript
interface AuctionStartedNotification {
  auctionId: string;
  startTime: string;
  endTime: string;
}
```

**FE handling**: Invalidate `['auction', id]` cache. AuctionCard starts countdown timer. BiddingPanel enables bid input.

### EndAuctionJob -> `AuctionEnded`

```typescript
interface AuctionEndedNotification {
  auctionId: string;
  winnerId: string | null;
  winnerDisplayName: string | null;
  finalPrice: number;
  totalBids: number;
  reserveMet: boolean;
}
```

**FE handling**: Invalidate `['auction', id]` and `['auctionBids', id]` caches. AuctionCard shows "Da ket thuc". BiddingPanel disables bid input.

### Auto-Extension (triggered by PlaceBid within EndAuctionJob's scheduled window) -> `AuctionExtended`

```typescript
interface AuctionExtendedNotification {
  auctionId: string;
  newEndTime: string;
  extensionMinutes: number;
}
```

**FE handling**: Invalidate `['auction', id]` cache. AuctionCard countdown resets to new `endTime`. The BE also reschedules the `EndAuctionJob` trigger to the new end time.

### Auto-Cancel (no participants at activation) -> `AuctionCancelled`

```typescript
interface AuctionCancelledNotification {
  auctionId: string;
  reason: string;
}
```

**FE handling**: Invalidate `['auction', id]` cache. Status badge shows cancelled.

---

## Polling as Fallback

The FE uses polling as a safety net when SignalR is unavailable (connection drops, BE bug, etc.):

| Hook | Poll Interval | Purpose |
|------|---------------|---------|
| `useAuction(id)` | 10 seconds | Catches status changes if SignalR misses them |
| `useAuctionBids(id)` | 10 seconds | Catches new bids if `BidPlaced` event not received |

This mirrors the BE's `AuctionPollingFallbackJob` (every 60s) which catches missed Quartz timers.

---

## Event-to-Cache Invalidation Map

| SignalR Event | Cache Keys Invalidated |
|---------------|----------------------|
| `BidPlaced` | `['auction', id]`, `['auctionBids', id]` |
| `Outbid` | `['auction', id]` |
| `BuyNowExecuted` | `['auction', id]` |
| `AuctionStarted` | `['auction', id]` |
| `AuctionEnded` | `['auction', id]`, `['auctionBids', id]` |
| `AuctionExtended` | `['auction', id]` |
| `AuctionCancelled` | `['auction', id]` |
| `PriceUpdated` | `['auction', id]` |

---

## Jobs Not Surfaced in FE Yet

| Job | SignalR Event | FE Impact (when built) |
|-----|---------------|----------------------|
| `AuctionAutoCompleteJob` | None currently | Would trigger order completion notification |
| `ExpireRunnerUpOffersJob` | None currently | Would notify bidder (offer expired) and seller (action needed) |

These jobs send notifications via the notification system, which the FE notification UI would display once implemented.

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/11-background-jobs.md` for all job configurations, Quartz scheduling details, `QuartzAuctionScheduler` implementation, and the fallback polling strategy.
