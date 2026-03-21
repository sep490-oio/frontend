# 10 -- Order Queries (Frontend)

> **Status**: Mock
> **Service**: `orderService.getMyOrders()`, `orderService.getOrderDetail()`
> **Hooks**: `useOrders.useMyOrders()`, `useOrders.useOrderDetail()`
> **BE endpoints**: `GET /api/me/orders`, `GET /api/orders/{orderId}`
> **BE docs**: `backend/docs/flows/10-order-lifecycle/10-queries.md`

## Overview

The FE has two query functions that fetch order data, both currently using mock data. The BE provides two corresponding endpoints: one for listing the current user's orders and one for fetching a single order by ID.

## Current Mock Behavior

### Query: getMyOrders

**File**: `src/services/orderService.ts`

```typescript
export async function getMyOrders(
  tab: 'active' | 'completed' | 'cancelled'
): Promise<OrderListItem[]>
```

Mock behavior:
- Filters 7 mock orders by status set per tab:
  - `active`: pending_payment, paid, processing, shipped, delivered
  - `completed`: completed
  - `cancelled`: cancelled, refunded, disputed
- Returns `OrderListItem[]` (lightweight summary objects)
- Simulates network delay

### Query: getOrderDetail

**File**: `src/services/orderService.ts`

```typescript
export async function getOrderDetail(
  orderId: string
): Promise<Order | null>
```

Mock behavior:
- Finds a mock order by ID from the 7 pre-built orders
- Returns full `Order` object with nested item, seller, address, escrow, tracking
- Returns `null` if not found

### Hook: useMyOrders

**File**: `src/hooks/useOrders.ts`

```typescript
export function useMyOrders(tab: 'active' | 'completed' | 'cancelled')
```

- Query key: `['orders', tab]`
- Fires on mount for each tab value
- `OrdersPage` calls all 3 tabs in parallel so tab switching is instant

### Hook: useOrderDetail

**File**: `src/hooks/useOrders.ts`

```typescript
export function useOrderDetail(orderId: string | undefined)
```

- Query key: `['order', orderId]`
- `enabled: !!orderId` -- only fires when orderId is defined
- Used by `OrderDetailPage` via `useParams`

### Page: OrdersPage

**File**: `src/pages/orders/OrdersPage.tsx`

Three-tab layout using `Segmented` (desktop) or `Select` (mobile):
- All 3 `useMyOrders` hooks fire in parallel on mount
- Tab counts shown in labels: "Active (3)", "Completed (1)", "Cancelled (2)"
- View mode toggle: table vs. card layout (shared across tabs)

### Component: OrdersList

**File**: `src/components/orders/OrdersList.tsx`

Renders orders in three modes:
- **Desktop table**: Ant Design `Table` with 5 columns (item, status, total, date, action)
- **Mobile list**: Ant Design `List` with avatar + compact metadata
- **Card grid**: Responsive card grid with cover images

Client-side filters:
- Status filter (options vary per tab)
- Sort: Newest, Oldest, Highest Price

## BE Endpoint Reference

### GET /api/me/orders

```
Auth: Required
Response: OrderDto[]
```

Returns all orders where the current user is either the buyer or the seller, ordered by `CreatedAt` descending. No pagination. No tab/status filtering -- the BE returns ALL orders and the FE would need to filter client-side.

### GET /api/orders/{orderId}

```
Auth: Required (buyer or seller of the order)
Response: OrderDto
```

Returns a single order with included `Return`, `Escrows`, and `OutboundShipments` navigation properties. Returns 403 if the caller is neither the buyer nor the seller.

### OrderDto Structure

```typescript
{
  id: string;                       // Guid
  orderNumber: string;
  auctionId: string;                // Guid
  buyerId: string;                  // Guid
  sellerId: string;                 // Guid
  status: string;                   // Order status
  totalAmount: number;              // decimal
  currency: string;
  createdAt: string;                // DateTime
  paymentDueAt: string | null;      // DateTime? -- 48h deadline
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  decisionWindowEndsAt: string | null;  // DateTime? -- deliveredAt + 7 days
  completedAt: string | null;
  cancelledAt: string | null;
  escrowStatus: string | null;      // Flat string, not nested object
  trackingNumber: string | null;    // Flat string, not nested object
  return: OrderReturnDto | null;    // Nested return if exists
}
```

### OrderReturnDto Structure

```typescript
{
  id: string;
  status: string;
  reasonCode: string;
  description: string | null;
  decisionReason: string | null;
  providerCode: string | null;
  trackingNumber: string | null;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  shippedAt: string | null;
  sellerReceivedAt: string | null;
  buyerDecisionDueAt: string | null;
}
```

## What the Real Integration Needs

### Type Alignment: FE Order vs. BE OrderDto

| FE Field | BE Field | Gap |
|----------|----------|-----|
| `order.item` (ItemSummary) | Not in OrderDto | FE has nested item; BE does not |
| `order.seller` (SellerSummary) | Not in OrderDto | FE has nested seller; BE does not |
| `order.shippingAddress` (UserAddress) | Not in OrderDto | FE has nested address; BE does not |
| `order.billingAddress` (UserAddress) | Not in OrderDto | FE has nested address; BE does not |
| `order.escrow` (Escrow object) | `escrowStatus` (flat string) | FE has rich escrow; BE has flat status |
| `order.tracking` (OrderTracking) | `trackingNumber` (flat string) | FE has rich tracking; BE has flat number |
| Not in FE type | `paymentDueAt` | BE has; FE needs to add |
| Not in FE type | `decisionWindowEndsAt` | BE has; FE needs to add |
| Not in FE type | `return` (OrderReturnDto) | BE has; FE needs to add |
| `order.itemPrice` | Not in OrderDto | FE has breakdown; BE has only `totalAmount` |
| `order.shippingFee` | Not in OrderDto | FE has breakdown; BE has only `totalAmount` |
| `order.platformFee` | Not in OrderDto | FE has breakdown; BE has only `totalAmount` |
| `order.taxAmount` | Not in OrderDto | FE has breakdown; BE has only `totalAmount` |
| `order.notes` | Not in OrderDto | FE has notes; not in BE DTO |

### Integration Changes Required

1. **Service functions**: Replace mock implementations with real API calls:
   ```typescript
   export async function getMyOrders(): Promise<OrderDto[]> {
     const { data } = await api.get('/me/orders');
     return data;
   }

   export async function getOrderDetail(orderId: string): Promise<OrderDto> {
     const { data } = await api.get(`/orders/${orderId}`);
     return data;
   }
   ```

2. **Remove tab parameter**: The BE `GET /api/me/orders` returns all orders without filtering. The FE must filter client-side:
   ```typescript
   const ACTIVE = new Set(['pending_payment', 'paid', 'processing', 'shipped', 'delivered']);
   const COMPLETED = new Set(['completed', 'refunded']);
   const CANCELLED = new Set(['cancelled', 'disputed']);
   ```

3. **Update FE Order type**: Align with `OrderDto`:
   - Add `paymentDueAt`, `decisionWindowEndsAt`, `return`
   - Change `escrow` from object to `escrowStatus: string | null`
   - Change `tracking` from object to `trackingNumber: string | null`
   - Remove or make optional: `item`, `seller`, `shippingAddress`, `billingAddress`, `itemPrice`, `shippingFee`, `platformFee`, `taxAmount`

4. **OrderListItem type**: The FE `OrderListItem` includes `itemTitle` and `primaryImageUrl` which are not in `OrderDto`. Options:
   - Remove these fields and show order number + total only
   - Request BE to add item summary fields to `OrderDto`
   - Make a separate API call to fetch item details (not recommended for list views)

5. **Pagination**: The BE currently returns all orders without pagination. For users with many orders, this could be slow. Pagination support would need to be added to the BE endpoint.

6. **Hook changes**: Update `useMyOrders` to fetch once and filter locally:
   ```typescript
   export function useMyOrders() {
     return useQuery({
       queryKey: ['orders'],
       queryFn: getMyOrders,
     });
   }
   // Then filter in the component or a derived hook
   ```

### Query Invalidation Map

| Mutation | Queries to Invalidate |
|----------|----------------------|
| `payOrder` | `['order', orderId]`, `['orders']`, `['wallet']` |
| `confirmReceipt` | `['order', orderId]`, `['orders']` |
| `requestReturn` | `['order', orderId]`, `['orders']` |
| `approveReturn` | `['order', orderId]`, `['orders']` |
| `rejectReturn` | `['order', orderId]`, `['orders']` |
| `shipReturn` | `['order', orderId]`, `['orders']` |
| `confirmReturnReceived` | `['order', orderId]`, `['orders']`, `['wallet']` |
