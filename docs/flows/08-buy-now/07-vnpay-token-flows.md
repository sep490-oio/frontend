# 07 -- VNPay Token Flows (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/07-vnpay-token-flows.md`

## Overview

VNPay supports three token flows for saved-card payments. The BE implements all three, including auto-creation of `PaymentMethod` records from VNPay callbacks. The FE has no implementation for token/card management yet. This is shared infrastructure used by buy-now, deposits, and order payments.

## Three Token Flows (BE)

### 1. `token_create` -- Link Card Only

| Property | Value |
|----------|-------|
| Endpoint | `POST /api/payments/methods/link-card` |
| VNPay command | `token_create` |
| Amount | 0 (no payment) |
| Result | User redirected to VNPay, callback auto-creates `PaymentMethod` |

### 2. `pay_and_create` -- Pay + Save Card

| Property | Value |
|----------|-------|
| Trigger | `CreateVnPayPaymentUrlCommand` with `SaveCard = true` |
| VNPay command | `pay_and_create` |
| Amount | Actual payment amount |
| Result | Payment processed AND token saved |

### 3. `token_pay` -- Pay with Saved Token

| Property | Value |
|----------|-------|
| Trigger | `CreateVnPayPaymentUrlCommand` with `PaymentMethodId` set |
| VNPay command | `token_pay` |
| Amount | Actual payment amount |
| Result | Payment charged to saved card (no redirect to VNPay UI) |

## Payment Method Management Endpoints (BE)

| Method | URL | Description | FE Status |
|--------|-----|-------------|-----------|
| `GET` | `/api/payments/methods` | List user's payment methods | Not implemented |
| `POST` | `/api/payments/methods` | Add payment method manually | Not implemented |
| `POST` | `/api/payments/methods/link-card` | Link card via VNPay redirect | Not implemented |
| `POST` | `/api/payments/methods/{id}/default` | Set as default | Not implemented |
| `DELETE` | `/api/payments/methods/{id}` | Deactivate payment method | Not implemented |

## Auto-Create from Callback (BE)

After any successful VNPay payment, `TryLinkOrCreatePaymentMethodFromTokenAsync` runs (best-effort):
1. Check if `callback.VnPayToken` is present
2. Look for existing active PaymentMethod with same token
3. If found: update token info
4. If not found: create new `PaymentMethod.CreateFromVnPayToken()`

This means a buyer who completes a buy-now payment may automatically get a saved payment method without explicitly linking a card.

## FE Impact on Buy Now

Currently, the buy-now flow always uses the standard VNPay payment URL (no token). To support saved-card payments:

1. Show "Save this card" checkbox during buy-now checkout -> sets `SaveCard = true`
2. Allow selecting a saved payment method -> sets `PaymentMethodId`
3. For `token_pay`: no redirect needed (payment happens server-side)

None of this is implemented in the FE.

## Implementation Checklist

- [ ] Create PaymentMethodsPage or section in settings
- [ ] Implement `GET /api/payments/methods` to list saved cards
- [ ] Implement "Link Card" flow (`POST /api/payments/methods/link-card` -> VNPay redirect)
- [ ] Add "Save card" checkbox to buy-now checkout flow
- [ ] Allow selecting saved card for buy-now payment
- [ ] Implement `DELETE /api/payments/methods/{id}` for card removal
- [ ] Implement `POST /api/payments/methods/{id}/default` for default card

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE token handling | `backend: CreateVnPayPaymentUrlCommand.cs` | Routes to standard/pay_and_create/token_pay |
| BE link card | `backend: LinkCardViaVnPayCommand.cs` | token_create flow |
| BE PaymentMethod entity | `backend: PaymentMethod.cs` | Aggregate with VNPay token fields |
| FE service (future) | `src/services/paymentService.ts` | Does not exist yet |
