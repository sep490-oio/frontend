# 04 - Notification Preferences

> **Status**: Not Started | **BE**: Ready | **FE**: No implementation

## Overview

Notification preferences allow users to configure which notification channels are active (in-app, email, SignalR) and set quiet hours. The BE endpoints are fully implemented but no frontend UI exists for this feature.

---

## BE Endpoints Available

| # | Method | Endpoint | Permission | Description |
|---|--------|----------|-----------|-------------|
| 1 | GET | `/api/me/notification-preferences` | `Me.ReadNotificationPreferences` | Get current preferences (returns defaults if none set) |
| 2 | PUT | `/api/me/notification-preferences` | `Me.ManageNotificationPreferences` | Update preferences |

### GET Response (default when no preferences exist)

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "isEnabled": true,
  "channels": "{}",
  "quietHours": null,
  "rateLimits": null,
  "createdAt": "0001-01-01T00:00:00",
  "modifiedAt": null
}
```

### PUT Request Body

```json
{
  "isEnabled": true,
  "channels": "{}",
  "quietHours": "{}"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isEnabled` | `bool` | Yes | Master toggle for all notifications |
| `channels` | `string` | Yes | JSON string -- channel configuration |
| `quietHours` | `string?` | No | JSON string -- quiet hours configuration |

---

## Delivery Channels (from BE)

| Channel | Description |
|---------|-------------|
| `In App` | Stored in DB, shown in notification center UI |
| `Email` | Sent via email |
| `SignalR` | Real-time push via SignalR WebSocket |

---

## What Needs to Be Built

### Service Layer

Add to `services/userService.ts`:
- `getNotificationPreferences()` -- `GET /api/me/notification-preferences`
- `updateNotificationPreferences()` -- `PUT /api/me/notification-preferences`

### Hooks

Add to `hooks/useUser.ts`:
- `useNotificationPreferences()` -- TanStack Query hook with key `['user', 'notification-preferences']`
- `useUpdateNotificationPreferences()` -- mutation that invalidates the query on success

### Types

Add to `types/notification.ts` or `types/user.ts`:
- `NotificationPreference` interface matching the DTO

### UI Component

Create `components/profile/NotificationPreferencesTab.tsx` (or a section within an existing tab):
- Master enable/disable toggle (`isEnabled`)
- Per-channel toggles (in-app, email, SignalR)
- Quiet hours configuration (time range picker)

### Route/Tab

Option A: Add a 5th tab to `ProfilePage` for notifications.
Option B: Add a section within the existing SecurityTab.

---

## Source Files (BE reference)

| Layer | File |
|-------|------|
| BE Endpoint (GET) | `OIO.Api/Endpoints/UserContext/Me/GetNotificationPreferencesEndpoint.cs` |
| BE Endpoint (PUT) | `OIO.Api/Endpoints/UserContext/Me/UpdateNotificationPreferencesEndpoint.cs` |
| BE Domain | `OIO.Domain/Context/UserContext/Aggregates/Users/UserNotificationPreference.cs` |
| BE DTO | `OIO.Application/Context/UserContext/DTOs/UserNotificationPreferenceDto.cs` |
| FE Types (partial) | `types/notification.ts` -- has `Notification` and `NotificationChannel` types but no preferences type |
