# 06 -- Deposit Funding (Frontend)

> **Status**: Not implemented
> **BE doc**: `backend/docs/flows/08-buy-now/06-deposit-funding.md`

## Overview

When a buy-now reservation finalizes and the buyer had a held auction deposit, the BE converts that deposit into partial payment for the order. This creates a "split payment" scenario with two escrows: one for the VNPay gateway amount and one for the converted deposit. This is entirely a BE operation -- the FE has no direct role but should display the funding breakdown to the user.

## What Happens on the BE

### Deposit Calculation (at Reservation Time)

```
buyNowPrice      = auction.Pricing.BuyNowPrice
heldDeposit      = buyer's held deposit (from qualification phase)
depositApplied   = min(heldDeposit.Amount, buyNowPrice.Amount)
gatewayAmountDue = buyNowPrice.Amount - depositApplied
```

This calculation is returned in `BuyNowCheckoutDto.DepositAppliedAmount` and `AmountDue`.

### Deposit Funding (at Finalization Time)

Only runs if `reservation.DepositAppliedAmount > 0`:

1. Find buyer's held deposit on the auction
2. Create internal funding transaction (ref: `BNDEP-{guid}`, type: `Payment`)
3. Mark transaction as completed immediately (no external gateway)
4. Convert deposit status: `Held -> ConvertedToPayment`
5. Debit buyer's wallet pending balance (or fallback to regular debit)
6. Create escrow for the deposit portion

### Two Escrows Per Buy-Now Order

| Escrow | Source | Amount |
|--------|--------|--------|
| Gateway escrow | VNPay payment | `transaction.Amount` (VNPay portion) |
| Deposit escrow | Converted deposit | `reservation.DepositAppliedAmount` |

Both reference the same `order.Id` but different transaction IDs.

### Skip Condition

If `reservation.DepositAppliedAmount == 0` (buyer had no deposit), the entire deposit funding step is skipped. Only the gateway escrow is created.

## FE Impact

### What the FE Should Display

**Before payment (in BuyNowConfirmModal)**:
- Full buy-now price
- Deposit being applied (from `BuyNowCheckoutDto.DepositAppliedAmount`)
- Amount due via VNPay (from `BuyNowCheckoutDto.AmountDue`)

Example display:
```
Buy Now Price:     5,000,000 VND
Deposit Applied:  -  500,000 VND
Amount Due:        4,500,000 VND
```

**After payment (in order detail)**:
- Order total = buy-now price
- Payment breakdown: VNPay + deposit conversion
- Two escrow records in payment info

Currently, the FE does not parse `BuyNowCheckoutDto` and does not display any funding breakdown.

## Implementation Checklist

- [ ] Parse `BuyNowCheckoutDto.DepositAppliedAmount` and `AmountDue`
- [ ] Display funding breakdown in `BuyNowConfirmModal` before redirect
- [ ] Show deposit-to-payment conversion in order detail (future OrderDetailPage)
- [ ] Handle the case where deposit fully covers buy-now price (`AmountDue == 0`)

## Source Files

| File | Path | Notes |
|------|------|-------|
| BE deposit funding | `backend: ProcessVnPayCallbackCommandHandler.ApplyBuyNowDepositFundingAsync` | Lines 717-796 |
| FE type (needs update) | `src/types/auction.ts` | `BuyNowResponse` does not include deposit fields |
| FE modal (needs update) | `src/components/auction/BuyNowConfirmModal.tsx` | No deposit breakdown display |
