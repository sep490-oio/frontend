# 04 -- Late Payment (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/04-late-payment.md`

## Overview

A late payment occurs when VNPay payment succeeds but the 15-minute buy-now reservation has already expired. The BE handles this by crediting the full payment amount to the buyer's wallet and failing the reservation. No order is created. The FE has no direct implementation for this scenario.

## What Happens on the BE

1. VNPay IPN reports successful payment
2. BE checks `reservation.IsActive(now)` -- returns `false` (expired)
3. `CreditLateBuyNowPaymentToWalletAsync`: credits full `transaction.Amount` to buyer wallet
4. `FailBuyNowReservation("late_payment_success")`: marks reservation as Failed
5. Transaction still marked as `Completed` (payment was genuinely successful)
6. No order created, auction state unchanged

### Why Wallet Credit (Not VNPay Refund)

- Prevents double-sell (auction may have ended or been sold to another buyer)
- Wallet credit is immediate; VNPay refund can take days
- Buyer's money is preserved in the platform wallet

## FE Impact

### What the Buyer Sees (Currently)

After a late payment, the buyer is redirected back from VNPay to the auction page. Currently:
- The auction page refetches data -- auction may still be active or already ended
- No specific "late payment" notification is shown
- Wallet balance updates on next page load (not immediately)

### What the Buyer Should See (Target)

- A notification explaining: "Your payment was processed but the reservation expired. The full amount has been credited to your wallet."
- Updated wallet balance showing the credit
- The auction page showing the current state (still active, or ended/sold to another buyer)

### SignalR Events

| BE Event | Notification | FE Handling |
|----------|-------------|-------------|
| `AuctionBuyNowReservationReleasedEvent` (reason="late_payment_success") | `BuyNowReservationReleased` | Not handled |

### Edge Cases

| Situation | Outcome |
|-----------|---------|
| Reservation already expired by background job | Wallet credit still happens; reservation status unchanged |
| Transaction amount is 0 (fully covered by deposit) | Nothing to credit; reservation still failed |
| Wallet not found | Error -- transaction NOT marked as completed |

## Implementation Checklist

- [ ] Handle VNPay return URL for buy-now payments (detect late payment scenario)
- [ ] Show user-facing notification for late payment wallet credit
- [ ] Refresh wallet balance after late payment detection
- [ ] Handle `BuyNowReservationReleased` SignalR event with "late_payment_success" reason

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE late payment handler | `backend: ProcessVnPayCallbackCommandHandler.HandleAuctionBuyNowAsync` | Wallet credit + fail reservation |
| FE wallet display | `src/pages/wallet/WalletPage.tsx` | Would show credit in transaction history |
