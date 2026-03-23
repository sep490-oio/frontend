# 01 -- Create Item

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/05-item-management/01-create-item.md`

## Overview

Sellers create items through a 3-step wizard on `CreateItemPage`. The page guides the seller through: (1) uploading images via the Cloudinary signed upload flow, (2) filling in item details (title, condition, category, description), and (3) seeing a success confirmation. On submit, the FE creates a draft item, attaches uploaded images, and auto-submits for admin review.

---

## API Calls

### POST `/api/items` -- Create Item (Draft)

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/items` |
| **Permission** | `items.create` (seller) |
| **FE Function** | `createItem()` in `src/services/auctionService.ts` |
| **Hook** | `useCreateItem()` in `src/hooks/useItems.ts` |

#### Request Body

```typescript
interface CreateItemRequest {
  title: string;          // Required, max 255 chars
  condition: string;      // Required: 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable'
  categoryId?: string;    // Optional GUID
  description?: string;   // Optional, max 2000 chars (FE limit)
  quantity?: number;      // Optional, defaults to 1
  images?: Array<{        // Optional inline images (not used by FE -- FE attaches separately)
    mediaUploadId: string;
    publicId: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}
```

#### Response: `201 Created`

```json
{
  "id": "3fa85f64-...",
  "sellerId": "3fa85f64-...",
  "title": "...",
  "status": "draft",
  "condition": "like_new",
  "createdAt": "2026-03-20T10:00:00Z"
}
```

The FE extracts `{ id }` from the response to use in subsequent media attachment calls.

---

### GET `/api/categories` -- Fetch Category Tree

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/categories` |
| **Permission** | Anonymous |
| **Hook** | `useCategories()` in `src/hooks/useAuctions.ts` |

Returns a tree of categories. The FE flattens the tree into a searchable `Select` dropdown:

```typescript
const categoryOptions = categories.flatMap((cat) => {
  const opts = [{ value: cat.id, label: cat.name }];
  if (cat.children) {
    opts.push(
      ...cat.children.map((child) => ({
        value: child.id,
        label: `${cat.name} > ${child.name}`,
      }))
    );
  }
  return opts;
});
```

---

## FE Implementation

**File**: `src/pages/seller/CreateItemPage.tsx`

### Step 0: Upload Images

Handled by `mediaService.uploadMedia(file, 'item_image')`. See [02-manage-media.md](./02-manage-media.md) for details.

### Step 1: Item Details Form

| Field | Ant Design Component | Validation | Form Name |
|-------|---------------------|------------|-----------|
| Title | `Input` | Required, max 255 chars, `showCount` | `title` |
| Condition | `Select` | Required, 5 options | `condition` |
| Category | `Select` (searchable, clearable) | Optional | `categoryId` |
| Description | `TextArea` | Optional, max 2000 chars, `showCount` | `description` |

#### Condition Options

```typescript
const CONDITION_OPTIONS = [
  { value: 'new',        labelKey: 'createItem.conditionNew' },
  { value: 'like_new',   labelKey: 'createItem.conditionLikeNew' },
  { value: 'very_good',  labelKey: 'createItem.conditionVeryGood' },
  { value: 'good',       labelKey: 'createItem.conditionGood' },
  { value: 'acceptable', labelKey: 'createItem.conditionAcceptable' },
];
```

All labels are i18n keys, not hardcoded text.

### Step 2: Submit Flow

The submit handler performs three sequential API calls:

```
1. createItem({ title, condition, categoryId, description, quantity: 1 })
   -> Returns { id: itemId }

2. For each uploaded image (index i):
   addItemMedia(itemId, { mediaUploadId, isPrimary: i === 0, sortOrder: i })
   -> First image is marked as primary

3. submitItemForReview(itemId, false)
   -> verifyByPlatform = false (always admin review path)
   -> draft -> pending_review
```

If step 3 fails, the item remains as a draft with images attached. The seller can submit manually later from MyListingsPage.

### Step 3: Done

Shows either:
- Success alert: "Your item has been submitted for review" (if submit succeeded)
- Info alert: "Your item has been saved as a draft" (if submit failed)

Options: "Create Another" (resets wizard) or "View My Listings" (navigates to `/my-listings`).

### Seller Role Gate

The page checks `user.hasSellerPermission` before rendering. Non-sellers see a prompt to set up their seller profile at `/profile`.

---

## Cache Invalidation

| Hook | Query Key | Invalidated On |
|------|----------|----------------|
| `useCreateItem()` | `['myItems']` | After successful item creation |
| `useSubmitItem()` | `['myItems']` | After successful submit |

---

## Error Handling

| Error | FE Handling |
|-------|-------------|
| Create item fails | `message.error(t('common.error'))` |
| Submit fails | Silent catch -- item stays as draft, no error toast |
| Upload image fails | `message.error(t('createItem.uploadFailed'))` |

---

## BE Validation Rules (not enforced by FE)

The BE performs additional validation that the FE does not replicate:

| Rule | BE Error Code |
|------|--------------|
| Title max 255 chars (enforced by `ItemTitle` value object) | Validation error |
| Category must exist | `Category.NotFound` |
| Quantity must be > 0 | Validation error |
| Item must have >= 1 media to submit | `Item.CannotActivate` |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/seller/CreateItemPage.tsx` | 3-step wizard page component |
| `src/services/auctionService.ts` | `createItem()`, `addItemMedia()` functions |
| `src/hooks/useItems.ts` | `useCreateItem()`, `useSubmitItem()` mutations |
| `src/hooks/useAuctions.ts` | `useCategories()` query |
| `src/types/item.ts` | `Category`, `SellerItem` type definitions |
