# Flow 09 -- Payment & VNPay (Frontend)

> **Status**: Partial
> **Last verified**: 2026-03-21
> **BE docs**: `backend/docs/flows/09-payment/`

## Overview

The Payment module handles all monetary transactions through VNPay as the primary payment gateway. On the frontend, payment interactions are limited: the FE creates payment URLs, redirects users to VNPay, and handles the return redirect. Most of the heavy processing (IPN callbacks, escrow management, webhook retries, reconciliation) happens entirely on the backend.

### What the FE Does

| Touchpoint | Status | Description |
|-----------|--------|-------------|
| VNPay URL creation (deposit) | Implemented | `createDepositUrl()` in `auctionService.ts` |
| VNPay redirect + return | Partial | Redirect works; return URL parsing is basic (page refetch) |
| Wallet top-up (Add Funds) | Implemented | `AddFundsModal` calls `POST /api/payments/vnpay/create-url` with `purpose: wallet_top_up` |
| Wallet withdrawal | Mock only | `WithdrawModal` shows a simulated form, no real API call |
| Order checkout | Not implemented | BE supports `POST /api/payments/checkout` (vnpay/wallet/hybrid) |
| Token/card management | Not implemented | BE supports CRUD on `/api/payments/methods` |
| Admin payment dashboard | Implemented | `AdminPaymentsPage` with summary, transactions, escrows, withdrawals tabs |
| Refund (admin) | Not implemented | BE supports `POST /api/payments/vnpay/refund` |

### What the FE Does NOT Do

- IPN callback handling (server-to-server, VNPay to BE directly)
- Webhook retry logic (BE background job)
- Reconciliation (BE background job queries VNPay for stale transactions)
- HMAC-SHA512 signature validation (BE only)
- Escrow management (BE only, but FE displays escrow status in `OrderPaymentInfo`)

## API Endpoints Consumed

| # | Method | Route | FE Consumer | Status |
|---|--------|-------|-------------|--------|
| 1 | POST | `/api/payments/vnpay/create-url` | `auctionService.createDepositUrl()` (deposit) + `AddFundsModal` (wallet top-up) | Implemented — purpose: `auction_deposit` or `wallet_top_up`, requires `amount`, `currency`, `description` |
| 2 | GET | `/api/payments/vnpay/ipn` | N/A (server-to-server) | BE-only |
| 3 | GET | `/api/payments/vnpay/return` | Browser redirect (no FE code) | BE-only |
| 4 | POST | `/api/payments/vnpay/refund` | Not implemented | Admin |
| 5 | POST | `/api/payments/checkout` | Not implemented | Authenticated |
| 6 | POST | `/api/payments/methods` | Not implemented | Authenticated |
| 7 | GET | `/api/payments/methods` | Not implemented | Authenticated |
| 8 | DELETE | `/api/payments/methods/{id}` | Not implemented | Authenticated |
| 9 | PUT | `/api/payments/methods/{id}/default` | Not implemented | Authenticated |
| 10 | POST | `/api/payments/methods/link-card` | Not implemented | Authenticated |

### Admin Endpoints (read-only dashboard)

| # | Method | Route | FE Consumer | Status |
|---|--------|-------|-------------|--------|
| 1 | GET | `/api/admin/payments/summary` | `adminService.getPaymentSummary()` | Implemented |
| 2 | GET | `/api/admin/payments/transactions` | `adminService.getTransactions()` | Implemented |
| 3 | GET | `/api/admin/payments/transactions/{id}` | `adminService.getTransactionById()` | Implemented |
| 4 | GET | `/api/admin/payments/escrows` | `adminService.getEscrows()` | Implemented |
| 5 | GET | `/api/admin/payments/escrows/{id}` | `adminService.getEscrowById()` | Implemented |
| 6 | GET | `/api/admin/payments/withdrawals` | `adminService.getWithdrawals()` | Implemented |
| 7 | GET | `/api/admin/payments/withdrawals/{id}` | `adminService.getWithdrawalById()` | Implemented |
| 8 | POST | `/api/admin/payments/withdrawals/{id}/approve` | `adminService.approveWithdrawal()` | Implemented |
| 9 | POST | `/api/admin/payments/withdrawals/{id}/reject` | `adminService.rejectWithdrawal()` | Implemented |

## Component Hierarchy

```
WalletPage
├── BalanceOverview                    -- 4 balance cards (available, locked, held, refund)
├── Action Buttons                     -- "Add Funds" + "Withdraw"
├── TransactionHistory                 -- wallet transaction table with type filter
├── AddFundsModal                      -- mock VNPay/MoMo/bank selection (not wired)
└── WithdrawModal                      -- mock withdrawal form (not wired)

AuctionDetailPage
└── BiddingPanel
    └── QualificationSection           -- triggers createDepositUrl() -> VNPay redirect

OrderDetailPage (future)
└── OrderPaymentInfo                   -- displays escrow status (holding/released/refunded)

AdminPaymentsPage
├── SummaryTab                         -- payment stats (completed, failed, escrows)
├── TransactionsTab                    -- paginated transaction table with filters
├── EscrowsTab                         -- escrow list with status filter
└── WithdrawalsTab                     -- withdrawal requests with approve/reject actions
```

## Routes

| Route | Page | Component |
|-------|------|-----------|
| `/wallet` | User wallet | `WalletPage` |
| `/auction/:id` | Deposit flow (via QualificationSection) | `AuctionDetailPage` |
| `/admin/payments` | Admin payment dashboard | `AdminPaymentsPage` |

## Key FE Types

| Type | File | Description |
|------|------|-------------|
| `Wallet` | `src/types/wallet.ts` | Wallet with 4 balance fields |
| `WalletTransaction` | `src/types/wallet.ts` | Credit/debit/hold/release entries |
| `WithdrawalRequest` | `src/types/wallet.ts` | Withdrawal to bank account |
| `AddFundsRequest` | `src/types/wallet.ts` | Add funds request shape |
| `TransactionType` | `src/types/enums.ts` | `payment \| refund \| deposit \| withdrawal \| fee \| payout` |
| `TransactionStatus` | `src/types/enums.ts` | `pending \| processing \| completed \| failed \| cancelled \| refunded` |
| `EscrowStatus` | `src/types/enums.ts` | `holding \| released_to_seller \| refunded_to_buyer \| disputed` |

## Subflow Index

| # | File | Status | Description |
|---|------|--------|-------------|
| 1 | [01-create-payment-url.md](01-create-payment-url.md) | Implemented | VNPay URL creation for deposits and wallet top-up |
| 2 | [02-ipn-return-callback.md](02-ipn-return-callback.md) | BE-only | IPN callback is server-to-server; FE not involved |
| 3 | [03-callback-processing.md](03-callback-processing.md) | BE-only | Purpose routing and business logic; FE not involved |
| 4 | [04-checkout-order.md](04-checkout-order.md) | Not implemented | Order checkout with vnpay/wallet/hybrid methods |
| 5 | [05-token-management.md](05-token-management.md) | Not implemented | VNPay card token CRUD |
| 6 | [06-refund.md](06-refund.md) | Not implemented | Admin refund processing |
| 7 | [07-webhook-retry.md](07-webhook-retry.md) | BE-only | Webhook retry with exponential backoff |
| 8 | [08-reconciliation.md](08-reconciliation.md) | BE-only | Stale transaction reconciliation |
| 9 | [09-vnpay-technical.md](09-vnpay-technical.md) | Reference | FE VNPay integration details |
