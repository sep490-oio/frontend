# 07 -- Activate Item and Create Auction

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/05-item-management/07-activate-and-auction.md`

## Overview

Once an item is approved by an admin, the seller can create an auction from it. The FE supports two entry points for auction creation: (1) the "Create Auction" button on MyListingsPage next to approved/active items, and (2) the standalone CreateAuctionPage which includes an item selector.

The FE also has an `activateItem()` function (approved -> active) but the current flow bypasses explicit activation -- items go directly from `approved` to auction creation.

---

## API Calls

### POST `/api/items/{itemId}/activate` -- Activate Item

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/items/{itemId}/activate` |
| **Permission** | `Catalogs.Items.Activate` |
| **FE Function** | `activateItem()` in `src/services/auctionService.ts` |
| **Hook** | `useActivateItem()` in `src/hooks/useItems.ts` |

No request body. Transitions item: `approved` -> `active` (or `draft` -> `active`).

#### Response: `204 No Content`

**Current usage**: The hook exists but is not actively called in the current UI flow. The CreateAuctionPage does not require activation before auction creation -- the BE allows auction creation from both `approved` and `active` items.

---

### POST `/api/items/{itemId}/auctions` -- Create Auction from Item

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/items/{itemId}/auctions` |
| **Permission** | `Catalogs.Auctions.Create` |
| **FE Function** | `createAuctionFromItem()` in `src/services/auctionService.ts` |
| **Hook** | `useCreateAuction()` in `src/hooks/useSellerManagement.ts` |

#### Request Body

```typescript
interface CreateAuctionFromItemRequest {
  startingPrice: number;     // Non-negative
  bidIncrement: number;      // Non-negative
  reservePrice?: number;     // Optional, must be >= startingPrice
  buyNowPrice?: number;      // Optional, must be >= startingPrice
  extensionMinutes?: number; // 1-30, default 5
  currency?: string;         // 3-char code, default "VND"
  auctionType?: string;      // "regular" | "sealed", default "regular"
}
```

#### Response: `201 Created` with `AuctionDto`

The FE extracts `{ id }` from the response to proceed with auction timing and submission.

---

### GET `/api/items/my` -- Get Seller's Items

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/items/my` |
| **Permission** | Authenticated |
| **FE Function** | `getMyItems()` in `src/services/auctionService.ts` |
| **Hook** | `useMyItems()` in `src/hooks/useSellerManagement.ts` |

Used by CreateAuctionPage to populate the item selector. The response is mapped to `SellerItem[]`.

---

## FE Implementation

### MyListingsPage -- "Create Auction" Button

**File**: `src/pages/seller/MyListingsPage.tsx`

The button appears for items with `status === 'active'` or `status === 'approved'`:

```typescript
{(record.status === 'active' || record.status === 'approved') && (
  <Button type="primary" size="small" icon={<PlusOutlined />}
    onClick={() => navigate(`/create-auction/${record.id}`)}>
    {t('myListings.createAuction')}
  </Button>
)}
```

This navigates to `/create-auction/:itemId` with the item pre-selected.

### CreateAuctionPage -- 4-Step Wizard

**File**: `src/pages/seller/CreateAuctionPage.tsx`

The auction creation follows a 4-step wizard:

1. **Select Item**: Choose from approved/active items (or pre-selected via URL param)
2. **Configure Auction**: Set pricing (starting price, bid increment, reserve, buy-now), timing (start/end, qualification window), and anti-sniping settings
3. **Review**: Summary of all settings before submission
4. **Done**: Success confirmation with publish option

The 3-step BE API flow within the wizard:

```
Step 1: POST /api/items/{itemId}/auctions  -> Creates draft auction (pricing only)
Step 2: POST /api/auctions/{id}/submit     -> Draft -> Approved
Step 3: PUT /api/auctions/{id}/timing      -> Sets timing -> Scheduled
```

### Item Selector in CreateAuctionPage

The page filters `useMyItems()` results to show only items eligible for auction:

- Status must be `active` or `approved`
- Each item displays: thumbnail, title, condition badge, status tag

---

## Item-to-Auction Status Flow

```
Item: draft
  |-- (submit for review)
  v
Item: pending_review
  |-- (admin approves)
  v
Item: approved
  |-- (create auction) --> Auction: draft
  |-- (activate) --> Item: active
  v
Item: active
  |-- (create auction) --> Auction: draft
```

When an auction is created, the BE calls `item.MarkInAuction()` which transitions the item to `in_auction` status. This happens automatically -- the FE does not make a separate call.

---

## BE Preconditions for Auction Creation

| Precondition | BE Error Code |
|-------------|--------------|
| Caller must be item seller | `Auction.OnlyOwnerOfItem` |
| Item must have >= 1 media | `Auction.ItemRequiresMedia` |
| Item status must be approved/active (or draft/pending states) | `Item.NotAvailable` |
| No existing auction in blocking status | `Auction.ItemAlreadyHasAuction` |
| Payment-defaulted auction requires relist | `Auction.PaymentDefaultedRequiresRelist` |
| Starting price non-negative | `Auction.InvalidStartingPrice` |
| Bid increment non-negative | `Auction.InvalidIncrement` |
| Reserve price >= starting price | `Auction.InvalidReserve` |
| Buy-now price >= starting price | `Auction.InvalidBuyNow` |

---

## Cache Invalidation

| Hook | Query Keys Invalidated |
|------|----------------------|
| `useCreateAuction()` | `['myItems']`, `['myAuctions']` |
| `useActivateItem()` | `['myItems']` |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/seller/MyListingsPage.tsx` | "Create Auction" button for approved/active items |
| `src/pages/seller/CreateAuctionPage.tsx` | 4-step auction creation wizard with item selector |
| `src/services/auctionService.ts` | `activateItem()`, `createAuctionFromItem()`, `getMyItems()` |
| `src/hooks/useItems.ts` | `useActivateItem()` mutation |
| `src/hooks/useSellerManagement.ts` | `useMyItems()` query, `useCreateAuction()` mutation |
| `src/types/item.ts` | `SellerItem` interface |
| `src/types/auction.ts` | `CreateAuctionFromItemRequest` interface |
