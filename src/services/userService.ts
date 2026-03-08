/**
 * User Service — profile, address, and account security API calls.
 *
 * All calls go through the main `api` Axios instance, which automatically
 * attaches the Bearer token and handles silent refresh on 401.
 */
import { api } from './api';
import type {
  ApiUserDto,
  ApiUserProfileDto,
  AddressType,
  ChangePasswordRequest,
  SetPhoneNumberRequest,
  ConfirmPhoneRequest,
  ApiPaginatedResponse,
  UserSessionDto,
  LoginHistoryDto,
} from '@/types';
import type { UserAddress, UserProfile } from '@/types/user';

// ─── Profile ─────────────────────────────────────────────────────────

/**
 * GET /api/me
 * Returns the full user object including the nested profile.
 */
export async function getMe(): Promise<ApiUserDto> {
  const response = await api.get<ApiUserDto>('/api/me');
  return response.data;
}

/**
 * GET /api/me/profile
 * Returns just the profile data (personal info, avatar, etc.).
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/api/me/profile');
  return response.data;
}

/**
 * PUT /api/me/profile
 * Updates displayable profile fields (name, avatar, DOB, gender).
 */
export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
}): Promise<ApiUserProfileDto> {
  const response = await api.put<ApiUserProfileDto>('/api/me/profile', data);
  return response.data;
}

// ─── Addresses ───────────────────────────────────────────────────────

export interface AddAddressRequest {
  type: AddressType;
  recipientName: string;
  street: string;
  ward?: string;
  district?: string;
  city: string;
  postalCode?: string;
  phoneNumber: string;
  countryCode?: string;
  isDefault?: boolean;
}

/**
 * GET /api/me/addresses
 * Returns a paginated list. We fetch page 1 with a large page size
 * since users rarely have more than 10 addresses.
 */
export async function getAddresses(): Promise<UserAddress[]> {
  const response = await api.get<{ items: UserAddress[] }>('/api/me/addresses', {
    params: { PageNumber: 1, PageSize: 50 },
  });
  // Handle both paginated shape { items: [...] } and flat array
  return Array.isArray(response.data)
    ? (response.data as UserAddress[])
    : (response.data.items ?? []);
}

/**
 * POST /api/me/addresses
 * Adds a new address. Returns the created address with its server-assigned id.
 */
export async function addAddress(data: AddAddressRequest): Promise<UserAddress> {
  const response = await api.post<UserAddress>('/api/me/addresses', data);
  return response.data;
}

/**
 * PUT /api/me/addresses/{addressId}
 * Updates an existing address by ID.
 */
export async function updateAddress(
  addressId: string,
  data: Partial<AddAddressRequest>
): Promise<UserAddress> {
  const response = await api.put<UserAddress>(
    `/api/me/addresses/${addressId}`,
    data
  );
  return response.data;
}

/**
 * DELETE /api/me/addresses/{addressId}
 * Removes an address. Returns nothing (204).
 */
export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/api/me/addresses/${addressId}`);
}

/**
 * PATCH /api/me/addresses/{addressId}/default
 * Marks an address as the user's default. Returns nothing (204).
 * This is a dedicated action — not part of the regular update endpoint.
 */
export async function setDefaultAddress(addressId: string): Promise<void> {
  await api.patch(`/api/me/addresses/${addressId}/default`);
}

// ─── Account Security ───────────────────────────────────────────────

/**
 * PUT /api/me/password
 * Changes the user's password. Requires the current password for verification.
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.put('/api/me/password', data);
}

/**
 * PUT /api/me/phone
 * Sets or updates the user's phone number. Triggers a verification SMS.
 */
export async function setPhoneNumber(data: SetPhoneNumberRequest): Promise<void> {
  await api.put('/api/me/phone', data);
}

/**
 * POST /api/me/phone/confirm
 * Confirms the phone number using the verification code from SMS.
 */
export async function confirmPhone(data: ConfirmPhoneRequest): Promise<void> {
  await api.post('/api/me/phone/confirm', data);
}

/**
 * POST /api/me/two-factor/enable
 * Enables two-factor authentication for the user's account.
 */
export async function enableTwoFactor(provider: string): Promise<void> {
  await api.post('/api/me/two-factor/enable', { provider });
}

/**
 * POST /api/me/two-factor/disable
 * Disables two-factor authentication.
 */
export async function disableTwoFactor(): Promise<void> {
  await api.post('/api/me/two-factor/disable');
}

// ─── Sessions & Login History ───────────────────────────────────────

/**
 * GET /api/me/sessions
 * Returns a paginated list of active sessions across devices.
 */
export async function getSessions(
  page = 1,
  pageSize = 10
): Promise<ApiPaginatedResponse<UserSessionDto>> {
  const response = await api.get<ApiPaginatedResponse<UserSessionDto>>(
    '/api/me/sessions',
    { params: { PageNumber: page, PageSize: pageSize } }
  );
  return response.data;
}

/**
 * GET /api/me/login-history
 * Returns a paginated list of past login attempts (success + failure).
 */
export async function getLoginHistory(
  page = 1,
  pageSize = 10
): Promise<ApiPaginatedResponse<LoginHistoryDto>> {
  const response = await api.get<ApiPaginatedResponse<LoginHistoryDto>>(
    '/api/me/login-history',
    { params: { PageNumber: page, PageSize: pageSize } }
  );
  return response.data;
}
