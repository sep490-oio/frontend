# 03 -- Callback Processing (Frontend)

> **Status**: BE-only
> **FE involvement**: None -- all callback processing happens on the backend
> **BE docs**: `backend/docs/flows/09-payment/03-callback-processing.md`

## Why This Is BE-Only

`ProcessVnPayCallbackCommand` is the core handler that processes VNPay payment results. It validates the callback signature, finds the matching Transaction, resolves the payment purpose, and executes purpose-specific business logic. All of this happens on the BE with no FE interaction.

## Purpose Routing (BE Reference)

When a VNPay callback arrives, the BE resolves the payment purpose from the Transaction and routes to the appropriate handler:

| Purpose | Handler | What Happens |
|---------|---------|-------------|
| `auction_deposit` | `HandleAuctionDepositAsync` | Wallet credit + hold, create AuctionDeposit, register participant |
| `order_payment` | `HandleOrderPaymentAsync` | Create Escrow, commit hybrid hold, convert winner deposit, mark order paid |
| `auction_buy_now` | `HandleAuctionBuyNowAsync` | If reservation active: create order + escrow. If expired: credit to wallet |
| `wallet_top_up` | `HandleWalletTopUpAsync` | Wallet credit |

## FE Implications

The FE does not participate in callback processing. However, the FE **benefits from the results**:

| Purpose | FE Sees The Result Via |
|---------|----------------------|
| Auction deposit | Auction detail refetch shows `currentUserDeposit` populated |
| Order payment | Order detail shows `status: paid` and escrow info |
| Buy-now | Order created, visible in My Orders |
| Wallet top-up | Wallet balance increased on refetch |

All of these are visible through standard TanStack Query data refetching -- no special FE code is needed to "listen" for callback results.

## Admin Visibility

The `AdminPaymentsPage` (`src/pages/admin/AdminPaymentsPage.tsx`) displays transaction results in the Transactions tab via `GET /api/admin/payments/transactions`. Admins can filter by status and type to see completed, pending, or failed transactions.

See `backend/docs/flows/09-payment/03-callback-processing.md` for the full processing flow, including idempotency checks, failure handling, and auto-linking of payment methods from tokens.
