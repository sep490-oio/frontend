# Bid System v1.0 — Competitive Bidding E-Commerce Platform

Capstone project (SP26SE150) — an online platform where users list items for auction and participate in competitive bidding, with two-phase bidding (qualification + final), wallet/escrow, and dispute resolution.

**Timeline:** January 1 – April 30, 2026
**Supervisor:** Ly Tuan Anh
**Team:** Nguyen Duc Trung, Dao Nguyen Phuong Anh, Ngo Tung Hiep, Le Hoang Nhat Tan, Le Hai Long

## Project Status

**Frontend deployed** to `https://fe.newlsun.com/` — CI/CD pipeline live (push to `master` → Docker → deploy).

| Step | Feature | Status |
|------|---------|--------|
| 1 | Infrastructure + types + mock data | Done |
| 2 | Layouts (Public + App) | Done |
| 3 | Browse/Catalog page | Done |
| 4 | Auction Detail (read-only) | Done |
| 5 | Bidder Dashboard | Done |
| 6 | Wallet | Done |
| 7 | Auction Detail (interactive bidding) | Done |
| 8 | My Bids | Done |
| 9 | Seller Profile | Done |
| 10 | Orders | Done |
| 11 | API Integration (Auth, User, Addresses, Security) | Done |
| 12 | Profile Page (Info, Addresses, Security, Sessions) | Done |
| 13 | Bidding MVP (SignalR, auto-bid, create item, Cloudinary) | Done |
| 14 | UI Refactor (feature-based architecture) | Done |

## Project Structure

```
caps_sp_2026/                    <- Parent repo (docs + orchestration)
├── CLAUDE.md                    <- AI team instructions
├── docs/
│   ├── analysis/                <- Business analysis, DB schema, user stories
│   ├── meetings/                <- Meeting transcripts
│   ├── adr/                     <- Architecture Decision Records
│   ├── vps/                     <- VPS deployment & flow docs
│   └── DECISIONS.md             <- Technical decision log
├── frontend/                    <- Git submodule -> SEP490-OIO/frontend
│   └── src/
│       ├── app/                 <- App entry, router, providers, i18n
│       ├── components/          <- Shared UI components (ui/, layout/)
│       ├── features/            <- Feature modules (13 domains)
│       ├── hooks/               <- Shared custom hooks
│       ├── lib/                 <- Axios, Cloudinary, QueryClient, SignalR
│       ├── styles/              <- Global CSS, design tokens
│       ├── types/               <- TypeScript type definitions
│       └── utils/               <- Formatters, helpers
├── backend/                     <- Git submodule -> SEP490-OIO/backend (.NET)
└── docs/                        <- Documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9, Vite 8 |
| UI Library | Ant Design 6, @ant-design/icons 6 |
| State | TanStack Query 5 (server data) |
| Real-time | @microsoft/signalr (auction hub) |
| Routing | React Router v7 (lazy-loaded) |
| Forms | React Hook Form + Zod |
| HTTP | Axios (with silent JWT refresh) |
| i18n | react-i18next (Vietnamese primary, English secondary) |
| Media | Cloudinary (signed upload) |
| Backend | .NET (ASP.NET Core), PostgreSQL |
| Deployment | Docker -> ghcr.io -> VPS |

## Getting Started

```bash
cd frontend
npm install
npm run dev        # Dev server -> http://localhost:3000
npm run build      # TypeScript check + production build
npm run lint       # ESLint
```

**Requires:** Node.js 18+

## Key Documentation

- `docs/analysis/CORE_FLOW_SUMMARY.md` — Business logic quick reference
- `docs/analysis/CORE_FLOW.md` — Detailed implementation guide
- `docs/DECISIONS.md` — Technical decisions with rationale
- `CLAUDE.md` — AI team instructions and code conventions
