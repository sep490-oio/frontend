/**
 * Central type barrel — re-exports all domain types for convenient imports.
 *
 * Usage:
 *   import { Auction, Bid, Wallet } from '@/types';
 *   // OR import directly from the domain file:
 *   import { Auction } from '@/types/auction';
 *
 * Types are organized by business domain, mirroring the PostgreSQL schema
 * (docs/analysis/SP26SE150.sql) and the Core Flow (docs/analysis/CORE_FLOW_SUMMARY.md).
 */

// ─── Domain re-exports ──────────────────────────────────────────────
export * from './enums';
export * from './user';
export * from './item';
export * from './auction';
export * from './wallet';
export * from './order';
export * from './notification';
export * from './admin';
export * from './dashboard';
export * from './signalr';

// ─── Core types (defined below, not in separate files) ──────────────
// These are foundational types used across the entire app (auth, API, UI).
// They stay here because they were part of the original Phase 1 setup
// and are imported everywhere.

// ─── Roles ───────────────────────────────────────────────────────────
// Backend currently has 4 roles: user, bidder, seller, admin.
// Frontend keeps additional roles (moderator, etc.) for future use.

export type UserRole =
  | 'user'
  | 'guest'
  | 'bidder'
  | 'seller'
  | 'moderator'
  | 'risk_manager'
  | 'support'
  | 'marketing'
  | 'admin'
  | 'super_admin';

// Staff roles that have dedicated portals (assigned by Super Admin)
export const STAFF_ROLES: UserRole[] = [
  'moderator',
  'risk_manager',
  'support',
  'marketing',
  'admin',
  'super_admin',
];

// ─── User ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: UserRole[];
  isEmailVerified: boolean;
  hasSellerPermission: boolean;
  createdAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────

export interface LoginRequest {
  /** Accepts email or username (backend uses 'account' field) */
  account: string;
  password: string;
  /** UUID persisted per-browser in localStorage — used for session tracking */
  deviceId: string;
}

export interface RegisterRequest {
  userName: string;
  /** Optional — BE confirmed firstName is not required */
  firstName?: string;
  /** Optional — BE confirmed lastName is not required */
  lastName?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── API DTOs (raw backend response shapes) ──────────────────────────
// These match the backend spec exactly. They are mapped to our frontend
// types (User, UserProfile, etc.) inside authService / userService.

export interface ApiSessionExpirationDto {
  sessionId: string;
  deviceId: string;
  slidingExpiresAt: string;
  absoluteExpiresAt: string;
  isNearingAbsoluteExpiration: boolean;
  remainingAbsoluteTime: string;
}

/** Returned by POST /auth/login and POST /auth/refresh */
export interface ApiAuthTokenDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  session: ApiSessionExpirationDto;
}

/** Nested inside ApiUserDto */
export interface ApiUserProfileDto {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
}

/** Returned by POST /auth/register and GET /api/users/me */
export interface ApiUserDto {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  countryCode: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  twoFactorProvider: string;
  status: string;
  createdAt: string;
  profile: ApiUserProfileDto | null;
}

// ─── API ─────────────────────────────────────────────────────────────

/** Standard API response wrapper from the backend */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/** Standard API error shape */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ─── Pagination ──────────────────────────────────────────────────────

/** Metadata returned by all paginated backend endpoints */
export interface PageMetadata {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Wrapper for paginated responses from real backend endpoints.
 *
 * Named differently from the mock PaginatedResponse in auction.ts
 * to avoid conflicts while the mock layer is still active.
 * When auctions switch to the real API, consolidate into one type.
 */
export interface ApiPaginatedResponse<T> {
  items: T[];
  metadata: PageMetadata;
}

// ─── Account Security DTOs ──────────────────────────────────────────

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SetPhoneNumberRequest {
  phoneNumber: string;
  countryCode?: string;
}

export interface ConfirmPhoneRequest {
  verificationCode: string;
}

/** Returned by GET /api/users/me/sessions */
export interface UserSessionDto {
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

/** Returned by GET /api/users/me/login-history */
export interface LoginHistoryDto {
  id: string;
  ipAddress: string;
  userAgent: string;
  loginAt: string;
  status: string;
}

// ─── UI ──────────────────────────────────────────────────────────────

export type SupportedLanguage = 'vi' | 'en';
