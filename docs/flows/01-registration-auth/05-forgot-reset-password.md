# 05 - Forgot / Reset Password (Frontend)

## Status: Not Implemented

---

## Summary

The forgot/reset password feature has not been built on the frontend. The LoginPage contains a link to `/forgot-password`, but no page component exists for that route.

---

## Backend Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `POST` | `/api/auth/reset-password` | Reset password using token from email |

### Forgot Password Request

```json
{
  "email": "string"
}
```

- Always returns `204 No Content` regardless of whether the email exists (silent success pattern to prevent email enumeration)
- Backend sends a password reset email with a token link if the user exists and email is confirmed
- 60-second cooldown between resend attempts

### Reset Password Request

```json
{
  "email": "string",
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

- Returns `204 No Content` on success
- Token is single-use with 30-minute expiration
- Password must meet the same rules as registration (8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special)

---

## What Exists Today

- **LoginPage** has a `<Link to="/forgot-password">` that renders "Forgot password?" text
- **No route** is defined for `/forgot-password` in `routes/index.tsx`
- **No service function** exists in `authService.ts` for these endpoints
- Navigating to `/forgot-password` currently shows the 404 page

---

## Implementation Plan (when ready)

### Pages Needed

1. **ForgotPasswordPage** (`/forgot-password`)
   - Email input form
   - Submit → `POST /api/auth/forgot-password`
   - Show "Check your email" message on success (always, regardless of response)

2. **ResetPasswordPage** (`/reset-password`)
   - Read `email` and `token` from URL search params
   - Form: new password + confirm password
   - Submit → `POST /api/auth/reset-password`
   - On success → redirect to `/login` with success message

### Service Functions Needed

```typescript
// In authService.ts
export async function forgotPassword(email: string): Promise<void>;
export async function resetPassword(data: {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void>;
```

### Routes Needed

```tsx
// In routes/index.tsx, under PublicLayout
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password"  element={<ResetPasswordPage />} />
```

---

## Source Files

| Layer | File | Notes |
|-------|------|-------|
| Link | `pages/public/LoginPage.tsx` (line 212) | Contains `<Link to="/forgot-password">` |
| BE Docs | `backend/docs/flows/01-registration-auth/05-forgot-reset-password.md` | Full BE specification |
