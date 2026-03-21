# 02 -- Payment Callback (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/02-payment-callback.md`

## Overview

The VNPay IPN callback processing for buy-now payments is entirely handled by the backend. The FE has no direct involvement in this flow -- VNPay calls the BE IPN endpoint server-to-server, and the BE processes the payment, creates orders, and finalizes the auction.

## BE Callback Decision Tree

When VNPay sends a callback for a buy-now payment (`transaction.BuyNowReservationId.HasValue`):

| Condition | BE Action | FE Impact |
|-----------|-----------|-----------|
| VNPay payment failed | `FailBuyNowReservation("payment_failed")` | Auction unlocked; `BuyNowReservationReleased` event (not handled by FE) |
| Payment succeeded + reservation active | Create order, finalize auction (Sold), create escrow | `BuyNowExecuted` event -> FE invalidates auction cache |
| Payment succeeded + reservation expired | Credit full amount to buyer wallet | `BuyNowReservationReleased` event with reason "late_payment_success" (not handled by FE) |
| Order creation fails after payment | Credit to wallet, fail reservation | Wallet credit visible on refresh |
| Finalization fails after payment | Credit to wallet, fail reservation | Wallet credit visible on refresh |

## What FE Needs to Implement

### 1. Return URL Handling

When the buyer completes payment on VNPay, they are redirected back to the FE. The return URL should:
- Parse the VNPay query parameters (or simply refetch auction detail)
- Show a success/failure message based on the payment outcome
- If the auction is now `Sold`, display the result

Currently, the FE does not have a dedicated return URL handler for buy-now payments. The deposit flow uses a simple page refetch on return.

### 2. Real-Time Updates via SignalR

The BE raises events that the FE should handle:

| BE Event | SignalR Notification | FE Action Needed |
|----------|---------------------|------------------|
| `AuctionSoldEvent` | `AuctionEnded` (with winner info) | Show auction result |
| `BuyNowExecutedEvent` | `BuyNowExecuted` | Show "Sold via Buy Now" |
| `AuctionBuyNowReservationReleasedEvent` | `BuyNowReservationReleased` | Remove lock indicator, re-enable bidding |

The `BuyNowExecuted` event IS handled by the FE (cache invalidation). The `BuyNowReservationReleased` event is NOT handled.

### 3. Wallet Credit Display (Late Payment)

If a late payment occurs, the buyer's wallet is credited. The FE should:
- Show a notification explaining the situation
- Refresh wallet balance

Currently not implemented -- the wallet balance would update on next page load.

## Normal Path (Happy Flow) -- What Happens on BE

1. VNPay IPN arrives with success
2. BE loads reservation + auction + buyer
3. BE creates order with buyer shipping snapshot
4. BE calls `auction.FinalizeBuyNowReservation()` -- cancels active bids, creates winning bid, marks `Sold`
5. BE inserts order, links to reservation
6. BE creates escrow for gateway amount
7. If deposit was applied: converts deposit, debits wallet pending, creates second escrow
8. BE marks order as paid, transaction as completed
9. BE auto-links VNPay token to PaymentMethod (best-effort)
10. `SaveChangesAsync` commits everything

**Result**: Auction status = `Sold`, order created, buyer is winner.

## Error Handling (Wallet Credit Fallback)

After a successful VNPay payment, if order creation or finalization fails, the BE credits the full `transaction.Amount` to the buyer's wallet instead of issuing a VNPay refund. Three scenarios:

| Failure Point | Reservation Failure Reason |
|---------------|---------------------------|
| `CreateBuyNowOrder` fails | `order_creation_failed_after_payment` |
| `FinalizeBuyNowReservation` fails | `buy_now_finalize_failed_after_payment` |
| Reservation expired (late payment) | `late_payment_success` |

## Implementation Checklist

- [ ] Create a return URL page/handler for buy-now VNPay redirects
- [ ] Parse VNPay return query params or refetch auction detail on return
- [ ] Handle `BuyNowReservationReleased` SignalR event
- [ ] Show appropriate messages for late payment wallet credits
- [ ] Display auction sold state when `BuyNowExecuted` event is received (partially done)

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE callback handler | `backend: ProcessVnPayCallbackCommand.cs` | Handles all IPN routing |
| FE event handling | `src/hooks/useAuctionHub.ts` | Only `BuyNowExecuted` handled |
| FE SignalR types | `src/types/signalr.ts` | `BuyNowNotification` defined |
