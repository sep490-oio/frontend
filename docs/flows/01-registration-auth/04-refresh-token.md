# 04 - Refresh Token / Silent Refresh (Frontend)

## Status: Implemented

---

## API Call

| Property | Value |
|----------|-------|
| Function | `refreshToken()` |
| Service | `authService.ts` |
| Method | `POST` |
| Endpoint | `/api/auth/refresh` |
| Auth | Bearer (expired token allowed by backend) |
| Request Body | `{ refreshToken: string, deviceId: string }` |
| Response Type | `ApiAuthTokenDto` |

---

## Architecture

The silent refresh mechanism lives in `services/api.ts` as an Axios response interceptor. It is invisible to all other code -- pages and hooks simply use the `api` instance and never worry about token expiration.

### Key Design Decisions

1. **Separate Axios instance** for refresh calls (`authAxios` in `authService.ts`) -- prevents the refresh call itself from triggering the 401 interceptor and causing infinite loops.
2. **Request queue** -- when multiple API calls fail with 401 simultaneously, only one refresh is attempted. The others are queued and replayed with the new token.
3. **`_retry` flag** -- marks a request as already retried to prevent infinite retry loops.

---

## Flow Diagram

```mermaid
sequenceDiagram
    participant Comp as React Component
    participant API as api (Axios instance)
    participant Int as 401 Interceptor
    participant LS as localStorage
    participant Auth as authAxios
    participant BE as Backend
    participant Redux as Redux Store

    Comp->>API: Any API call
    API->>BE: Request with Bearer token
    BE-->>API: 401 Unauthorized
    API->>Int: Error intercepted

    Int->>Int: Check: status === 401 AND !_retry
    Int->>Int: Check: isRefreshing?

    alt Already refreshing
        Int->>Int: Push to failedQueue
        Note over Int: Wait for refresh to complete
    else Start refresh
        Int->>Int: isRefreshing = true
        Int->>Int: originalRequest._retry = true
        Int->>LS: Read refreshToken
        alt No refresh token
            Int->>Redux: dispatch(clearCredentials())
            Int->>Comp: Redirect to /login
        end
        Int->>LS: getOrCreateDeviceId()
        Int->>Auth: refreshToken(storedRefreshToken, deviceId)
        Auth->>BE: POST /api/auth/refresh
        alt Refresh succeeds
            BE-->>Auth: ApiAuthTokenDto (new tokens)
            Auth-->>Int: New tokens
            Int->>Auth: getMe(newAccessToken)
            Auth->>BE: GET /api/me
            BE-->>Auth: ApiUserDto
            Int->>Int: mapApiUserToUser(dto, newAccessToken)
            Int->>Redux: dispatch(setCredentials({ user, accessToken, refreshToken }))
            Int->>Int: processQueue(null, newAccessToken)
            Int->>API: Replay original request with new token
            API->>BE: Retry with new Bearer token
            BE-->>API: Success response
            API-->>Comp: Response
        else Refresh fails
            BE-->>Auth: Error
            Int->>Int: processQueue(error, null)
            Int->>Redux: dispatch(clearCredentials())
            Int->>Comp: window.location.href = '/login'
        end
        Int->>Int: isRefreshing = false (in finally)
    end
```

---

## Queue Mechanism

The queue prevents a "thundering herd" problem:

```
Request A → 401 → starts refresh
Request B → 401 → queued (isRefreshing = true)
Request C → 401 → queued
    ...refresh completes with new token...
Request B → replayed with new token
Request C → replayed with new token
```

### Queue Data Structure

```typescript
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};
let failedQueue: QueueEntry[] = [];
```

When a refresh completes:
- **Success**: `processQueue(null, newToken)` -- resolves all entries, each replays its original request
- **Failure**: `processQueue(error, null)` -- rejects all entries

---

## Token Storage

| Token | Storage Location | Read By | Written By |
|-------|-----------------|---------|------------|
| `accessToken` | `localStorage` + Redux state | Request interceptor (from Redux), 401 interceptor (from localStorage) | `setCredentials` action |
| `refreshToken` | `localStorage` only | 401 interceptor | `setCredentials` action |
| `deviceId` | `localStorage` | `getOrCreateDeviceId()` | `getOrCreateDeviceId()` (on first call) |
| `user` | `localStorage` + Redux state | Components (from Redux) | `setCredentials` action |

---

## Auth State Updates

After a successful refresh, the interceptor updates the full auth state:

1. Call `getMe(newAccessToken)` to get fresh user data
2. Call `mapApiUserToUser(dto, newAccessToken)` to transform the DTO
3. Dispatch `setCredentials({ user, accessToken: newAccessToken, refreshToken: newRefreshToken })`
4. This updates both Redux state and localStorage

After a failed refresh:
1. Dispatch `clearCredentials()` -- clears Redux state + removes all auth keys from localStorage
2. Hard redirect: `window.location.href = '/login'`

---

## Request Interceptor (Token Injection)

Defined in the same `api.ts` file, the request interceptor runs before every outgoing request:

```typescript
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

This means components never need to pass tokens manually -- the Axios instance handles it.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No refresh token in localStorage | Immediate logout (clearCredentials + redirect) |
| Refresh endpoint returns 401/403 | Catch block: logout + redirect |
| Network error during refresh | Catch block: logout + redirect |
| 401 on a request already marked `_retry` | Rejected immediately (no second refresh attempt) |
| Non-401 error | Passed through unchanged (no interception) |
| Multiple 401s at the same time | Only one refresh call; others queued |

---

## Source Files

| Layer | File |
|-------|------|
| Interceptor | `services/api.ts` (response interceptor + request interceptor) |
| Service | `services/authService.ts` (`refreshToken()`, `getMe()`, `mapApiUserToUser()`, `getOrCreateDeviceId()`) |
| State | `features/auth/authSlice.ts` (`setCredentials`, `clearCredentials`) |
| Types | `types/index.ts` (`ApiAuthTokenDto`) |
