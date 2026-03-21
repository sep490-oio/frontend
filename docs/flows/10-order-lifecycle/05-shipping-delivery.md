# 05 -- Shipping & Delivery (Frontend)

> **Status**: Mock
> **Component**: `OrderTrackingInfo`
> **Service**: `orderService.getOrderDetail()` (mock tracking data)
> **BE docs**: `backend/docs/flows/10-order-lifecycle/05-shipping-delivery.md`

## Overview

The FE displays shipping and delivery information through the `OrderTrackingInfo` component, which shows carrier name, tracking number, estimated delivery, an external tracking link, and a chronological event timeline. All data is currently mock. The BE handles shipping via `OutboundShipment` entities and receives real tracking updates from GHN carrier webhooks.

## Current Mock Behavior

### Component: OrderTrackingInfo

**File**: `src/components/orders/OrderTrackingInfo.tsx`

```typescript
interface OrderTrackingInfoProps {
  tracking: OrderTracking;
}
```

Renders when `order.tracking` is not null (shipped orders and beyond). Displays:

| Section | Content |
|---------|---------|
| Carrier name | `tracking.carrier` with `CarOutlined` icon |
| Tracking number | Monospace code display + copy button |
| Estimated delivery | `tracking.estimatedDelivery` (formatted date) |
| External link | "Track Delivery" button linking to `tracking.trackingUrl` |
| Event timeline | Ant Design `Timeline` with color-coded events |

### Timeline Event Colors

| Event Status | Color |
|-------------|-------|
| `delivered` | green |
| `out_for_delivery` | blue |
| All others | gray |

### Mock Tracking Data

Three tracking datasets cover the shipped/delivered/completed order statuses:

**Shipped (Order #1 -- GHN)**:
- 3 events: picked_up -> in_transit -> in_transit
- Estimated delivery set to a future date

**Delivered (Order #3 -- GHTK)**:
- 4 events: picked_up -> in_transit -> out_for_delivery -> delivered
- Estimated delivery in the past

**Completed (Order #4 -- ViettelPost)**:
- 3 events: picked_up -> out_for_delivery -> delivered

### OrderTracking Type

**File**: `src/types/order.ts`

```typescript
interface OrderTracking {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}

interface TrackingEvent {
  status: string;
  description: string;
  location: string | null;
  timestamp: string;
}
```

### OrderTimeline Integration

**File**: `src/components/orders/OrderTimeline.tsx`

The 6-step timeline shows shipping-related steps:
- Step 3 (Shipped): Marked when `order.shippedAt` is set
- Step 4 (Delivered): Marked when `order.deliveredAt` is set

For cancelled/disputed orders, the timeline marks the last completed step with an error icon.

## What the Real Integration Needs

### BE Shipping Architecture

The BE does not expose tracking data through `OrderDto` directly. The `OrderDto` includes:
- `trackingNumber: string | null` -- the carrier tracking number (from `OutboundShipment`)
- `shippedAt: DateTime?` -- when carrier picked up
- `deliveredAt: DateTime?` -- when carrier confirmed delivery

The full tracking event history is stored in `OutboundShipment.TrackingEvents` but is NOT included in `OrderDto`. To display the event timeline, the FE would need either:
1. A separate endpoint to fetch tracking events for an order
2. An expanded `OrderDto` that includes tracking events
3. Direct link to GHN tracking page (which the FE already supports via `trackingUrl`)

### BE Shipment Lifecycle

```
Pending -> Booked -> PickedUp -> InTransit -> Delivered
                                            \-> Failed -> Returning -> Returned
         \-> Cancelled (only before PickedUp)
```

Key domain events that affect the order:
- `OutboundShipmentPickedUpEvent` -> `order.MarkAsShipped(now)`
- `OutboundShipmentDeliveredEvent` -> `order.MarkAsDelivered(deliveredAt, decisionWindowEndsAt, now)`

### GHN Webhook

The BE receives tracking updates at `POST /webhooks/ghn` (AllowAnonymous, always returns 200). The `ProcessTrackingWebhookCommand` normalizes GHN status codes to:

| Normalized Status | Maps to Shipment Status |
|-------------------|------------------------|
| `picked_up` | PickedUp |
| `in_transit` | InTransit |
| `delivered` | Delivered |
| `failed` | Failed |
| `returning` | Returning |
| `returned` | Returned |

### Integration Changes Required

1. **Type alignment**: The FE `OrderTracking` type does not match any BE response. Either:
   - Remove the event timeline and only show tracking number + external link (simplest)
   - Request a new BE endpoint for tracking events
   - Embed tracking events in an expanded `OrderDto`

2. **Tracking link construction**: The mock uses hardcoded `trackingUrl` values. In production, construct from the carrier's tracking page URL pattern + tracking number:
   - GHN: `https://donhang.ghn.vn/?order_code={trackingNumber}`
   - GHTK: `https://giaohangtietkiem.vn/tracking?code={trackingNumber}`
   - ViettelPost: `https://viettelpost.vn/tracking?code={trackingNumber}`

3. **Real-time updates**: The FE could poll for tracking updates or use SignalR to receive `OutboundTrackingEventRecordedEvent` events. Currently no SignalR integration exists for shipping updates.

4. **Delivery confirmation**: When `order.deliveredAt` is set by the BE (via GHN webhook), the decision window starts. The FE should show the decision window countdown (see [06-decision-window.md](06-decision-window.md)).
