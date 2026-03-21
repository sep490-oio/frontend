# 03 -- Payment Callback (Frontend)

> **Status**: Not implemented
> **FE involvement**: Minimal -- browser redirect after VNPay payment; IPN is server-to-server
> **BE endpoint**: `POST /api/payments/vnpay/ipn` (server-to-server)
> **BE docs**: `backend/docs/flows/10-order-lifecycle/03-payment-callback.md`

## Overview

When a buyer pays for an order via VNPay (pure VNPay or hybrid wallet+VNPay), VNPay sends payment results through two channels:

1. **IPN (Instant Payment Notification)**: Server-to-server POST from VNPay to `POST /api/payments/vnpay/ipn`. The FE never sees this.
2. **Return URL**: After the user completes payment on VNPay, their browser is redirected back. The BE processes this and the user lands back on the platform.

Neither channel requires FE code. The FE only needs to handle the user's return to the app after VNPay redirect.

## BE Callback Processing (Reference)

When the IPN arrives with `purpose = OrderPayment`:

1. Load the order by `transaction.OrderId`
2. Detect hybrid wallet hold (if any) by searching wallet transactions for `[HybridHold]` description
3. Create escrow: pure VNPay creates 1 escrow with VNPay amount; hybrid creates 1 escrow combining VNPay + wallet portions
4. Commit hybrid hold if applicable (`wallet.DebitPending`)
5. Convert winner auction deposit if applicable (`deposit.ConvertToPayment`)
6. `order.MarkAsPaid(now)` -- transitions to `Paid` status
7. `transaction.MarkAsCompleted()`

### Failed Callback

If VNPay reports a failed payment:
- Transaction is marked as failed
- Order stays in `PendingPayment` status
- Buyer can retry checkout
- `CancelExpiredOrdersJob` will cancel the order if `PaymentDueAt` expires

## FE Implementation Plan

When checkout is integrated (see [02-checkout-payment.md](02-checkout-payment.md)), the FE needs to handle the user's return from VNPay:

### After VNPay Redirect Return

1. User completes VNPay payment and browser redirects back to the platform
2. The return URL should route to the order detail page or a payment result page
3. On mount, TanStack Query refetches order data via `useOrderDetail(orderId)`
4. If the IPN has already processed (typical), the order will show as `Paid`
5. If the order is still `PendingPayment`, show a "Payment processing..." state and poll/refetch

### Suggested Return URL Pattern

```typescript
// When calling POST /api/payments/checkout, include returnUrl:
const returnUrl = `${window.location.origin}/orders/${orderId}?payment=completed`;

// On OrderDetailPage, detect the query param and show appropriate feedback
const searchParams = new URLSearchParams(location.search);
if (searchParams.get('payment') === 'completed') {
  // Show "Payment processing" state, auto-refetch
}
```

### Escrow Scenarios (for FE display)

| Scenario | Escrows Created | What FE Should Show |
|----------|----------------|---------------------|
| Pure VNPay | 1 escrow: VNPay amount | "Payment held in escrow" |
| Hybrid wallet+VNPay | 1 escrow: combined amount | "Payment held in escrow" |
| Full wallet (from checkout) | 1 escrow: full amount | "Payment held in escrow" |
| Buy-now (VNPay + deposit) | 2 escrows: VNPay + deposit | "Payment held in escrow" |

The FE `OrderPaymentInfo` component already displays escrow status via `order.escrow`. In the real integration, the BE `OrderDto` provides a flat `escrowStatus` string rather than a nested escrow object.

See `backend/docs/flows/10-order-lifecycle/03-payment-callback.md` for full details.
