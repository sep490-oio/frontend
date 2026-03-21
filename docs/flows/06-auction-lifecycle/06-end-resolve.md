# 06 - Auction End & Resolution (Frontend)

## Status: Not Implemented

No FE pages or components handle post-auction resolution UI (winner confirmation, payment deadline display, failed auction messaging). The FE receives end/resolution events via SignalR and polling but has no dedicated resolution flow.

---

## BE Summary

When the `EndAuctionJob` fires at `endTime`, the BE runs a 3-step pipeline:

1. **RevealAllSealedBids** (sealed auctions only) — decrypt and materialize sealed bids
2. **End** — `Auction.End()` transitions to `Ended`, sets `ActualEndTime`
3. **Resolve** — determines final outcome:
   - **No bids / no winning bid**: Status -> `Failed`, reason "No bids received"
   - **Reserve not met**: Status -> `Failed`, reason "Reserve price not met"
   - **Winner + reserve met**: `winningBid.MarkAsWon()`, Status -> `Sold`

---

## FE Events Received

### SignalR: `AuctionEnded`

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

Currently handled in `useAuctionHub` — triggers cache invalidation for `['auction', id]` and `['auctionBids', id]`.

### Current UI Behavior

- `AuctionCard`: When status becomes `ended`/`sold`/`failed`, the countdown shows "Da ket thuc" and the status badge updates
- `AuctionDetailPage`: Status tag changes, BiddingPanel disables bid input
- No winner congratulations screen, no payment deadline countdown, no failed auction messaging

---

## What Needs to Be Built

| Feature | Priority | Description |
|---------|----------|-------------|
| Winner notification UI | High | Show winner confirmation with payment deadline |
| Failed auction message | Medium | Show reason (no bids / reserve not met) with relist option for seller |
| Bid result display | Medium | Show each bidder whether they won, lost, or were outbid |
| Payment deadline countdown | High | Show countdown until payment deadline (from `Sold` status) |

---

## BE Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auctions/{id}/close` | Manually close/end auction early (same as EndAuctionCommand) |

The close endpoint triggers the same end-resolution pipeline as the scheduled job.

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/06-end-resolve.md` for the full resolution flow, sealed bid reveal, `AuctionGrain.EndAuctionAsync()`, and domain events (`AuctionEndedEvent`, `AuctionSoldEvent`, `AuctionFailedEvent`).
