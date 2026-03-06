/**
 * useUser — TanStack Query hooks for user profile, addresses, and account security.
 *
 * These hooks are the interface between React components and the userService.
 * Components import from here — they never call userService directly.
 *
 * Cache keys:
 *   ['user', 'me']            — current user's full profile (UserDto)
 *   ['user', 'profile']       — current user's profile data
 *   ['user', 'addresses']     — current user's address list
 *   ['user', 'sessions']      — active sessions across devices
 *   ['user', 'login-history'] — past login attempts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateUser } from '@/features/auth/authSlice';
import { mapApiUserToUser } from '@/services/authService';
import type { ChangePasswordRequest, SetPhoneNumberRequest, ConfirmPhoneRequest } from '@/types';
import {
  getMe,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  changePassword,
  setPhoneNumber,
  confirmPhone,
  enableTwoFactor,
  disableTwoFactor,
  getSessions,
  getLoginHistory,
  type AddAddressRequest,
} from '@/services/userService';

// ─── Profile hooks ────────────────────────────────────────────────────

/**
 * Fetches the current user's full data from GET /api/users/me.
 * Only runs when the user is authenticated (has an access token).
 *
 * Note: This is separate from the Redux auth state. Use Redux for
 * "is the user logged in?" checks. Use this hook when you need
 * fresh server-side profile data (e.g., the Profile page).
 */
export function useCurrentUser() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    // Only fetch when there's a token — avoids 401 on page load
    enabled: !!accessToken,
  });
}

/**
 * Updates the user's profile fields.
 * On success: invalidates the ['user', 'me'] query AND updates Redux state
 * so the header avatar/name refresh immediately without a page reload.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      // Refresh the full user from the server and sync back to Redux
      const freshDto = await getMe();
      if (accessToken) {
        const freshUser = mapApiUserToUser(freshDto, accessToken);
        dispatch(updateUser(freshUser));
      }
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

// ─── Address hooks ────────────────────────────────────────────────────

/** Returns the user's saved addresses */
export function useAddresses() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery({
    queryKey: ['user', 'addresses'],
    queryFn: getAddresses,
    enabled: !!accessToken,
  });
}

/** Adds a new address. Invalidates address list on success. */
export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddAddressRequest) => addAddress(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

/** Updates an existing address. Invalidates address list on success. */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddAddressRequest> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

/** Deletes an address. Invalidates address list on success. */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => deleteAddress(addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

/**
 * Sets an address as the default. Invalidates address list on success.
 * The backend handles clearing the previous default automatically.
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => setDefaultAddress(addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

// ─── Profile hooks (dedicated endpoint) ──────────────────────────────

/**
 * Fetches the current user's profile from GET /api/users/me/profile.
 * Returns just profile data (name, avatar, DOB, etc.) without account fields.
 */
export function useUserProfile() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getProfile,
    enabled: !!accessToken,
  });
}

// ─── Account Security hooks ──────────────────────────────────────────

/** Changes the user's password. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  });
}

/** Sets or updates the user's phone number. Triggers verification SMS. */
export function useSetPhoneNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetPhoneNumberRequest) => setPhoneNumber(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

/** Confirms the phone number with a verification code. */
export function useConfirmPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmPhoneRequest) => confirmPhone(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

/** Enables two-factor authentication. */
export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) => enableTwoFactor(provider),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

/** Disables two-factor authentication. */
export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disableTwoFactor(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

// ─── Sessions & Login History hooks ──────────────────────────────────

/**
 * Fetches active sessions across devices (paginated).
 * Useful for the "Manage Devices" section of Account Settings.
 */
export function useSessions(page = 1, pageSize = 10) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery({
    queryKey: ['user', 'sessions', page, pageSize],
    queryFn: () => getSessions(page, pageSize),
    enabled: !!accessToken,
  });
}

/**
 * Fetches past login attempts (paginated).
 * Shows both successful and failed logins for security review.
 */
export function useLoginHistory(page = 1, pageSize = 10) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery({
    queryKey: ['user', 'login-history', page, pageSize],
    queryFn: () => getLoginHistory(page, pageSize),
    enabled: !!accessToken,
  });
}
