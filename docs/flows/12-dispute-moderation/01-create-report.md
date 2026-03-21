# 01 -- Create Report (Frontend)

> **Status**: Not implemented
> **BE endpoints**: `POST /api/reports`, `GET /api/me/reports`
> **BE docs**: `backend/docs/flows/12-dispute-moderation/01-create-report.md`

## Overview

Report creation allows any authenticated user to submit a report against an entity (Auction, User, Item). The BE accepts the report, sets its status to `Open`, and sends a confirmation notification to the reporter. There is currently no FE page or component for creating or viewing reports.

## BE Endpoint Reference

### POST /api/reports

**Auth**: Authenticated (any user)

#### Request

```typescript
{
  entityType: string;      // "Auction", "User", "Item"
  entityId: string;        // UUID of the reported entity
  reasonCode: string;      // e.g. "fraud", "spam", "inappropriate"
  description?: string;    // Optional free-text description
  attachments?: string;    // Optional JSON string of attachment data
}
```

#### Response -- ReportDto

```typescript
{
  id: string;
  reporterId: string;
  entityType: string;
  entityId: string;
  reasonCode: string;
  description: string | null;
  attachments: string | null;
  status: string;               // "open"
  assignedTo: string | null;
  createdAt: string;
  assignedAt: string | null;
  resolvedAt: string | null;
  escalatedEmergencyAt: string | null;
  resolutionNotes: string | null;
}
```

#### Validation

| Field | Rule | Error |
|-------|------|-------|
| `entityType` | Not whitespace | Validation error |
| `entityId` | Not empty GUID | Validation error |
| `reasonCode` | Not whitespace | Validation error |

#### Side Effects

- Notification sent to reporter: type `moderation`, event `report_created`
- Title: "Bao cao da duoc ghi nhan"

### GET /api/me/reports

**Auth**: Authenticated (any user)

Returns the current user's own reports ordered by `CreatedAt` descending.

**Response**: `ReportDto[]`

## Report Status Lifecycle

```
Open -> UnderReview -> ActionTaken -> Closed
                    -> Dismissed   -> Closed
                    -> ActionTaken (via escalation)
```

| Status | String ID |
|--------|-----------|
| Open | `open` |
| UnderReview | `under_review` |
| ActionTaken | `action_taken` |
| Dismissed | `dismissed` |
| Closed | `closed` |

## FE Implementation Plan

### Where It Would Live

Report creation would be triggered from contextual locations:

1. **Auction detail page** -- "Report this auction" button/menu item
2. **User profile page** -- "Report this user" button
3. **Item detail page** -- "Report this item" button

A shared `ReportModal` component would handle all entity types.

### Proposed Components

| Component | Purpose |
|-----------|---------|
| `ReportModal` | Modal with entity type pre-filled, reason code dropdown, description textarea, optional file attachments |
| `MyReportsPage` | User's submitted reports list with status badges |

### Proposed Service Functions

```typescript
// src/services/reportService.ts
export function createReport(data: CreateReportRequest): Promise<ReportDto>;
export function getMyReports(): Promise<ReportDto[]>;
```

### Proposed Hooks

```typescript
// src/hooks/useReports.ts
export function useMyReports(): UseQueryResult<ReportDto[]>;
export function useCreateReport(): UseMutationResult;
```

### Flow

1. User clicks "Report" on an auction/user/item page
2. `ReportModal` opens with `entityType` and `entityId` pre-filled
3. User selects a `reasonCode` from dropdown and optionally adds description
4. Submit calls `POST /api/reports`
5. Success toast confirms report was submitted
6. `MyReportsPage` shows all user's reports with current status
