# OIO Auction Platform - Frontend Implementation Plan

> **Version:** 1.0
> **Date:** 2026-03-24
> **Stack:** React 19 + TypeScript 5.9 + Vite 8 + Ant Design 6
> **Source of truth:** Backend at `D:\HocTrenTruong\Ky9\Project\OIO`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack & Versions](#2-technology-stack--versions)
3. [Project Structure](#3-project-structure)
4. [Routing & Navigation](#4-routing--navigation)
5. [State Management Strategy](#5-state-management-strategy)
6. [Screen Specifications (Top 15)](#6-screen-specifications-top-15)
7. [API Integration Layer](#7-api-integration-layer)
8. [Real-Time (SignalR) Integration](#8-real-time-signalr-integration)
9. [Forms & Validation](#9-forms--validation)
10. [Enum & Type System](#10-enum--type-system)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Internationalization (i18n)](#12-internationalization-i18n)
13. [Media Upload Pipeline](#13-media-upload-pipeline)
14. [Known Blockers & Risk Register](#14-known-blockers--risk-register)
15. [Implementation Phases & Timeline](#15-implementation-phases--timeline)

---

## 1. Architecture Overview

### High-Level Architecture

```
Browser
  |
  +-- React 19 SPA (Vite 8)
  |     |
  |     +-- React Router v7 (5 panel layouts)
  |     +-- Redux Toolkit (auth state only)
  |     +-- TanStack Query 5 (all server state)
  |     +-- React Hook Form + Zod (form validation)
  |     +-- Ant Design 6 (UI, Vietnamese locale)
  |     +-- i18next (vi primary, en secondary)
  |     +-- dayjs (dates)
  |
  +-- Axios (REST API, JWT auto-refresh, idempotency keys)
  |
  +-- SignalR 10 (3 hubs: auction, dispute, notification)
  |
  +-- Cloudinary (signed upload, 3-step pipeline)
```

### 5 Panel Architecture

| Panel | Layout | Guard | Route Prefix | Pages |
|-------|--------|-------|-------------|-------|
| Public (Guest) | `AppLayout` | None | `/`, `/auctions`, `/items` | 7 |
| User (Auth) | `AppLayout` | `AuthGuard` | `/me/*` | 12 |
| Seller | `SellerLayout` | `SellerGuard` | `/seller/*` | 8+ warehouse |
| Inspector | `InspectorLayout` | `InspectorGuard` | `/inspector/*` | 5 |
| Admin | `AdminLayout` | `RoleGuard(Admin)` | `/admin/*` | 17 |

### Data Flow Pattern

```
Component --> useQuery/useMutation (TanStack Query)
                |
                +--> api.ts (feature-level) --> apiClient (Axios)
                |                                  |
                |                                  +--> JWT interceptor (auto-refresh)
                |                                  +--> Idempotency-Key header
                |                                  +--> X-Correlation-Id header
                |
                +--> SignalR hub --> query invalidation --> auto re-render
```

---

## 2. Technology Stack & Versions

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | React | 19.2.4 | UI framework |
| Language | TypeScript | 5.9.3 | Type safety |
| Build | Vite | 8.0.1 | Dev server + bundler |
| UI Library | Ant Design | 6.3.3 | Component library (Vietnamese locale) |
| Icons | @ant-design/icons | 6.1.0 | Icon set |
| Routing | React Router | 7.13.1 | Client-side routing |
| Server State | TanStack Query | 5.94.5 | Data fetching, caching, sync |
| Client State | Redux Toolkit | 2.11.2 | Auth-only global state |
| Forms | React Hook Form | 7.71.2 | Form management |
| Validation | Zod | 4.3.6 | Schema validation |
| HTTP | Axios | 1.13.6 | REST client + interceptors |
| Real-Time | @microsoft/signalr | 10.0.0 | WebSocket hubs |
| i18n | i18next + react-i18next | 25.10.2 / 16.6.0 | Localization |
| Dates | dayjs | 1.11.20 | Date formatting/parsing |
| Lint | ESLint | 9.39.4 | Code quality |

### Key Constraints
- **No CSS framework** -- Ant Design 6 is the sole UI system
- **No SSR** -- SPA only, Vite build
- **localStorage for tokens** -- XSS risk acknowledged; httpOnly cookie migration planned
- **Lazy loading** -- All pages use `React.lazy()` with `Suspense` fallback

---

## 3. Project Structure

```
src/
  app/
    router.tsx            # All route definitions (5 panels)
    store.ts              # Redux store (auth slice)
    queryClient.ts        # TanStack Query config
  components/
    guards/
      AuthGuard.tsx       # Redirects unauthenticated users
      GuestGuard.tsx      # Redirects authenticated users (login/register)
      SellerGuard.tsx     # Requires approved seller profile
      InspectorGuard.tsx  # Requires inspector role
      RoleGuard.tsx       # Generic role check (used for Admin)
    layout/
      AppLayout.tsx       # Public + User layout
      AuthLayout.tsx      # Login/Register layout
      SellerLayout.tsx    # Seller dashboard layout
      InspectorLayout.tsx # Inspector dashboard layout
      AdminLayout.tsx     # Admin panel layout
  features/
    admin/                # 17 pages, api.ts
    auction/              # 6 pages, api.ts, hooks/
    auth/                 # 6 pages, api.ts, slice.ts
    dispute/              # 2 pages, api.ts
    inspector/            # 5 pages, api.ts
    item/                 # 4 pages, api.ts
    notification/         # 1 page, api.ts, components/
    order/                # 3 pages, api.ts
    payment/              # 5 pages, api.ts
    public/               # 2 pages
    seller/               # 5 pages, api.ts
    user/                 # 4 pages, api.ts
    warehouse/            # 5 pages, api.ts
  hooks/                  # Shared custom hooks
  lib/
    axios.ts              # Axios instance, interceptors, idempotent helpers
    signalr.ts            # Hub factory, connection lifecycle
    cloudinary.ts         # Signed upload pipeline
  types/
    api.ts                # PagedList<T>, MoneyDto, ApiError, HubCommandResult
    auction.ts            # All auction/bid/autobid DTOs
    enums.ts              # 23 enum types as const objects
    notification.ts       # Notification DTOs
  utils/
    constants.ts          # API_URL, SIGNALR_URL, STORAGE_KEYS
  public/
    locales/
      vi/common.json      # Vietnamese translations (primary)
      en/common.json      # English translations (secondary)
```

### Current State: 64 pages, 180 API hooks, 13 feature modules

---

## 4. Routing & Navigation

### Complete Route Map

#### Auth Routes (GuestGuard)

| Path | Page | Lazy | Notes |
|------|------|------|-------|
| `/login` | LoginPage | Yes | Redirect to `/` if authenticated |
| `/register` | RegisterPage | Yes | |
| `/2fa` | TwoFactorPage | Yes | TOTP/SMS verification |
| `/forgot-password` | ForgotPasswordPage | Yes | |
| `/reset-password` | ResetPasswordPage | Yes | Token from email link |

#### Standalone Routes

| Path | Page | Guard | Notes |
|------|------|-------|-------|
| `/confirm-email` | ConfirmEmailPage | None | Accessible to all |
| `/payments/vnpay/return` | VnPayReturnPage | None | No layout wrapper |

#### Public Routes (AppLayout)

| Path | Page | Notes |
|------|------|-------|
| `/` (index) | AuctionListPage | Homepage = auction browse |
| `/auctions` | AuctionListPage | Same as index |
| `/auctions/:id` | AuctionDetailPage | Real-time bids via SignalR |
| `/items/:id` | ItemDetailPage | |
| `/sellers/:id` | PublicSellerPage | |
| `/about` | AboutPage | |
| `/categories` | CategoriesPage | |

#### User Routes (AuthGuard + AppLayout)

| Path | Page | Notes |
|------|------|-------|
| `/me/profile` | ProfilePage | |
| `/me/addresses` | AddressesPage | CRUD with AddressType enum |
| `/me/security` | SecurityPage | Password change, 2FA toggle |
| `/me/notifications` | NotificationsPage | |
| `/me/notifications/settings` | NotificationPrefsPage | |
| `/me/terms` | TermsPage | Platform terms acceptance |
| `/me/items` | MyItemsPage | |
| `/me/items/create` | CreateItemPage | Multi-step with media upload |
| `/me/items/:id/edit` | EditItemPage | |
| `/me/auctions` | MyAuctionsPage | |
| `/me/auctions/create` | CreateAuctionPage | |
| `/me/watchlist` | WatchlistPage | |
| `/me/bids` | MyBidsPage | |
| `/me/orders` | MyOrdersPage | |
| `/me/orders/:id` | OrderDetailPage | |
| `/me/orders/:id/return` | OrderReturnPage | |
| `/me/wallet` | WalletPage | |
| `/me/wallet/withdraw` | WithdrawPage | |
| `/me/payment-methods` | PaymentMethodsPage | |
| `/checkout/:orderId` | CheckoutPage | Wallet + VnPay + hybrid |
| `/me/disputes` | DisputeListPage | |
| `/me/disputes/:id` | DisputeDetailPage | SignalR chat |
| `/seller/register` | CreateSellerProfilePage | Outside SellerGuard |

#### Seller Routes (SellerGuard + SellerLayout)

| Path | Page | Notes |
|------|------|-------|
| `/seller` | SellerDashboardPage | |
| `/seller/items` | MyItemsPage | Reused component |
| `/seller/items/create` | CreateItemPage | Reused component |
| `/seller/items/:id/edit` | EditItemPage | Reused component |
| `/seller/auctions` | MyAuctionsPage | Reused component |
| `/seller/auctions/create` | CreateAuctionPage | Reused component |
| `/seller/bids` | MyBidsPage | |
| `/seller/orders` | MyOrdersPage | Reused component |
| `/seller/orders/:id` | OrderDetailPage | |
| `/seller/orders/:id/return` | OrderReturnPage | |
| `/seller/wallet` | WalletPage | |
| `/seller/wallet/withdraw` | WithdrawPage | |
| `/seller/warehouse/inbound` | InboundShipmentsPage | |
| `/seller/warehouse/inbound/book` | BookInboundPage | |
| `/seller/warehouse/inbound/:id` | InboundDetailPage | |
| `/seller/warehouse/outbound` | OutboundShipmentsPage | |
| `/seller/warehouse/items` | WarehouseItemsPage | |
| `/seller/profile` | SellerProfilePage | |
| `/seller/verification` | VerificationPage | KYC/eKYC |

#### Inspector Routes (InspectorGuard + InspectorLayout)

| Path | Page | Notes |
|------|------|-------|
| `/inspector` | InspectorDashboardPage | |
| `/inspector/queue` | InspectionQueuePage | |
| `/inspector/inspections/:shipmentId` | InspectionDetailPage | |
| `/inspector/reviews` | InspectionReviewPage | |
| `/inspector/storage` | StorageManagementPage | |

#### Admin Routes (RoleGuard[Admin] + AdminLayout)

| Path | Page | Notes |
|------|------|-------|
| `/admin` | AdminDashboardPage | |
| `/admin/users` | AdminUsersPage | |
| `/admin/users/:id` | AdminUserDetailPage | |
| `/admin/verifications` | AdminVerificationsPage | |
| `/admin/verifications/:id` | AdminVerificationDetailPage | |
| `/admin/sellers` | AdminSellerProfilesPage | |
| `/admin/items/review` | AdminReviewQueuePage | |
| `/admin/items/:id` | AdminItemDetailPage | |
| `/admin/auctions/:id` | AdminAuctionControlPage | |
| `/admin/reports` | AdminReportsPage | |
| `/admin/monitoring` | AdminMonitoringPage | |
| `/admin/disputes` | AdminDisputesPage | |
| `/admin/payments` | AdminPaymentsPage | |
| `/admin/terms` | AdminTermsPage | |
| `/admin/roles` | AdminRolesPage | |

### Route Error Handling

All panel groups use `<RouteErrorBoundary />` which:
- Detects dynamic import failures (chunk loading after deploy) and shows a reload prompt
- Handles unexpected errors with a generic fallback
- Offers "Reload page" and "Go home" actions
- Vietnamese language by default

---

## 5. State Management Strategy

### Dual-Layer Approach

| Concern | Tool | Justification |
|---------|------|---------------|
| Auth state (user, tokens, roles) | **Redux Toolkit** | Synchronous access needed by guards, interceptors, layouts |
| Server data (all API responses) | **TanStack Query 5** | Caching, background refetch, optimistic updates, pagination |
| Form state | **React Hook Form** | Controlled forms with Zod validation |
| URL state (filters, pagination) | **React Router v7** | Search params synced with query keys |
| Real-time updates | **SignalR + Query Invalidation** | Hub events trigger `queryClient.invalidateQueries()` |

### TanStack Query Key Convention

```typescript
// Hierarchical keys for targeted invalidation
['auctions', 'list', { filters }]      // auction list with filters
['auctions', 'detail', auctionId]       // single auction
['auctions', 'detail', auctionId, 'bids'] // bids for auction
['items', 'list', { filters }]
['items', 'detail', itemId]
['orders', 'list', { filters }]
['orders', 'detail', orderId]
['wallet', 'balance']
['wallet', 'transactions', { filters }]
['notifications', 'list']
['notifications', 'unreadCount']
```

### Invalidation Strategy on SignalR Events

| SignalR Event | Invalidated Query Keys |
|---------------|----------------------|
| `BidPlaced` | `['auctions', 'detail', auctionId]`, `['auctions', 'detail', auctionId, 'bids']` |
| `PriceUpdated` | `['auctions', 'detail', auctionId]`, `['auctions', 'list']` |
| `AuctionEnded` | `['auctions', 'detail', auctionId]`, `['auctions', 'list']`, `['orders', 'list']` |
| `AuctionExtended` | `['auctions', 'detail', auctionId]` |
| `BuyNowReserved` | `['auctions', 'detail', auctionId]` |
| `BuyNowExecuted` | `['auctions', 'detail', auctionId]`, `['orders', 'list']` |
| `NewNotification` | `['notifications', 'list']`, `['notifications', 'unreadCount']` |
| `UnreadCountUpdated` | `['notifications', 'unreadCount']` |
| `NewMessage` (dispute) | `['disputes', 'detail', disputeId, 'messages']` |
| `DisputeResolved` | `['disputes', 'detail', disputeId]`, `['disputes', 'list']` |

### Optimistic Updates

Apply optimistic updates for these mutations:

| Mutation | Optimistic Behavior |
|----------|-------------------|
| Place bid | Append bid to `recentBids`, increment `bidCount` |
| Toggle watchlist | Toggle watch icon immediately |
| Mark notification read | Decrement unread count immediately |
| Send dispute message | Append message to chat immediately |

---

## 6. Screen Specifications (Top 15)

---

### 6.1 AuctionDetailPage

**Route:** `/auctions/:id`
**Guard:** None (public) -- bid actions require auth
**Feature:** `auction`
**File:** `src/features/auction/pages/AuctionDetailPage.tsx`

#### 6.1.1 Purpose
The most critical screen. Shows auction details, real-time bidding, price history, buy-now, and item information. This is the revenue-generating page.

#### 6.1.2 Data Requirements

| Query Key | Endpoint | DTO | Refresh |
|-----------|----------|-----|---------|
| `['auctions', 'detail', id]` | `GET /auctions/{id}` | `AuctionDetailDto` | SignalR `BidPlaced`, `PriceUpdated` |
| `['auctions', id, 'bids']` | `GET /auctions/{id}/bids` | `PagedList<BidDto>` | SignalR `BidPlaced` |
| `['auctions', id, 'autobid']` | `GET /auctions/{id}/auto-bid` | `AutoBidDto` | On mutation |

#### 6.1.3 UI Sections

| Section | Ant Design Components | Data Source |
|---------|----------------------|-------------|
| Image gallery | `Image.PreviewGroup`, `Carousel` | `item.images[]` |
| Auction header | `Typography.Title`, `Tag`, `Badge` | `auction.status`, `item.title` |
| Price display | `Statistic`, `Typography` | `auction.currentPrice`, `auction.startingPrice` |
| Countdown timer | `Statistic.Countdown` | `auction.endTime`, `auction.remainingTime` |
| Bid form | `InputNumber`, `Button` | Manual bid mutation |
| Auto-bid config | `Modal`, `InputNumber`, `Switch` | Auto-bid mutation |
| Buy Now section | `Button`, `Modal` (confirm), `Countdown` | `auction.buyNowPrice`, reservation timer |
| Bid history | `Table` | `recentBids[]` |
| Price chart | Line chart | `priceHistory[]` |
| Item details | `Descriptions`, `Tag` | `item.*` |
| Seller info | `Avatar`, `Link` | `item.sellerId` |

#### 6.1.4 SignalR Integration

```
AuctionHub: JoinAuction(auctionId) on mount, LeaveAuction(auctionId) on unmount

Events handled:
- BidPlaced        --> update currentPrice, bidCount, append to recentBids
- Outbid           --> show notification if current user was outbid
- PriceUpdated     --> update currentPrice display
- AuctionExtended  --> update endTime, show "Extended!" toast
- AuctionEnded     --> show winner modal or "Auction ended" state
- AuctionCancelled --> show cancellation notice
- BuyNowReserved   --> disable Buy Now button, show "Reserved" state
- BuyNowReservationReleased --> re-enable Buy Now
- BuyNowExecuted   --> show "Sold via Buy Now" state
```

#### 6.1.5 Mutations

| Action | Endpoint | Method | Idempotent | Notes |
|--------|----------|--------|------------|-------|
| Place bid | `POST /auctions/{id}/bids` | `idempotentPost` | Yes | Minimum: `currentPrice + bidIncrement` |
| Configure auto-bid | `POST /auctions/{id}/auto-bid` | `idempotentPost` | Yes | `maxAmount`, `incrementAmount` |
| Toggle auto-bid | `PUT /auctions/{id}/auto-bid/toggle` | `idempotentPut` | Yes | |
| Reserve buy-now | `POST /auctions/{id}/buy-now/reserve` | `idempotentPost` | Yes | Returns `BuyNowCheckoutDto` |
| Execute buy-now | `POST /auctions/{id}/buy-now/execute` | `idempotentPost` | Yes | |
| Toggle watch | `POST /auctions/{id}/watch` | POST | No | |

#### 6.1.6 Conditional Rendering

| Condition | Behavior |
|-----------|----------|
| `status === 'scheduled'` | Show countdown to start, no bid form |
| `status === 'active'` | Full bid UI, countdown to end |
| `status === 'ended' / 'sold'` | Show final price, winner info, no bid form |
| `!isAuthenticated` | Show bid form disabled with "Login to bid" CTA |
| `isBuyNowReserved && reservedByOther` | "Buy Now reserved by another buyer" |
| `auctionType === 'sealed'` | Hide bid history, show sealed bid form |
| `isEndingSoon` | Pulsing red countdown, "Ending soon!" badge |
| `autoExtend && extensionCount > 0` | Show "Extended N times" info |

#### 6.1.7 Error Handling

| Error | UX Response |
|-------|------------|
| Bid below minimum | Form validation error, show minimum amount |
| Insufficient deposit | Modal: "Deposit required" with deposit CTA |
| Auction ended (race) | Toast + disable form + refetch auction status |
| Buy-now already reserved | Toast, disable button, poll for release |
| Network failure on bid | Retry with same idempotency key |

#### 6.1.8 Blockers

- **HIGH:** BuyNow reservation timeout -- need client-side 15min countdown with auto-release
- **MEDIUM:** Auction detail DTO variants -- sealed vs regular have different data shapes
- **MEDIUM:** Anti-sniping extension -- real-time countdown must handle server-pushed extensions
- **MEDIUM:** Concurrent bid handling -- optimistic update may flash wrong price

#### 6.1.9 Accessibility

- Countdown timer announced via `aria-live="polite"`
- Bid amount input has `aria-label` with current minimum
- Price updates announced to screen readers

#### 6.1.10 Performance

- SignalR connection managed by `useAuctionHub` hook (connect on mount, disconnect on unmount)
- Bid history: virtual scroll if > 50 bids
- Price chart: lazy-loaded component
- Image gallery: thumbnails first, full-size on preview

#### 6.1.11 Testing Priorities

- Bid placement flow (happy path + below minimum + outbid)
- Buy-now reservation + expiry
- SignalR reconnection after network drop
- Sealed bid mode renders correctly
- Timer accuracy (server time sync)

---

### 6.2 CheckoutPage

**Route:** `/checkout/:orderId`
**Guard:** `AuthGuard`
**Feature:** `payment`
**File:** `src/features/payment/pages/CheckoutPage.tsx`

#### 6.2.1 Purpose
Handles payment for auction wins and buy-now purchases. Supports 3 payment modes: wallet-only, VnPay-only, and hybrid (partial wallet + VnPay remainder).

#### 6.2.2 Data Requirements

| Query Key | Endpoint | DTO | Notes |
|-----------|----------|-----|-------|
| `['orders', 'detail', orderId]` | `GET /orders/{orderId}` | `OrderDetailDto` | Order amount, status |
| `['wallet', 'balance']` | `GET /wallet/balance` | `WalletBalanceDto` | Available balance |
| `['payment', 'methods']` | `GET /payment/methods` | `PaymentMethodDto[]` | Saved methods |

#### 6.2.3 UI Sections

| Section | Components | Data |
|---------|-----------|------|
| Order summary | `Descriptions`, `Divider` | Item title, auction price, fees |
| Payment mode selector | `Radio.Group` | Wallet / VnPay / Hybrid |
| Wallet section | `Statistic`, `InputNumber` (hybrid) | Wallet balance, amount to use |
| VnPay section | `Button` | Redirect to VnPay gateway |
| Amount breakdown | `Table` | Item price, platform fee, deposit applied, total due |
| Submit | `Button` (primary) | Calls payment endpoint |

#### 6.2.4 Payment Flows

```
Wallet-only:
  POST /orders/{id}/pay  { method: 'wallet', amount: total }
  --> success --> redirect /me/orders/:id

VnPay-only:
  POST /orders/{id}/pay  { method: 'vnpay', amount: total }
  --> returns { paymentUrl } --> window.location.href = paymentUrl
  --> VnPay callback --> /payments/vnpay/return --> verify --> redirect

Hybrid:
  POST /orders/{id}/pay  { method: 'wallet', amount: walletPortion }
  POST /orders/{id}/pay  { method: 'vnpay', amount: remainder }
  --> sequential: wallet debit first, then VnPay redirect for remainder
```

#### 6.2.5 Mutations

| Action | Endpoint | Idempotent | Notes |
|--------|----------|------------|-------|
| Pay with wallet | `POST /orders/{id}/pay` | Yes | Deducts from wallet |
| Pay with VnPay | `POST /orders/{id}/pay` | Yes | Returns redirect URL |
| Apply deposit | Automatic | N/A | Server-side deduction from escrow |

#### 6.2.6 Error Handling

| Error | UX |
|-------|-----|
| Insufficient wallet balance | Disable wallet-only, suggest top-up or hybrid |
| VnPay gateway timeout | Show retry button, check payment status |
| Order already paid | Redirect to order detail with success message |
| Payment window expired | Show expiry notice with "Contact support" |

#### 6.2.7 Blockers

- **MEDIUM:** Invoice endpoints not confirmed -- cannot show downloadable invoice
- **MEDIUM:** Deposit status viewing -- need to show how much deposit is being applied

---

### 6.3 AuctionListPage

**Route:** `/` (index) and `/auctions`
**Guard:** None (public)
**Feature:** `auction`
**File:** `src/features/auction/pages/AuctionListPage.tsx`

#### 6.3.1 Purpose
Primary browse/search page. This is the landing page. Must be fast, filterable, and show live auction state.

#### 6.3.2 Data Requirements

| Query Key | Endpoint | DTO |
|-----------|----------|-----|
| `['auctions', 'list', filters]` | `GET /auctions` | `PagedList<AuctionListItemDto>` |
| `['categories', 'list']` | `GET /categories` | `CategoryDto[]` |

#### 6.3.3 Filters (synced to URL search params)

| Filter | Type | Component |
|--------|------|-----------|
| `search` | `string` | `Input.Search` (debounced 300ms) |
| `categoryId` | `string` | `Select` / `Cascader` |
| `status` | `AuctionStatus` | `Select` (Active, Scheduled, Ended) |
| `auctionType` | `AuctionType` | `Radio.Group` (Regular, Sealed) |
| `minPrice` / `maxPrice` | `number` | `Slider` or dual `InputNumber` |
| `sortBy` | `string` | `Select` (endTime, currentPrice, bidCount) |
| `sortOrder` | `asc/desc` | `Button` toggle |
| `pageNumber` / `pageSize` | `number` | Ant `Pagination` |

#### 6.3.4 UI Layout

- **Grid/List toggle** -- `Segmented` control for card grid vs table view
- **Auction cards** -- Image, title, current price, bid count, countdown, watch button
- **"Ending soon" badge** -- Red pulsing on `isEndingSoon` items
- **Featured auctions** -- Highlighted at top if `isFeatured`

#### 6.3.5 Performance

- `keepPreviousData: true` for seamless pagination
- Image lazy loading with Ant `Image` placeholder
- URL search params as query key deps (avoids stale filters)
- Prefetch next page on hover over pagination

#### 6.3.6 Blockers

- **MEDIUM:** Search integration -- full-text search endpoint may not match filter format
- **MEDIUM:** Pagination format -- must handle `PagedList<T>` with `metadata` object

---

### 6.4 CreateItemPage

**Route:** `/me/items/create` and `/seller/items/create`
**Guard:** `AuthGuard` / `SellerGuard`
**Feature:** `item`
**File:** `src/features/item/pages/CreateItemPage.tsx`

#### 6.4.1 Purpose
Multi-step item creation form with media upload. Items must be created before auctions.

#### 6.4.2 Form Steps

| Step | Fields | Validation |
|------|--------|-----------|
| 1. Basic Info | `title`, `description`, `categoryId`, `condition`, `quantity` | Required, min/max lengths |
| 2. Media Upload | Images (3-step Cloudinary pipeline) | Min 1 image, max 10, primary required |
| 3. Details | Q&A, additional attributes | Category-specific fields |
| 4. Review & Submit | Summary of all data | Confirm before submit |

#### 6.4.3 Media Upload Pipeline

```
Step 1: POST /media/signature --> { signature, timestamp, apiKey, cloudName, folder }
Step 2: POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
        --> { secure_url, public_id, thumbnail_url }
Step 3: POST /media/confirm  --> { publicId, url, thumbnailUrl, itemId }
```

#### 6.4.4 Mutations

| Action | Endpoint | Notes |
|--------|----------|-------|
| Create item | `POST /items` | Returns `itemId` |
| Upload media | Cloudinary + confirm | 3-step pipeline |
| Set primary image | `PUT /items/{id}/media/{mediaId}/primary` | |
| Submit for review | `POST /items/{id}/submit` | Changes status to `pending_review` |

#### 6.4.5 Blockers

- **MEDIUM:** Cloud storage confirmation -- confirm endpoint may fail after Cloudinary success (orphaned files)

---

### 6.5 CreateAuctionPage

**Route:** `/me/auctions/create` and `/seller/auctions/create`
**Guard:** `AuthGuard` / `SellerGuard`
**Feature:** `auction`
**File:** `src/features/auction/pages/CreateAuctionPage.tsx`

#### 6.5.1 Purpose
Create an auction for an approved item. Configures pricing, timing, buy-now, and auto-extend settings.

#### 6.5.2 Data Requirements

| Query | Endpoint | Notes |
|-------|----------|-------|
| Available items | `GET /items?status=approved` | Only approved items can be auctioned |

#### 6.5.3 Form Fields

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `itemId` | Select | Required | Filtered to `status=approved` |
| `auctionType` | Radio | Required | `regular` or `sealed` |
| `startingPrice` | InputNumber | Required, > 0 | Currency: VND |
| `reservePrice` | InputNumber | Optional, >= startingPrice | Hidden reserve |
| `buyNowPrice` | InputNumber | Optional, > reservePrice | Enables Buy Now |
| `bidIncrement` | InputNumber | Required, > 0 | Minimum bid step |
| `startTime` | DatePicker | Required, future | |
| `endTime` | DatePicker | Required, > startTime | Min duration rules |
| `autoExtend` | Switch | Default: true | Anti-sniping |
| `extensionMinutes` | InputNumber | Required if autoExtend | Default: 5 |
| `currency` | Hidden | VND | |

#### 6.5.4 Mutations

| Action | Endpoint | Notes |
|--------|----------|-------|
| Create auction | `POST /auctions` | Status: `draft` |
| Submit for review | `POST /auctions/{id}/submit` | Status: `pending` |

#### 6.5.5 Blockers

- **MEDIUM:** Sealed bid type has different pricing rules -- no bid increment, no auto-extend

---

### 6.6 LoginPage

**Route:** `/login`
**Guard:** `GuestGuard`
**Feature:** `auth`
**File:** `src/features/auth/pages/LoginPage.tsx`

#### 6.6.1 Purpose
Primary authentication entry point. Handles credentials, 2FA redirect, and token storage.

#### 6.6.2 Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| `email` | Input | Required, email format |
| `password` | Input.Password | Required, min 8 |
| `rememberMe` | Checkbox | Optional |

#### 6.6.3 Flow

```
POST /auth/login { email, password, deviceId }
  |
  +--> 200: { accessToken, refreshToken } --> store tokens --> redirect /
  |
  +--> 200: { requiresTwoFactor: true, twoFactorToken }
       --> store twoFactorToken --> redirect /2fa
  |
  +--> 401: Invalid credentials --> show error
  |
  +--> 403: Email not confirmed --> show "Check your email" message
  |
  +--> 423: Account locked --> show lockout info with remaining time
```

#### 6.6.4 Token Storage

```typescript
localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId)
// 2FA flow: separate temp token
localStorage.setItem(STORAGE_KEYS.TWO_FA_TOKEN, twoFactorToken)
```

#### 6.6.5 Error Handling

| Error Code | UX |
|------------|-----|
| 401 | "Email hoac mat khau khong dung" with field highlight |
| 403 (unconfirmed) | "Vui long xac nhan email" + resend link |
| 423 (locked) | "Tai khoan bi khoa. Thu lai sau X phut" |
| 429 (rate limit) | "Qua nhieu lan thu. Doi X giay" |

---

### 6.7 OrderDetailPage

**Route:** `/me/orders/:id` and `/seller/orders/:id`
**Guard:** `AuthGuard` / `SellerGuard`
**Feature:** `order`
**File:** `src/features/order/pages/OrderDetailPage.tsx`

#### 6.7.1 Purpose
Shows order lifecycle, payment status, shipping tracking, and actions (confirm delivery, request return, open dispute).

#### 6.7.2 Data Requirements

| Query Key | Endpoint | DTO |
|-----------|----------|-----|
| `['orders', 'detail', orderId]` | `GET /orders/{orderId}` | `OrderDetailDto` |

#### 6.7.3 UI Sections

| Section | Components | Notes |
|---------|-----------|-------|
| Status timeline | `Steps` | Maps `OrderStatus` to step progression |
| Order summary | `Descriptions` | Item, price, fees, payment method |
| Payment info | `Tag`, `Statistic` | Payment status, escrow status |
| Shipping info | `Timeline` | GHN tracking events |
| Actions | `Button`, `Popconfirm` | Context-dependent actions |

#### 6.7.4 Context-Dependent Actions

| Status | Buyer Actions | Seller Actions |
|--------|--------------|---------------|
| `pending_payment` | "Pay now" (-> checkout) | -- |
| `paid` | -- | "Confirm processing" |
| `shipped` | -- | -- |
| `delivered` | "Confirm receipt", "Request return" | -- |
| `completed` | "Leave review", "Open dispute" | -- |
| `disputed` | View dispute | View dispute |

#### 6.7.5 Blockers

- **HIGH:** Review endpoints missing -- "Leave review" button has no BE endpoint
- **MEDIUM:** GHN tracking format -- tracking event structure not confirmed

---

### 6.8 WalletPage

**Route:** `/me/wallet` and `/seller/wallet`
**Guard:** `AuthGuard` / `SellerGuard`
**Feature:** `payment`
**File:** `src/features/payment/pages/WalletPage.tsx`

#### 6.8.1 Purpose
Shows wallet balance, transaction history, top-up, and links to withdrawal.

#### 6.8.2 Data Requirements

| Query Key | Endpoint | DTO |
|-----------|----------|-----|
| `['wallet', 'balance']` | `GET /wallet/balance` | `WalletBalanceDto` |
| `['wallet', 'transactions', filters]` | `GET /wallet/transactions` | `PagedList<WalletTransactionDto>` |

#### 6.8.3 UI Sections

| Section | Components |
|---------|-----------|
| Balance card | `Card`, `Statistic` -- available, held, total |
| Quick actions | `Button` -- Top up, Withdraw |
| Transaction history | `Table` -- type, amount, status, date, description |
| Filters | `DatePicker.RangePicker`, `Select` (transaction type) |

#### 6.8.4 Mutations

| Action | Endpoint | Notes |
|--------|----------|-------|
| Top up via VnPay | `POST /wallet/topup` | Returns VnPay redirect URL |

#### 6.8.5 Enums Used

- `WalletTransactionType`: credit, debit, refund, fee
- `TransactionStatus`: pending, completed, failed, cancelled, processing

---

### 6.9 DisputeDetailPage

**Route:** `/me/disputes/:id`
**Guard:** `AuthGuard`
**Feature:** `dispute`
**File:** `src/features/dispute/pages/DisputeDetailPage.tsx`

#### 6.9.1 Purpose
Real-time dispute chat with admin mediator. Shows dispute status, evidence, messages, and resolution.

#### 6.9.2 SignalR Integration

```
DisputeHub: JoinDispute(disputeId) on mount, LeaveDispute(disputeId) on unmount

Events:
- NewMessage       --> append to message list, scroll to bottom
- MessageRead      --> update read receipts
- DisputeResolved  --> show resolution banner, disable input
- UnreadUpdate     --> update unread badge
```

#### 6.9.3 UI Sections

| Section | Components |
|---------|-----------|
| Dispute header | `Tag` (status), `Typography` (title, order info) |
| Evidence section | `Image.PreviewGroup`, `Upload` |
| Chat messages | Custom message list with `Avatar`, `Typography`, timestamps |
| Message input | `Input.TextArea`, `Upload` (attachments), `Button` (send) |
| Resolution banner | `Alert` (shown when resolved) |

#### 6.9.4 Mutations

| Action | Endpoint | Idempotent |
|--------|----------|------------|
| Send message | `POST /disputes/{id}/messages` | Yes |
| Upload evidence | Cloudinary pipeline | Yes |
| Mark messages read | `POST /disputes/{id}/messages/read` | No |

---

### 6.10 VerificationPage (Seller KYC)

**Route:** `/seller/verification`
**Guard:** `SellerGuard`
**Feature:** `seller`
**File:** `src/features/seller/pages/VerificationPage.tsx`

#### 6.10.1 Purpose
Multi-step identity verification (KYC/eKYC) required for seller approval.

#### 6.10.2 Verification Types

| Type | Documents Required | Validation |
|------|-------------------|-----------|
| `identity` | National ID / Passport / Driver License | Front + back images |
| `business` | Business registration certificate | Document image |
| `bank_account` | Bank statement or card photo | Document image |

#### 6.10.3 Form Steps

| Step | Fields |
|------|--------|
| 1. Select type | `VerificationType` radio |
| 2. Upload documents | `VerificationDocumentType` select + Cloudinary upload |
| 3. Personal info | Full name, DOB, ID number (type-dependent) |
| 4. Review & Submit | Preview all uploaded docs + info |

#### 6.10.4 Status Display

| Status | UI |
|--------|-----|
| `unverified` | Show start verification CTA |
| `pending` | Show "Under review" with submitted docs read-only |
| `approved` | Green badge, all verified |
| `rejected` | Show rejection reason + "Resubmit" CTA |

---

### 6.11 AdminReviewQueuePage

**Route:** `/admin/items/review`
**Guard:** `RoleGuard(Admin)`
**Feature:** `admin`
**File:** `src/features/admin/pages/AdminReviewQueuePage.tsx`

#### 6.11.1 Purpose
Queue of items and auctions pending admin review. Core workflow for platform quality control.

#### 6.11.2 Data Requirements

| Query | Endpoint | Notes |
|-------|----------|-------|
| Pending items | `GET /admin/items?status=pending_review` | Paginated |
| Pending auctions | `GET /admin/auctions?status=pending` | Paginated |

#### 6.11.3 UI Layout

- **Tab layout:** Items / Auctions tabs
- **Table columns:** Title, seller, submitted date, category, priority, actions
- **Quick actions:** Approve, Reject (with reason modal), View detail
- **Bulk actions:** Select multiple + batch approve/reject

#### 6.11.4 Mutations

| Action | Endpoint | Notes |
|--------|----------|-------|
| Approve item | `POST /admin/items/{id}/approve` | Changes to `approved` |
| Reject item | `POST /admin/items/{id}/reject` | Requires `reason` |
| Approve auction | `POST /admin/auctions/{id}/approve` | Changes to `approved` -> `scheduled` |
| Reject auction | `POST /admin/auctions/{id}/reject` | Requires `reason` |

---

### 6.12 InspectionDetailPage

**Route:** `/inspector/inspections/:shipmentId`
**Guard:** `InspectorGuard`
**Feature:** `inspector`
**File:** `src/features/inspector/pages/InspectionDetailPage.tsx`

#### 6.12.1 Purpose
Inspector evaluates inbound item condition, takes photos, confirms or rejects shipment.

#### 6.12.2 UI Sections

| Section | Components | Notes |
|---------|-----------|-------|
| Shipment info | `Descriptions` | Tracking, sender, expected item |
| Item comparison | Side-by-side: seller photos vs inspector photos | |
| Condition form | `Radio.Group` (ItemCondition), `TextArea` (notes) | |
| Photo upload | `Upload` + Cloudinary | Inspector takes condition photos |
| Actions | `Button` -- Approve, Reject, Flag | |

#### 6.12.3 Mutations

| Action | Endpoint | Notes |
|--------|----------|-------|
| Complete inspection | `POST /inspections/{id}/complete` | Condition + notes + photos |
| Reject shipment | `POST /inspections/{id}/reject` | Reason required |

---

### 6.13 MyBidsPage

**Route:** `/me/bids` and `/seller/bids`
**Guard:** `AuthGuard`
**Feature:** `auction`
**File:** `src/features/auction/pages/MyBidsPage.tsx`

#### 6.13.1 Purpose
Shows all bids placed by the user across auctions, with status and actions.

#### 6.13.2 Data Requirements

| Query | Endpoint | DTO |
|-------|----------|-----|
| `['bids', 'my', filters]` | `GET /bids/my` | `PagedList<MyBidDto>` |

#### 6.13.3 UI Layout

- **Tab filters:** All / Active / Won / Outbid
- **Table columns:** Auction title, bid amount, status, time, current price, action
- **Actions per row:** "View auction", "Increase bid" (if outbid + auction active)

#### 6.13.4 Real-time

- SignalR `Outbid` event updates bid status in list
- Badge count on "Outbid" tab updates live

---

### 6.14 AdminUsersPage

**Route:** `/admin/users`
**Guard:** `RoleGuard(Admin)`
**Feature:** `admin`
**File:** `src/features/admin/pages/AdminUsersPage.tsx`

#### 6.14.1 Purpose
User management: search, filter, view details, lock/unlock/ban accounts, assign roles.

#### 6.14.2 Data Requirements

| Query | Endpoint | DTO |
|-------|----------|-----|
| `['admin', 'users', filters]` | `GET /admin/users` | `PagedList<AdminUserDto>` |

#### 6.14.3 UI Layout

- **Search:** Email, username, phone
- **Filters:** `UserStatus` (active, inactive, locked, banned, suspended), role, verification status
- **Table columns:** Avatar, name, email, status, role(s), verified, created, actions
- **Actions:** View detail, Lock/Unlock, Ban, Assign role

#### 6.14.4 Mutations

| Action | Endpoint | Notes |
|--------|----------|-------|
| Lock user | `POST /admin/users/{id}/lock` | |
| Unlock user | `POST /admin/users/{id}/unlock` | |
| Ban user | `POST /admin/users/{id}/ban` | Requires reason |
| Assign role | `POST /admin/users/{id}/roles` | |

---

### 6.15 BookInboundPage

**Route:** `/seller/warehouse/inbound/book`
**Guard:** `SellerGuard`
**Feature:** `warehouse`
**File:** `src/features/warehouse/pages/BookInboundPage.tsx`

#### 6.15.1 Purpose
Seller books an inbound shipment to send items to the platform warehouse for inspection.

#### 6.15.2 Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| `itemId` | Select | Required, approved items only |
| `shippingMethod` | Select | GHN or self-delivery |
| `pickupAddress` | AddressSelect | From saved addresses |
| `notes` | TextArea | Optional |
| `expectedDate` | DatePicker | Required, future |

#### 6.15.3 Flow

```
Submit booking --> POST /warehouse/inbound
  --> returns { shipmentId, trackingCode }
  --> redirect to /seller/warehouse/inbound/:id
```

#### 6.15.4 Blockers

- **MEDIUM:** GHN integration -- pickup scheduling format not confirmed

---

## 7. API Integration Layer

### Axios Configuration

| Feature | Implementation |
|---------|---------------|
| Base URL | `API_URL` from env constants |
| Auth header | Auto-attached from `localStorage.ACCESS_TOKEN` |
| 2FA header | Separate `TWO_FA_TOKEN` for `/auth/two-factor` endpoints |
| Correlation ID | `X-Correlation-Id: crypto.randomUUID()` on every request |
| Token refresh | Silent 401 refresh with request queue (exponential backoff) |
| Idempotency | `idempotentPost()` / `idempotentPut()` add `Idempotency-Key` header |
| Error shape | `ApiError` with `type`, `status`, `title`, `detail`, `code`, `errors`, `requestId`, `traceId` |

### API Module Pattern (per feature)

Each `features/{name}/api.ts` exports:
1. **Raw API functions** -- `getAuctions(params)`, `placeBid(auctionId, data)`
2. **Query hooks** -- `useAuctions(params)`, `useAuctionDetail(id)`
3. **Mutation hooks** -- `usePlaceBid()`, `useCreateAuction()`

### Pagination Contract

```typescript
// All paginated endpoints return:
interface PagedList<T> {
  items: T[]
  metadata: {
    currentPage: number
    totalPages: number
    pageSize: number
    totalCount: number
    hasPrevious: boolean
    hasNext: boolean
  }
}

// Request params:
interface PaginationParams {
  pageNumber?: number  // 1-based
  pageSize?: number    // default 10
}
```

### Feature API Map

| Feature | File | Approx Hooks | Key Endpoints |
|---------|------|-------------|---------------|
| admin | `src/features/admin/api.ts` | 25+ | `/admin/users`, `/admin/items`, `/admin/auctions`, `/admin/payments` |
| auction | `src/features/auction/api.ts` | 20+ | `/auctions`, `/auctions/{id}/bids`, `/auctions/{id}/buy-now` |
| auth | `src/features/auth/api.ts` | 10+ | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/2fa` |
| dispute | `src/features/dispute/api.ts` | 8+ | `/disputes`, `/disputes/{id}/messages` |
| inspector | `src/features/inspector/api.ts` | 10+ | `/inspections`, `/inspections/{id}/complete` |
| item | `src/features/item/api.ts` | 15+ | `/items`, `/items/{id}/media`, `/items/{id}/submit` |
| notification | `src/features/notification/api.ts` | 5+ | `/notifications`, `/notifications/preferences` |
| order | `src/features/order/api.ts` | 10+ | `/orders`, `/orders/{id}/pay`, `/orders/{id}/return` |
| payment | `src/features/payment/api.ts` | 12+ | `/wallet`, `/wallet/topup`, `/wallet/withdraw`, `/payment/methods` |
| seller | `src/features/seller/api.ts` | 10+ | `/seller/profile`, `/seller/verification` |
| user | `src/features/user/api.ts` | 10+ | `/users/me`, `/users/me/addresses`, `/users/me/security` |
| warehouse | `src/features/warehouse/api.ts` | 12+ | `/warehouse/inbound`, `/warehouse/outbound`, `/warehouse/items` |

### Error Handling Strategy

```typescript
// Global error interceptor pattern:
// 401 --> auto-refresh token (queue pending requests)
// 401 after refresh fail --> clear tokens + redirect /login
// 403 --> show "Access denied" toast
// 404 --> show "Not found" with back navigation
// 409 --> show conflict message (e.g., "Auction already ended")
// 422 --> map field errors to form setError()
// 429 --> show rate limit message with retry-after
// 500 --> show generic error toast with requestId for support
```

---

## 8. Real-Time (SignalR) Integration

### Hub Configuration

| Hub | Path | Endpoint | Auth Required |
|-----|------|----------|---------------|
| AuctionHub | `/hubs/auction` | `SIGNALR_URL/auction` | No (public viewing), Yes (bidding) |
| DisputeHub | `/hubs/disputes` | `SIGNALR_URL/disputes` | Yes |
| NotificationHub | `/hubs/notifications` | `SIGNALR_URL/notifications` | Yes |

### Connection Lifecycle

```typescript
// From src/lib/signalr.ts:
// - Lazy initialization (hub created on first access)
// - Exponential backoff reconnection: 0s, 1s, 2s, 4s, 8s, 16s, max 30s
// - Token from localStorage.ACCESS_TOKEN
// - stopAllConnections() on logout
```

### AuctionHub Events

| Event | Payload Type | FE Handler |
|-------|-------------|------------|
| `BidPlaced` | `BidNotification` | Update price, bid count, append to bid list |
| `Outbid` | `OutbidNotification` | Show toast "You've been outbid!", update bid status |
| `PriceUpdated` | `PriceUpdateNotification` | Update `currentPrice` display |
| `AuctionStarted` | `AuctionStartedNotification` | Enable bid form, start countdown |
| `AuctionEnded` | `AuctionEndedNotification` | Show winner, disable bid form |
| `AuctionExtended` | `AuctionExtendedNotification` | Update countdown, show extension toast |
| `AuctionCancelled` | `AuctionCancelledNotification` | Show cancellation reason, disable all |
| `BuyNowReserved` | `BuyNowReservedNotification` | Disable Buy Now button |
| `BuyNowReservationReleased` | `BuyNowReservationReleasedNotification` | Re-enable Buy Now |
| `BuyNowExecuted` | `BuyNowNotification` | Show "Sold" state |

### AuctionHub Commands (Client -> Server)

| Command | Params | Returns | Notes |
|---------|--------|---------|-------|
| `JoinAuction` | `auctionId: string` | `HubCommandResult<void>` | Subscribe to auction updates |
| `LeaveAuction` | `auctionId: string` | `HubCommandResult<void>` | Unsubscribe |
| `PlaceBid` | `auctionId, amount` | `HubCommandResult<BidDto>` | Real-time bid via hub |

### DisputeHub Events

| Event | Payload | FE Handler |
|-------|---------|------------|
| `NewMessage` | `DisputeMessageDto` | Append to chat, scroll to bottom |
| `MessageRead` | `{ messageIds: string[] }` | Update read receipts |
| `DisputeResolved` | `{ disputeId, resolution }` | Show resolution banner |
| `UnreadUpdate` | `{ unreadCount: number }` | Update badge in nav |

### NotificationHub Events

| Event | Payload | FE Handler |
|-------|---------|------------|
| `NewNotification` | `NotificationDto` | Show toast, prepend to list, update badge |
| `UnreadCountUpdated` | `{ count: number }` | Update header badge |

### Hook Pattern

```typescript
// useAuctionHub(auctionId) -- manages AuctionHub lifecycle per page
// Pattern: connect on mount, join room, register event handlers, leave + disconnect on unmount
// All event handlers invalidate relevant TanStack Query keys
```

---

## 9. Forms & Validation

### 20 Forms Catalog

| # | Form | Feature | Page | Zod Schema | Key Fields |
|---|------|---------|------|-----------|------------|
| 1 | Registration | auth | RegisterPage | `registerSchema` | email, password, confirmPassword, fullName, phone |
| 2 | Login | auth | LoginPage | `loginSchema` | email, password |
| 3 | 2FA Setup | auth | TwoFactorPage | `twoFaSchema` | code (6 digits) |
| 4 | Item Creation | item | CreateItemPage | `createItemSchema` | title, description, categoryId, condition, quantity |
| 5 | Auction Creation | auction | CreateAuctionPage | `createAuctionSchema` | itemId, auctionType, startingPrice, reservePrice, buyNowPrice, startTime, endTime |
| 6 | Manual Bid | auction | AuctionDetailPage | `bidSchema` | amount (>= currentPrice + bidIncrement) |
| 7 | Auto-Bid Config | auction | AuctionDetailPage | `autoBidSchema` | maxAmount, incrementAmount |
| 8 | Buy Now Confirm | auction | AuctionDetailPage | `buyNowConfirmSchema` | confirmation boolean |
| 9 | Checkout | payment | CheckoutPage | `checkoutSchema` | paymentMethod, walletAmount (hybrid) |
| 10 | Address | user | AddressesPage | `addressSchema` | fullName, phone, province, district, ward, street, type |
| 11 | Wallet Top-Up | payment | WalletPage | `topupSchema` | amount (min 10,000 VND) |
| 12 | Withdrawal | payment | WithdrawPage | `withdrawSchema` | amount, bankAccount, bankName |
| 13 | Watch Config | auction | AuctionDetailPage | `watchConfigSchema` | priceThreshold, endingAlert |
| 14 | Dispute Message | dispute | DisputeDetailPage | `disputeMessageSchema` | content, attachments[] |
| 15 | Inspection | inspector | InspectionDetailPage | `inspectionSchema` | condition, notes, photos[] |
| 16 | Notification Prefs | user | NotificationPrefsPage | `notifPrefsSchema` | email, sms, push per category |
| 17 | Return Request | order | OrderReturnPage | `returnRequestSchema` | reason, description, photos[] |
| 18 | Admin Item Review | admin | AdminItemDetailPage | `adminReviewSchema` | decision (approve/reject), reason |
| 19 | Admin Dispute Resolution | admin | AdminDisputesPage | `adminDisputeSchema` | resolution, notes, refundAmount |
| 20 | KYC Verification | seller | VerificationPage | `verificationSchema` | type, documentType, documents[], personalInfo |

### Validation Pattern

```typescript
// All forms use: React Hook Form + @hookform/resolvers/zod + Zod v4
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().min(1, 'Bat buoc')
})
type FormData = z.infer<typeof schema>

const { control, handleSubmit, setError } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

### Server Error Mapping

```typescript
// When API returns 422 with field errors:
// { errors: { "Title": ["Too short"], "Price": ["Must be positive"] } }
// Map to form:
Object.entries(apiError.errors).forEach(([field, messages]) => {
  setError(camelCase(field), { message: messages[0] })
})
```

### Money Input Convention

All money fields use VND (no decimals). `InputNumber` configured with:
- `formatter`: `(value) => value.toLocaleString('vi-VN')` + " VND"
- `parser`: strip non-numeric
- `step`: 1000 (minimum VND step)
- `min`: field-dependent

---

## 10. Enum & Type System

### 23 Enums (defined in `src/types/enums.ts`)

All enums use the **const object + type extraction** pattern:

```typescript
export const EnumName = { Key: 'value' } as const
export type EnumName = (typeof EnumName)[keyof typeof EnumName]
```

### Complete Enum Reference

| # | Enum | Values | Used In |
|---|------|--------|---------|
| 1 | `AuctionStatus` | draft, pending, approved, scheduled, active, ended, sold, payment_defaulted, cancelled, failed, terminated | Auction list/detail, admin review |
| 2 | `AuctionType` | regular, sealed | Auction creation, detail |
| 3 | `BidStatus` | pending, accepted, rejected, cancelled, retracted | Bid history, my bids |
| 4 | `AutoBidStatus` | active, paused, completed, cancelled | Auto-bid config |
| 5 | `SealedBidStatus` | submitted, revealed, invalid, expired | Sealed auction detail |
| 6 | `UserStatus` | active, inactive, locked, banned, suspended | Admin users |
| 7 | `SellerProfileStatus` | pending, approved, rejected, suspended | Seller profile, admin sellers |
| 8 | `VerificationType` | identity, business, bank_account | KYC verification |
| 9 | `VerificationDocumentType` | passport, national_id, driver_license, business_registration | KYC upload |
| 10 | `IdentityVerificationStatus` | unverified, pending, approved, rejected | Verification page |
| 11 | `Gender` | male, female, other | Profile |
| 12 | `OrderStatus` | pending_payment, paid, processing, shipped, delivered, completed, cancelled, refunded, disputed | Order list/detail |
| 13 | `OrderReturnStatus` | requested, approved, rejected, shipped, received, completed, cancelled | Return requests |
| 14 | `PaymentMethodType` | card, wallet, bank_transfer, vnpay | Checkout, payment methods |
| 15 | `TransactionStatus` | pending, completed, failed, cancelled, processing | Wallet transactions |
| 16 | `WalletTransactionType` | credit, debit, refund, fee | Wallet history |
| 17 | `WithdrawalStatus` | pending, approved, rejected, processing, completed, failed | Withdrawal tracking |
| 18 | `EscrowStatus` | held, released, disputed, refunded | Order payment info |
| 19 | `ReportStatus` | open, assigned, in_progress, resolved, closed | Admin reports |
| 20 | `DisputeStatus` | open, assigned, in_progress, pending_response, resolved, closed | Dispute list/detail |
| 21 | `AlertSeverity` | low, medium, high, critical | Admin monitoring |
| 22 | `AlertStatus` | active, acknowledged, resolved, closed | Admin monitoring |
| 23 | `ItemStatus` | draft, pending_review, pending_verify, pending_condition_confirmation, approved, active, in_auction, sold, rejected, removed | Item management |
| 24 | `ItemCondition` | new, like_new, very_good, good, acceptable | Item creation, inspection |
| 25 | `NotificationStatus` | unread, read, archived | Notifications |
| 26 | `ShipmentStatus` | pending, confirmed, in_transit, arrived, stored, shipped, delivered, cancelled | Warehouse |
| 27 | `AddressType` | home, work | Address management |

### Shared Types

| Type | File | Fields | Used In |
|------|------|--------|---------|
| `PagedList<T>` | `types/api.ts` | `items: T[]`, `metadata: PagedMetadata` | All paginated endpoints |
| `PagedMetadata` | `types/api.ts` | `currentPage`, `totalPages`, `pageSize`, `totalCount`, `hasPrevious`, `hasNext` | Pagination components |
| `MoneyDto` | `types/api.ts` | `amount`, `currency`, `symbol` | All price displays |
| `ApiError` | `types/api.ts` | `status`, `title`, `detail`, `code`, `errors`, `requestId`, `traceId` | Error handling |
| `HubCommandResult<T>` | `types/api.ts` | `success`, `data?`, `error?` | SignalR command responses |
| `PaginationParams` | `types/api.ts` | `pageNumber?`, `pageSize?` | All list queries |

---

## 11. Authentication & Authorization

### Auth Flow Overview

```
Register --> Confirm Email --> Login --> (optional 2FA) --> Authenticated
                                |
                                +--> Forgot Password --> Reset Password
```

### Token Architecture

| Token | Storage | Lifetime | Usage |
|-------|---------|----------|-------|
| Access Token | `localStorage.accessToken` | Short (15-30min) | API Authorization header |
| Refresh Token | `localStorage.refreshToken` | Long (7-30 days) | Token refresh endpoint |
| 2FA Token | `localStorage.twoFaToken` | Very short (5min) | Only for `/auth/two-factor` |
| Device ID | `localStorage.deviceId` | Persistent | Sent with refresh requests |

### Silent Token Refresh

```
Request fails with 401
  --> Is it a refresh/login/2FA request? --> Reject (no retry)
  --> Is another refresh in progress? --> Queue this request
  --> Start refresh:
      POST /auth/refresh { refreshToken, deviceId }
      Headers: Authorization: Bearer <expired-access-token>
        --> Success: store new tokens, replay queued requests
        --> Failure: clear all tokens, redirect to /login
```

### Route Guards

| Guard | Component | Logic |
|-------|-----------|-------|
| `AuthGuard` | `src/components/guards/AuthGuard.tsx` | Redirect to `/login` if no valid token |
| `GuestGuard` | `src/components/guards/GuestGuard.tsx` | Redirect to `/` if already authenticated |
| `SellerGuard` | `src/components/guards/SellerGuard.tsx` | Requires auth + approved `SellerProfileStatus` |
| `InspectorGuard` | `src/components/guards/InspectorGuard.tsx` | Requires auth + inspector role |
| `RoleGuard` | `src/components/guards/RoleGuard.tsx` | Generic: `<RoleGuard roles={['Admin']} />` |

### 2FA Flow

```
Login --> response.requiresTwoFactor === true
  --> Store twoFaToken in localStorage
  --> Redirect to /2fa
  --> User enters TOTP code
  --> POST /auth/two-factor/verify  (uses twoFaToken as Bearer)
  --> Returns { accessToken, refreshToken }
  --> Clear twoFaToken, store real tokens
  --> Redirect to /
```

### Security Notes

| Concern | Current State | Planned |
|---------|--------------|---------|
| Token storage | localStorage (XSS vulnerable) | httpOnly cookies when BE supports |
| CSRF | Not needed (no cookies for auth) | Will need if cookies adopted |
| Correlation ID | `X-Correlation-Id` on every request | For tracing/debugging |
| Idempotency | UUID key on POST/PUT for bids, buy-now, uploads | Prevents duplicate operations |

---

## 12. Internationalization (i18n)

### Setup

| Config | Value |
|--------|-------|
| Library | i18next + react-i18next + i18next-browser-languagedetector + i18next-http-backend |
| Primary language | Vietnamese (`vi`) |
| Secondary language | English (`en`) |
| Namespace | `common` (single namespace) |
| Loading | HTTP backend -- loads from `/public/locales/{lng}/common.json` |
| Detection | Browser language detection with localStorage fallback |

### File Locations

```
public/
  locales/
    vi/common.json   # Vietnamese (primary, complete)
    en/common.json   # English (secondary)
```

### Translation Key Convention

```json
{
  "common": {
    "save": "Luu",
    "cancel": "Huy",
    "confirm": "Xac nhan",
    "loading": "Dang tai..."
  },
  "auction": {
    "title": "Dau gia",
    "placeBid": "Dat gia",
    "currentPrice": "Gia hien tai",
    "bidHistory": "Lich su dau gia"
  },
  "validation": {
    "required": "Truong nay bat buoc",
    "minLength": "Toi thieu {{min}} ky tu"
  }
}
```

### Ant Design Locale

Ant Design 6 configured with Vietnamese locale provider at app root:

```tsx
<ConfigProvider locale={viVN}>
  <App />
</ConfigProvider>
```

### Date Formatting

All dates use dayjs with Vietnamese locale:
- Display: `dayjs(date).format('DD/MM/YYYY HH:mm')`
- Relative: `dayjs(date).fromNow()` (Vietnamese)
- Countdown: Ant `Statistic.Countdown` with `value={dayjs(endTime)}`

---

## 13. Media Upload Pipeline

### 3-Step Signed Upload (Cloudinary)

```
                   FE                              BE                          Cloudinary
                    |                               |                              |
Step 1:  POST /media/signature -------->  Generate signature  <                    |
                    |  <--------  { signature, timestamp,                           |
                    |               apiKey, cloudName, folder }                     |
                    |                               |                              |
Step 2:  POST /cloudinary/upload  ------------------------------------------->  Upload
                    |  <-------------------------------------------  { secure_url, |
                    |                   public_id, thumbnail_url }                 |
                    |                               |                              |
Step 3:  POST /media/confirm  ---------->  Record in DB                            |
                    |  <--------  { mediaId }        |                             |
```

### Upload Component Pattern

```typescript
// Shared upload hook: useCloudinaryUpload()
// 1. Request signature from BE
// 2. Upload to Cloudinary with signature + timestamp
// 3. Confirm upload with BE (associates media to entity)
// 4. Returns { url, thumbnailUrl, mediaId }
```

### Upload Contexts

| Context | Max Files | Max Size | Formats | Entity |
|---------|-----------|----------|---------|--------|
| Item images | 10 | 10MB | jpg, png, webp | Item |
| Inspection photos | 20 | 10MB | jpg, png | Inspection |
| Verification docs | 5 | 5MB | jpg, png, pdf | Verification |
| Dispute evidence | 10 | 10MB | jpg, png, pdf | Dispute |
| Profile avatar | 1 | 2MB | jpg, png | User |

### Error Recovery

| Failure Point | Recovery |
|---------------|----------|
| Step 1 fails (signature) | Retry with exponential backoff |
| Step 2 fails (Cloudinary) | Retry upload, reuse same signature if not expired |
| Step 3 fails (confirm) | **BLOCKER** -- orphaned file on Cloudinary. Log for cleanup. Retry confirm. |

---

## 14. Known Blockers & Risk Register

### HIGH Priority (Must resolve before launch)

| # | Blocker | Impact | Affected Screens | Workaround |
|---|---------|--------|-----------------|------------|
| H1 | BuyNow reservation timeout handling | Buyer can hold reservation indefinitely if client crashes | AuctionDetailPage, CheckoutPage | Client-side 15min countdown + server-side TTL. Show countdown on UI. Auto-release on expiry. |
| H2 | Review endpoints missing | Users cannot leave reviews after order completion | OrderDetailPage | Hide "Leave review" button. Implement when BE ready. |
| H3 | User reviews/ratings missing | No seller reputation system | PublicSellerPage, AuctionDetailPage | Hide rating display. Show "Coming soon" placeholder. |

### MEDIUM Priority (Should resolve before launch)

| # | Blocker | Impact | Affected Screens | Workaround |
|---|---------|--------|-----------------|------------|
| M1 | Pagination format ambiguity | List pages may break if format changes | All list pages | `extractArray<T>()` helper handles both bare arrays and `PagedList<T>` |
| M2 | Auction detail DTO variants | Sealed vs regular auctions have different data | AuctionDetailPage | Type guard: `if (auction.auctionType === 'sealed')` conditional rendering |
| M3 | Auto-bid anti-sniping | Auto-bid may trigger auction extension confusion | AuctionDetailPage | Show clear "Auto-extended" toast with new end time |
| M4 | Runner-up notification | Second-place bidder not notified of win opportunity | MyBidsPage | Not implemented until BE supports |
| M5 | Sealed bid reveal timing | UI for revealing sealed bids after auction end | AuctionDetailPage | Show "Revealing bids..." loading state with polling |
| M6 | Concurrent bid handling | Two users bid simultaneously, optimistic update flashes wrong | AuctionDetailPage | Server-sent price is canonical. Revert optimistic if server rejects. |
| M7 | Invoice endpoints | Cannot generate/download invoices | OrderDetailPage | Hide invoice button |
| M8 | Deposit status viewing | User cannot see deposit amount held | WalletPage, AuctionDetailPage | Show wallet "held" amount in balance card |
| M9 | GHN tracking format | Tracking event structure from GHN not confirmed | OrderDetailPage | Generic timeline with status text |
| M10 | VnPay card linking | Saved card feature not confirmed | PaymentMethodsPage | Hide card management, VnPay redirect only |
| M11 | Cloud storage confirmation failure | Orphaned files on Cloudinary | CreateItemPage, VerificationPage | Retry confirm 3x, log failure for manual cleanup |
| M12 | Search integration | Full-text search may differ from filter params | AuctionListPage | Use `search` param, let BE handle |
| M13 | Seller analytics | No analytics endpoints confirmed | SellerDashboardPage | Show placeholder charts with mock data |
| M14 | Mobile push notifications | Push subscription not implemented | NotificationPrefsPage | Hide push toggle, show email/SMS only |

### LOW Priority (Post-launch)

| # | Blocker | Impact | Notes |
|---|---------|--------|-------|
| L1 | Dark mode | No dark theme | Ant Design 6 supports theming -- implement later |
| L2 | PWA support | No offline capability | Add service worker post-launch |
| L3 | Social login | No OAuth providers | Google/Facebook login -- BE not ready |
| L4 | Export to CSV | Admin cannot export data | Add client-side CSV generation |
| L5 | Accessibility audit | WCAG compliance unknown | Schedule audit post-launch |
| L6 | Performance budget | No bundle size monitoring | Add bundlesize CI check |
| L7 | E2E tests | No Playwright/Cypress tests | Add critical path tests |
| L8 | Storybook | No component documentation | Add for design system components |
| L9 | Error tracking | No Sentry/LogRocket | Integrate error monitoring |
| L10 | Analytics | No user behavior tracking | Google Analytics or Mixpanel |
| L11 | Rate limiting UX | No client-side throttle for bids | Add debounce + disable after submit |

---

## 15. Implementation Phases & Timeline

### Phase 1: Core Auth & Browse (Week 1-2)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| Login flow + token management | LoginPage, TwoFactorPage | P0 | Axios interceptors done |
| Registration + email confirmation | RegisterPage, ConfirmEmailPage | P0 | |
| Password reset flow | ForgotPasswordPage, ResetPasswordPage | P0 | |
| Route guards (all 5) | AuthGuard, GuestGuard, SellerGuard, InspectorGuard, RoleGuard | P0 | Auth slice done |
| Auction list (public) | AuctionListPage | P0 | Pagination helper |
| Auction detail (view only) | AuctionDetailPage (read) | P0 | |
| Category browsing | CategoriesPage | P1 | |

**Exit Criteria:** Users can register, login (with 2FA), browse auctions, view details.

### Phase 2: Bidding & Real-Time (Week 3-4)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| SignalR AuctionHub integration | AuctionDetailPage | P0 | Phase 1 complete |
| Manual bid placement | AuctionDetailPage | P0 | Auth required |
| Auto-bid configuration | AuctionDetailPage | P0 | |
| Buy-now reservation + checkout | AuctionDetailPage, CheckoutPage | P0 | Wallet/VnPay ready |
| Real-time price/bid updates | AuctionDetailPage | P0 | SignalR connected |
| My bids tracking | MyBidsPage | P1 | |
| Watchlist | WatchlistPage | P1 | |

**Exit Criteria:** Users can bid in real-time, use auto-bid, buy-now works with 15min reservation.

### Phase 3: Items & Auctions Management (Week 5-6)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| Item creation (multi-step) | CreateItemPage | P0 | Cloudinary upload ready |
| Item editing | EditItemPage | P0 | |
| Media upload pipeline (3-step) | CreateItemPage, EditItemPage | P0 | Cloudinary config |
| My items list | MyItemsPage | P0 | |
| Auction creation | CreateAuctionPage | P0 | Items exist |
| My auctions list | MyAuctionsPage | P0 | |
| Item detail (public) | ItemDetailPage | P1 | |

**Exit Criteria:** Sellers can create items with photos, create auctions, manage their listings.

### Phase 4: Payments & Orders (Week 7-8)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| Wallet (balance, transactions) | WalletPage | P0 | |
| Wallet top-up via VnPay | WalletPage | P0 | VnPay integration |
| Withdrawal requests | WithdrawPage | P0 | |
| Checkout (3 payment modes) | CheckoutPage | P0 | Wallet + VnPay |
| VnPay return handler | VnPayReturnPage | P0 | |
| Order list | MyOrdersPage | P0 | |
| Order detail + tracking | OrderDetailPage | P0 | |
| Return requests | OrderReturnPage | P1 | |
| Payment methods | PaymentMethodsPage | P1 | |

**Exit Criteria:** Full payment flow works -- wallet, VnPay, hybrid. Orders tracked from payment to delivery.

### Phase 5: Seller & Warehouse (Week 9-10)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| Seller registration | CreateSellerProfilePage | P0 | |
| Seller dashboard | SellerDashboardPage | P0 | |
| Seller profile management | SellerProfilePage | P0 | |
| KYC verification (multi-step) | VerificationPage | P0 | Cloudinary upload |
| Inbound shipment booking | BookInboundPage | P0 | |
| Inbound shipment tracking | InboundShipmentsPage, InboundDetailPage | P0 | |
| Outbound shipments | OutboundShipmentsPage | P1 | |
| Warehouse items | WarehouseItemsPage | P1 | |

**Exit Criteria:** Sellers can register, get verified, ship items to warehouse, track shipments.

### Phase 6: Inspector & Admin (Week 11-12)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| Inspector dashboard | InspectorDashboardPage | P0 | |
| Inspection queue | InspectionQueuePage | P0 | |
| Inspection detail + review | InspectionDetailPage, InspectionReviewPage | P0 | |
| Storage management | StorageManagementPage | P1 | |
| Admin dashboard | AdminDashboardPage | P0 | |
| User management | AdminUsersPage, AdminUserDetailPage | P0 | |
| Item/auction review queue | AdminReviewQueuePage, AdminItemDetailPage | P0 | |
| Verification review | AdminVerificationsPage, AdminVerificationDetailPage | P0 | |

**Exit Criteria:** Inspectors can review shipments. Admins can manage users, review items/auctions.

### Phase 7: Disputes, Notifications & Polish (Week 13-14)

| Task | Pages | Priority | Dependencies |
|------|-------|----------|-------------|
| Notification hub + dropdown | NotificationDropdown | P0 | SignalR NotificationHub |
| Notification list page | NotificationsPage | P0 | |
| Notification preferences | NotificationPrefsPage | P1 | |
| Dispute list | DisputeListPage | P0 | |
| Dispute detail + real-time chat | DisputeDetailPage | P0 | SignalR DisputeHub |
| Admin dispute management | AdminDisputesPage | P0 | |
| Admin remaining pages | AdminPaymentsPage, AdminReportsPage, AdminMonitoringPage, AdminTermsPage, AdminRolesPage, AdminSellerProfilesPage, AdminAuctionControlPage | P1 | |
| User profile + settings | ProfilePage, AddressesPage, SecurityPage | P1 | |
| Public pages | AboutPage, PublicSellerPage, TermsPage | P2 | |

**Exit Criteria:** Full platform functional. All 64 pages implemented. Real-time notifications and disputes working.

### Phase 8: Hardening & Launch Prep (Week 15-16)

| Task | Priority | Notes |
|------|----------|-------|
| Error boundary testing | P0 | Verify RouteErrorBoundary handles all failure modes |
| SignalR reconnection testing | P0 | Test all 3 hubs under network instability |
| Token refresh edge cases | P0 | Concurrent 401s, refresh failure, tab switching |
| i18n completeness audit | P1 | Ensure all strings translated in both languages |
| Bundle size optimization | P1 | Lazy loading audit, tree shaking verification |
| Cross-browser testing | P1 | Chrome, Firefox, Safari, Edge |
| Accessibility basics | P2 | Focus management, ARIA labels, keyboard navigation |
| Performance profiling | P2 | Lighthouse, React DevTools Profiler |

**Exit Criteria:** Platform stable, all critical paths tested, ready for production deployment.

---

## Appendix A: Component Reuse Map

Several pages are reused across panels (User vs Seller views):

| Component | User Route | Seller Route | Differentiator |
|-----------|-----------|-------------|----------------|
| MyItemsPage | `/me/items` | `/seller/items` | Layout context only |
| CreateItemPage | `/me/items/create` | `/seller/items/create` | Layout context only |
| EditItemPage | `/me/items/:id/edit` | `/seller/items/:id/edit` | Layout context only |
| MyAuctionsPage | `/me/auctions` | `/seller/auctions` | Layout context only |
| CreateAuctionPage | `/me/auctions/create` | `/seller/auctions/create` | Layout context only |
| MyBidsPage | `/me/bids` | `/seller/bids` | Layout context only |
| MyOrdersPage | `/me/orders` | `/seller/orders` | May show buyer vs seller view |
| OrderDetailPage | `/me/orders/:id` | `/seller/orders/:id` | Different action buttons |
| WalletPage | `/me/wallet` | `/seller/wallet` | Layout context only |
| WithdrawPage | `/me/wallet/withdraw` | `/seller/wallet/withdraw` | Layout context only |

---

## Appendix B: Query Key Registry

```typescript
// Canonical query key structure for invalidation consistency
const QUERY_KEYS = {
  auctions: {
    all:    ['auctions'],
    list:   (filters) => ['auctions', 'list', filters],
    detail: (id) => ['auctions', 'detail', id],
    bids:   (id) => ['auctions', id, 'bids'],
    autoBid:(id) => ['auctions', id, 'auto-bid'],
  },
  items: {
    all:    ['items'],
    list:   (filters) => ['items', 'list', filters],
    detail: (id) => ['items', 'detail', id],
    media:  (id) => ['items', id, 'media'],
  },
  orders: {
    all:    ['orders'],
    list:   (filters) => ['orders', 'list', filters],
    detail: (id) => ['orders', 'detail', id],
  },
  wallet: {
    balance:      ['wallet', 'balance'],
    transactions: (filters) => ['wallet', 'transactions', filters],
  },
  notifications: {
    list:        ['notifications', 'list'],
    unreadCount: ['notifications', 'unreadCount'],
  },
  disputes: {
    all:      ['disputes'],
    list:     (filters) => ['disputes', 'list', filters],
    detail:   (id) => ['disputes', 'detail', id],
    messages: (id) => ['disputes', id, 'messages'],
  },
  categories: {
    all: ['categories'],
  },
  admin: {
    users:          (filters) => ['admin', 'users', filters],
    userDetail:     (id) => ['admin', 'users', id],
    verifications:  (filters) => ['admin', 'verifications', filters],
    reviewQueue:    (filters) => ['admin', 'review-queue', filters],
  },
  seller: {
    profile:  ['seller', 'profile'],
    verification: ['seller', 'verification'],
  },
  warehouse: {
    inbound:  (filters) => ['warehouse', 'inbound', filters],
    outbound: (filters) => ['warehouse', 'outbound', filters],
    items:    (filters) => ['warehouse', 'items', filters],
  },
}
```

---

## Appendix C: Environment Variables

```env
VITE_API_URL=https://api.oio.vn/api
VITE_SIGNALR_URL=https://api.oio.vn/hubs
VITE_CLOUDINARY_CLOUD_NAME=oio-platform
VITE_APP_ENV=production
```

---

*Document generated: 2026-03-24. Source of truth: Backend at D:\HocTrenTruong\Ky9\Project\OIO*
