# 08 -- Return Approval & Rejection (Frontend)

> **Status**: Not implemented
> **BE endpoints**: 4 endpoints for the return lifecycle (approve, reject, ship, confirm-received)
> **BE docs**: `backend/docs/flows/10-order-lifecycle/08-return-approval-rejection.md`

## Overview

After a buyer submits a return request, the return goes through a multi-step lifecycle involving both buyer and seller. The FE has no UI for any of these steps yet. The BE provides four endpoints covering: seller approve, seller reject, buyer ship return, and seller confirm receipt (which triggers automatic refund).

## BE Endpoints Reference

### 1. Seller Approve Return

```
POST /api/orders/{orderId}/returns/{returnId}/approve
Auth: Required (seller only)
```

**Request**:
```typescript
{
  notes?: string;  // Optional approval notes
}
```

**Response**: `200 OK` with `OrderReturnDto`

**Behavior**:
- Return status: `Requested` -> `Approved`
- Sets `ApprovedAt`, `DecisionReason = notes`
- Notifies buyer with event `return_approved` (High priority)

**Error responses**: 403 (not seller), 404 (not found), 409 (not in Requested status)

### 2. Seller Reject Return

```
POST /api/orders/{orderId}/returns/{returnId}/reject
Auth: Required (seller only)
```

**Request**:
```typescript
{
  reason: string;  // Required rejection reason
}
```

**Response**: `200 OK` with `OrderReturnDto`

**Behavior**:
- Return status: `Requested` -> `Rejected`
- Sets `RejectedAt`, `DecisionReason = reason`
- Notifies buyer with event `return_rejected` (High priority)
- Order stays in `Delivered` status
- `ReleaseExpiredDecisionWindowJob` treats rejected returns as safe-to-release (escrow will be released to seller after decision window expires)

**Error responses**: 400 (missing reason), 403 (not seller), 404 (not found), 409 (not in Requested status)

### 3. Buyer Ship Return

```
POST /api/orders/{orderId}/returns/{returnId}/ship
Auth: Required (buyer only)
```

**Request**:
```typescript
{
  providerCode: string;    // Required -- shipping provider code (e.g., "ghn")
  trackingNumber: string;  // Required -- return shipment tracking number
}
```

**Response**: `200 OK` with `OrderReturnDto`

**Behavior**:
- Return status: `Approved` -> `ReturnInTransit`
- Sets `ProviderCode`, `TrackingNumber`, `ShippedAt`
- Notifies seller with event `return_shipped` (High priority)

**Error responses**: 400 (missing fields), 403 (not buyer), 404 (not found), 409 (not in Approved status)

### 4. Seller Confirm Return Received

```
POST /api/orders/{orderId}/returns/{returnId}/confirm-received
Auth: Required (seller only)
Request Body: None
```

**Response**: `200 OK` with `OrderReturnDto`

**Behavior**:
- Return status: `ReturnInTransit` or `Approved` -> `SellerReceived` -> `Resolved`
- Triggers `EscrowSettlementService.RefundBuyerAsync()` -- full refund to buyer
- `order.MarkAsRefunded()` -- order status becomes `Refunded`
- Return is resolved in the same transaction
- Notifies buyer with event `refund_completed` (High priority)

**Error responses**: 403 (not seller), 404 (not found), 409 (invalid status)

## Return Status Flow

```
Requested --> Approved (seller approves)
Requested --> Rejected (seller rejects)
Approved --> ReturnInTransit (buyer ships)
Approved --> SellerReceived (seller confirms without shipping)
ReturnInTransit --> SellerReceived (seller confirms)
SellerReceived --> Resolved (after refund)
Any non-terminal --> Cancelled
```

## FE Implementation Plan

### Where This Would Live

The return lifecycle needs UI in two places:

1. **Seller's order detail page**: The seller sees incoming return requests on their orders and can approve/reject. After approval, they see the return shipping info and can confirm receipt.

2. **Buyer's order detail page**: After a return is approved, the buyer needs to enter shipping info (provider code + tracking number). After the seller confirms receipt, the buyer sees the refund status.

### Seller-Side Components (New)

**ReturnRequestCard** -- shows on seller's order detail when `order.return` exists:
- Status: `Requested` -- show buyer's reason + description, Approve/Reject buttons
- Status: `Approved` -- show "Waiting for buyer to ship return"
- Status: `ReturnInTransit` -- show tracking info, "Confirm Received" button
- Status: `SellerReceived`/`Resolved` -- show completion + refund info

**ApproveReturnModal** -- confirmation dialog with optional notes TextArea

**RejectReturnModal** -- confirmation dialog with required reason TextArea

**ConfirmReturnReceivedModal** -- warning dialog explaining that confirming triggers a full refund

### Buyer-Side Components (New)

**ShipReturnForm** -- shown when return status is `Approved`:
- Provider code select (dropdown with GHN, GHTK, ViettelPost options)
- Tracking number input
- Submit button calls `POST .../ship`

**ReturnStatusDisplay** -- shown on buyer's order detail when a return exists:
- Timeline showing return progress
- Tracking info after shipping
- Refund confirmation after completion

### Service Functions

```typescript
// Add to src/services/orderService.ts
export async function approveReturn(orderId: string, returnId: string, notes?: string): Promise<OrderReturnDto>
export async function rejectReturn(orderId: string, returnId: string, reason: string): Promise<OrderReturnDto>
export async function shipReturn(orderId: string, returnId: string, providerCode: string, trackingNumber: string): Promise<OrderReturnDto>
export async function confirmReturnReceived(orderId: string, returnId: string): Promise<OrderReturnDto>
```

### Notification Handling

| Event | Recipient | Suggested FE Behavior |
|-------|-----------|----------------------|
| `return_approved` | Buyer | Toast + navigate to order detail to enter shipping info |
| `return_rejected` | Buyer | Toast + show rejection reason |
| `return_shipped` | Seller | Toast + navigate to order detail to confirm receipt |
| `refund_completed` | Buyer | Toast + show refund amount credited to wallet |
