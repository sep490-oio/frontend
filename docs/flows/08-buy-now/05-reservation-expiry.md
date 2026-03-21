# 05 -- Reservation Expiry (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/05-reservation-expiry.md`

## Overview

The BE runs a background job (`ExpireBuyNowReservationsJob`) every 1 minute that finds and expires buy-now reservations past their 15-minute window. This is entirely a BE operation. The FE needs to react to the resulting SignalR events to update the UI.

## What Happens on the BE

### Background Job

| Setting | Value |
|---------|-------|
| Type | `BackgroundService` (hosted service) |
| Interval | 1 minute |
| Batch size | 50 auctions per run |
| Error handling | Catches all exceptions, logs, continues |

### Expiry Flow

1. Query auctions with `PendingPayment` reservations where `ExpiresAt <= now`
2. For each expired reservation: `auction.ExpireBuyNowReservation(reservationId, now)`
   - Status -> `Expired`, `ReleasedAt = now`
   - Raises `AuctionBuyNowReservationReleasedEvent` (reason="expired")
3. Save per auction (fault isolation)
4. After saving, check if auction should have ended while locked:
   - If `Status == Active AND EndTime <= now AND no active reservation`: send `EndAuctionCommand`

### Auto-End Trigger

If an auction's scheduled end time passed while a buy-now reservation was holding it open, the expiry job triggers `EndAuctionCommand` after the reservation expires. This ensures the auction proceeds to its natural end.

## FE Impact

### SignalR Events

| BE Event | Notification | Current FE Handling |
|----------|-------------|---------------------|
| `AuctionBuyNowReservationReleasedEvent` (reason="expired") | `BuyNowReservationReleased` | Not handled |
| `AuctionEndedEvent` (if auto-end triggered) | `AuctionEnded` | Handled in `useAuctionHub` |

### What Should Happen in FE

When a reservation expires:
- Remove "Buy-now in progress" lock indicator (not yet built)
- Re-enable bidding for other users
- If the buyer who made the reservation is viewing the page, show "Your reservation expired"
- If auto-end triggers `AuctionEnded`, the existing handler updates the UI

### Timing Characteristics

- Reservation window: 15 minutes
- Expiry detection delay: up to 1 minute (job poll interval)
- Total worst case: ~16 minutes from reservation creation to expiry processing
- The FE countdown timer (when implemented) should use `expiresAt` from `BuyNowCheckoutDto`

## Implementation Checklist

- [ ] Display reservation countdown timer using `expiresAt` from `BuyNowCheckoutDto`
- [ ] Handle `BuyNowReservationReleased` event with reason="expired"
- [ ] Show "Reservation expired" notification to the buyer
- [ ] Remove auction lock indicator when reservation expires

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE expiry job | `backend: ExpireBuyNowReservationsJob` | BackgroundService, every 1 min |
| FE event types | `src/types/signalr.ts` | `BuyNowReservationReleased` not defined yet |
