# Bid System v1.0 — Frontend

Responsive web frontend for the Competitive Bidding E-Commerce Platform. Built with **React 19**, **TypeScript**, **Vite 8**, and **Ant Design 6**.

**Deployed:** `http://14.225.222.182` — CI/CD via Docker + ghcr.io (push to `master` triggers deploy).

## Quick Start

```bash
npm install
npm run dev        # Dev server → http://localhost:5173
npm run build      # TypeScript check + production build
npm run lint       # Code quality check
npm run preview    # Preview production build
```

## Implemented Pages

### Public
| Route | Description |
|-------|-------------|
| `/` | Auction list (home) |
| `/auctions` | Browse all auctions |
| `/auctions/:id` | Auction detail |
| `/items` | Browse all items |
| `/items/:id` | Item detail |
| `/sellers` | Browse sellers |
| `/sellers/:id` | Public seller profile |
| `/about` | About page |
| `/categories` | Categories |
| `/help` | Help center |

### Auth
| Route | Description |
|-------|-------------|
| `/login` | Login |
| `/register` | Registration |
| `/2fa` | Two-factor authentication |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/confirm-email` | Email confirmation |

### User (`/me/*`)
| Route | Description |
|-------|-------------|
| `/me/dashboard` | User dashboard |
| `/me/profile` | Profile settings |
| `/me/addresses` | Address book |
| `/me/security` | Security settings |
| `/me/notifications` | Notifications |
| `/me/notifications/settings` | Notification preferences |
| `/me/terms` | Terms acceptance |
| `/me/verification` | Identity verification (CCCD) |
| `/me/items` | My items |
| `/me/items/create` | Create item |
| `/me/items/:id/edit` | Edit item |
| `/me/auctions` | My auctions |
| `/me/auctions/create` | Create auction |
| `/me/auctions/:id/edit` | Edit auction |
| `/me/watchlist` | Watchlist |
| `/me/bids` | My bids |
| `/me/orders` | My orders |
| `/me/orders/:id` | Order detail |
| `/me/orders/:id/return` | Order return |
| `/me/wallet` | Wallet |
| `/me/wallet/withdraw` | Withdraw |
| `/me/payment-methods` | Payment methods |
| `/me/checkout/:orderId` | Checkout |
| `/me/disputes` | Disputes |
| `/me/disputes/:id` | Dispute detail |

### Seller (`/seller/*`)
| Route | Description |
|-------|-------------|
| `/seller/dashboard` | Seller dashboard |
| `/seller/items` | Manage items |
| `/seller/items/create` | Create item |
| `/seller/items/:id/edit` | Edit item |
| `/seller/auctions` | Manage auctions |
| `/seller/auctions/create` | Create auction |
| `/seller/auctions/:id/edit` | Edit auction |
| `/seller/bids` | Bids received |
| `/seller/orders` | Seller orders |
| `/seller/orders/:id` | Order detail |
| `/seller/orders/:id/return` | Order return |
| `/seller/wallet` | Seller wallet |
| `/seller/wallet/withdraw` | Withdraw |
| `/seller/warehouse/inbound` | Inbound shipments |
| `/seller/warehouse/inbound/book` | Book inbound |
| `/seller/warehouse/inbound/:id` | Inbound detail |
| `/seller/warehouse/outbound` | Outbound shipments |
| `/seller/warehouse/items` | Warehouse inventory |
| `/seller/profile` | Seller profile |
| `/seller/verification` | Seller verification |
| `/seller/register` | Seller registration |

### Admin (`/admin/*`)
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/users/:id` | User detail |
| `/admin/verifications` | Identity verifications |
| `/admin/verifications/:id` | Verification detail |
| `/admin/sellers` | Seller management |
| `/admin/items/review` | Item review queue |
| `/admin/items/:id` | Item detail |
| `/admin/auctions/:id` | Auction detail |
| `/admin/reports` | Reports |
| `/admin/monitoring` | System monitoring |
| `/admin/disputes` | Dispute management |
| `/admin/payments` | Payment management |
| `/admin/terms` | Terms management |
| `/admin/roles` | Role management |

### Inspector (`/inspector/*`)
| Route | Description |
|-------|-------------|
| `/inspector/dashboard` | Inspector dashboard |
| `/inspector/queue` | Inspection queue |
| `/inspector/inspections/:shipmentId` | Inspection detail |
| `/inspector/reviews` | Reviews |
| `/inspector/storage` | Storage management |

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.4 | UI library — functional components, hooks |
| TypeScript | ~5.9.3 | Type safety — all code in TS |
| Vite | 8.0.1 | Build tool — fast dev server, optimized builds |
| Ant Design | 6.3.3 | UI component library |
| @ant-design/icons | 6.1.0 | Icon set |
| Redux Toolkit | 2.11.2 | Global state management |
| TanStack Query | 5.94.5 | Server state, caching, data fetching |
| React Router | 7.13.1 | Client-side routing |
| React Hook Form | 7.71.2 | Form state management |
| Zod | 4.3.6 | Schema validation |
| Axios | 1.13.6 | HTTP client |
| @microsoft/signalr | 10.0.0 | Real-time WebSocket communication |
| i18next | 25.10.2 | Internationalization framework |
| react-i18next | 16.6.0 | React bindings for i18next |
| dayjs | 1.11.20 | Date/time utilities |

## Project Structure

Feature-based architecture — each domain module owns its API, pages, components, hooks, and utilities.

```
src/
├── app/               # App shell: App.tsx, router.tsx, providers.tsx, store.ts, i18n.ts
├── assets/            # Static assets (images, fonts)
├── components/
│   ├── common/        # Shared utility components
│   ├── guards/        # AuthGuard, GuestGuard, SellerGuard, RoleGuard, InspectorGuard
│   ├── layout/        # AppLayout, AuthLayout, AdminLayout, InspectorLayout, SellerLayout
│   └── ui/            # 15 reusable UI components (AuctionCard, CountdownTimer,
│                      # EmptyState, ImageGallery, MediaUploader, MultiCaptureUploader,
│                      # SecureCaptureUploader, LiveCapturedBadge, LivenessChallenge,
│                      # CaptureQualityValidator, OrderStatusStepper, PriceDisplay,
│                      # ResponsiveTable, ShippingDetailsForm, StatusBadge)
├── features/          # Domain modules — each has api.ts + pages/
│   ├── admin/         # Dashboard, users, verifications, sellers, items, auctions,
│   │                  # reports, monitoring, disputes, payments, terms, roles
│   ├── auction/       # List, detail, create, my auctions, watchlist, my bids, browse
│   ├── auth/          # Login, register, 2FA, forgot/reset password, confirm email
│   ├── dispute/       # Dispute list, detail
│   ├── inspector/     # Dashboard, queue, detail, review, storage
│   ├── item/          # My items, create, edit, browse, detail
│   ├── notification/  # Notifications page, preferences
│   ├── order/         # My orders, order detail, order return
│   ├── payment/       # Wallet, payment methods, checkout, VnPay return, withdraw
│   ├── public/        # About, categories, help
│   ├── seller/        # Dashboard, profile, registration, verification, browse, public profile
│   ├── user/          # Dashboard, profile, addresses, security, notification prefs, terms
│   └── warehouse/     # Inbound/outbound shipments, book inbound, warehouse items
├── hooks/             # 8 global hooks: useAuth, useBreakpoint, useCamera, useDebounce,
│                      # useMediaUpload, useRoutePrefix, useSignalR, useTheme
├── lib/               # axios.ts, cloudinary.ts, queryClient.ts, signalr.ts
├── locales/           # vi/ and en/ translation files
├── styles/            # animations.css, global.css
├── types/             # 15 type files + index barrel (admin, api, auction, auth, capture,
│                      # dispute, enums, item, media, notification, order, payment,
│                      # seller, user, warehouse)
└── utils/             # constants.ts, format.ts, itemPhotoRules.ts, validation.ts
```

## Responsive Design

Mobile-first approach with CSS breakpoints defined in the design system:

| Breakpoint | Width |
|-----------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Use `useBreakpoint` hook to respond to breakpoint changes in components.

## API Integration

All API calls are co-located with their feature module in `features/*/api.ts`. The HTTP client is configured in `src/lib/axios.ts` with base URL from `VITE_API_URL`.

Real-time features (bid updates, notifications) use SignalR via `src/lib/signalr.ts` and the `useSignalR` hook.

## Path Aliases

`@/` maps to `src/` — use absolute imports throughout:

```ts
import { AuctionCard } from '@/components/ui/AuctionCard'
import { useAuth } from '@/hooks/useAuth'
import type { Auction } from '@/types'
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `https://api.newlsun.com`) |
| `VITE_SIGNALR_URL` | SignalR hub URL for real-time features |

Copy `.env.example` to `.env.local` for local development.
