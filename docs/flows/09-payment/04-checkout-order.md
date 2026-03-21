# 04 -- Checkout Order (Frontend)

> **Status**: Not implemented
> **BE endpoint**: `POST /api/payments/checkout`
> **BE docs**: `backend/docs/flows/09-payment/04-checkout-order.md`

## Overview

Order checkout is not yet implemented on the FE. The BE supports a unified checkout endpoint that handles three payment methods: pure VNPay, full wallet, and hybrid wallet + VNPay.

## BE Endpoint Reference

```
POST /api/payments/checkout
Auth: Authenticated
```

### Request

```typescript
{
  orderId: string;       // Required
  bankCode?: string;     // Optional bank filter for VNPay
  paymentMethod: string; // "vnpay" | "wallet" | "wallet_vnpay" (default: "vnpay")
}
```

### Response

```typescript
{
  transactionId: string;
  transactionRef: string;
  paymentUrl: string | null;  // null for full wallet payment
}
```

## Three Payment Flows

### 1. Pure VNPay (`paymentMethod: "vnpay"`)

- Creates a VNPay payment URL for the full order amount
- FE would redirect user to `paymentUrl`
- After VNPay payment, callback processing creates escrow and marks order paid

### 2. Full Wallet (`paymentMethod: "wallet"`)

- Debits the full order amount from the user's wallet
- Converts winner auction deposit if applicable
- Creates escrow, marks order paid immediately
- `paymentUrl` is `null` -- no redirect needed
- FE should show success immediately

### 3. Hybrid Wallet + VNPay (`paymentMethod: "wallet_vnpay"`)

- Splits payment: wallet covers what it can, VNPay covers the rest
- BE holds the wallet portion first, then creates VNPay URL for the remainder
- FE would redirect user to `paymentUrl` for the VNPay portion
- On VNPay callback success, BE commits the wallet hold and creates escrow

## FE Implementation Plan

When implemented, the checkout flow would need:

### Service Function

```typescript
// src/services/paymentService.ts (new file)
export async function checkoutOrder(request: {
  orderId: string;
  paymentMethod: 'vnpay' | 'wallet' | 'wallet_vnpay';
  bankCode?: string;
}): Promise<{
  transactionId: string;
  transactionRef: string;
  paymentUrl: string | null;
}>
```

### Component

A checkout page or modal that:
1. Shows order summary (item, price, shipping)
2. Shows wallet balance
3. Lets user choose payment method (VNPay / Wallet / Hybrid)
4. If wallet selected and balance sufficient: pay immediately
5. If VNPay or hybrid: redirect to VNPay
6. Handles the winner deposit auto-conversion (transparent to user)

### Wallet Balance Check

The BE automatically rejects wallet payments with insufficient balance (`InsufficientBalance` error with required vs available amounts). The FE should pre-check wallet balance to show/disable options proactively.

## Related Components

- `OrderPaymentInfo` (`src/components/orders/OrderPaymentInfo.tsx`) -- already displays escrow status after payment is complete
- `WalletPage` (`src/pages/wallet/WalletPage.tsx`) -- shows wallet balance

See `backend/docs/flows/09-payment/04-checkout-order.md` for the full checkout flow including hybrid hold/commit logic and winner deposit conversion.
