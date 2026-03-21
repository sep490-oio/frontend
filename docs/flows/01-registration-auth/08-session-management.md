# 08 - Session Management (Frontend)

## Status: Implemented

---

## API Calls

| Function | Method | Endpoint | Response |
|----------|--------|----------|----------|
| `getSessions(page, pageSize)` | GET | `/api/me/sessions` | `ApiPaginatedResponse<UserSessionDto>` |
| `getLoginHistory(page, pageSize)` | GET | `/api/me/login-history` | `ApiPaginatedResponse<LoginHistoryDto>` |

Both are in `userService.ts` and use the main `api` Axios instance (auto-attached Bearer token).

---

## Component: SessionsTab

Located at `components/profile/SessionsTab.tsx`, rendered as a tab inside the `ProfilePage`.

### Two Sections

1. **Active Sessions** — table/cards showing current sessions across devices
2. **Login History** — table/cards showing past login attempts (success + failure)

Both sections are responsive:
- **Desktop**: Ant Design `Table` with columns
- **Mobile**: Card-based list with `useBreakpoint()` hook

---

## Active Sessions

### Data Type

```typescript
interface UserSessionDto {
  sessionId: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  isActive: boolean;
  isCurrentDevice: boolean;
  createdAt: string;
  lastRotatedAt: string;
  slidingExpiresAt: string;
  absoluteExpiresAt: string;
  isNearingAbsoluteExpiration: boolean;
  remainingAbsoluteTime: string;
}
```

### Table Columns (Desktop)

| Column | Data | Rendering |
|--------|------|-----------|
| Device | `userAgent` | Truncated to 40 chars, with `DesktopOutlined` icon. Shows "Current Device" tag if `isCurrentDevice` |
| Last Active | `lastRotatedAt` | Formatted with `toLocaleString()` |
| Status | `isActive` + `isNearingAbsoluteExpiration` | Green "Active" tag or gray "Inactive" tag. Warning tag if nearing expiration |

### Mobile Card

Each card shows:
- Device icon + truncated user agent (30 chars)
- "Current Device" tag if applicable
- Last active date
- "Expiring Soon" warning tag if `isNearingAbsoluteExpiration`

### Pagination

- Page size: 10
- State managed by local `useState<number>(1)`
- Only shows pagination controls when `totalPages > 1`
- Query key: `['user', 'sessions', page, pageSize]`

---

## Login History

### Data Type

```typescript
interface LoginHistoryDto {
  id: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  status: string;  // 'success' or 'failed'
}
```

### Table Columns (Desktop)

| Column | Data | Rendering |
|--------|------|-----------|
| Date | `loginAt` | Formatted with `toLocaleString()` |
| Device | `userAgent` | Truncated to 40 chars |
| Status | `status` | Green "Success" tag or red "Failed" tag |

### Mobile Card

Each card shows:
- Truncated user agent (30 chars)
- Success/Failed tag
- Login date

### Pagination

Same pattern as sessions: local state, page size 10, conditional display.

---

## Hooks

| Hook | Query Key | Service Function |
|------|-----------|-----------------|
| `useSessions(page, pageSize)` | `['user', 'sessions', page, pageSize]` | `getSessions()` |
| `useLoginHistory(page, pageSize)` | `['user', 'login-history', page, pageSize]` | `getLoginHistory()` |

Both hooks:
- Only enabled when `accessToken` exists in Redux
- Use default TanStack Query caching behavior

---

## Component Tree

```
SessionsTab
├── Active Sessions section
│   ├── Text label (profile.activeSessions)
│   ├── Loading: Spin
│   ├── Desktop: Table + Pagination
│   └── Mobile: Card list + Pagination
├── Divider
└── Login History section
    ├── Text label (profile.loginHistory)
    ├── Loading: Spin
    ├── Desktop: Table + Pagination
    └── Mobile: Card list + Pagination
```

---

## Not Implemented

| Feature | Notes |
|---------|-------|
| Session revocation (per-device) | No "Revoke" or "Logout this device" button on individual sessions |
| Session revocation (all devices) | No "Logout all devices" button |
| IP address display | `ipAddress` is in the DTO but not rendered in the sessions table |

The backend supports revoking specific sessions via `POST /api/auth/logout` with a `deviceId`, but the FE does not expose this action in the SessionsTab UI.

---

## i18n Keys Used

| Key | Purpose |
|-----|---------|
| `profile.activeSessions` | Sessions section label |
| `profile.loginHistory` | Login history section label |
| `profile.device` | Table column header |
| `profile.lastActive` | Table column header |
| `profile.status` | Table column header |
| `profile.date` | Table column header |
| `profile.currentDevice` | Tag text |
| `profile.active` | Active status tag |
| `profile.inactive` | Inactive status tag |
| `profile.expiringSoon` | Warning tag |
| `profile.success` | Login success tag |
| `profile.failed` | Login failed tag |

---

## Source Files

| Layer | File |
|-------|------|
| Component | `components/profile/SessionsTab.tsx` |
| Service | `services/userService.ts` (`getSessions()`, `getLoginHistory()`) |
| Hook | `hooks/useUser.ts` (`useSessions()`, `useLoginHistory()`) |
| Types | `types/index.ts` (`UserSessionDto`, `LoginHistoryDto`, `ApiPaginatedResponse`) |
| Responsive | `hooks/useBreakpoint.ts` (`useBreakpoint()`) |
