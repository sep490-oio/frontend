# Flow 10 -- Order Lifecycle (Frontend)

> **Status**: Mock
> **Last verified**: 2026-03-21
> **BE docs**: `backend/docs/flows/10-order-lifecycle/`

## Overview

The Order Lifecycle module covers everything from automatic order creation (after auction ends or buy-now payment) through checkout, shipping, delivery, the 7-day decision window, and optional return/refund flows. On the FE, the UI exists with full mock data covering all order statuses, but no real API integration has been done yet.

### What the FE Does (Mock)

| Touchpoint | Status | Component / Service | Description |
|-----------|--------|---------------------|-------------|
| My Orders list | Mock | `OrdersPage` + `OrdersList` | Three-tab layout (Active / Completed / Cancelled) with mock data |
| Order detail | Mock | `OrderDetailPage` | Full detail view with timeline, item card, tracking, payment, actions |
| Pay order | Mock | `PayOrderModal` | Wallet-only confirmation modal (no VNPay/hybrid support) |
| Confirm receipt | Mock | `ConfirmReceiptModal` | Confirmation dialog (mock mutation, no real escrow release) |
| Request return | Mock | `RequestReturnModal` | Return reason form (mock mutation, no real API call) |
| Order timeline | Mock | `OrderTimeline` | 6-step progression using Ant Design Steps |
| Tracking info | Mock | `OrderTrackingInfo` | Carrier details + event timeline (hardcoded mock events) |
| Payment info | Mock | `OrderPaymentInfo` | Escrow status display + shipping address |
| Order actions | Mock | `OrderActions` | Context-sensitive action buttons per order status |

### What the FE Does NOT Do (Yet)

- Real API calls to `GET /api/me/orders` or `GET /api/orders/{orderId}`
- Real checkout via `POST /api/payments/checkout` (3 payment methods: vnpay/wallet/hybrid)
- VNPay redirect flow for order payment
- Return request via `POST /api/orders/{orderId}/returns`
- Return approval/rejection/shipping/confirmation endpoints
- Escrow settlement display (real escrow data from BE)
- GHN tracking integration (real carrier webhook data)
- Decision window countdown or expiry display
- Payment deadline (48h) countdown for pending_payment orders

## API Endpoints Consumed

| # | Method | Route | FE Consumer | Status |
|---|--------|-------|-------------|--------|
| 1 | GET | `/api/me/orders` | `orderService.getMyOrders()` | Mock |
| 2 | GET | `/api/orders/{orderId}` | `orderService.getOrderDetail()` | Mock |
| 3 | POST | `/api/payments/checkout` | `orderService.payOrder()` | Mock |
| 4 | POST | `/api/orders/{orderId}/returns` | `orderService.requestReturn()` | Mock |
| 5 | POST | `/api/orders/{orderId}/returns/{returnId}/approve` | Not implemented | -- |
| 6 | POST | `/api/orders/{orderId}/returns/{returnId}/reject` | Not implemented | -- |
| 7 | POST | `/api/orders/{orderId}/returns/{returnId}/ship` | Not implemented | -- |
| 8 | POST | `/api/orders/{orderId}/returns/{returnId}/confirm-received` | Not implemented | -- |
| 9 | POST | `/webhooks/ghn` | N/A (server-to-server) | BE-only |
| 10 | POST | `/api/payments/vnpay/ipn` | N/A (server-to-server) | BE-only |

## Order State Machine (from BE)

```
[*] --> PendingPayment : Order.Create()
PendingPayment --> Paid : MarkAsPaid()
PendingPayment --> Cancelled : Cancel()
Paid --> Shipped : MarkAsShipped()
Shipped --> Delivered : MarkAsDelivered()
Delivered --> Completed : Complete() (decision window expired)
Delivered --> Refunded : MarkAsRefunded() (return confirmed)
Cancelled --> [*]
Completed --> [*]
Refunded --> [*]
```

## FE Architecture

### File Map

| File | Path | Purpose |
|------|------|---------|
| `OrdersPage` | `src/pages/orders/OrdersPage.tsx` | My Orders list with 3 tabs |
| `OrderDetailPage` | `src/pages/orders/OrderDetailPage.tsx` | Full order detail view |
| `OrdersList` | `src/components/orders/OrdersList.tsx` | Table/card/list order rendering |
| `OrderTimeline` | `src/components/orders/OrderTimeline.tsx` | 6-step status progression |
| `OrderItemCard` | `src/components/orders/OrderItemCard.tsx` | Item info + price breakdown |
| `OrderTrackingInfo` | `src/components/orders/OrderTrackingInfo.tsx` | Carrier tracking timeline |
| `OrderPaymentInfo` | `src/components/orders/OrderPaymentInfo.tsx` | Escrow + payment details |
| `OrderActions` | `src/components/orders/OrderActions.tsx` | Context-sensitive action buttons |
| `PayOrderModal` | `src/components/orders/PayOrderModal.tsx` | Pay confirmation modal |
| `ConfirmReceiptModal` | `src/components/orders/ConfirmReceiptModal.tsx` | Confirm delivery receipt |
| `RequestReturnModal` | `src/components/orders/RequestReturnModal.tsx` | Return request form |
| `orderService` | `src/services/orderService.ts` | Data fetching + mutations (mock) |
| `useOrders` | `src/hooks/useOrders.ts` | TanStack Query hooks |
| `order.ts` (types) | `src/types/order.ts` | Order, OrderListItem, Escrow, etc. |
| `orders.ts` (mock) | `src/services/mock/orders.ts` | 7 mock orders across all statuses |

### Mock Data Coverage

| Order # | Status | Item | Escrow | Tracking |
|---------|--------|------|--------|----------|
| 1 | `shipped` | PS5 Slim | holding | GHN - in transit |
| 2 | `pending_payment` | iPhone 15 Pro Max | none | none |
| 3 | `delivered` | Nike Air Jordan 1 | holding | GHTK - delivered |
| 4 | `completed` | MacBook Air M2 | released_to_seller | ViettelPost - delivered |
| 5 | `processing` | Pokemon Card Box | holding | none |
| 6 | `cancelled` | Sony WH-1000XM5 | none | none |
| 7 | `disputed` | Marshall Stanmore II | disputed | GHN - delivered |

## Subflow Index

| # | File | Status | Description |
|---|------|--------|-------------|
| 01 | [01-auto-create-from-auction.md](01-auto-create-from-auction.md) | BE-only | Order creation from buy-now and auction-won paths |
| 02 | [02-checkout-payment.md](02-checkout-payment.md) | Mock | PayOrderModal with mock wallet deduction |
| 03 | [03-payment-callback.md](03-payment-callback.md) | Not implemented | VNPay IPN callback for order payment |
| 04 | [04-cancel-expired.md](04-cancel-expired.md) | Mock | Cancelled status display (BE job cancels) |
| 05 | [05-shipping-delivery.md](05-shipping-delivery.md) | Mock | OrderTrackingInfo with mock carrier data |
| 06 | [06-decision-window.md](06-decision-window.md) | Mock | ConfirmReceiptModal + decision window display |
| 07 | [07-return-request.md](07-return-request.md) | Not implemented | Return request via POST endpoint |
| 08 | [08-return-approval-rejection.md](08-return-approval-rejection.md) | Not implemented | Seller approve/reject/ship/confirm-received |
| 09 | [09-escrow-settlement.md](09-escrow-settlement.md) | Not implemented | Escrow release to seller / refund to buyer |
| 10 | [10-queries.md](10-queries.md) | Mock | GET /api/me/orders and GET /api/orders/{id} |

## Key Differences: FE Mock vs. BE Reality

| Area | FE Mock | BE Reality |
|------|---------|------------|
| **Order creation** | Mock orders exist at build time | Auto-created by `AuctionSoldEventHandler` or `ProcessVnPayCallbackCommand` |
| **Payment** | `payOrder()` simulates wallet deduction | `POST /api/payments/checkout` with 3 methods (vnpay/wallet/hybrid) |
| **Order query** | `getMyOrders(tab)` filters by status set | `GET /api/me/orders` returns all orders (buyer or seller) |
| **Tracking** | Hardcoded mock tracking events | Real GHN webhook data via `OutboundShipment` |
| **Escrow** | Static mock escrow objects | Real `Escrow` entity with Holding/Released/Refunded lifecycle |
| **Decision window** | Not displayed | `DecisionWindowEndsAt = deliveredAt + 7 days` |
| **Return** | `requestReturn()` logs to console | `POST /api/orders/{id}/returns` with full lifecycle |
| **Confirm receipt** | `confirmReceipt()` is a no-op | No direct confirm endpoint; decision window auto-releases escrow |
| **OrderDto fields** | FE `Order` type has `item`, `seller`, `billingAddress` | BE `OrderDto` has flat fields: `totalAmount`, `currency`, `trackingNumber`, `escrowStatus`, `return` |
