/**
 * Auth Service — all authentication API calls.
 *
 * This is the single source of truth for talking to the /api/auth/* and
 * /api/users/me endpoints. Pages and hooks import from here — they never
 * call `api` directly for auth operations.
 *
 * Also exports two small utilities used across auth:
 *   - getOrCreateDeviceId()  — stable browser UUID for session tracking
 *   - parseRolesFromToken()  — extracts roles from the JWT payload
 */
import axios from 'axios';
import type {
  User,
  UserRole,
  LoginRequest,
  RegisterRequest,
  ApiAuthTokenDto,
  ApiUserDto,
} from '@/types';

// ─── deviceId utility ───────────────────────────────────────────────
/**
 * Returns a stable UUID that identifies this browser across sessions.
 * Generated once on first visit, then persisted in localStorage.
 *
 * The backend uses this to track which devices have active sessions,
 * so users can see and revoke sessions from the Sessions page.
 */
export function getOrCreateDeviceId(): string {
  const stored = localStorage.getItem('deviceId');
  if (stored) return stored;

  // Generate a v4-like UUID without any external dependency
  const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  localStorage.setItem('deviceId', newId);
  return newId;
}

// ─── JWT role parser ─────────────────────────────────────────────────
/**
 * Decodes the JWT payload (base64url) and extracts the user's roles.
 *
 * We decode client-side purely to read claims — we do NOT verify the
 * signature here (that's the backend's job). We just want to know what
 * roles the backend has assigned without making an extra API call.
 *
 * Falls back to ['bidder'] if:
 *  - Token is malformed
 *  - No roles claim found
 */
export function parseRolesFromToken(token: string): UserRole[] {
  try {
    // JWT is 3 base64url parts separated by '.'
    // We only need the middle part (payload)
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return ['bidder'];

    // base64url → base64 → JSON
    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as Record<string, unknown>;

    // Standard JWT roles claim — check common key names
    const rawRoles =
      (payload['roles'] as string[] | undefined) ??
      (payload['role'] as string[] | string | undefined);

    if (!rawRoles) return ['bidder'];

    const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    // Validate against our known UserRole values before trusting the backend data
    const validRoles: UserRole[] = [
      'user', 'guest', 'bidder', 'seller', 'moderator',
      'risk_manager', 'support', 'marketing', 'admin', 'super_admin',
    ];
    const filtered = rolesArray.filter((r): r is UserRole =>
      validRoles.includes(r as UserRole)
    );

    return filtered.length > 0 ? filtered : ['bidder'];
  } catch {
    // If anything goes wrong, assume basic bidder access
    return ['bidder'];
  }
}

// ─── JWT permission parser ───────────────────────────────────────────
/**
 * Decodes the JWT payload and extracts the user's permissions.
 *
 * The backend uses a custom claim "permission" (singular) to store
 * fine-grained permissions like "Permissions.Auctions.Create".
 * Returns an empty array if the token is malformed or has no permissions.
 */
export function parsePermissionsFromToken(token: string): string[] {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return [];

    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as Record<string, unknown>;

    const rawPerms = payload['permission'] as string[] | string | undefined;
    if (!rawPerms) return [];

    return Array.isArray(rawPerms) ? rawPerms : [rawPerms];
  } catch {
    return [];
  }
}

// ─── API user → frontend User mapper ────────────────────────────────
/**
 * Maps the backend's ApiUserDto to our frontend User type.
 * Called after login (with token) and after GET /api/users/me.
 */
export function mapApiUserToUser(dto: ApiUserDto, accessToken: string): User {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.profile?.fullName
      || [dto.profile?.firstName, dto.profile?.lastName].filter(Boolean).join(' ')
      || dto.userName,
    avatarUrl: dto.profile?.avatarUrl ?? null,
    roles: parseRolesFromToken(accessToken),
    isEmailVerified: dto.emailConfirmed,
    hasSellerPermission: parseRolesFromToken(accessToken).includes('seller'),
    createdAt: dto.createdAt,
  };
}

// ─── Dedicated plain axios instance for refresh calls ───────────────
// Using a separate instance (not the main `api`) prevents the refresh
// call itself from triggering another 401 intercept → infinite loop.
const authAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Auth API calls ──────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Returns tokens — use getMe() immediately after to get the user object.
 */
export async function login(data: LoginRequest): Promise<ApiAuthTokenDto> {
  const response = await authAxios.post<ApiAuthTokenDto>('/api/auth/login', data);
  return response.data;
}

/**
 * POST /api/auth/register
 * Returns the new user record. Does NOT return tokens — the user must
 * confirm their email first, then log in separately.
 */
export async function register(data: RegisterRequest): Promise<ApiUserDto> {
  const response = await authAxios.post<ApiUserDto>('/api/auth/register', data);
  return response.data;
}

/**
 * POST /api/auth/logout
 * Fire-and-forget — we clear local state regardless of the response.
 */
export async function logout(deviceId: string): Promise<void> {
  try {
    await authAxios.post('/api/auth/logout', { deviceId });
  } catch {
    // Intentionally ignore errors — local cleanup happens regardless
  }
}

/**
 * POST /api/auth/refresh
 * Exchanges a refresh token for a new access + refresh token pair.
 * Called automatically by the Axios 401 interceptor in api.ts.
 */
export async function refreshToken(
  token: string,
  deviceId: string
): Promise<ApiAuthTokenDto> {
  const response = await authAxios.post<ApiAuthTokenDto>('/api/auth/refresh', {
    refreshToken: token,
    deviceId,
  });
  return response.data;
}

/**
 * POST /api/auth/confirm-email
 * Called by ConfirmEmailPage after the user clicks the link in their email.
 */
export async function confirmEmail(userId: string, token: string): Promise<void> {
  await authAxios.post('/api/auth/confirm-email', { userId, token });
}

/**
 * GET /api/me
 * Fetches the current authenticated user's data.
 * Called right after login to hydrate the Redux auth state.
 * Requires the access token to be passed explicitly (before it's in Redux).
 */
export async function getMe(accessToken: string): Promise<ApiUserDto> {
  const response = await authAxios.get<ApiUserDto>('/api/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
