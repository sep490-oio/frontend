# 02 - User Profile Module

> **Status**: Implemented | **Route**: `/profile` | **Auth**: Required

## Overview

The User Profile module lets authenticated users manage their personal information, phone verification, shipping addresses, and account security settings. The profile page uses a 4-tab layout (Segmented on desktop, Select dropdown on mobile).

> **Note**: Notification preferences are **not yet implemented** in the frontend. The BE endpoints exist (`GET/PUT /api/me/notification-preferences`) but no FE tab or UI has been built.

---

## User Flow

```
User navigates to /profile
         |
    ┌────┴─────────────────────────────────────────┐
    |              ProfilePage                      |
    |  ┌─────────┬────────────┬──────────┬────────┐ |
    |  | Info    | Addresses  | Security | Sessions| |
    |  └────┬────┴─────┬──────┴────┬─────┴───┬────┘ |
    └───────|──────────|───────────|──────────|──────┘
            v          v           v          v
    ProfileInfoTab  AddressesTab  SecurityTab  SessionsTab
    - View/edit     - List        - Password   - Active
      name, DOB,      addresses   - Phone        sessions
      gender,       - Add/Edit      verify     - Login
      avatar          (modal)    - 2FA toggle    history
    - Read-only:    - Delete
      email,        - Set default
      username
```

---

## Component Hierarchy

```
ProfilePage
├── ProfileInfoTab
│   ├── Avatar section (display only, no upload yet)
│   ├── Read-only fields (email + confirmed badge, username)
│   └── Editable form (firstName, lastName, displayName, gender, dateOfBirth)
│       └── React Hook Form + Zod validation
├── AddressesTab
│   ├── AddressCard (per address)
│   │   ├── Recipient name + type badge + default badge
│   │   ├── Full address (street, ward, district, city)
│   │   ├── Phone number
│   │   └── Actions: Edit, Delete (Popconfirm), Set Default
│   └── AddressFormModal (add/edit mode)
│       └── React Hook Form + Zod validation
├── SecurityTab
│   ├── PhoneNumberSection (3-step: display → input → verify)
│   ├── Password change section
│   └── Two-factor toggle
└── SessionsTab
    ├── Active sessions list
    └── Login history list
```

---

## Pages & Routes

| Route | Page Component | Auth | Description |
|-------|---------------|------|-------------|
| `/profile` | `ProfilePage` | Required | User account management (4 tabs) |

---

## API Endpoints Consumed

| # | Method | Endpoint | Service Function | Hook | Used By |
|---|--------|----------|-----------------|------|---------|
| 1 | GET | `/api/me` | `getMe()` | `useCurrentUser()` | ProfilePage (passes to tabs) |
| 2 | GET | `/api/me/profile` | `getProfile()` | `useUserProfile()` | ProfilePage (passes to ProfileInfoTab) |
| 3 | PUT | `/api/me/profile` | `updateProfile()` | `useUpdateProfile()` | ProfileInfoTab |
| 4 | PUT | `/api/me/phone` | `setPhoneNumber()` | `useSetPhoneNumber()` | PhoneNumberSection |
| 5 | POST | `/api/me/phone/confirm` | `confirmPhone()` | `useConfirmPhone()` | PhoneNumberSection |
| 6 | GET | `/api/me/addresses` | `getAddresses()` | `useAddresses()` | AddressesTab |
| 7 | POST | `/api/me/addresses` | `addAddress()` | `useAddAddress()` | AddressFormModal |
| 8 | PUT | `/api/me/addresses/{id}` | `updateAddress()` | `useUpdateAddress()` | AddressFormModal |
| 9 | DELETE | `/api/me/addresses/{id}` | `deleteAddress()` | `useDeleteAddress()` | AddressesTab |
| 10 | PATCH | `/api/me/addresses/{id}/default` | `setDefaultAddress()` | `useSetDefaultAddress()` | AddressesTab |
| 11 | PUT | `/api/me/password` | `changePassword()` | `useChangePassword()` | SecurityTab |
| 12 | GET | `/api/me/sessions` | `getSessions()` | `useSessions()` | SessionsTab |
| 13 | GET | `/api/me/login-history` | `getLoginHistory()` | `useLoginHistory()` | SessionsTab |

---

## Subflow Index

| # | File | Status | Description |
|---|------|--------|-------------|
| 01 | [01-view-update-profile.md](./01-view-update-profile.md) | Implemented | View and update personal info (name, DOB, gender) |
| 02 | [02-phone-verification.md](./02-phone-verification.md) | Implemented | Set phone number + OTP confirmation |
| 03 | [03-address-management.md](./03-address-management.md) | Implemented | Full CRUD for shipping addresses |
| 04 | [04-notification-preferences.md](./04-notification-preferences.md) | Not Started | Notification channel and quiet hours config |

---

## Key Source Files

| Layer | File | Purpose |
|-------|------|---------|
| Page | `pages/profile/ProfilePage.tsx` | Main profile page with 4-tab layout |
| Component | `components/profile/ProfileInfoTab.tsx` | Personal info form |
| Component | `components/profile/AddressesTab.tsx` | Address list with CRUD actions |
| Component | `components/profile/AddressCard.tsx` | Single address display card |
| Component | `components/profile/AddressFormModal.tsx` | Add/edit address modal |
| Component | `components/profile/PhoneNumberSection.tsx` | 3-step phone verification UI |
| Component | `components/profile/SecurityTab.tsx` | Password, phone, 2FA settings |
| Component | `components/profile/SessionsTab.tsx` | Sessions and login history |
| Service | `services/userService.ts` | All user-related API calls |
| Hooks | `hooks/useUser.ts` | TanStack Query hooks for user data |
| Types | `types/user.ts` | `UserProfile`, `UserAddress` interfaces |
| Types | `types/index.ts` | `ApiUserDto`, `ApiUserProfileDto`, request types |
| Types | `types/enums.ts` | `AddressType`, `Gender` enums |
| Route | `routes/index.tsx` | `/profile` route definition |

---

## TanStack Query Cache Keys

| Key | Endpoint | Invalidated By |
|-----|----------|---------------|
| `['user', 'me']` | `GET /api/me` | `useUpdateProfile`, `useSetPhoneNumber`, `useConfirmPhone`, `useEnableTwoFactor`, `useDisableTwoFactor` |
| `['user', 'profile']` | `GET /api/me/profile` | `useSetPhoneNumber`, `useConfirmPhone` |
| `['user', 'addresses']` | `GET /api/me/addresses` | `useAddAddress`, `useUpdateAddress`, `useDeleteAddress`, `useSetDefaultAddress` |
| `['user', 'sessions', page, size]` | `GET /api/me/sessions` | (none) |
| `['user', 'login-history', page, size]` | `GET /api/me/login-history` | (none) |
