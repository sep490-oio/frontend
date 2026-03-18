/**
 * useAdmin — TanStack Query hooks for all admin operations.
 *
 * Follows the same pattern as useUser.ts and useAuctions.ts:
 *   1. Wrap a service function with useQuery / useMutation
 *   2. Descriptive queryKey arrays for smart cache invalidation
 *   3. Named exports (no default export)
 *
 * Cache keys:
 *   ['admin', 'users', params]              — paginated user list
 *   ['admin', 'users', userId]              — single user detail
 *   ['admin', 'roles']                      — all roles + their permissions
 *   ['admin', 'permissions', params]        — all available permission strings
 *   ['admin', 'settings']                   — all system settings
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsers,
  getUserById,
  removeUser,
  changeUserStatus,
  unlockUser,
  assignRole,
  revokeRole,
  grantPermission,
  denyPermission,
  revokePermission,
  getRoles,
  togglePermissionOnRole,
  getPermissions,
  getAllSettings,
  updateSetting,
  type GetUsersParams,
  type ChangeUserStatusRequest,
  type TogglePermissionFromRoleRequest,
  type UpdateSystemSettingRequest,
  type GetPermissionsParams,
} from '@/services/adminService';

// ─────────────────────────────────────────────────────────────────────
// SECTION 1 — Users
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated, filterable list of users.
 * Re-fetches automatically when params change (search, filter, page).
 */
export function useAdminUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => getUsers(params),
    placeholderData: (prev) => prev, // keeps previous page visible during refetch
  });
}

/**
 * Fetches full detail for a single user by ID.
 * Disabled when userId is undefined (before route params resolve).
 */
export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
  });
}

/** Mutation: permanently delete a user account */
export function useRemoveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/** Mutation: change a user's status (Active / Banned / Suspended) */
export function useChangeUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ChangeUserStatusRequest }) =>
      changeUserStatus(userId, data),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

/** Mutation: unlock a locked user account */
export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unlockUser(userId),
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 2 — User Roles
// ─────────────────────────────────────────────────────────────────────

/** Mutation: assign a role to a user */
export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      assignRole(userId, role),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

/** Mutation: revoke a role from a user */
export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      revokeRole(userId, role),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 3 — User Permissions
// ─────────────────────────────────────────────────────────────────────

/** Mutation: grant a permission directly to a user */
export function useGrantPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: string }) =>
      grantPermission(userId, permission),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

/** Mutation: explicitly deny a permission for a user (overrides role) */
export function useDenyPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: string }) =>
      denyPermission(userId, permission),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

/** Mutation: remove a direct permission override from a user */
export function useRevokePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permission }: { userId: string; permission: string }) =>
      revokePermission(userId, permission),
    onSuccess: (_, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 4 — Roles
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all roles with their assigned permissions.
 * Roles rarely change — no need for polling or short staleTime.
 */
export function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: getRoles,
  });
}

/** Mutation: toggle a permission on/off for a specific role */
export function useTogglePermissionOnRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      role,
      permission,
      data,
    }: {
      role: string;
      permission: string;
      data: TogglePermissionFromRoleRequest;
    }) => togglePermissionOnRole(role, permission, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 5 — Permissions
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the full list of available permission strings.
 * Used to populate permission panels in user detail and roles pages.
 * Permissions are system-level constants — long staleTime is appropriate.
 */
export function usePermissions(params: GetPermissionsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'permissions', params],
    queryFn: () => getPermissions(params),
    staleTime: 10 * 60 * 1000, // 10 minutes — permissions rarely change
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 6 — System Settings
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all system-level settings.
 */
export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: getAllSettings,
  });
}

/** Mutation: update a single system setting by key */
export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateSystemSettingRequest }) =>
      updateSetting(key, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
  });
}