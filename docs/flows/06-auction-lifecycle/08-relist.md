# 08 - Relist Auction (Frontend)

## Status: Not Implemented

No FE pages or components handle relisting auctions. The BE endpoint exists but no UI calls it.

---

## BE Summary

When a winner defaults on payment (status `PaymentDefaulted`), the seller can relist the auction via `POST /api/auctions/{id}/relist`. This creates a **new auction** (new ID) linked to the original via `AuctionRelistHistory`. Only one relist is allowed per defaulted auction.

### Key Points
- Creates a new auction in `Draft` status with a new GUID v7 ID
- Timing fields are required (qualification window + start/end)
- Pricing fields are optional — defaults to original auction's values
- Only allowed when status is `PaymentDefaulted`
- Only one relist per auction (checked via `RelistHistory.NewAuctionId`)
- Sealed auctions cannot have `autoExtend = true`

---

## BE Endpoint

| Method | Endpoint | Permission | Response |
|--------|----------|------------|----------|
| POST | `/api/auctions/{id}/relist` | `Catalogs.Auctions.Submit` | 200 OK with `AuctionDto` |

### Request Body

```json
{
  "qualificationStartAt": "2026-04-01T00:00:00Z",
  "qualificationEndAt": "2026-04-03T00:00:00Z",
  "startAt": "2026-04-03T10:00:00Z",
  "endAt": "2026-04-10T10:00:00Z",
  "startingPrice": 100000,
  "bidIncrement": 10000,
  "reservePrice": 500000,
  "buyNowPrice": 1000000,
  "currency": "VND",
  "reason": "Winner did not pay"
}
```

Timing fields are required. Pricing and reason are optional (defaults to original values).

---

## What Needs to Be Built

| Feature | Location | Description |
|---------|----------|-------------|
| Relist button | MyListingsPage (PaymentDefaulted auctions) | Open relist form |
| Relist form | New component or modal | Timing picker + optional pricing overrides + reason |
| Relist history display | AuctionDetailPage | Show link to original / relisted auction |

---

## BE Error Codes

| Code | When |
|------|------|
| `Auction.InvalidState` | Status is not `PaymentDefaulted` |
| `Auction.AlreadyRelisted` | Already relisted from current state |
| `Auction.SealedAutoExtendNotSupported` | Sealed auction with autoExtend=true |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/08-relist.md` for the relist handler, `RegisterRelist()` domain logic, and `AuctionRelistedEvent`.
