# 07 - Cancel & Close Auction (Frontend)

## Status: Not Implemented

No FE pages or components allow sellers or admins to cancel or close an auction. The BE endpoints exist but no UI calls them.

---

## BE Summary

Two separate operations:

### Cancel (`POST /api/auctions/{id}/cancel`)
- Seller or admin cancels with a reason
- All bids with `Active`/`Winning` status are cancelled
- All auto-bids are terminalized
- Item returns to `Active` status
- All scheduled Quartz jobs are removed
- Raises `AuctionCancelledEvent`

### Close (`POST /api/auctions/{id}/close`)
- Triggers the normal end-resolution pipeline (same as `EndAuctionCommand`)
- Auction ends with a winner if one exists (status -> `Sold` or `Failed`)
- Used for early termination while preserving the bidding outcome

---

## FE Events Received

### SignalR: `AuctionCancelled`

```typescript
interface AuctionCancelledNotification {
  auctionId: string;
  reason: string;
}
```

Currently handled via cache invalidation in `useAuctionHub`.

---

## BE Endpoints Available

| Method | Endpoint | Permission | Request Body |
|--------|----------|------------|-------------|
| POST | `/api/auctions/{id}/cancel` | `Catalogs.Auctions.Cancel` | `{ "reason": "string" }` |
| POST | `/api/auctions/{id}/close` | `Catalogs.Auctions.Cancel` | None |

---

## What Needs to Be Built

| Feature | Location | Description |
|---------|----------|-------------|
| Cancel button (seller) | MyListingsPage | Cancel draft/scheduled/active auction with reason modal |
| Cancel button (admin) | Admin auction detail | Admin cancel with reason |
| Close button (seller) | MyListingsPage/AuctionDetail | Early close with winner resolution |
| Cancelled state display | AuctionCard, AuctionDetailPage | Show cancellation reason |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/07-cancel-close.md` for cancel handler, domain logic (`Auction.CancelAuction()`), close handler, and error codes.
