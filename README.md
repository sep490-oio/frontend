# Bid System v1.0 — Frontend

Responsive web frontend for the Competitive Bidding E-Commerce Platform. Built with **React 18**, **TypeScript**, **Vite**, and **Ant Design 6**.

**Deployed:** `http://14.225.222.182` — CI/CD via Docker + ghcr.io (push to `master` triggers deploy).

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000 with HMR
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

**Requires:** Node.js 18+

## Implemented Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page |
| `/browse` | Browse | Auction catalog with filters, search, AuctionCard grid |
| `/auction/:id` | Auction Detail | Image gallery, bid history, real-time bidding (SignalR) |
| `/dashboard` | Dashboard | Stats, active bids, recent results, wallet summary |
| `/wallet` | Wallet | Balance overview, transaction history, add/withdraw modals |
| `/my-bids` | My Bids | 3 tabs (Active/Ended/Watching), table/card toggle, filters |
| `/seller/:id` | Seller Profile | Seller info, stats, listings, reviews with ratings |
| `/seller/create-item` | Create Item | 3-step wizard: upload images (Cloudinary) → fill details → submit |
| `/orders` | Orders | 3 tabs (Active/Completed/Cancelled), table/card toggle |
| `/orders/:id` | Order Detail | Timeline, item card, tracking, payment info, actions |
| `/profile` | Profile | 4 tabs: info, addresses, security (password/2FA/phone), sessions |
| `/login` | Login | JWT authentication |
| `/register` | Register | User registration |
| `/confirm-email` | Confirm Email | Email verification callback |

## Tech Stack

| Category | Technology |
|----------|-----------|
| UI | Ant Design 6.3 (Vietnamese locale), @ant-design/icons 6 |
| State | Redux Toolkit 2 (auth) + TanStack Query 5 (server data) |
| Real-time | @microsoft/signalr 10 (auction hub — 9 events, 6 actions) |
| Routing | React Router v7 |
| Forms | React Hook Form 7 + Zod 4 |
| HTTP | Axios (with silent JWT refresh + queue pattern) |
| i18n | react-i18next (Vietnamese primary, English secondary, ~660 keys) |
| Dates | dayjs |
| Media | Cloudinary signed upload (3-step: signature → upload → confirm) |

## Project Structure

```
src/
├── components/
│   ├── auction/       # AuctionCard, BiddingPanel, BidForm, AutoBidForm, SealedBidForm,
│   │                  # ImageGallery, BidHistoryList, QualificationSection, BuyNowConfirmModal,
│   │                  # AuctionResult, WatchButton (11 components)
│   ├── dashboard/     # StatsRow, WalletSummaryCard, MyActiveBidsTable, etc. (5)
│   ├── wallet/        # BalanceOverview, TransactionHistory, AddFundsModal, etc. (4)
│   ├── mybids/        # ActiveBidsList, EndedBidsList, WatchingList (3)
│   ├── seller/        # SellerInfoCard, SellerStats, SellerListings, SellerReviewsList (4)
│   ├── orders/        # OrderTimeline, OrderItemCard, OrderActions, OrdersList, etc. (8)
│   ├── profile/       # ProfileInfoTab, AddressesTab, SecurityTab, SessionsTab, etc. (9)
│   ├── layout/        # AppLayout, PublicLayout, AppHeader, Sidebar (5)
│   └── common/        # ErrorBoundary (2)
├── pages/
│   ├── public/        # HomePage, BrowsePage, AuctionDetailPage, Login, Register, etc.
│   ├── dashboard/     # DashboardPage
│   ├── wallet/        # WalletPage
│   ├── mybids/        # MyBidsPage
│   ├── seller/        # SellerProfilePage, CreateItemPage
│   ├── orders/        # OrdersPage, OrderDetailPage
│   └── profile/       # ProfilePage
├── hooks/             # useAuctions, useBidding, useAuctionHub, useItems, useWallet,
│                      # useMyBids, useSeller, useOrders, useUser, useDashboard,
│                      # useBreakpoint, useDebouncedValue (12 hooks)
├── services/          # api.ts, authService, auctionService, auctionHubService,
│                      # mediaService, walletService, userService, dashboardService,
│                      # myBidsService, sellerService, orderService, i18n (12 services)
├── types/             # enums, user, item, auction, wallet, dashboard, order,
│                      # notification, admin, signalr + index barrel (11 files)
├── locales/           # vi/common.json, en/common.json
├── routes/            # React Router config
├── store/             # Redux slices (auth)
└── utils/             # formatVND, formatCountdown, STATUS_KEYS, etc.
```

## Responsive Design

Two-tier system using Ant Design's grid + custom `useBreakpoint()` hook:
- **Mobile** (<1200px) — single column, compact lists, Select dropdowns, hamburger menu
- **Desktop** (≥1200px) — full layout with 240px sidebar, tables, side-by-side layouts

Tested across 17 Edge DevTools device dimensions (iPhone SE to Nest Hub Max).

## API Integration

- **Base URL:** `https://api.newlsun.com`
- **Auth:** JWT with silent refresh (access=1hr, refresh=7d) via queue pattern in `api.ts`
- **Real-time:** SignalR hub at `/hubs/auction` ([Authorize])
- **Media:** Cloudinary signed upload — FE never holds API secret

## Path Aliases

`@/` maps to `src/`:
```ts
import { AuctionCard } from '@/components/auction/AuctionCard';
```

## Environment Variables

| Variable | Description |
|----------|------------|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_BYPASS_DEPOSIT` | Skip qualification phase (dev only, until BE builds endpoint) |
