# Frontend Documentation — Flow Reference

> **Project**: Competitive Bidding E-Commerce Platform (Capstone SP26SE150)
> **Last Updated**: 2026-03-21 (session 2: VNPay deposit fix, qualification window, items pagination)
> **Tech Stack**: React 18 + TypeScript + Vite + Ant Design 6 + TanStack Query 5

This documentation mirrors the backend's `backend/docs/flows/` structure. Each module documents how the frontend consumes the corresponding BE flow — pages, components, hooks, services, types, and SignalR events.

## Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | Fully implemented in FE |
| 🔶 | Partially implemented |
| 🟡 | UI exists with mock data (not wired to real API) |
| ❌ | Not implemented in FE |
| ⬜ | Backend-only process (no FE action needed) |
| 📋 | Reference document (enums, constants, config) |

## Module Index

| # | Module | Status | Files | Description |
|---|--------|--------|-------|-------------|
| [01](flows/01-registration-auth/README.md) | Registration & Auth | ✅ Implemented | 11 | Login, register, email verification, JWT refresh, logout, 2FA, sessions, password change |
| [02](flows/02-user-profile/README.md) | User Profile | ✅ Implemented | 5 | Profile editing, phone verification, address management, notification preferences |
| [03](flows/03-seller-verification/README.md) | Seller Verification | 🔶 Partial | 8 | Admin verification review, seller profile display. eKYC submission not built |
| [04](flows/04-media-upload/README.md) | Media Upload | ✅ Implemented | 6 | 3-step Cloudinary signed upload (signature → upload → confirm) |
| [05](flows/05-item-management/README.md) | Item Management | ✅ Implemented | 9 | Create item, upload images, submit for review, admin review, activate for auction |
| [06](flows/06-auction-lifecycle/README.md) | Auction Lifecycle | 🔶 Partial | 13 | 3-step auction creation (create → submit → timing). End/cancel/relist not built |
| [07](flows/07-bidding/README.md) | Bidding | ✅ Implemented | 9 | Deposit, manual bid, auto-bid, sealed bid, watch, SignalR real-time hub |
| [08](flows/08-buy-now/README.md) | Buy Now | 🔶 Partial | 10 | Buy-now modal exists. Payment callback, reservation timer not built |
| [09](flows/09-payment/README.md) | Payment & VNPay | 🔶 Partial | 10 | VNPay deposit + wallet top-up URL creation. Checkout, refunds, token management not built |
| [10](flows/10-order-lifecycle/README.md) | Order Lifecycle | 🟡 Mock | 11 | Full order UI with mock data. Real API integration pending |
| [11](flows/11-warehouse-shipping/README.md) | Warehouse & Shipping | ❌ Not Implemented | 10 | No FE pages or services. All stubs |
| [12](flows/12-dispute-moderation/README.md) | Dispute & Moderation | 🔶 Partial | 9 | Admin report management + monitoring alerts. User-facing disputes not built |

**Total: 112 documentation files** (1 index + 12 READMEs + 99 subflow files)

## Implementation Summary

| Category | Count |
|----------|-------|
| ✅ Fully documented (implemented features) | ~45 files |
| 🔶 Partial implementations | ~15 files |
| 🟡 Mock implementations | ~7 files |
| ❌ Not implemented stubs | ~30 files |
| ⬜ BE-only references | ~10 files |
| 📋 Reference docs | ~5 files |

## Quick Links

### Key Implemented Flows
- [Login Flow](flows/01-registration-auth/03-login.md) — JWT auth with device tracking
- [3-Step Auction Creation](flows/06-auction-lifecycle/01-create-auction.md) — Create → Submit → Timing
- [Manual Bidding](flows/07-bidding/02-manual-bid.md) — SignalR + REST dual-channel
- [SignalR Hub](flows/07-bidding/07-signalr-hub.md) — Real-time auction events
- [Media Upload](flows/04-media-upload/README.md) — Cloudinary signed upload pipeline
- [VNPay Deposit](flows/09-payment/01-create-payment-url.md) — Payment URL creation + redirect

### Key Source Files
| Layer | Path | Purpose |
|-------|------|---------|
| Services | `src/services/authService.ts` | Authentication API calls |
| Services | `src/services/auctionService.ts` | Auctions, items, bidding API calls |
| Services | `src/services/auctionHubService.ts` | SignalR real-time connection |
| Services | `src/services/mediaService.ts` | Cloudinary upload pipeline |
| Services | `src/services/adminService.ts` | 53+ admin API endpoints |
| Hooks | `src/hooks/useAuctionHub.ts` | SignalR event handling |
| Hooks | `src/hooks/useBidding.ts` | Bid placement logic |
| Store | `src/features/auth/authSlice.ts` | Redux auth state |
| Types | `src/types/enums.ts` | All domain enums |
| Routes | `src/routes/index.tsx` | All route definitions |

## How to Use These Docs

1. **Find a feature**: Use the Module Index above to navigate to the relevant flow
2. **Understand FE implementation**: Each implemented subflow shows the API call, component tree, hooks, and source files
3. **Find gaps**: Not-implemented stubs list BE endpoints and FE requirements for future work
4. **Cross-reference BE**: Each file references its corresponding `backend/docs/flows/` document
5. **Check enums**: Reference files (e.g., `08-enums-reference.md`) map FE enum values to BE values
