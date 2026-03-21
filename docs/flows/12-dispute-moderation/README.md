# Flow 12 -- Dispute & Moderation (Frontend)

> **Status**: Partial (2 of 8 subflows implemented)
> **Last verified**: 2026-03-21
> **BE docs**: `backend/docs/flows/12-dispute-moderation/`

## Overview

The dispute & moderation module covers the full lifecycle of user reports, formal disputes, monitoring alerts, risk flags, audit logging, and auction emergency actions. On the FE side, two admin pages are currently implemented: **AdminReportsPage** (report management) and **AdminMonitoringPage** (monitoring alerts). The remaining subflows -- user-facing report creation, dispute overview/chat/resolution, risk flags, and auction emergencies -- have BE endpoints ready but no FE UI yet. Service functions and hooks exist for some of these (e.g., `resolveDispute`, `triggerAuctionEmergency`, `flagUser`) but are not wired to any page.

## Implementation Status

| # | Subflow | FE Status | Service Layer | UI Page |
|---|---------|-----------|---------------|---------|
| 01 | [Create Report](./01-create-report.md) | Not implemented | -- | -- |
| 02 | [Admin Report Management](./02-admin-report-management.md) | **Implemented** | `adminService.ts` | `AdminReportsPage` |
| 03 | [Dispute Overview](./03-dispute-overview.md) | Not implemented | `adminService.resolveDispute()` only | -- |
| 04 | [Dispute Chat](./04-dispute-chat.md) | Not implemented | -- | -- |
| 05 | [Resolve Dispute](./05-resolve-dispute.md) | Not implemented | `adminService.resolveDispute()` | -- |
| 06 | [Monitoring Alerts](./06-monitoring-alerts.md) | **Implemented** | `adminService.ts` | `AdminMonitoringPage` |
| 07 | [Risk Flags & Audit](./07-risk-flags-audit.md) | Not implemented | `adminService.flagUser()` | -- |
| 08 | [Auction Emergency](./08-auction-emergency.md) | Not implemented | `adminService.triggerAuctionEmergency()` | -- |

## Routes

| Route | Page | Component | Status |
|-------|------|-----------|--------|
| `/admin/reports` | Admin report management | `AdminReportsPage` | Implemented |
| `/admin/monitoring` | Admin monitoring alerts | `AdminMonitoringPage` | Implemented |
| `/reports/new` | User create report | -- | Not implemented |
| `/disputes` | Dispute list | -- | Not implemented |
| `/disputes/:id` | Dispute thread + chat | -- | Not implemented |

## API Endpoints Consumed (FE)

| # | Method | URL | FE Function | Used In |
|---|--------|-----|-------------|---------|
| 1 | `GET` | `/api/admin/reports` | `getReports()` | AdminReportsPage |
| 2 | `POST` | `/api/admin/reports/{id}/assign` | `assignReport()` | useAdmin hook (not wired to UI) |
| 3 | `POST` | `/api/admin/reports/{id}/resolve` | `resolveReport()` | AdminReportsPage |
| 4 | `POST` | `/api/admin/reports/{id}/escalate-emergency` | `escalateReportEmergency()` | AdminReportsPage |
| 5 | `GET` | `/api/admin/monitoring-alerts` | `getMonitoringAlerts()` | AdminMonitoringPage |
| 6 | `POST` | `/api/admin/monitoring-alerts/{id}/acknowledge` | `acknowledgeMonitoringAlert()` | AdminMonitoringPage |
| 7 | `POST` | `/api/admin/monitoring-alerts/{id}/resolve` | `resolveMonitoringAlert()` | AdminMonitoringPage |
| 8 | `POST` | `/api/admin/disputes/{id}/resolve` | `resolveDispute()` | useAdmin hook (not wired to UI) |
| 9 | `POST` | `/api/admin/users/{id}/risk-flags` | `flagUser()` | useAdmin hook (not wired to UI) |
| 10 | `POST` | `/api/admin/auctions/{id}/alerts` | `flagAuction()` | useAdmin hook (not wired to UI) |
| 11 | `POST` | `/api/admin/auctions/{id}/bids/{bidId}/cancel` | `cancelInvalidBid()` | useAdmin hook (not wired to UI) |
| 12 | `POST` | `/api/admin/auctions/{id}/emergencies` | `triggerAuctionEmergency()` | useAdmin hook (not wired to UI) |
| 13 | `POST` | `/api/admin/auctions/{id}/emergencies/{eId}/resolve` | `resolveAuctionEmergency()` | useAdmin hook (not wired to UI) |

## API Endpoints NOT Yet Consumed

| # | Method | URL | Purpose |
|---|--------|-----|---------|
| 1 | `POST` | `/api/reports` | User creates a report |
| 2 | `GET` | `/api/me/reports` | User views own reports |
| 3 | `GET` | `/api/disputes` | List disputes (paged, role-scoped) |
| 4 | `GET` | `/api/disputes/{id}` | Dispute thread detail |
| 5 | `GET` | `/api/disputes/{id}/messages` | Cursor-paginated messages |
| 6 | `POST` | `/api/disputes/{id}/messages` | Send message (with attachments) |
| 7 | `POST` | `/api/disputes/{id}/read` | Mark dispute read |

## SignalR Hub (Not Yet Consumed)

Hub path: `/hubs/disputes`

| Direction | Method | Purpose |
|-----------|--------|---------|
| Client -> Server | `JoinDispute(disputeId)` | Subscribe to dispute events |
| Client -> Server | `LeaveDispute(disputeId)` | Unsubscribe |
| Server -> Client | `MessageReceived` | New message in thread |
| Server -> Client | `ReadStateUpdated` | Participant read state changed |
| Server -> Client | `DisputeUpdated` | Dispute metadata changed |
| Server -> Client | `DisputeUnreadUpdated` | Unread count changed |

See [04-dispute-chat.md](./04-dispute-chat.md) for full SignalR details.

## State Management

### TanStack Query Keys (Active)

| Key | Source | Usage |
|-----|--------|-------|
| `['admin', 'reports', params]` | `getReports()` | Admin reports list |
| `['admin', 'monitoring-alerts', params]` | `getMonitoringAlerts()` | Monitoring alerts list (polls every 30s) |

### TanStack Query Keys (Defined but Unused)

| Key | Hook | Notes |
|-----|------|-------|
| `['admin', 'reports', params]` | `useAdminReports()` | Hook exists in `useAdmin.ts`, page uses inline `useQuery` |

## Source Files

| Category | File | Path |
|----------|------|------|
| **Service** | Admin service (reports, alerts, disputes, emergencies) | `src/services/adminService.ts` |
| **Hook** | Admin hooks (all admin mutations/queries) | `src/hooks/useAdmin.ts` |
| **Page** | Admin reports page | `src/pages/admin/AdminReportsPage.tsx` |
| **Page** | Admin monitoring page | `src/pages/admin/AdminMonitoringPage.tsx` |
| **Types** | Dispute enums (DisputeType, DisputeStatus, etc.) | `src/types/enums.ts` |
| **Types** | Report types (ReportDto, etc.) | `src/services/adminService.ts` (inline) |
| **Types** | Monitoring alert types (MonitoringAlertDto, etc.) | `src/services/adminService.ts` (inline) |
| **Routes** | Route definitions | `src/routes/index.tsx` |
