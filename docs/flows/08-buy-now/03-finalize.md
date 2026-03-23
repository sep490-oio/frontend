# 03 -- Finalize Buy Now Reservation (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/03-finalize.md`

## Overview

Finalization is the domain operation where the auction is marked as `Sold` after a successful buy-now payment. This is entirely a BE operation -- the FE has no direct role. However, the FE needs to react to the outcome via SignalR events and query invalidation.

## What Happens on the BE

When `FinalizeBuyNowReservation` is called (after VNPay IPN confirms payment):

1. **Cancel all active/winning bids** -- all existing bids get `Cancel()` called
2. **Create winning bid** -- new `Bid.Create()` at `BuyNowPrice`, immediately `MarkAsWon()`
3. **Update pricing** -- `Pricing.WithBuyNow()` marks buy-now as exercised
4. **Mark reservation paid** -- status transitions `PendingPayment -> Paid`
5. **Set winner** -- `WinnerId = buyerId`
6. **Set auction end** -- `ActualEndTime = now`, `Status = Sold`
7. **Record price history** -- `AuctionPriceHistory.CreateBuyNow()`
8. **Raise events** -- `AuctionSoldEvent` + `BuyNowExecutedEvent`

### Normal Auction End vs Buy Now

| Aspect | Normal Auction End | Buy Now Finalize |
|--------|-------------------|------------------|
| State transitions | Active -> Ended -> Sold/Failed | Scheduled -> Sold (single step) |
| Winner | Highest bid marked as Won | New bid at BuyNowPrice, immediate Won |
| Existing bids | Outbid during active phase | All force-cancelled |
| Reserve check | May result in Failed | No check -- buy-now always satisfies |
| Events | `AuctionEndedEvent` then `AuctionSoldEvent` | `AuctionSoldEvent` + `BuyNowExecutedEvent` |

## FE Impact

### Events the FE Receives

| SignalR Event | FE Type | Current Handling |
|---------------|---------|------------------|
| `BuyNowExecuted` | `BuyNowNotification { auctionId, buyerId, price }` | Invalidates `['auction', id]` cache |
| `AuctionEnded` | `AuctionEndedNotification { auctionId, winnerId, finalPrice, ... }` | Handled in `useAuctionHub` |

### What the FE Should Display After Finalization

When the auction transitions to `Sold` via buy-now:
- Auction status badge: "Sold" (or "Da ban")
- Winner info: buyer who used buy-now
- Final price: buy-now price
- Bid history: all previous bids cancelled, one winning bid at buy-now price

Currently, the `AuctionResult` component in `BiddingPanel` handles displaying ended/sold auctions, but does not distinguish between normal sold and buy-now sold.

## Implementation Checklist

- [ ] Distinguish "Sold via Buy Now" from "Sold via bidding" in `AuctionResult` component
- [ ] Show buy-now price as final price (not highest bid)
- [ ] Handle cancelled bids in bid history display (show as cancelled/grey)
- [ ] Update `BuyNowNotification` handler to show a toast/notification to all auction viewers

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE finalization | `backend: Auction.FinalizeBuyNowReservation()` | Domain method |
| FE event type | `src/types/signalr.ts` | `BuyNowNotification` |
| FE event handler | `src/hooks/useAuctionHub.ts` | `onBuyNowExecuted` callback |
| FE result display | `src/components/auction/AuctionResult.tsx` | No buy-now distinction |
