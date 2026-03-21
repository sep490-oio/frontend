# 09 -- VNPay Refund (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/09-refund.md`

## Overview

VNPay refund is an admin-only operation. The BE exposes `POST /api/payments/vnpay/refund` which calls the VNPay refund API server-side. The FE does not have a UI for this operation yet. The admin payments dashboard (`AdminPaymentsPage`) exists but does not include a refund action.

## Important Context: Buy-Now Failure Recovery

The buy-now flow does **not** use VNPay refunds for failure recovery. Instead, when payment succeeds but order creation or finalization fails, the BE credits the full amount to the buyer's wallet via `CreditLateBuyNowPaymentToWalletAsync`. This is simpler and faster than a gateway refund.

VNPay refunds are reserved for cases where an admin needs to manually refund a transaction (e.g., dispute resolution, customer service escalation).

## BE Endpoint

| Property | Value |
|----------|-------|
| Method | `POST` |
| URL | `/api/payments/vnpay/refund` |
| Auth | `RequireAuthorization(App.Permissions.Catalogs.Admin.ManagePayments)` (admin-only) |
| Handler | `RefundVnPayTransactionCommand` |

### Request

```json
{
  "originalTransactionRef": "string",
  "originalVnPayTransactionNo": "string",
  "amount": 0,
  "reason": "string"
}
```

### Response

```json
{
  "isSuccess": true,
  "responseCode": "00",
  "message": "string"
}
```

### VNPay Response Codes

| Code | Meaning |
|------|---------|
| `00` | Success |
| `02` | Transaction not found at VNPay |
| `03` | Already refunded |
| `04` | Invalid amount (exceeds original) |
| `91` | Refund not found |
| `93` | Invalid refund amount |
| `94` | Duplicate request |
| `95` | Processing |
| `97` | Invalid checksum |
| `99` | Unknown error |

## BE Refund Flow

1. Find `Transaction` by `originalTransactionRef`
2. Build VNPay refund request (`vnp_Command = refund`, `vnp_TransactionType = 02`)
3. Sign with HMAC-SHA512 over pipe-delimited string
4. POST to VNPay API URL
5. On success: `transaction.MarkAsRefunded(now)`
6. Return result to admin

## FE Impact

### Current State

The `AdminPaymentsPage` has:
- Transaction list (with detail view)
- Escrow management
- Withdrawal approval/rejection

But no refund action button or form.

### Target Implementation

An admin should be able to:
1. View a transaction in `AdminPaymentsPage -> TransactionsTab`
2. Click "Refund" on a completed transaction
3. Enter refund amount and reason in a modal
4. Submit refund -> calls `POST /api/payments/vnpay/refund`
5. See refund result (success/failure with VNPay response code)

## Implementation Checklist

- [ ] Add "Refund" button to transaction detail view (admin only)
- [ ] Create `RefundModal` component with amount + reason fields
- [ ] Add `refundTransaction()` function to admin service
- [ ] Handle VNPay error codes with user-facing messages
- [ ] Update transaction status display after successful refund

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE refund endpoint | `backend: RefundVnPayEndpoint.cs` | Admin-only |
| BE refund handler | `backend: RefundVnPayTransactionCommand.cs` | VNPay API call |
| BE gateway refund | `backend: VnPayGateway.RefundAsync` | HMAC signing + POST |
| FE admin page | `src/pages/admin/AdminPaymentsPage.tsx` | Exists, no refund action |
| FE admin service | `src/services/adminService.ts` | No refund function |
