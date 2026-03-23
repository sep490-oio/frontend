# 09 - Runner-Up Offer (Frontend)

## Status: Not Implemented

No FE pages or components handle runner-up offers. The BE endpoints exist but no UI calls them.

---

## BE Summary

When the original winner defaults on payment (status `PaymentDefaulted`), the seller can offer the item to the next-highest bidder (runner-up). The system supports sequential offers: if one runner-up declines or the offer expires, the seller can offer to the next candidate.

### Flow
1. **Seller creates offer**: `POST /api/auctions/{id}/runner-up-offers` -> finds next eligible bidder, creates `Pending` offer with 24h expiration
2. **Runner-up responds**: `POST /api/auctions/{id}/runner-up-offers/respond` with `{ "accept": true/false }`
   - **Accept**: Auction transfers to runner-up (status -> `Sold`, winner updated)
   - **Decline**: Auction stays `PaymentDefaulted`, seller can offer to next candidate
3. **Expiration**: `ExpireRunnerUpOffersJob` runs every 5 minutes, expires stale offers, notifies both parties

### Key Points
- Only allowed when status is `PaymentDefaulted`
- One active offer at a time (`WinnerOfferAlreadyActive` if pending offer exists)
- Ranked by bid amount (highest first), tie-break by earliest `CreatedAt`
- Previously offered bidders (except cancelled offers) are skipped
- Offer expires after `RunnerUpOfferExpirationHours` (default: 24h)
- `NoMoreRunnerUps` error when all candidates exhausted

---

## BE Endpoints

| Method | Endpoint | Permission | Purpose |
|--------|----------|------------|---------|
| POST | `/api/auctions/{id}/runner-up-offers` | `Catalogs.Auctions.Submit` | Create runner-up offer (seller) |
| POST | `/api/auctions/{id}/runner-up-offers/respond` | `Catalogs.Auctions.Bid` | Accept/decline offer (bidder) |

---

## What Needs to Be Built

| Feature | Location | Description |
|---------|----------|-------------|
| "Offer Runner-Up" button | MyListingsPage (PaymentDefaulted) | Initiate runner-up offer |
| Runner-up offer notification | Notification system | Show offer to eligible bidder |
| Accept/Decline UI | AuctionDetailPage or dedicated page | Bidder responds to offer |
| Offer status tracking | MyListingsPage | Show pending/accepted/declined/expired status |
| Expiration countdown | Offer response page | Show remaining time to respond |

---

## BE Error Codes

| Code | When |
|------|------|
| `Auction.InvalidState` | Status is not `PaymentDefaulted` |
| `Auction.WinnerOfferAlreadyActive` | A pending offer already exists |
| `Auction.NoMoreRunnerUps` | All eligible candidates exhausted |
| `Auction.WinnerOfferExpired` | Offer already expired |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/09-runner-up-offer.md` for the full offer/respond flow, `ExpireRunnerUpOffersJob` background service, and `AuctionRunnerUpOfferedEvent` / `AuctionRunnerUpOfferRespondedEvent`.
