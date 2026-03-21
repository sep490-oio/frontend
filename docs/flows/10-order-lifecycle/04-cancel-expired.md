# 04 -- Cancel Expired Orders (Frontend)

> **Status**: Mock
> **Components**: `OrderTimeline`, `OrderActions`, `OrdersList`
> **Service**: N/A (cancellation is BE-only; FE only displays cancelled status)
> **BE docs**: `backend/docs/flows/10-order-lifecycle/04-cancel-expired.md`

## Overview

Order cancellation is entirely BE-driven. The `CancelExpiredOrdersJob` runs every 5 minutes and cancels `PendingPayment` orders past their `PaymentDueAt` deadline (48 hours after creation). The FE only displays the cancelled status -- it never triggers cancellation.

Currently, the FE has one mock cancelled order (#6) that demonstrates the display.

## Current Mock Behavior

### How Cancelled Orders Are Displayed

**OrdersList** (`src/components/orders/OrdersList.tsx`):
- Cancelled orders appear under the "Cancelled & Disputed" tab
- Status filter options: `cancelled`, `disputed`
- Cancelled status tag uses a red color (`ORDER_STATUS_COLORS.cancelled`)

**OrderTimeline** (`src/components/orders/OrderTimeline.tsx`):
- For cancelled orders, the current step shows with `CloseCircleOutlined` icon and `error` status
- The step description shows `t('orders.timelineCancelled')` instead of a timestamp
- The timeline stops at whichever step the order reached before cancellation (determined by checking which timestamp fields are populated)

**OrderActions** (`src/components/orders/OrderActions.tsx`):
- For `cancelled`, `disputed`, or `refunded` status, shows informational text: `order.notes` or a default cancellation message
- No action buttons are shown

### Mock Cancelled Order

```typescript
// Order #6: Cancelled — non-payment timeout
{
  status: 'cancelled',
  cancelledAt: mockDate(-168),   // ~7 days ago
  notes: 'Qua han thanh toan 48 gio',  // "Exceeded 48h payment deadline"
  escrow: null,                  // No escrow (never paid)
  tracking: null,                // No tracking (never shipped)
}
```

## What the Real Integration Needs

### BE Cancellation Side Effects

When `CancelExpiredOrdersJob` cancels an order, it also:

1. **Marks auction as payment defaulted**: `auction.MarkPaymentDefaulted(now)`
2. **Creates UserRiskFlag**: type `"non_payment"`, severity `Medium`
3. **Creates MonitoringAlert**: type `"repeated_non_payment"`, severity `Medium`
4. **Auto-suspend check**: If the buyer has accumulated enough `non_payment` risk flags (configurable threshold), the user account is suspended

The FE does not need to handle any of this directly, but should be prepared for:
- Suspended user accounts (show appropriate error when API returns 403)
- `OrderCancelledEvent` could trigger a notification that the FE should display

### Integration Changes Required

1. **Payment deadline display**: Add `paymentDueAt` to the FE `Order` type (exists in BE `OrderDto`). Show a countdown timer on `pending_payment` orders: "Payment due in: 23h 45m" or "Payment overdue" if past deadline.

2. **Cancellation reason display**: The BE appends the cancel reason to `order.Notes`. The mock already handles this in `OrderActions` by showing `order.notes`. This should work with real data.

3. **Real-time notification**: When the BE cancels an order, it raises `OrderCancelledEvent`. If a notification is sent to the buyer, the FE should handle it (show toast, refetch order data).

4. **Tab count update**: When an order moves from Active to Cancelled, the tab counts in `OrdersPage` should update. TanStack Query invalidation of `['orders']` handles this if polling or WebSocket updates trigger refetch.

### Gap: No Manual Cancel

The BE does not expose a buyer-initiated cancel endpoint for orders. Cancellation is only automatic via the background job. The FE should NOT add a "Cancel Order" button.
