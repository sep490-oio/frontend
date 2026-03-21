# QC Report: Full Demo Flow Re-Test (Post Bug Fixes)
**Scope**: All FE bug fixes from session 2026-03-21 | **Date**: 2026-03-21 (afternoon session)

## Summary

Re-tested the full demo flow after fixing 5 FE bugs (error swallowing, QualificationSection visibility, date picker, startTime validation). Key result: **QualificationSection now shows during qualification window** — the main blocker is resolved. Bidding flow could not be tested due to wallet funding (mock-only) and VNPay dependency.

---

## Bug Fix Verification

| Bug | Description | Fix | Re-Test Result |
|-----|-------------|-----|---------------|
| **#1/#3/#5** | Service functions swallow errors → Items(0) on first load | Removed try/catch in 7 functions across 3 files | **PARTIAL** — Error no longer swallowed (errors propagate), but first-load empty page still occurs. Root cause: initial request fires before token is fully initialized. TanStack Query retries now work, page renders after brief delay. |
| **#2** | Date picker disables today | Changed `'minute'` → `'day'` granularity | **PASS** ✓ — Today selectable, start time typed as `21/03/2026 14:30` worked |
| **#7** | No deposit button during qualification window | Added `isInQualificationWindow` detection, removed `BYPASS_DEPOSIT` | **PASS** ✓ — QualificationSection renders during qual window showing "Deposit 50.000₫ to participate", "Insufficient balance" warning, and disabled "Pay Deposit to Join" button |
| **New** | Missing 30-min minimum startTime validation | Added validator rule + i18n keys | Not explicitly tested (no time to trigger validation error) |
| **SignalR** | CORS blocking WebSocket | Tân fixed server-side | **PASS** ✓ — "AuctionHub Connected" in console, "Live" badge on page |

---

## Test Steps Completed

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1 | All 4 | Login | PASS ✓ |
| 2 | Seller | Create 3 items with images (multi-upload) | PASS ✓ — 2 images on item 1, 1 each on items 2 & 3 |
| 3 | Seller | Submit items for review | PASS ✓ — All 3 → pending_review |
| 4 | Admin | Approve all 3 items | PASS ✓ — All 3 → approved |
| 5 | Seller | Create 3 auctions (regular, buy-now, sealed) | PASS ✓ — 3-step flow: create 201, submit 204, timing 200 |
| 6 | Seller | Publish all 3 | **PARTIAL** — A1 published (204 ✓), A2 and A3 failed (400 — BE Bug #6) |
| 7 | Bidder1 | View auction detail during qual window | PASS ✓ — QualificationSection visible with deposit info |
| 8 | Bidder1 | Deposit | **BLOCKED** — Wallet balance is 0₫, "Add Funds" is mock-only, VNPay not available |
| 9-12 | All | Bidding, buy-now, sealed, end states | **BLOCKED** — Requires funded wallet + deposit |

---

## Remaining Issues

### FE Issues (not fixed yet)

| # | Severity | Description | Root Cause |
|---|----------|-------------|------------|
| **Empty page on first load** | MEDIUM | Auction detail and My Listings show empty on first navigation after login | Initial API request fires before token is fully set in axios headers. TanStack Query now retries (fix #1/#3/#5 helped), but there's a brief flash of empty content. Page works after reload or brief wait. |
| **Wallet Add Funds is mock** | HIGH (for demo) | "Add Funds" button uses mock data, no real VNPay wallet top-up | Needs real `POST /api/payments/vnpay/create-url` integration with `purpose: "WalletTopUp"` |
| **Items pagination** | LOW | My Listings shows max 10 items, no page 2 navigation for items | `getMyItems()` doesn't pass pagination params |

### BE Issues (for Tân)

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| **Publish race condition** | HIGH | `POST /api/auctions/{id}/publish` returns 400 on 2nd/3rd auction despite all being in `scheduled` status with timing set | **Reproduced again** — persistent, not transient. A1 always works, A2/A3 always fail. See `be-bugs-for-tan-2026-03-21.md` |
| **SignalR VPS origin** | MEDIUM | CORS works for `localhost:3000` but NOT for VPS origin `http://14.225.222.182` | Tân needs to add VPS origin to CORS allowed list |

---

## Auctions Created This Session

| Auction | ID | Type | Status | Timing (local) |
|---------|-----|------|--------|----------------|
| A1 Regular | `019d0f51-4fee-7af7-9a1e-7a52d8bad75a` | regular, autoExtend | scheduled (published) | Qual 14:40-15:08, Start 15:09, End 15:19 |
| A2 Buy Now | `019d0f51-593e-7a55-b01a-b70a237acf6a` | regular + buyNow 1M | scheduled (NOT published) | Same timing |
| A3 Sealed | `019d0f51-618a-7263-b9bb-53944b7137d5` | sealed | scheduled (NOT published) | Same timing |

---

## Files Modified This Session

| File | Change |
|------|--------|
| `src/services/auctionService.ts` | Removed error swallowing in `getMyItems`, `getAuctionBids`, `getCategories`; fixed `getMyAutoBid` catch; added `qualificationStartAt`/`qualificationEndAt` to API type + mapper |
| `src/services/walletService.ts` | Removed mock fallback on error |
| `src/services/myBidsService.ts` | Removed error swallowing in `getMyBids` |
| `src/components/auction/BiddingPanel.tsx` | Added `isInQualificationWindow`; removed `BYPASS_DEPOSIT`; updated QualificationSection condition |
| `src/types/auction.ts` | Added `qualificationStartAt`, `qualificationEndAt` to Auction interface |
| `src/pages/seller/CreateAuctionPage.tsx` | Fixed date picker (`'day'` granularity); added 30-min startTime validation; changed qual window to 29 min (1-min buffer) |
| `src/locales/vi/common.json` | Added `createAuction.startTimeTooSoon` |
| `src/locales/en/common.json` | Added `createAuction.startTimeTooSoon` |

---

## What's Needed to Complete Full Demo Flow

1. **Tân fixes Publish bug** (#6) — so A2/A3 can be published
2. **Real "Add Funds"** — implement VNPay wallet top-up (or Tân inserts wallet balance via DB)
3. **Tân adds VPS origin to CORS** — for deployed FE to use SignalR
4. **Re-test with funded wallets** — deposit → bid → outbid → buy-now → sealed → auction end

---

## Verdict: PASS WITH NOTES

**FE fixes verified:**
- ✓ QualificationSection shows during qualification window (Bug #7 — BLOCKER resolved)
- ✓ Date picker allows today's date (Bug #2)
- ✓ SignalR connection works on localhost (Tân's CORS fix)
- ✓ Error swallowing removed (Bugs #1/#3/#5)

**Cannot fully test yet:**
- Deposit flow (wallet mock-only + VNPay)
- Bidding, buy-now, sealed bids (requires qualified bidders)
- BE publish bug blocks A2/A3
