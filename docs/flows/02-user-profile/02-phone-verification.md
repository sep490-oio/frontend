# 02 - Phone Verification

> **Status**: Implemented | **Component**: `PhoneNumberSection`

## Overview

Phone verification is a 3-step UI flow within the SecurityTab. The user can set (or change) their phone number and confirm it with a 6-digit OTP code. The component manages its own internal step state (`display` -> `input` -> `verify`) using React `useState`.

---

## User Flow

```
Step 1: DISPLAY
┌──────────────────────────────────────────────────┐
│  Phone Number                                     │
│  📱 +84912345678  [Confirmed]  [Change]           │
│  -- OR --                                         │
│  📱 Not set  [Add Phone]                          │
└──────────────────────────────────────────────────┘
       | (user clicks Change/Add Phone)
       v
Step 2: INPUT
┌──────────────────────────────────────────────────┐
│  📱 [Enter phone number____________]              │
│  [Send Code]  [Cancel]                            │
└──────────────────────────────────────────────────┘
       | (PUT /api/me/phone → 204)
       v
Step 3: VERIFY
┌──────────────────────────────────────────────────┐
│  "Enter the verification code sent to your phone" │
│  [______] (max 6 chars)                           │
│  [Verify]  [Cancel]                               │
└──────────────────────────────────────────────────┘
       | (POST /api/me/phone/confirm → 204)
       v
  Back to Step 1 (display) with updated status
```

---

## API Calls

### Step 2: Set Phone Number

| Hook | Endpoint | Request Body | Response |
|------|----------|-------------|----------|
| `useSetPhoneNumber()` | `PUT /api/me/phone` | `{ phoneNumber: string, countryCode?: string }` | `204 No Content` |

**On success:**
- Invalidates `['user', 'me']` and `['user', 'profile']` queries
- Transitions step to `verify`
- Shows success toast: "Verification code sent"

**FE note:** The `countryCode` is not exposed in the UI -- the service sends only `phoneNumber`. The BE defaults to `"VN"` when `countryCode` is omitted.

### Step 3: Confirm Phone

| Hook | Endpoint | Request Body | Response |
|------|----------|-------------|----------|
| `useConfirmPhone()` | `POST /api/me/phone/confirm` | `{ verificationCode: string }` | `204 No Content` |

**On success:**
- Invalidates `['user', 'me']` and `['user', 'profile']` queries
- Transitions step back to `display`
- Shows success toast: "Phone confirmed"

**On error:**
- Sets a form error on the `verificationCode` field (inline validation message)

---

## Component Props

```typescript
interface PhoneNumberSectionProps {
  currentPhone: string | null | undefined;
  phoneConfirmed: boolean;
}
```

Props are passed from `SecurityTab`, which receives them from `ProfilePage` via `currentUser`.

---

## Internal State

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `step` | `'display' \| 'input' \| 'verify'` | `'display'` | Controls which UI step is shown |

Two separate `useForm` instances:
- `phoneForm` -- for the phone number input (step 2), validated with `z.string().min(1)`
- `verifyForm` -- for the verification code (step 3), validated with `z.string().min(1)`

---

## Form Fields

### Phone Input (Step 2)

| Field | Control | Validation | Notes |
|-------|---------|-----------|-------|
| `phoneNumber` | `Input` with phone icon prefix | Required (min 1 char) | Borderless variant, pre-filled with current phone |

### Verification Code (Step 3)

| Field | Control | Validation | Notes |
|-------|---------|-----------|-------|
| `verificationCode` | `Input` | Required (min 1 char) | `maxLength={6}`, borderless variant |

---

## Display State Details

When `step === 'display'`:
- Shows the phone icon + current phone number (or "Not set" i18n text)
- If phone is set, shows a `Tag` badge: green "Confirmed" or orange "Unconfirmed"
- Button label: "Change" if phone exists, "Add Phone" if not

---

## BE Phone Validation Details

The BE uses `libphonenumber` to validate phone numbers:
- Default region: `"VN"` (Vietnam)
- Accepts local format (`0912345678`) and international format (`+84912345678`)
- Stores in E.164 format (`+84912345678`)
- Setting a new phone resets `phoneNumberConfirmed = false`

**OTP lifecycle** (managed by BE):
- Token created via `ISecureTokenStore` with `TokenType.PhoneVerification`
- OTP has a TTL (time-to-live) with rate limiting
- Successful confirmation raises `UserPhoneConfirmedEvent`

**Error codes from BE:**

| Code | HTTP | Condition |
|------|------|-----------|
| `User.NotFound` | 404 | User does not exist |
| `User.PhoneNumber.NotSet` | 403 | Trying to confirm when no phone is set |
| `User.ConfirmationCode.Invalid` | 401 | OTP code is invalid or expired |
| Format error | 422 | Phone number fails libphonenumber validation |

---

## Source Files

| Layer | File |
|-------|------|
| Component | `components/profile/PhoneNumberSection.tsx` |
| Parent | `components/profile/SecurityTab.tsx` |
| Service | `services/userService.ts` -- `setPhoneNumber()`, `confirmPhone()` |
| Hooks | `hooks/useUser.ts` -- `useSetPhoneNumber()`, `useConfirmPhone()` |
| Types | `types/index.ts` -- `SetPhoneNumberRequest`, `ConfirmPhoneRequest` |
