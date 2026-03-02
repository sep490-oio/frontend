/**
 * User Service — profile and address API calls.
 *
 * All calls go through the main `api` Axios instance, which automatically
 * attaches the Bearer token and handles silent refresh on 401.
 *
 * Note: GET /api/users/me/profile returns 204 (backend bug confirmed in audit).
 * We use GET /api/users/me instead, which returns UserDto with a nested profile.
 * The getProfile() function is included but marked as potentially broken.
 */
import { api } from './api';
import type { ApiUserDto, ApiUserProfileDto } from '@/types';
import type { UserAddress } from '@/types/user';

// ─── Profile ─────────────────────────────────────────────────────────

/**
 * GET /api/users/me
 * Returns the full user object including the nested profile.
 * Prefer this over getProfile() until the profile endpoint bug is fixed.
 */
export async function getMe(): Promise<ApiUserDto> {
  const response = await api.get<ApiUserDto>('/api/users/me');
  return response.data;
}

/**
 * PUT /api/users/me/profile
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
  const response = await api.put<ApiUserProfileDto>('/api/users/me/profile', data);
  return response.data;
}

// ─── Addresses ───────────────────────────────────────────────────────

export interface AddAddressRequest {
  type: string;
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
 * GET /api/users/me/addresses
 * Returns a paginated list. We fetch page 1 with a large page size
 * since users rarely have more than 10 addresses.
 */
export async function getAddresses(): Promise<UserAddress[]> {
  const response = await api.get<{ items: UserAddress[] }>('/api/users/me/addresses', {
    params: { PageNumber: 1, PageSize: 50 },
  });
  // Handle both paginated shape { items: [...] } and flat array
  return Array.isArray(response.data)
    ? (response.data as UserAddress[])
    : (response.data.items ?? []);
}

/**
 * POST /api/users/me/addresses
 * Adds a new address. Returns the created address with its server-assigned id.
 */
export async function addAddress(data: AddAddressRequest): Promise<UserAddress> {
  const response = await api.post<UserAddress>('/api/users/me/addresses', data);
  return response.data;
}

/**
 * PUT /api/users/me/addresses/{addressId}
 * Updates an existing address by ID.
 */
export async function updateAddress(
  addressId: string,
  data: Partial<AddAddressRequest>
): Promise<UserAddress> {
  const response = await api.put<UserAddress>(
    `/api/users/me/addresses/${addressId}`,
    data
  );
  return response.data;
}

/**
 * DELETE /api/users/me/addresses/{addressId}
 * Removes an address. Returns nothing (204).
 */
export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/api/users/me/addresses/${addressId}`);
}

/**
 * PATCH /api/users/me/addresses/{addressId}/default
 * Marks an address as the user's default. Returns nothing (204).
 * This is a dedicated action — not part of the regular update endpoint.
 */
export async function setDefaultAddress(addressId: string): Promise<void> {
  await api.patch(`/api/users/me/addresses/${addressId}/default`);
}
