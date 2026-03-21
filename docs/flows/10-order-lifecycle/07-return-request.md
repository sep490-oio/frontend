# 07 -- Return Request (Frontend)

> **Status**: Not implemented (mock UI exists but does not call real API)
> **Component**: `RequestReturnModal`
> **Service**: `orderService.requestReturn()` (mock)
> **Hook**: `useOrders.useRequestReturn()` (mock)
> **BE endpoint**: `POST /api/orders/{orderId}/returns`
> **BE docs**: `backend/docs/flows/10-order-lifecycle/07-return-request.md`

## Overview

The FE has a `RequestReturnModal` that collects a return reason and optional notes, then calls a mock `requestReturn()` function that logs to console. The BE provides `POST /api/orders/{orderId}/returns` for creating real return requests, which enforces decision window validation and creates an `OrderReturn` entity.

## Current Mock UI

### Component: RequestReturnModal

**File**: `src/components/orders/RequestReturnModal.tsx`

```typescript
interface RequestReturnModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
}
```

The modal contains:

1. **Reason selection** (required): Radio group with 4 predefined reasons:
   - `returnReasonNotAsDescribed` -- "Not as described"
   - `returnReasonDamaged` -- "Damaged"
   - `returnReasonWrongItem` -- "Wrong item"
   - `returnReasonOther` -- "Other"

2. **Notes** (optional): TextArea with 500-character limit and live character counter

3. **Validation**: Shows error text if no reason is selected when submitting

4. **Submission**: Concatenates reason key + notes as a single string: `"${reason}: ${notes}"` and calls `requestReturn(orderId, combinedString)`

### Service Function (Mock)

**File**: `src/services/orderService.ts`

```typescript
export async function requestReturn(orderId: string, reason: string): Promise<void>
```

Mock behavior:
- Simulates 500-1000ms delay
- Validates order exists and has `delivered` status
- Logs to console: `[mock] Return requested for order {orderId} reason: {reason}`
- Does NOT create any return entity

### Mutation Hook (Mock)

**File**: `src/hooks/useOrders.ts`

```typescript
export function useRequestReturn(): UseMutationResult<void, Error, { orderId: string; reason: string }>
```

On success: invalidates `['order', orderId]` and `['orders']` queries.

## BE Endpoint Reference

```
POST /api/orders/{orderId}/returns
Auth: Required (buyer only)
```

### Request

```typescript
{
  reasonCode: string;     // Required -- reason code (e.g., "not_as_described")
  description?: string;   // Optional -- buyer's description
}
```

### Response

```typescript
// 200 OK
OrderReturnDto {
  id: string;
  status: string;           // "requested"
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

### Domain Validation

The BE enforces these rules in `Order.RequestReturn()`:

| # | Check | Error Code | HTTP |
|---|-------|-----------|------|
| 1 | Caller is the buyer | `Order.ReturnForbidden` | 403 |
| 2 | Order status is `Delivered` | `Order.InvalidState` | 409 |
| 3 | Decision window has started | `Order.DecisionWindowNotStarted` | 409 |
| 4 | Decision window has not expired | `Order.DecisionWindowExpired` | 409 |
| 5 | No active (non-terminal) return exists | `Order.ReturnAlreadyExists` | 409 |

### Notification

After successful creation, a notification is sent to the seller:
- Event type: `return_requested`
- Priority: `High`
- Metadata includes: `orderId`, `returnId`, `reasonCode`

## FE Implementation Plan

### Service Function

```typescript
// Replace mock in src/services/orderService.ts
export async function requestReturn(
  orderId: string,
  reasonCode: string,
  description?: string
): Promise<OrderReturnDto> {
  const { data } = await api.post(`/orders/${orderId}/returns`, {
    reasonCode,
    description,
  });
  return data;
}
```

### Changes to RequestReturnModal

1. **Separate reason and notes**: Currently the modal concatenates reason + notes into a single string. The BE expects separate `reasonCode` and `description` fields. Change the mutation call:
   ```typescript
   mutation.mutate({
     orderId,
     reasonCode: reason,       // The radio value (e.g., "not_as_described")
     description: notes || undefined,
   });
   ```

2. **Reason code alignment**: The FE uses i18n keys as reason values (`returnReasonNotAsDescribed`). The BE expects snake_case reason codes. Map FE values to BE codes:
   ```typescript
   const REASON_CODE_MAP: Record<string, string> = {
     returnReasonNotAsDescribed: 'not_as_described',
     returnReasonDamaged: 'damaged',
     returnReasonWrongItem: 'wrong_item',
     returnReasonOther: 'other',
   };
   ```

3. **Error handling**: Handle BE error codes:
   - 409 `Order.DecisionWindowExpired`: Show "Return window has expired" message
   - 409 `Order.ReturnAlreadyExists`: Show "A return request already exists" message
   - 403: Show "Only the buyer can request a return"

4. **Post-submission display**: After successful return request, the `OrderActions` component should update to show the return status instead of the action buttons. The BE `OrderDto` includes a `return: OrderReturnDto` field.

5. **Decision window check**: Before showing the "Request Return" button, check if the decision window has expired:
   ```typescript
   const canRequestReturn = order.status === 'delivered'
     && order.decisionWindowEndsAt
     && new Date(order.decisionWindowEndsAt) > new Date();
   ```

### New Type: OrderReturnDto

Add to `src/types/order.ts`:

```typescript
export interface OrderReturn {
  id: string;
  status: OrderReturnStatus;
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
