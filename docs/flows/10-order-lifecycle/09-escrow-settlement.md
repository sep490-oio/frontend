# 09 -- Escrow Settlement (Frontend)

> **Status**: Not implemented
> **FE involvement**: Display only -- escrow operations are entirely BE-driven
> **BE docs**: `backend/docs/flows/10-order-lifecycle/09-escrow-settlement.md`

## Overview

Escrow settlement is entirely BE-driven. The `EscrowSettlementService` handles two outcomes: releasing funds to the seller when the decision window expires, or refunding the buyer when a return is confirmed. The FE only needs to display the escrow status -- it never triggers settlement directly.

## Current FE Display (Mock)

### Component: OrderPaymentInfo

**File**: `src/components/orders/OrderPaymentInfo.tsx`

The component displays escrow status using `order.escrow`:

```typescript
const ESCROW_COLORS: Record<EscrowStatus, string> = {
  holding: 'processing',          // Blue tag
  released_to_seller: 'success',  // Green tag
  refunded_to_buyer: 'default',   // Gray tag
  disputed: 'error',              // Red tag
};
```

Each escrow status shows with a corresponding icon:
- `holding`: `SafetyCertificateOutlined` (shield icon)
- `released_to_seller`: `CheckCircleOutlined` (green check)
- `refunded_to_buyer`: `CheckCircleOutlined` (gray check)
- `disputed`: `ExclamationCircleOutlined` (warning)

### FE Escrow Type

**File**: `src/types/order.ts`

```typescript
interface Escrow {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;        // 'holding' | 'released_to_seller' | 'refunded_to_buyer' | 'disputed'
  heldAt: string | null;
  releasedAt: string | null;
}
```

### Mock Escrow Data

| Order # | Status | Escrow Status | Amount |
|---------|--------|---------------|--------|
| 1 (shipped) | shipped | `holding` | 13,500,000 |
| 3 (delivered) | delivered | `holding` | 5,080,000 |
| 4 (completed) | completed | `released_to_seller` | 21,605,000 |
| 5 (processing) | processing | `holding` | 3,395,000 |
| 7 (disputed) | disputed | `disputed` | 5,510,000 |

## BE Settlement Logic (Reference)

### ReleaseToSellerAsync (Decision Window Expired)

Triggered by `ReleaseExpiredDecisionWindowJob` (every 10 min, batch 100):

1. Load `Holding` escrows for the order
2. Find seller's active wallet
3. Create `PAYOUT` transaction: `PAYOUT-{GUIDv7}`, type `Payout`
4. Credit seller wallet with total escrow amount
5. Mark each escrow as `ReleasedToSeller` (raises `EscrowReleasedToSellerDomainEvent`)
6. `order.Complete(now)` -- status becomes `Completed`

### RefundBuyerAsync (Return Confirmed)

Triggered by `ConfirmOrderReturnReceivedCommandHandler`:

1. Load `Holding` escrows for the order
2. Calculate refund amount (full or partial)
3. Find buyer's active wallet
4. Create `REFUND` transaction: `REFUND-{GUIDv7}`, type `Refund`
5. Mark each escrow as `RefundedToBuyer` (raises `EscrowRefundedToBuyerDomainEvent`)
6. Credit buyer wallet with refund amount
7. If partial refund: create `PAYOUT-PART` transaction for seller with remainder
8. `order.MarkAsRefunded(now)` -- status becomes `Refunded`

### Escrow Entity (BE)

| Property | Type | Description |
|----------|------|-------------|
| `Status` | enum | `holding`, `released_to_seller`, `refunded_to_buyer`, `disputed` |
| `ReleasedTo` | enum | `none`, `platform`, `seller`, `buyer` |
| `Amount` | Money | Held amount |
| `ReleaseTransactionId` | Guid? | Transaction that released the hold |

## FE Implementation Plan

### Gap: FE Escrow Type vs. BE OrderDto

The FE `Order` type has a nested `escrow: Escrow | null` object. The BE `OrderDto` has a flat `escrowStatus: string | null` field. These are structurally different.

**Option A** (minimal): Map `OrderDto.escrowStatus` to the FE `EscrowStatus` type and display the tag. No escrow amount or timestamps.

**Option B** (rich): Request BE to expand `OrderDto` with escrow details:
```typescript
{
  escrowStatus: string;
  escrowAmount: number;
  escrowHeldAt: string | null;
  escrowReleasedAt: string | null;
}
```

### Integration Changes

1. **Update `OrderPaymentInfo`**: Adapt to work with either a nested `Escrow` object (current mock) or flat `escrowStatus` string (BE reality). Example:
   ```typescript
   const escrowStatus = order.escrow?.status ?? order.escrowStatus;
   ```

2. **Escrow amount display**: The mock shows `order.escrow.amount`. The BE `OrderDto` does not include this. If not expanded, display `order.totalAmount` as a proxy (escrow typically holds the full order amount).

3. **Settlement notifications**: When escrow is released (order completed) or refunded, the FE should update the display. This happens via data refetch when the user views the order detail.

4. **Wallet balance impact**: After escrow release (seller) or refund (buyer), the user's wallet balance changes. The `['wallet']` query should be invalidated, though this is tricky since the settlement is triggered by a BE background job, not a FE action.
