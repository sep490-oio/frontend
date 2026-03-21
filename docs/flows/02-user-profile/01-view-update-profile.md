# 01 - View & Update Profile

> **Status**: Implemented | **Component**: `ProfileInfoTab`

## Overview

The ProfileInfoTab lets users view their account info and edit personal profile fields. Read-only fields (email, username) are displayed with confirmation badges. Editable fields (name, display name, DOB, gender) are managed via React Hook Form with Zod validation.

Avatar is displayed but **upload is not yet wired** -- the `updateProfile` service function accepts `avatarUrl` but the UI has no upload button. The BE supports avatar upload via the media pipeline (`avatarMediaUploadId`).

---

## User Flow

```
ProfileInfoTab loads
       |
       v
┌──────────────────────────────────┐
│  Avatar + display name/username  │  (read-only display)
│  Email + confirmed/unconfirmed   │  (read-only with Tag badge)
│  Username                        │  (read-only)
├──────────────────────────────────┤
│  First Name    |  Last Name      │  (editable)
│  Display Name  |  Gender         │  (editable, Select dropdown)
│  Date of Birth                   │  (DatePicker desktop / native input mobile)
├──────────────────────────────────┤
│  [Save Changes] button           │  (disabled until form is dirty)
└──────────────────────────────────┘
       |
       v (on submit)
  PUT /api/me/profile
       |
       v (on success)
  - Invalidate ['user', 'me'] query
  - Re-fetch full user from GET /api/me
  - Sync updated user to Redux (for header avatar/name)
  - Show success toast
```

---

## API Calls

### Data Loading (at ProfilePage level)

| Hook | Endpoint | Response Type | Purpose |
|------|----------|--------------|---------|
| `useCurrentUser()` | `GET /api/me` | `ApiUserDto` | Account fields: email, emailConfirmed, userName, phoneNumber, status |
| `useUserProfile()` | `GET /api/me/profile` | `UserProfile` | Profile fields: firstName, lastName, displayName, avatarUrl, dateOfBirth, gender |

Both queries are fired at the `ProfilePage` level and passed as props to `ProfileInfoTab`.

### Profile Update

| Hook | Endpoint | Request Body | Response |
|------|----------|-------------|----------|
| `useUpdateProfile()` | `PUT /api/me/profile` | `{ firstName?, lastName?, displayName?, dateOfBirth?, gender? }` | `ApiUserProfileDto` |

**On success**, the mutation:
1. Calls `getMe()` to fetch the fresh full user DTO
2. Maps it via `mapApiUserToUser()` and dispatches `updateUser()` to Redux
3. Invalidates the `['user', 'me']` query cache

This ensures the header avatar/name update immediately without a full page reload.

---

## Form Fields

| Field | Type | Control | Validation | Notes |
|-------|------|---------|-----------|-------|
| `firstName` | `string?` | `Input` | Optional, Zod `.string().optional()` | Borderless variant |
| `lastName` | `string?` | `Input` | Optional | Side-by-side with firstName on desktop |
| `displayName` | `string?` | `Input` | Optional | -- |
| `gender` | `string?` | `Select` | Optional, values: `male`, `female`, `other` | With `allowClear` |
| `dateOfBirth` | `string?` | `DatePicker` (desktop) / `<input type="date">` (mobile) | Optional | Stored as `YYYY-MM-DD` string |

**Read-only fields** (not in form):
- Email -- shown with `confirmed` (green) or `unconfirmed` (orange) Tag
- Username -- shown as `@{userName}`

---

## Component Props

```typescript
interface ProfileInfoTabProps {
  currentUser: ApiUserDto | undefined;
  userProfile: UserProfile | undefined;
}
```

Data is received from `ProfilePage`, not fetched internally. The form is populated via `useEffect` + `reset()` when `userProfile` loads.

---

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Mobile (`< md`) | Single column, native `<input type="date">` for DOB |
| Desktop (`>= md`) | Two-column grid (firstName/lastName, displayName/gender side-by-side), Ant Design `DatePicker` for DOB |

---

## BE Endpoint Details

### PUT /api/me/profile

All fields are optional. Only provided fields are updated; omitted fields retain current values.

**Avatar upload** (not yet wired in FE): The BE accepts `avatarMediaUploadId` (not `avatarUrl`). The upload flow requires:
1. Upload image via media pipeline to get a `MediaUpload` with context `user_avatar`
2. Pass the `MediaUpload.id` as `avatarMediaUploadId` in the profile update
3. BE validates ownership, confirmation status, and context before linking

**Error codes from BE:**

| Code | HTTP | Condition |
|------|------|-----------|
| `User.NotFound` | 404 | User does not exist |
| `Media.NotFound` | 404 | Avatar upload ID not found |
| `Media.NotOwnedByUser` | 403 | Upload belongs to another user |
| `Media.NotConfirm` | 409 | Upload not confirmed yet |
| `Media.WrongContext` | 409 | Upload context is not `user_avatar` |

---

## Source Files

| Layer | File |
|-------|------|
| Component | `components/profile/ProfileInfoTab.tsx` |
| Page (parent) | `pages/profile/ProfilePage.tsx` |
| Service | `services/userService.ts` — `getMe()`, `getProfile()`, `updateProfile()` |
| Hooks | `hooks/useUser.ts` — `useCurrentUser()`, `useUserProfile()`, `useUpdateProfile()` |
| Types | `types/user.ts` — `UserProfile` |
| Types | `types/index.ts` — `ApiUserDto`, `ApiUserProfileDto` |
