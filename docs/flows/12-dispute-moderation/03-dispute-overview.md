# 03 -- Dispute Overview (Frontend)

> **Status**: Not implemented
> **BE endpoints**: `GET /api/disputes`, `GET /api/disputes/{disputeId}`
> **BE docs**: `backend/docs/flows/12-dispute-moderation/03-dispute-overview.md`

## Overview

The dispute overview provides a role-scoped view of all disputes. Admins see all disputes; regular users see only disputes where they are the complainant or respondent. The BE supports a full dispute entity with child collections (messages, evidence, refunds, status history) and access control via `DisputeAccessService`. No FE service functions, hooks, or UI pages exist for listing or viewing disputes yet.

## BE Endpoint Reference

### GET /api/disputes

**Auth**: Authenticated (role-scoped: admin sees all, user sees own)

Returns a paginated list of disputes accessible to the current user.

### GET /api/disputes/{disputeId}

**Auth**: Authenticated (must be admin, complainant, or respondent)

Returns the dispute thread including metadata, participants, and recent messages. Returns `404` if not found, `403` if current user has no access.

## Dispute Entity Structure

### Core Fields

```typescript
interface DisputeDto {
  id: string;
  disputeNumber: string;         // Format: "DSP-{guid}" truncated to 16 chars
  orderId: string;               // Linked order (empty GUID if none)
  auctionId: string | null;      // Linked auction (null for verification disputes)
  verificationId: string | null; // Linked verification (null for auction disputes)
  complainantId: string;         // User who filed
  respondentId: string;          // User the dispute is against
  type: DisputeType;
  title: string;
  description: string;
  desiredResolution: DesiredResolution;
  status: DisputeStatus;
  priority: DisputePriority;
  resolutionType: ResolutionType;
  resolutionNotes: string | null;
  resolutionAmount: number | null;
  assignedTo: string | null;     // Admin handling the dispute
  escalatedTo: string | null;    // Senior admin if escalated
  responseDeadline: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  modifiedAt: string | null;
}
```

### Child Collections

| Collection | Description |
|-----------|-------------|
| `Evidence` | Submitted evidence (images, videos, documents, receipts, tracking info) |
| `Messages` | Chat messages between participants (see [04-dispute-chat.md](./04-dispute-chat.md)) |
| `Refunds` | Refund records linked to dispute resolution |
| `StatusHistory` | Full audit trail of status transitions |
| `ParticipantState` | Read state tracking per participant |

## Enums

### DisputeType (9 values)

| FE Type | BE String ID |
|---------|-------------|
| `item_not_received` | `item_not_received` |
| `item_not_as_described` | `item_not_as_described` |
| `damaged_item` | `damaged_item` |
| `counterfeit` | `counterfeit` |
| `payment_issue` | `payment_issue` |
| `shipping_issue` | `shipping_issue` |
| `seller_unresponsive` | `seller_unresponsive` |
| `verification_correction` | `verification_correction` |
| `other` | `other` |

Note: FE `src/types/enums.ts` defines `DisputeType` but is missing `verification_correction`. This should be added when the dispute UI is implemented.

### DisputeStatus (8 values)

| FE Type | BE String ID |
|---------|-------------|
| `draft` | `draft` |
| `open` | `open` |
| `under_review` | `under_review` |
| `awaiting_response` | `awaiting_response` |
| `escalated` | `escalated` |
| `resolved` | `resolved` |
| `closed` | `closed` |
| `cancelled` | `cancelled` |

Note: FE `src/types/enums.ts` defines `DisputeStatus` but is missing `draft`. This should be added when the dispute UI is implemented.

### DesiredResolution (5 values)

| BE String ID | Description |
|-------------|-------------|
| `no_action` | No action requested |
| `refund` | Full refund |
| `replacement` | Item replacement |
| `partial_refund` | Partial refund |
| `other` | Other resolution |

Note: FE `src/types/enums.ts` defines `DesiredResolution` but is missing `no_action`. This should be added.

### DisputePriority (5 values)

| BE String ID |
|-------------|
| `none` |
| `low` |
| `medium` |
| `high` |
| `urgent` |

### ResolutionType (9 values)

| BE String ID | Escrow Action |
|-------------|---------------|
| `no_resolution` | None |
| `refund_full` | Full escrow refunded to buyer |
| `refund_partial` | Partial to buyer, remainder to seller |
| `replacement` | None |
| `favor_buyer` | Full escrow refunded to buyer |
| `favor_seller` | Full escrow released to seller |
| `mutual_agreement` | Full escrow released to seller |
| `no_action` | None |
| `cancelled` | None |

Note: FE `src/types/enums.ts` defines `ResolutionType` but is missing `no_resolution`. This should be added.

## Access Control

The BE `DisputeAccessService` controls visibility:

| User Role | Access |
|-----------|--------|
| Admin | Can view all disputes, can send internal messages |
| Complainant | Can view own disputes, cannot see internal messages |
| Respondent | Can view disputes filed against them, cannot see internal messages |
| Other | `403 Forbidden` |

## FE Implementation Plan

### Proposed Pages

| Page | Route | Purpose |
|------|-------|---------|
| `DisputeListPage` | `/disputes` | Paginated list of user's disputes (or all for admin) |
| `DisputeDetailPage` | `/disputes/:id` | Dispute thread: metadata, chat, evidence, status history |

### Proposed Service Functions

```typescript
// src/services/disputeService.ts
export function getDisputes(params: GetDisputesParams): Promise<PagedList<DisputeDto>>;
export function getDisputeById(disputeId: string): Promise<DisputeThreadDto>;
```

### Proposed Hooks

```typescript
// src/hooks/useDisputes.ts
export function useDisputes(params: GetDisputesParams): UseQueryResult;
export function useDispute(disputeId: string): UseQueryResult;
```

### Proposed Component Hierarchy

```
DisputeListPage
├── Filter bar (status, type, priority)
├── Dispute cards / table
│   ├── DisputeNumber + title
│   ├── Status badge + priority tag
│   ├── Participants (complainant vs respondent)
│   ├── Unread message count
│   └── Created date
└── Pagination

DisputeDetailPage
├── DisputeHeader (number, title, status, priority, assigned admin)
├── DisputeParticipants (complainant + respondent info)
├── DisputeChat (see 04-dispute-chat.md)
├── EvidenceList (submitted evidence with media preview)
├── StatusHistory (timeline of status changes)
└── AdminActions (resolve button -- admin only)
```
