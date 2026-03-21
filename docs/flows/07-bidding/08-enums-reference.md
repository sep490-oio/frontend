# 08 -- Enums Reference (Frontend)

> **Status**: Reference
> **Source file**: `src/types/enums.ts`

## Overview

All bidding-related enums are defined as TypeScript union types in `src/types/enums.ts`. They mirror the BE domain enums (PostgreSQL `EnumValueObject<T>` stored as string IDs). Using union types instead of TypeScript `enum` keyword provides better tree-shaking and simpler JSON comparison.

## BidStatus

**FE type**: `src/types/enums.ts` -- `BidStatus`
**BE source**: `OIO.Domain.Context.AuctionContext.Enums.BidStatus`

```typescript
export type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'cancelled';
```

| FE Value | BE String ID | Terminal | Description |
|----------|-------------|----------|-------------|
| `'active'` | `active` | No | Bid is live and valid. Initial state on creation. |
| `'outbid'` | `outbid` | Yes | A higher bid was placed; no longer competitive. |
| `'winning'` | `winning` | No | Currently the highest bid. |
| `'won'` | `won` | Yes | Auction resolved, this bid is the winner. |
| `'cancelled'` | `cancelled` | Yes | Cancelled by admin or buy-now finalization. |

### Where Used in FE

| Component/Hook | Values Checked | Purpose |
|----------------|---------------|---------|
| `BidForm` | `'winning'` | Detect if current user is winning (green alert) |
| `BidHistoryList` | `'winning'`, `'won'` | Highlight winning bid with green border + trophy |
| `myBidsService.filterActiveBids()` | `'active'`, `'winning'`, `'outbid'` | Filter for Active tab |
| `myBidsService.filterEndedBids()` | `'won'`, `'cancelled'` | Filter for Ended tab |
| `myBidsService.deduplicateByAuction()` | `'winning'` | Prefer winning bid when deduplicating |

### Transition Diagram

```
active -----> winning      (becomes highest bid)
active -----> outbid       (higher bid placed)
active -----> cancelled    (admin cancel or buy-now)
winning ----> outbid       (higher bid placed)
winning ----> won          (auction resolved)
winning ----> cancelled    (admin cancel or buy-now)
```

## AutoBidStatus

**FE type**: `src/types/enums.ts` -- `AutoBidStatus`
**BE source**: `OIO.Domain.Context.AuctionContext.Enums.AutoBidStatus`

```typescript
export type AutoBidStatus = 'active' | 'paused' | 'exhausted' | 'won' | 'outbid';
```

| FE Value | BE String ID | Terminal | Description |
|----------|-------------|----------|-------------|
| `'active'` | `active` | No | Auto-bid is enabled and will bid automatically. |
| `'paused'` | `paused` | No | Temporarily disabled by user. Wallet hold retained. |
| `'exhausted'` | `exhausted` | No | Budget fully consumed. Reactivated if max increased. |
| `'won'` | `won` | Yes | Auction resolved, this auto-bidder won. |
| `'outbid'` | `outbid` | No | Another bidder exceeded max amount. Can update config. |

### Where Used in FE

| Component | Values Checked | Purpose |
|-----------|---------------|---------|
| `AutoBidForm` | `'active'`, `'paused'` | Show pause/resume buttons |
| `AutoBidForm` | All values | Status tag display with color mapping |

### Status Tag Colors in AutoBidForm

```typescript
const STATUS_TAG_COLOR: Record<AutoBidStatus, string> = {
  active: 'green',
  paused: 'orange',
  exhausted: 'red',
  won: 'blue',
  outbid: 'volcano',
};
```

### i18n Keys

```typescript
const STATUS_I18N_KEY: Record<AutoBidStatus, string> = {
  active: 'bidding.autoBidActive',
  paused: 'bidding.autoBidPaused',
  exhausted: 'bidding.autoBidExhausted',
  won: 'bidding.autoBidWon',
  outbid: 'bidding.autoBidOutbid',
};
```

### Transition Diagram

```
active -----> paused       (user pauses)
active -----> exhausted    (budget consumed)
active -----> won          (auction resolved)
active -----> outbid       (outbid beyond max)
paused -----> active       (user resumes)
exhausted --> active       (user increases max)
outbid -----> active       (user increases max)
won ---------> [terminal]  (cannot modify)
```

## AuctionStatus (Bidding Context)

**FE type**: `src/types/enums.ts` -- `AuctionStatus`
**BE source**: `OIO.Domain.Context.AuctionContext.Enums.AuctionStatus`

```typescript
export type AuctionStatus =
  | 'draft' | 'submitted' | 'resubmitted' | 'pending' | 'pending_review'
  | 'scheduled' | 'published' | 'approved'
  | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed';
```

### Values Relevant to Bidding

| FE Value | Bidding Context | BiddingPanel Behavior |
|----------|----------------|----------------------|
| `'active'` | Auction is live, accepting bids | Show BidForm/SealedBidForm + Buy-Now |
| `'ended'` | Bidding closed, result pending | Show AuctionResult |
| `'sold'` | Winner determined, order created | Show AuctionResult |
| `'cancelled'` | Auction cancelled by seller/admin | Show AuctionResult |
| `'failed'` | Reserve not met or other failure | Show AuctionResult |

### Phase Detection in BiddingPanel

```typescript
const isActive = auction.status === 'active';
const isEnded = ['ended', 'sold', 'cancelled', 'failed'].includes(auction.status);
const isSealed = auction.auctionType === 'sealed';
```

## DepositStatus

**FE type**: `src/types/enums.ts` -- `DepositStatus`
**BE source**: `OIO.Domain.Context.AuctionContext.Aggregates.Auctions.AuctionDeposit`

```typescript
export type DepositStatus = 'held' | 'returned' | 'forfeited' | 'converted_to_payment';
```

| FE Value | BE String ID | Description |
|----------|-------------|-------------|
| `'held'` | `held` | Deposit is active, funds held in wallet. |
| `'returned'` | `returned` | Auction ended, bidder didn't win. Refunded. |
| `'forfeited'` | `forfeited` | Bidder violated rules. Deposit confiscated. |
| `'converted_to_payment'` | `converted_to_payment` | Winner's deposit applied to order payment. |

### Additional FE Display Statuses

The `QualificationSection` component maps additional status strings for display purposes (these may come from BE in certain states):

```typescript
const DEPOSIT_STATUS_KEY: Record<string, string> = {
  held: 'bidding.depositHeld',
  holding: 'bidding.depositHolding',
  converted_to_payment: 'bidding.depositConverted_to_payment',
  applied: 'bidding.depositApplied',
  returned: 'bidding.depositReturned',
  refunded: 'bidding.depositRefunded',
  forfeited: 'bidding.depositForfeited',
};
```

### Tag Colors in QualificationSection

| Status | Color |
|--------|-------|
| `held` | orange |
| `converted_to_payment` | green |
| `returned` | cyan |
| everything else | red |

## AuctionType

**FE type**: `src/types/enums.ts` -- `AuctionType`

```typescript
export type AuctionType = 'open' | 'sealed';
```

| FE Value | BE Value | Description |
|----------|----------|-------------|
| `'open'` | `regular` | English ascending auction. Live bids, auto-bid, bid history visible. |
| `'sealed'` | `sealed` | Hidden single-bid auction. One bid per bidder, revealed at end. |

**Important mapping difference**: The FE uses `'open'` while the BE uses `'regular'`. The `mapAuctionDetail()` adapter in `auctionService.ts` currently hardcodes `auctionType: 'open'` since the BE does not return auction type in the detail response:

```typescript
auctionType: 'open' as const,  // BE doesn't return this yet
```

## DepositSourceType

**FE type**: `src/types/enums.ts` -- `DepositSourceType`

```typescript
export type DepositSourceType = 'wallet' | 'payment_gateway' | 'bank_transfer';
```

Used in the `AuctionDeposit` interface but not directly checked in UI logic. The deposit flow always uses VNPay (payment_gateway).

## AuctionResult

**FE type**: `src/types/enums.ts` -- `AuctionResult`

```typescript
export type AuctionResult = 'winner' | 'outbid' | 'auction_cancelled';
```

Used in the `AuctionDeposit` interface to indicate what happened to the bidder after the auction ended. Not directly rendered in current UI.

## FE-to-BE Enum Mapping Summary

| Domain | FE Type | FE Values | BE String IDs | Match? |
|--------|---------|-----------|---------------|--------|
| Bid status | `BidStatus` | `active, outbid, winning, won, cancelled` | `active, outbid, winning, won, cancelled` | Exact match |
| Auto-bid status | `AutoBidStatus` | `active, paused, exhausted, won, outbid` | `active, paused, exhausted, won, outbid` | Exact match |
| Sealed bid status | (not defined in FE) | -- | `submitted, revealed, invalidated, withdrawn` | Missing in FE |
| Buy-now reservation | (not defined in FE) | -- | `pending_payment, paid, expired, cancelled, failed` | Missing in FE |
| Deposit status | `DepositStatus` | `held, returned, forfeited, converted_to_payment` | `held, returned, forfeited, converted_to_payment` | Exact match |
| Auction type | `AuctionType` | `open, sealed` | `regular, sealed` | `open` != `regular` |
| Auction status | `AuctionStatus` | 13 values | varies | FE has extra values |

## Source Files

| File | Path |
|------|------|
| All enums | `src/types/enums.ts` |
| Bid type (uses BidStatus) | `src/types/auction.ts` |
| AutoBid type (uses AutoBidStatus) | `src/types/auction.ts` |
| AuctionDeposit type (uses DepositStatus) | `src/types/auction.ts` |
| SignalR types | `src/types/signalr.ts` |
