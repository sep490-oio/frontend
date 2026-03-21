# 04 -- Dispute Chat (Frontend)

> **Status**: Not implemented
> **BE endpoints**: `POST /api/disputes/{id}/messages`, `GET /api/disputes/{id}/messages`, `POST /api/disputes/{id}/read`
> **BE docs**: `backend/docs/flows/12-dispute-moderation/04-dispute-chat.md`
> **SignalR hub**: `/hubs/disputes`

## Overview

The dispute chat system provides real-time messaging between dispute participants (complainant, respondent, and assigned admin) via a combination of REST API and SignalR. Messages support file attachments via the media upload system. Admins can send "internal" messages visible only to other admins. Read state is tracked per participant.

No FE service functions, hooks, or components exist for dispute chat yet.

## BE Endpoint Reference

### POST /api/disputes/{disputeId}/messages

**Auth**: Authenticated (must be participant or admin)
**Idempotency**: Yes (via `IdempotencyFilter<DisputeMessageDto>`)

#### Request

```typescript
{
  message?: string;              // Text content (optional if media attached)
  mediaUploadIds?: string[];     // UUIDs of confirmed media uploads
  isInternal?: boolean;          // Admin-only internal message (403 for non-admins)
}
```

#### Validation

| Rule | Error |
|------|-------|
| Must have message text or at least one media upload | `Dispute.MessageOrAttachmentRequired` |
| Message max 5000 characters | `Dispute.MessageTooLong` |
| Non-admin sending `isInternal: true` | `Dispute.InternalMessageForbidden` (403) |
| Media uploads must be confirmed, owned by sender, context `dispute_attachment`, not already linked | Various validation errors |

#### Response -- DisputeMessageDto

```typescript
{
  id: string;
  disputeId: string;
  senderId: string;
  senderDisplayName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  attachments: DisputeMessageAttachmentDto[];
}
```

```typescript
interface DisputeMessageAttachmentDto {
  id: string;
  fileName: string | null;
  resourceType: string;        // "image" or "video"
  secureUrl: string;
  bytes: number;
  format: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}
```

### GET /api/disputes/{disputeId}/messages

**Auth**: Authenticated (must be participant or admin)

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `beforeCreatedAt` | DateTime | null | Cursor: messages before this timestamp |
| `beforeId` | string | null | Tie-breaker for same timestamp |
| `pageSize` | number | 50 | Items per page (clamped 1-100) |

#### Response -- DisputeMessagePageDto

```typescript
{
  messages: DisputeMessageDto[];
  hasMore: boolean;
  nextBeforeCreatedAt: string | null;
  nextBeforeId: string | null;
}
```

Non-admins automatically have `isInternal: true` messages filtered out.

### POST /api/disputes/{disputeId}/read

**Auth**: Authenticated (must be participant or admin)

#### Request

```typescript
{
  lastReadMessageId: string;    // UUID of the last message read
}
```

#### Response -- DisputeParticipantReadStateDto

```typescript
{
  disputeId: string;
  userId: string;
  lastReadMessageId: string | null;
  lastReadAt: string | null;
}
```

## SignalR Hub -- /hubs/disputes

**Auth**: Required

### Connection Lifecycle

| Event | Action |
|-------|--------|
| `OnConnectedAsync` | Auto-join `dispute-user:{userId}` group |
| `OnDisconnectedAsync` | Auto-leave `dispute-user:{userId}` group |

### Client-to-Server Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `JoinDispute` | `disputeId: string` | Validates access, creates/updates participant state, joins `dispute:{disputeId}` group. Admins also join `dispute:{disputeId}:admins`. Throws `HubException` on access failure. |
| `LeaveDispute` | `disputeId: string` | Leaves `dispute:{disputeId}` group (and admin group if applicable) |

### Server-to-Client Events

| Event | DTO | Broadcast Target | Description |
|-------|-----|------------------|-------------|
| `MessageReceived` | `DisputeMessageDto` | External: `dispute:{id}`, Internal: `dispute:{id}:admins` | New message |
| `ReadStateUpdated` | `DisputeParticipantReadStateDto` | Appropriate group based on internal flag | Participant marked messages as read |
| `DisputeUpdated` | `DisputeThreadMetaDto` | `dispute:{id}` | Dispute metadata changed (status, priority, assignment) |
| `DisputeUnreadUpdated` | `DisputeUnreadUpdateDto` | `dispute-user:{userId}` | Per-user unread count changed |

### Groups

| Group | Members | Purpose |
|-------|---------|---------|
| `dispute:{disputeId}` | All joined participants | External messages, read states, dispute updates |
| `dispute:{disputeId}:admins` | Admin participants only | Internal (admin-only) messages |
| `dispute-user:{userId}` | Single user across all disputes | Per-user unread broadcasts |

### DisputeThreadMetaDto

```typescript
{
  id: string;
  disputeNumber: string;
  title: string;
  status: string;
  priority: string;
  auctionId: string | null;
  verificationId: string | null;
  orderId: string | null;
  complainantId: string;
  respondentId: string;
  assignedTo: string | null;
  createdAt: string;
  resolvedAt: string | null;
  modifiedAt: string | null;
}
```

### DisputeUnreadUpdateDto

```typescript
{
  disputeId: string;
  unreadCount: number;
}
```

## Message Broadcast Logic

When a message is sent via REST, the `DisputeMessageSentEventHandler` fires:

1. **Internal messages** -> broadcast only to `dispute:{id}:admins` group
2. **External messages** -> broadcast to `dispute:{id}` group (all participants)
3. For each recipient (excluding sender):
   - Calculate unread count (internal visibility based on admin role)
   - Broadcast unread update to `dispute-user:{userId}` group
   - Send push notification (event: `dispute_message_received` or `dispute_internal_message_received`)
   - Notification message: first 120 chars, or "sent an attachment" / "sent N attachments"

## FE Implementation Plan

### Proposed Service Functions

```typescript
// src/services/disputeService.ts
export function getDisputeMessages(disputeId: string, params: {
  beforeCreatedAt?: string;
  beforeId?: string;
  pageSize?: number;
}): Promise<DisputeMessagePageDto>;

export function sendDisputeMessage(disputeId: string, data: {
  message?: string;
  mediaUploadIds?: string[];
  isInternal?: boolean;
}): Promise<DisputeMessageDto>;

export function markDisputeRead(disputeId: string, data: {
  lastReadMessageId: string;
}): Promise<DisputeParticipantReadStateDto>;
```

### Proposed SignalR Service

```typescript
// src/services/disputeHubService.ts
class DisputeHubService {
  startConnection(): Promise<void>;
  joinDispute(disputeId: string): Promise<void>;
  leaveDispute(disputeId: string): Promise<void>;
  onMessageReceived(callback: (msg: DisputeMessageDto) => void): void;
  onReadStateUpdated(callback: (state: DisputeParticipantReadStateDto) => void): void;
  onDisputeUpdated(callback: (meta: DisputeThreadMetaDto) => void): void;
  onUnreadUpdated(callback: (update: DisputeUnreadUpdateDto) => void): void;
}
```

### Proposed Component Hierarchy

```
DisputeChat (embedded in DisputeDetailPage)
├── MessageList
│   ├── MessageBubble (sender name, text, timestamp, internal badge)
│   │   └── AttachmentPreview (image/video thumbnails)
│   ├── InternalMessageBubble (admin-only, visually distinct)
│   └── InfiniteScrollLoader (cursor pagination, loads older messages)
├── ReadReceipts (shows who has read up to which message)
├── MessageComposer
│   ├── TextArea (max 5000 chars)
│   ├── AttachmentUploader (media upload with dispute_attachment context)
│   ├── InternalToggle (admin-only checkbox for internal messages)
│   └── SendButton
└── ConnectionIndicator (SignalR connection status)
```

### Key Implementation Considerations

1. **Cursor pagination**: Messages use `beforeCreatedAt` + `beforeId` cursor, not page numbers. Load older messages by scrolling up.
2. **Internal messages**: Admin users see a toggle to send internal messages. These appear with a distinct visual style (e.g., different background color, "Internal" badge).
3. **Read tracking**: Automatically call `POST /api/disputes/{id}/read` when the user views new messages (e.g., on scroll into view).
4. **SignalR reconnection**: Follow same pattern as auction hub -- auto-reconnect with `JoinDispute` on reconnect.
5. **Idempotency**: `POST /api/disputes/{id}/messages` supports idempotency keys -- generate a UUID per message send to prevent duplicates.
