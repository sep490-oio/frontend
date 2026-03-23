# 08 -- IPN & Return URL Callbacks (Frontend)

> **Status**: BE-only (no FE implementation needed for IPN; minimal FE for return URL)
> **BE doc**: `backend/docs/flows/08-buy-now/08-ipn-return.md`

## Overview

VNPay communicates payment results through two callback mechanisms. The IPN (Instant Payment Notification) is server-to-server and requires no FE involvement. The Return URL redirects the buyer back to the FE after payment -- the FE needs to handle this redirect gracefully.

## IPN Flow (Server-to-Server) -- BE Only

The FE has zero involvement in IPN processing. The flow:

1. VNPay sends `GET /api/payments/vnpay/ipn?vnp_TxnRef=...&vnp_SecureHash=...`
2. BE validates HMAC-SHA512 signature
3. BE saves `GatewayWebhookEvent` (provider="vnpay", eventType="ipn", status=Pending)
4. BE responds immediately with `{ RspCode: "00", Message: "Confirm Success" }`
5. Background job (`ProcessGatewayWebhooksJob`, every 10 seconds) picks up the event
6. `GatewayWebhookProcessor` deserializes and sends `ProcessVnPayCallbackCommand`
7. Callback handler routes to buy-now handler if `transaction.BuyNowReservationId.HasValue`

### IPN Endpoint

| Property | Value |
|----------|-------|
| Method | `GET` |
| URL | `/api/payments/vnpay/ipn` |
| Auth | `AllowAnonymous` (VNPay calls directly) |
| Response | `{ RspCode, Message }` |

### Retry Strategy (Background Job)

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 15 minutes |
| After 3 retries | Permanently `Failed` |

### Reconciliation Backup

A second job (`GatewayReconciliationJob`) runs every 15 minutes to catch transactions stuck in `Pending` status. It queries VNPay's `querydr` API to check transaction status directly.

## Return URL Flow -- FE Involved

When the buyer completes (or cancels) payment on VNPay, they are redirected to:

```
GET /api/payments/vnpay/return?vnp_TxnRef=...&vnp_SecureHash=...
```

### Return Endpoint (BE)

| Property | Value |
|----------|-------|
| Method | `GET` |
| URL | `/api/payments/vnpay/return` |
| Auth | `AllowAnonymous` (user redirected from VNPay) |
| Handler | `ProcessVnPayCallbackCommand` (synchronous) |
| Response | `ProcessVnPayCallbackResponse` (200 OK or 400 Bad Request) |

The return endpoint processes the callback synchronously, giving the user an immediate result. After processing, the user remains on the return URL page.

### FE Handling (Current)

For the **deposit** flow, the FE passes a `returnUrl` pointing back to the auction detail page. On return, the page simply refetches auction data.

For **buy-now**, no specific return URL handling exists yet. The buy-now flow does not currently redirect to VNPay at all (the VNPay redirect is not wired).

### FE Handling (Target)

When the buy-now VNPay redirect is implemented, the FE should:

1. Set `returnUrl` to the auction detail page (e.g., `/auction/{id}?buyNowReturn=true`)
2. On return, detect the `buyNowReturn` query parameter
3. Refetch auction data to check if it transitioned to `Sold`
4. Show success message if payment completed, or error if it failed
5. If late payment: show message explaining wallet credit

## Purpose Routing (BE)

The `ProcessVnPayCallbackCommandHandler` routes callbacks by purpose:

```
BuyNowReservationId.HasValue           -> PaymentPurpose.AuctionBuyNow
AuctionId.HasValue + Type == Deposit   -> PaymentPurpose.AuctionDeposit
OrderId.HasValue                       -> PaymentPurpose.OrderPayment
Otherwise                              -> PaymentPurpose.WalletTopUp
```

## Implementation Checklist

- [ ] Add `returnUrl` to buy-now checkout flow (when VNPay redirect is wired)
- [ ] Handle `?buyNowReturn=true` query param on auction detail page
- [ ] Show payment success/failure message based on auction state after return
- [ ] Handle edge case: return before IPN processes (auction may not be Sold yet)

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE IPN endpoint | `backend: VnPayIpnEndpoint.cs` | AllowAnonymous, saves webhook event |
| BE return endpoint | `backend: VnPayReturnEndpoint.cs` | Synchronous callback processing |
| BE webhook processor | `backend: GatewayWebhookProcessor.cs` | Background job, retries |
| BE reconciliation | `backend: GatewayReconciliationJob.cs` | Backup polling every 15 min |
| BE callback handler | `backend: ProcessVnPayCallbackCommandHandler.cs` | Routes by purpose |
| FE deposit return | `src/pages/public/AuctionDetailPage.tsx` | Simple refetch on return (deposit only) |
