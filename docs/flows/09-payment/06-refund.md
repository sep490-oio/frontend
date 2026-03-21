# 06 -- Refund (Frontend)

> **Status**: Not implemented
> **BE endpoint**: `POST /api/payments/vnpay/refund`
> **BE docs**: `backend/docs/flows/09-payment/06-refund.md`

## Overview

Refund processing is not yet implemented on the FE. The BE provides an admin-only endpoint to initiate full refunds through VNPay's refund API. This would be added to the `AdminPaymentsPage` as a refund action on completed transactions.

## BE Endpoint Reference

```
POST /api/payments/vnpay/refund
Auth: Admin (ManagePayments permission)
```

### Request

```typescript
{
  originalTransactionRef: string;       // Transaction number from original payment
  originalVnPayTransactionNo: string;   // VNPay's transaction number
  amount: number;                        // Refund amount
  reason: string;                        // Admin-provided reason
}
```

### Response

```typescript
{
  isSuccess: boolean;
  responseCode: string;
  message: string;
}
```

## FE Implementation Plan

When implemented, refund would be added to the admin payment dashboard:

### Where It Would Live

The `TransactionsTab` in `AdminPaymentsPage` (`src/pages/admin/AdminPaymentsPage.tsx`) would gain a "Refund" action button on completed transactions. Currently, the tab displays transactions in a read-only table.

### Flow

1. Admin finds a completed transaction in the Transactions tab
2. Clicks "Refund" action button
3. Confirmation modal shows: transaction details, amount, reason input
4. On confirm: `POST /api/payments/vnpay/refund`
5. Success: transaction status changes to `refunded`, toast notification
6. Failure: error message with VNPay response code

### Service Function

```typescript
// Would be added to src/services/adminService.ts
export async function refundTransaction(request: {
  originalTransactionRef: string;
  originalVnPayTransactionNo: string;
  amount: number;
  reason: string;
}): Promise<{ isSuccess: boolean; responseCode: string; message: string }>;
```

## Current Admin Coverage

The admin already has read access to transactions and can filter by status. The refund action would extend the existing `TransactionsTab` columns with an actions column for completed transactions.

See `backend/docs/flows/09-payment/06-refund.md` for full details on the VNPay refund API call and token removal.
