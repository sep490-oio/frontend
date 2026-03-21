# 08 -- Enums Reference (Frontend)

> **Status**: Reference
> **Source file**: `src/types/enums.ts`

## Overview

Item-related enums are defined as TypeScript union types in `src/types/enums.ts`. They mirror the BE domain enums (PostgreSQL `EnumValueObject<T>` stored as string IDs). The FE also uses inline string-to-color/label maps in page components for display purposes.

---

## ItemCondition

**FE type**: `src/types/enums.ts` -- `ItemCondition`
**BE source**: `OIO.Domain.Context.CatalogContext.Enums.ItemCondition`

```typescript
export type ItemCondition = 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable';
```

| FE Value | BE String ID | i18n Key | Description |
|----------|-------------|----------|-------------|
| `'new'` | `new` | `createItem.conditionNew` | Brand new, unused, in original packaging |
| `'like_new'` | `like_new` | `createItem.conditionLikeNew` | Opened but barely used |
| `'very_good'` | `very_good` | `createItem.conditionVeryGood` | Minor signs of use, fully functional |
| `'good'` | `good` | `createItem.conditionGood` | Noticeable wear, fully functional |
| `'acceptable'` | `acceptable` | `createItem.conditionAcceptable` | Significant wear, still functional |

### Where Used in FE

| Component | Values Used | Purpose |
|-----------|------------|---------|
| `CreateItemPage` | All 5 values | Condition selector dropdown |
| `AdminItemsPage` | Display only | Shown in item column as text |
| `SellerItem` type | `condition: string` | Type is `string` (not `ItemCondition`) in My Items list |
| `ItemSummary` type | `condition: ItemCondition` | Used in auction detail views |

### BE Note: WarehouseItemCondition

The BE warehouse inspection uses a separate `WarehouseItemCondition` enum that includes an additional `damaged` value not present in `ItemCondition`. This enum is not defined in the FE since the warehouse flow is not implemented.

---

## ItemStatus (Display-Only)

The BE `ItemStatus` enum has 10 values. The FE does **not** define an `ItemStatus` union type in `enums.ts`. Instead, item status is typed as `string` and mapped to display colors/labels inline in components.

**BE source**: `OIO.Domain.Context.CatalogContext.Enums.ItemStatus`

| BE Value | Color (MyListingsPage) | Color (AdminItemsPage) | i18n Key (MyListingsPage) |
|----------|----------------------|----------------------|--------------------------|
| `draft` | `default` | `default` | `myListings.itemStatusDraft` |
| `pending_review` | `processing` | `processing` | `myListings.itemStatusPendingReview` |
| `pending_verify` | `gold` | `gold` | `myListings.itemStatusPendingVerify` |
| `pending_condition_confirmation` | -- | `gold` | -- |
| `approved` | `cyan` | `cyan` | `myListings.itemStatusApproved` |
| `rejected` | -- | `red` | -- |
| `active` | `green` | `green` | `myListings.itemStatusActive` |
| `in_auction` | `blue` | `blue` | `myListings.itemStatusInAuction` |
| `sold` | `purple` | `purple` | `myListings.itemStatusSold` |
| `removed` | `red` | `red` | `myListings.itemStatusRemoved` |

### Status Color Map (MyListingsPage)

```typescript
const ITEM_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  pending_review: 'processing',
  pending_verify: 'gold',
  approved: 'cyan',
  active: 'green',
  in_auction: 'blue',
  sold: 'purple',
  removed: 'red',
};
```

Note: `rejected` and `pending_condition_confirmation` are missing from this map (would fall back to `'default'`).

### Status Color Map (AdminItemsPage)

```typescript
const colorMap: Record<string, string> = {
  draft: 'default',
  pending_review: 'processing',
  pending_verify: 'gold',
  pending_condition_confirmation: 'gold',
  approved: 'cyan',
  rejected: 'red',
  active: 'green',
  in_auction: 'blue',
  sold: 'purple',
  removed: 'red',
};
```

AdminItemsPage includes all 10 statuses. Labels use dynamic i18n keys: `t('admin.items.status.${status}')`.

### Status Transition Diagram

```
draft -------> pending_review    (submit, verifyByPlatform=false)
draft -------> pending_verify    (submit, verifyByPlatform=true)  [FE: not used]
draft -------> active            (activate)

pending_review -> approved       (admin approves)
pending_review -> rejected       (admin rejects)

pending_verify -> approved       (inspection approved, condition matches)
pending_verify -> rejected       (inspection rejected)
pending_verify -> pending_condition_confirmation  (condition differs)

pending_condition_confirmation -> approved  (seller confirms)

rejected -----> pending_review   (resubmit)  [FE: not implemented]
rejected -----> pending_verify   (resubmit)  [FE: not implemented]

approved -----> in_auction       (auction goes live)
active -------> in_auction       (auction goes live)

in_auction ---> sold             (auction completed with winner)
in_auction ---> active           (auction cancelled / no sale)
```

---

## ModerationStatus (Legacy FE Type)

**FE type**: `src/types/enums.ts` -- `ModerationStatus`

```typescript
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
```

This is a legacy type from early development. The BE now uses `ItemStatus` (10 values) instead of a separate `ModerationStatus`. The FE type still exists in `enums.ts` and is referenced by the `Item` interface in `types/item.ts`, but `SellerItem` (used by actual list views) uses `status: string` instead.

---

## ListingVerificationStatus (Legacy FE Type)

**FE type**: `src/types/enums.ts` -- `ListingVerificationStatus`

```typescript
export type ListingVerificationStatus = 'unverified' | 'pending_verification' | 'verified';
```

This type represents the item verification badge (separate from moderation). It is defined in `enums.ts` and used in the `Item` and `ItemSummary` interfaces, but the verification badge feature is not actively displayed in the current FE UI.

---

## ModerationAction (BE-Only)

The BE records moderation actions in `ItemModerationReview` entities. This enum is not defined in the FE since the moderation history UI is not implemented.

| BE Value | Description |
|----------|-------------|
| `submitted` | Seller submitted item for review |
| `assigned` | Admin assigned as reviewer |
| `started_review` | Admin started reviewing |
| `approved` | Admin approved |
| `rejected` | Admin rejected (with reason) |
| `platform_verified` | Warehouse inspection approved |
| `platform_rejected` | Warehouse inspection rejected |
| `condition_confirmation_requested` | Condition differs, awaiting seller confirmation |
| `condition_confirmed` | Seller confirmed inspected condition |
| `resubmitted` | Seller resubmitted after rejection |
| `removed` | Item removed from platform |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/types/enums.ts` | `ItemCondition`, `ModerationStatus`, `ListingVerificationStatus` union types |
| `src/types/item.ts` | `Item`, `SellerItem`, `ItemSummary` interfaces using these enums |
| `src/pages/seller/CreateItemPage.tsx` | `CONDITION_OPTIONS` array mapping values to i18n keys |
| `src/pages/seller/MyListingsPage.tsx` | `ITEM_STATUS_COLORS`, `ITEM_STATUS_KEYS` display maps |
| `src/pages/admin/AdminItemsPage.tsx` | Inline `colorMap` for status tags |
