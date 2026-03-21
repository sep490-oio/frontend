# 09 -- VNPay Technical Reference (Frontend)

> **Status**: Reference
> **BE docs**: `backend/docs/flows/09-payment/09-vnpay-technical.md`

## Overview

This document covers the FE-relevant technical details of the VNPay integration: how the FE triggers payment URLs, handles redirects, deals with return callbacks, and what to know about VNPay's behavior from the FE perspective.

## How FE Triggers VNPay Payments

### Step 1: Create Payment URL

The FE calls `POST /api/payments/vnpay/create-url` with a purpose and relevant IDs. The BE constructs the full VNPay URL (with HMAC-SHA512 signature, amount, return URL, etc.) and returns it.

**Current implementation** (auction deposit only):

```typescript
// src/services/auctionService.ts
const { data } = await api.post('/api/payments/vnpay/create-url', {
  purpose: 'AuctionDeposit',
  auctionId,
  returnUrl,  // Passed but BE uses its own configured return URL
});
const paymentUrl = (data?.data ?? data).paymentUrl;
```

### Step 2: Redirect to VNPay

The FE performs a full-page redirect:
```typescript
window.location.href = paymentUrl;
```

This navigates the user away from the FE application entirely. The user completes payment on VNPay's hosted page.

### Step 3: VNPay Redirects Back

After payment, VNPay redirects the user to the BE return URL (`GET /api/payments/vnpay/return`). The BE processes the callback synchronously and the user ends up back on the platform.

**Important**: The return URL is a BE endpoint, not a FE route. The BE controls what happens after processing. The FE does not parse VNPay query parameters directly.

## FE Return Handling

### Current Approach (Simple Refetch)

The FE does **not** parse VNPay return parameters. When the user returns to the auction page:

1. React app remounts (full page navigation back)
2. TanStack Query refetches auction data (`refetchOnMount: true` by default)
3. If the IPN callback has already processed the deposit (typical), the data reflects the new status
4. The `QualificationSection` component shows "Qualified" state instead of the deposit button

### Limitations

- No immediate visual feedback on return (relies on data refetch)
- No error handling for failed VNPay payments (user just sees the same unqualified state)
- No loading state between return and data refetch completing

### Future Improvement

When more payment flows are implemented, the FE could:
1. Parse query params from the VNPay return redirect (if BE forwards them)
2. Show a "Processing payment..." spinner
3. Display success/error messages based on `vnp_ResponseCode`
4. Redirect to appropriate page (order confirmation, wallet, etc.)

## VNPay Payment Purposes (FE Perspective)

| Purpose | FE Trigger | Current State |
|---------|-----------|--------------|
| `AuctionDeposit` | `QualificationSection` > deposit button | Implemented |
| `wallet_top_up` | `AddFundsModal` > submit | Mock only (no real API call) |
| `order_payment` | Order checkout page | Not implemented |
| `auction_buy_now` | Buy-now flow | Not implemented |

## Amount Display

VNPay uses integer amounts (multiplied by 100). The FE never needs to do this multiplication -- the BE handles it. The FE works with normal VND amounts (e.g., `500000` for 500,000 VND) and the BE multiplies by 100 before sending to VNPay.

## Currency

All VNPay transactions use `VND`. The FE hardcodes `currency: 'VND'` in bid requests and the BE does the same for payment URLs. Multi-currency is not supported.

## Error States

| Scenario | User Experience |
|----------|----------------|
| VNPay payment succeeds | User returns, data refetch shows deposit/payment |
| VNPay payment fails | User returns, data refetch shows unchanged state (still unqualified) |
| VNPay payment abandoned | User navigates back manually, nothing changes |
| Network error on create-url | Axios error caught, error toast shown |
| BE validation error (SelfBid, etc.) | Error response, shown as toast/alert |

## Admin Monitoring

The `AdminPaymentsPage` (`src/pages/admin/AdminPaymentsPage.tsx`) provides visibility into VNPay transaction processing:

| Tab | Shows | Service |
|-----|-------|---------|
| Summary | Completed/failed counts, escrow totals | `getPaymentSummary()` |
| Transactions | All transactions with type/status filters | `getTransactions()` |
| Escrows | Escrow records (holding/released/refunded) | `getEscrows()` |
| Withdrawals | Withdrawal requests with approve/reject | `getWithdrawals()` |

### Admin Types (from `adminService.ts`)

```typescript
interface PaymentTransactionDto {
  id: string;
  transactionNumber: string | null;
  userId: string | null;
  orderId: string | null;
  type: string | null;       // payment | refund | deposit | withdrawal | fee | payout
  amount: number;
  fee: number;
  netAmount: number;
  currency: string | null;
  status: string | null;     // pending | processing | completed | failed | cancelled | refunded
  gatewayProvider: string | null;
  description: string | null;
  createdAt: string;
  processedAt: string | null;
}
```

## Escrow Display

The `OrderPaymentInfo` component (`src/components/orders/OrderPaymentInfo.tsx`) displays escrow status for orders:

| Escrow Status | Tag Color | Display |
|--------------|-----------|---------|
| `holding` | blue (processing) | Payment held in escrow |
| `released_to_seller` | green (success) | Released to seller |
| `refunded_to_buyer` | default | Refunded to buyer |
| `disputed` | red (error) | Under dispute |

## Wallet Integration

The wallet system intersects with VNPay payments in several ways:

| Wallet Operation | VNPay Involvement | FE Status |
|-----------------|-------------------|-----------|
| Top-up via VNPay | `wallet_top_up` purpose | Mock (AddFundsModal not wired) |
| Deposit for auction | VNPay -> wallet credit -> wallet hold | Implemented |
| Full wallet checkout | No VNPay (wallet debit only) | Not implemented |
| Hybrid checkout | Wallet hold + VNPay for remainder | Not implemented |
| Withdrawal | No VNPay (bank transfer via admin) | Mock (WithdrawModal not wired) |

### Current Wallet Components

- `AddFundsModal` (`src/components/wallet/AddFundsModal.tsx`): Shows VNPay/MoMo/bank transfer options but only displays a mock success message. Min amount: 50,000 VND.
- `WithdrawModal` (`src/components/wallet/WithdrawModal.tsx`): Shows bank account form but only displays a mock success message. Capped at refund balance.
- `WalletPage` (`src/pages/wallet/WalletPage.tsx`): Displays 4 balance types + transaction history. Uses real API for reading (`GET /api/me/wallet`).

See `backend/docs/flows/09-payment/09-vnpay-technical.md` for full BE technical details including URL construction, HMAC-SHA512 signing, callback validation, and timezone handling.
