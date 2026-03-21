# 07 -- Risk Flags & Audit Logging (Frontend)

> **Status**: Not implemented (service function and hook exist, no UI)
> **BE endpoints**: `POST /api/admin/users/{userId}/risk-flags`
> **BE docs**: `backend/docs/flows/12-dispute-moderation/07-risk-flags-audit.md`
> **FE service**: `adminService.flagUser()`
> **FE hook**: `useAdmin.useFlagUser()`

## Overview

Risk flags are markers placed on user accounts to track suspicious or policy-violating behavior. They are created both automatically (by background jobs detecting collusion, non-payment, or emergency actions) and manually (by admins through an API endpoint). Audit logging tracks all moderation actions as immutable records. The FE has the service function and hook for manual flag creation, but no UI to invoke them or display existing flags.

## Existing FE Code

### Service Function

**File**: `src/services/adminService.ts`

```typescript
export async function flagUser(userId: string, data: FlagUserRequest): Promise<UserRiskFlagDto> {
  const response = await api.post<UserRiskFlagDto>(`/api/admin/users/${userId}/risk-flags`, data);
  return response.data;
}
```

### Request Type

```typescript
interface FlagUserRequest {
  flagType?: string | null;     // e.g. "suspicious_activity", "payment_fraud"
  reason?: string | null;       // Admin-provided reason
  severity?: string | null;     // "low", "medium", "high", "critical" (default: "medium")
}
```

### Response Type

```typescript
interface UserRiskFlagDto {
  id: string;
  userId: string | null;
  flagType: string | null;
  reason: string | null;
  severity: string | null;
  createdBy: string | null;     // Admin who created (null for system-created)
  createdAt: string;
}
```

### Hook

**File**: `src/hooks/useAdmin.ts`

```typescript
export function useFlagUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: FlagUserRequest }) =>
      flagUser(userId, data),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}
```

Cache invalidation: invalidates the specific user's detail query on success.

## BE Endpoint Reference

### POST /api/admin/users/{userId}/risk-flags

**Auth**: `Admin.ManageUsers` permission

#### Request

```typescript
{
  flagType: string;       // Required, not whitespace
  reason?: string;        // Optional
  severity?: string;      // Optional, default "medium"
}
```

#### Validation

| Field | Rule | Error |
|-------|------|-------|
| `userId` | Not empty GUID | Validation error |
| `flagType` | Not whitespace | Validation error |
| `severity` | Not whitespace (if provided) | Validation error |

#### Response

`UserRiskFlagDto` (see above)

#### Side Effects

- Audit log: action `user_risk_flag_created`, entityType `"User"`

### Flag Types Used Across the System

| FlagType | Created By | Severity | Trigger |
|----------|-----------|----------|---------|
| `non_payment` | `CancelExpiredOrdersJob` (auto) | Medium | Order expired without payment |
| `auction_collusion_suspected` | `AuctionCollusionDetectionService` (auto) | High/Critical | Collusion signals detected on auction |
| `auction_emergency` | `TriggerAuctionEmergencyCommand` (auto) | High | Auction emergency triggered |
| `suspicious_activity` | Admin (manual) | Varies | Admin judgment |
| `payment_fraud` | Admin (manual) | Varies | Admin judgment |
| `item_fraud` | Admin (manual) | Varies | Admin judgment |
| `seller_trust_violation` | Admin (manual) | Varies | Admin judgment |

### Risk Flag Severity

| Value | String ID |
|-------|-----------|
| Low | `low` |
| Medium | `medium` |
| High | `high` |
| Critical | `critical` |

### Auto-Suspension

The BE has an `Ops.AutoSuspendOnNonPaymentThreshold` setting. When a user accumulates enough `non_payment` flags to reach this threshold, the system automatically suspends the user account. Similarly, `Ops.AutoSuspendOnEmergency` can auto-suspend sellers when an auction emergency is triggered.

## Audit Logging (BE Only)

Audit logs are created server-side by `ModerationAuditService` for all moderation actions. There is currently **no FE endpoint to view audit logs** -- they exist only in the database for compliance and investigation purposes.

### AuditLog Entity

```typescript
{
  id: string;
  actorUserId: string | null;     // Admin who performed the action (null for system)
  actorRole: string | null;       // Role from JWT claims
  action: string;                 // Action identifier (see table below)
  entityType: string;             // "Report", "MonitoringAlert", "Auction", "User"
  entityId: string | null;        // UUID of affected entity
  oldData: string | null;         // JSON snapshot of previous state
  newData: string | null;         // JSON snapshot of new state
  ipAddress: string | null;       // Always null (not captured at service level)
  createdAt: string;
}
```

### All Audit Actions

| Action | Entity Type | Source |
|--------|-------------|-------|
| `monitoring_alert_acknowledged` | `MonitoringAlert` | Acknowledge alert |
| `monitoring_alert_resolved` | `MonitoringAlert` | Resolve alert (ignored=false) |
| `monitoring_alert_ignored` | `MonitoringAlert` | Resolve alert (ignored=true) |
| `auction_alert_created` | `Auction` | Create manual monitoring alert |
| `user_risk_flag_created` | `User` | Flag user with risk flag |
| `invalid_bid_cancelled` | `Auction` | Cancel an invalid bid |
| `report_escalated_emergency` | `Report` | Escalate report to auction emergency |
| `auction_emergency_triggered` | `Auction` | Trigger auction emergency |
| `auction_emergency_resolved` | `Auction` | Resolve auction emergency |
| `report_resolved` | `Report` | Resolve a report |
| `report_assigned` | `Report` | Assign a report to admin |
| `auction_collusion_signal_detected` | `Auction` | System detected collusion signal |

## FE Implementation Plan

### Where It Would Live

Risk flag creation would be added to the admin user detail page (`/admin/users/:id`):

1. A "Risk Flags" section showing existing flags for the user
2. A "Flag User" button opening a modal to create a new flag

### Proposed Components

| Component | Purpose |
|-----------|---------|
| `UserRiskFlagsSection` | Display list of risk flags on a user with severity badges |
| `FlagUserModal` | Modal with flagType dropdown, severity select, reason textarea |

### Proposed Flow

1. Admin navigates to a user's detail page
2. Scrolls to "Risk Flags" section showing existing flags (needs a BE `GET` endpoint or inclusion in user detail response)
3. Clicks "Flag User" button
4. Fills in flag type, severity, and reason
5. Submits -- calls `flagUser()` via `useFlagUser()` hook
6. Success toast, flag list refreshes

### Audit Log Viewer (Future)

An audit log viewer page is not currently planned but could be added at `/admin/audit-logs` with filters for action, entity type, date range, and actor.
