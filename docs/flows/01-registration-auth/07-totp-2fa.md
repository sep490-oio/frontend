# 07 - TOTP Two-Factor Authentication (Frontend)

## Status: Partial Implementation

The FE has a toggle switch to enable/disable 2FA but does **not** implement the full TOTP setup flow (QR code display, code confirmation, recovery codes).

---

## API Calls

### Implemented

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `enableTwoFactor(provider)` | POST | `/api/me/two-factor/enable` | Enable 2FA with a provider |
| `disableTwoFactor()` | POST | `/api/me/two-factor/disable` | Disable 2FA |

### Not Implemented

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/me/two-factor/setup` | Generate TOTP secret + QR code |
| POST | `/api/me/two-factor/confirm` | Verify TOTP code + activate + get recovery codes |
| POST | `/api/auth/two-factor/verify` | Verify TOTP during login (2FA-required flow) |
| POST | `/api/me/two-factor/recovery-codes` | Regenerate recovery codes |

---

## Current Implementation

### TwoFactorSection Component

Located in `components/profile/TwoFactorSection.tsx`, rendered inside `SecurityTab` on the Profile page.

**Props received from SecurityTab:**

| Prop | Type | Source |
|------|------|--------|
| `twoFactorEnabled` | `boolean` | `currentUser?.twoFactorEnabled ?? false` |
| `twoFactorProvider` | `string` | `currentUser?.twoFactorProvider ?? ''` |

**Behavior:**

- **2FA Disabled**: Shows a `Switch` (unchecked). On toggle → calls `enableTwoFactor('sms')`.
- **2FA Enabled**: Shows a `Switch` (checked) with a `Popconfirm`. On confirm → calls `disableTwoFactor()`.
- When enabled, shows a `Tag` displaying the provider name (totp/sms/email).

### Component Tree

```
SecurityTab
└── TwoFactorSection
    ├── Text (profile.twoFactorAuth label)
    ├── Flex
    │   ├── SafetyOutlined icon (green if enabled, gray if disabled)
    │   ├── Text (profile.twoFactorDescription)
    │   ├── Tag (provider name, only when enabled)
    │   └── Switch or Popconfirm+Switch
```

### Hooks Used

| Hook | Service Function | Query Key |
|------|-----------------|-----------|
| `useEnableTwoFactor()` | `enableTwoFactor(provider)` | Invalidates `['user', 'me']` on success |
| `useDisableTwoFactor()` | `disableTwoFactor()` | Invalidates `['user', 'me']` on success |

---

## What Is Missing

### 1. TOTP Setup Flow

The backend supports a full TOTP setup:

```
POST /api/me/two-factor/setup    → { sharedKey, qrCodeBase64 }
POST /api/me/two-factor/confirm  → { recoveryCodes: [...] }
```

The FE would need:
- A modal/page showing the QR code image (base64 PNG)
- A text input for the 6-digit TOTP code
- Display of recovery codes (shown once)

### 2. Login 2FA Verification

When a user with 2FA enabled logs in, the backend returns:

```json
{
  "accessToken": "limited_jwt",
  "refreshToken": "",
  "requiresTwoFactor": true,
  "session": null
}
```

The LoginPage does not check `requiresTwoFactor`. It would need:
- A second step in the login flow (TOTP code input)
- Call `POST /api/auth/two-factor/verify` with the code and deviceId
- Receive the full `AuthTokenDto` and proceed with normal post-login flow

### 3. Recovery Codes UI

No UI exists for:
- Displaying recovery codes after TOTP confirmation
- Regenerating recovery codes (`POST /api/me/two-factor/recovery-codes`)

---

## Current Limitation

The `enableTwoFactor('sms')` call sends `provider: 'sms'`, but the backend's primary 2FA implementation is TOTP. The correct flow for TOTP would be:

1. `POST /api/me/two-factor/setup` → receive QR code
2. User scans QR code in authenticator app
3. `POST /api/me/two-factor/confirm` → verify code, receive recovery codes

The current toggle does not follow this flow.

---

## i18n Keys Used

| Key | Purpose |
|-----|---------|
| `profile.twoFactorAuth` | Section label |
| `profile.twoFactorDescription` | Description text |
| `profile.twoFactorEnabled` | Success message on enable |
| `profile.twoFactorDisabled` | Success message on disable |
| `profile.disableTwoFactorConfirm` | Popconfirm title |
| `profile.twoFactorProviderTotp` | Provider tag: TOTP |
| `profile.twoFactorProviderSms` | Provider tag: SMS |
| `profile.twoFactorProviderEmail` | Provider tag: Email |
| `common.yes` | Popconfirm OK button |
| `common.no` | Popconfirm cancel button |
| `common.error` | Generic error message |

---

## Source Files

| Layer | File |
|-------|------|
| Component | `components/profile/TwoFactorSection.tsx` |
| Parent | `components/profile/SecurityTab.tsx` |
| Service | `services/userService.ts` (`enableTwoFactor()`, `disableTwoFactor()`) |
| Hook | `hooks/useUser.ts` (`useEnableTwoFactor()`, `useDisableTwoFactor()`) |
| Types | `types/index.ts` (`ApiUserDto.twoFactorEnabled`, `ApiUserDto.twoFactorProvider`) |
