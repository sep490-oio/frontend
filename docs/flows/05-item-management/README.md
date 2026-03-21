# 05 -- Item Management

> **Status**: Implemented (partial -- no Q&A, no warehouse inspection)
> **BE docs**: `backend/docs/flows/05-item-management/`

## Overview

The Item Management module covers the full item lifecycle from the seller's perspective: creating an item, uploading images, submitting for admin review, admin approval/rejection, and transitioning approved items into auctions. Items are the foundation of the auction system -- every auction is linked to exactly one item.

The FE currently implements the **admin review path** only (`verifyByPlatform = false`). The warehouse inspection path (`verifyByPlatform = true`) and Q&A features are not yet built on the frontend.

---

## User Flow

```
Seller creates item (draft)
       |
       v
Upload images (Cloudinary signed upload)
       |
       v
Submit for review (draft -> pending_review)
       |
       v
Admin reviews in queue (approve / reject)
       |
       v
Item approved -> Seller creates auction
```

---

## Component Hierarchy

```
CreateItemPage (seller/CreateItemPage.tsx)
├── Steps (3-step wizard)
├── Step 0: Image Upload
│   ├── Upload (Ant Design)
│   ├── Image preview grid (with primary badge)
│   └── Delete button per image
├── Step 1: Item Details Form
│   ├── Input (title, max 255 chars)
│   ├── Select (condition -- 5 options)
│   ├── Select (category -- from useCategories)
│   └── TextArea (description, max 2000 chars)
└── Step 2: Done (success/draft message)

MyListingsPage (seller/MyListingsPage.tsx)
├── Tabs
│   ├── Tab: My Items
│   │   └── Table<SellerItem>
│   │       ├── Image column
│   │       ├── Title column
│   │       ├── Status column (Tag with color)
│   │       ├── Created At column
│   │       └── Actions column
│   │           ├── "Submit for Review" (draft items)
│   │           └── "Create Auction" (active/approved items)
│   └── Tab: My Auctions
│       └── Table<AuctionListItem> (auction management)

AdminItemsPage (admin/AdminItemsPage.tsx)
├── Header (title + refresh button)
├── Status filter (Select)
└── Table (review queue)
    ├── Item column (avatar + title + condition)
    ├── Status column (Tag)
    ├── Reviewer column (assigned/not assigned)
    ├── Created At column
    └── Actions column
        ├── Approve button (with confirm modal)
        └── Reject button (opens reason modal)
```

---

## Routes

| Route | Page Component | Auth Required | Description |
|-------|---------------|---------------|-------------|
| `/create-item` | `CreateItemPage` | Seller | Create new item with images |
| `/my-listings` | `MyListingsPage` | Seller | View & manage items and auctions |
| `/create-auction/:itemId?` | `CreateAuctionPage` | Seller | Create auction from approved/active item |
| `/admin/items` | `AdminItemsPage` | Admin | Item review queue |

---

## API Endpoints Consumed

### Seller Endpoints

| Method | Path | FE Function | Page |
|--------|------|-------------|------|
| `POST` | `/api/items` | `createItem()` | CreateItemPage |
| `POST` | `/api/items/{id}/media` | `addItemMedia()` | CreateItemPage |
| `POST` | `/api/items/{id}/submit` | `submitItemForReview()` | CreateItemPage, MyListingsPage |
| `POST` | `/api/items/{id}/activate` | `activateItem()` | (available, not directly used in current flow) |
| `GET` | `/api/items/my` | `getMyItems()` | MyListingsPage, CreateAuctionPage |
| `POST` | `/api/items/{id}/auctions` | `createAuctionFromItem()` | CreateAuctionPage |
| `GET` | `/api/categories` | `getCategories()` | CreateItemPage |

### Admin Endpoints

| Method | Path | FE Function | Page |
|--------|------|-------------|------|
| `GET` | `/api/admin/items/review-queue` | `getItemReviewQueue()` | AdminItemsPage |
| `POST` | `/api/admin/items/{id}/approve` | `approveItem()` | AdminItemsPage |
| `POST` | `/api/admin/items/{id}/reject` | `rejectItem()` | AdminItemsPage |

### Not Yet Consumed

| Method | Path | BE Feature | Reason |
|--------|------|-----------|--------|
| `GET` | `/api/items/{id}` | Public item detail | No standalone item detail page |
| `POST` | `/api/items/{id}/resubmit` | Resubmit rejected item | No resubmit UI |
| `POST` | `/api/items/{id}/questions` | Ask question on item | Q&A not implemented |
| `POST` | `/api/items/{id}/questions/{qid}/answer` | Answer question | Q&A not implemented |
| `GET` | `/api/items/{id}/questions` | List questions | Q&A not implemented |
| `POST` | `/api/items/{id}/shipping` | Ship to warehouse | Warehouse path not implemented |
| `POST` | `/api/items/{id}/confirm-inspected-condition` | Confirm condition | Warehouse path not implemented |
| `POST` | `/api/admin/items/{id}/assign` | Assign reviewer | Available in service, not in UI |
| `GET` | `/api/admin/items/{id}` | Admin item detail | Available in service, not surfaced |
| `GET` | `/api/admin/items/{id}/reviews` | Review history | Available in service, not surfaced |
| `DELETE` | `/api/items/{id}/media/{mediaId}` | Remove media | No edit-item page |
| `POST` | `/api/items/{id}/media/{mediaId}/primary` | Set primary image | No edit-item page |
| `PUT` | `/api/items/{id}/media/reorder` | Reorder media | No edit-item page |

---

## Subflow Index

| # | File | Topic | Status |
|---|------|-------|--------|
| 1 | [01-create-item.md](./01-create-item.md) | Create item (draft) with form details | Implemented |
| 2 | [02-manage-media.md](./02-manage-media.md) | Upload images during item creation | Implemented |
| 3 | [03-item-qa.md](./03-item-qa.md) | Item Q&A (ask/answer questions) | Not Implemented |
| 4 | [04-submit-review.md](./04-submit-review.md) | Submit item for admin review | Implemented |
| 5 | [05-admin-review.md](./05-admin-review.md) | Admin review queue (approve/reject) | Implemented |
| 6 | [06-warehouse-inspection.md](./06-warehouse-inspection.md) | Warehouse inspection path | Not Implemented |
| 7 | [07-activate-and-auction.md](./07-activate-and-auction.md) | Activate item and create auction | Implemented |
| 8 | [08-enums-reference.md](./08-enums-reference.md) | Item-related enums (status, condition) | Reference |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/pages/seller/CreateItemPage.tsx` | 3-step wizard: upload images, fill details, submit |
| `src/pages/seller/MyListingsPage.tsx` | Seller's item + auction management dashboard |
| `src/pages/seller/CreateAuctionPage.tsx` | Create auction from an existing item |
| `src/pages/admin/AdminItemsPage.tsx` | Admin item review queue with approve/reject |
| `src/services/auctionService.ts` | Item CRUD functions (`createItem`, `addItemMedia`, `getMyItems`, etc.) |
| `src/services/adminService.ts` | Admin item review functions (`getItemReviewQueue`, `approveItem`, `rejectItem`) |
| `src/services/mediaService.ts` | Cloudinary signed upload flow (used by CreateItemPage) |
| `src/hooks/useItems.ts` | TanStack Query mutations: `useCreateItem`, `useActivateItem`, `useSubmitItem` |
| `src/hooks/useSellerManagement.ts` | TanStack Query: `useMyItems`, `useCreateAuction` |
| `src/types/item.ts` | Type definitions: `Item`, `SellerItem`, `ItemSummary`, `Category` |
| `src/types/enums.ts` | `ItemCondition`, `ModerationStatus`, `ListingVerificationStatus` |
| `src/utils/formatters.ts` | `STATUS_COLORS`, `STATUS_KEYS` for auction status display |
