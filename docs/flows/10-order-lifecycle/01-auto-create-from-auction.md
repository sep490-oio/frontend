# 01 -- Auto-Create Order from Auction (Frontend)

> **Status**: BE-only
> **FE involvement**: None -- orders are created server-side by event handlers and payment callbacks
> **BE docs**: `backend/docs/flows/10-order-lifecycle/01-auto-create-from-auction.md`

## Why This Is BE-Only

Orders are never created by FE code. They are automatically created by the BE in two scenarios:

1. **Auction Winner (Path B)**: When an auction ends with a winner, `AuctionSoldEventHandler` creates an order with `PendingPayment` status and a 48-hour payment deadline.

2. **Buy Now (Path A)**: When a buy-now VNPay payment succeeds, `ProcessVnPayCallbackCommand` creates an order and immediately marks it as `Paid` (no separate checkout needed).

The FE only becomes involved after the order exists -- displaying it in the My Orders list and Order Detail page.

## What Triggers FE Visibility

After BE creates an order:

- **Auction winner**: The winner receives an `auction_won` notification (High priority) with a checkout action payload. The FE `OrdersPage` will show the order in the Active tab once `GET /api/me/orders` is integrated.
- **Buy now**: The order is already `Paid` when created. The buyer sees it appear in their orders after the VNPay return redirect and data refetch.

Currently, the FE has no real-time notification handling for new orders. The mock data includes pre-built orders in all statuses.

## BE Reference

### Path A -- Buy Now

1. VNPay IPN callback arrives with `purpose = AuctionBuyNow`
2. `ProcessVnPayCallbackCommand` loads the `AuctionBuyNowReservation`
3. Creates order with `paymentDueAt = now` (immediate)
4. Creates escrow(s): one for VNPay amount, optionally one for deposit portion
5. Calls `order.MarkAsPaid(now)` -- order is `Paid` immediately

### Path B -- Auction Winner

1. Auction grain calls `auction.Resolve(Sold)` which raises `AuctionSoldEvent`
2. `AuctionSoldEventHandler` creates order with `paymentDueAt = now + 48h`
3. Order starts as `PendingPayment` -- winner must call `POST /api/payments/checkout` within 48 hours
4. If payment deadline expires, `CancelExpiredOrdersJob` cancels the order

### Order Number Format

```
ORD-{yyyyMMddHHmmss}-{Guid:N}
```

Truncated to 31 characters. The FE mock uses a simpler format: `ORD-2026{####}`.

### OrderPricing

| Field | Value at Creation |
|-------|-------------------|
| `ItemPrice` | Final auction price or buy-now price |
| `ShippingFee` | 0 (set later) |
| `PlatformFee` | 0 (set later) |
| `TaxAmount` | 0 (set later) |
| `TotalAmount` | Same as ItemPrice at creation |

### ShippingSnapshot

Denormalized from the buyer's default address at creation time. If no address exists, placeholder text `"Address pending update"` is used.

## FE Implications for Future Integration

When real API integration is done:

1. The FE `Order` type should align with `OrderDto` from the BE (see [10-queries.md](10-queries.md) for the full DTO structure)
2. The `item`, `seller`, `billingAddress` nested objects in the FE type do not exist in `OrderDto` -- they would need separate API calls or the BE would need to expand the DTO
3. The mock `OrderListItem` type is close to `OrderDto` but uses `itemTitle`/`primaryImageUrl` fields that are not in the BE response
4. Notification handling for `auction_won` events should navigate the user to the order detail / checkout page

See `backend/docs/flows/10-order-lifecycle/01-auto-create-from-auction.md` for full details.
