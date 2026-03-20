/**
 * useAdmin — TanStack Query hooks for all admin operations.
 *
 * Covers all 48 admin endpoints from OpenAPI spec v1.
 *
 * Cache keys:
 *   ['admin', 'users', params]                    — paginated user list
 *   ['admin', 'users', userId]                    — single user detail
 *   ['admin', 'roles']                            — all roles + permissions
 *   ['admin', 'permissions', params]              — all permission strings
 *   ['admin', 'settings']                         — system settings
 *   ['admin', 'items', 'review-queue', params]    — item review queue
 *   ['admin', 'items', itemId]                    — single item detail
 *   ['admin', 'items', itemId, 'reviews']         — item review history
 *   ['admin', 'monitoring-alerts', params]        — monitoring alerts
 *   ['admin', 'reports', params]                  — reports list
 *   ['admin', 'seller-profiles']                  — seller profiles
 *   ['admin', 'verifications']                    — pending verifications
 *   ['admin', 'verifications', verificationId]    — single verification
 *   ['admin', 'terms', params]                    — terms documents
 *   ['admin', 'payments', 'summary', params]      — payment summary
 *   ['admin', 'payments', 'transactions', params] — transactions list
 *   ['admin', 'payments', 'transactions', id]     — single transaction
 *   ['admin', 'payments', 'escrows', params]      — escrows list
 *   ['admin', 'payments', 'escrows', id]          — single escrow
 *   ['admin', 'payments', 'withdrawals', params]  — withdrawals list
 *   ['admin', 'payments', 'withdrawals', id]      — single withdrawal
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
  flagUser,
  getItemReviewQueue,
  getAdminItemDetail,
  getItemReviewHistory,
  approveItem,
  assignItemReviewer,
  rejectItem,
  getMonitoringAlerts,
  acknowledgeMonitoringAlert,
  resolveMonitoringAlert,
  getReports,
  assignReport,
  escalateReportEmergency,
  resolveReport,
  getSellerProfiles,
  verifySellerProfile,
  rejectSellerProfile,
  getPendingVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
  getTermsDocuments,
  createTermsDocument,
  activateTermsDocument,
  getPaymentSummary,
  getTransactions,
  getTransactionById,
  getEscrows,
  getEscrowById,
  getWithdrawals,
  getWithdrawalById,
  approveWithdrawal,
  rejectWithdrawal,
  flagAuction,
  cancelInvalidBid,
  setAuctionCuration,
  triggerAuctionEmergency,
  resolveAuctionEmergency,
  revealSealedBid,
  resolveDispute,
  type GetUsersParams,
  type ChangeUserStatusRequest,
  type TogglePermissionFromRoleRequest,
  type UpdateSystemSettingRequest,
  type GetPermissionsParams,
  type FlagUserRequest,
  type ItemReviewQueueParams,
  type AssignItemReviewerRequest,
  type RejectItemRequest,
  type GetMonitoringAlertsParams,
  type AcknowledgeMonitoringAlertRequest,
  type ResolveMonitoringAlertRequest,
  type GetReportsParams,
  type AssignReportRequest,
  type EscalateReportEmergencyRequest,
  type ResolveReportRequest,
  type RejectVerificationRequest,
  type GetTermsParams,
  type CreateTermsDocumentRequest,
  type GetTransactionsParams,
  type GetEscrowsParams,
  type GetWithdrawalsParams,
  type RejectWithdrawalRequest,
  type FlagAuctionRequest,
  type CancelInvalidBidRequest,
  type SetAuctionCurationRequest,
  type TriggerAuctionEmergencyRequest,
  type ResolveAuctionEmergencyRequest,
  type ResolveDisputeRequest,
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
    placeholderData: (prev) => prev,
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

/** Mutation: flag a user with a risk flag */
export function useFlagUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: FlagUserRequest }) =>
      flagUser(userId, data),
    onSuccess: (_, { userId }) => {
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

/** Fetches all system-level settings. */
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

// ─────────────────────────────────────────────────────────────────────
// SECTION 7 — Item Review
// ─────────────────────────────────────────────────────────────────────

/** Fetches paginated item review queue. Filter by Status, AssignedAdminId. */
export function useItemReviewQueue(params: ItemReviewQueueParams = {}) {
  return useQuery({
    queryKey: ['admin', 'items', 'review-queue', params],
    queryFn: () => getItemReviewQueue(params),
    placeholderData: (prev) => prev,
  });
}

/** Fetches full detail of a single item. Disabled when itemId is undefined. */
export function useAdminItemDetail(itemId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'items', itemId],
    queryFn: () => getAdminItemDetail(itemId!),
    enabled: !!itemId,
  });
}

/** Fetches review history for a specific item. Disabled when itemId is undefined. */
export function useItemReviewHistory(itemId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'items', itemId, 'reviews'],
    queryFn: () => getItemReviewHistory(itemId!),
    enabled: !!itemId,
  });
}

/** Mutation: approve an item — POST /api/admin/items/{itemId}/approve */
export function useApproveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => approveItem(itemId),
    onSuccess: (_, itemId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'items', 'review-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'items', itemId] });
    },
  });
}

/** Mutation: assign a reviewer admin to an item */
export function useAssignItemReviewer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: AssignItemReviewerRequest }) =>
      assignItemReviewer(itemId, data),
    onSuccess: (_, { itemId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'items', 'review-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'items', itemId] });
    },
  });
}

/** Mutation: reject an item with a reason */
export function useRejectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: RejectItemRequest }) =>
      rejectItem(itemId, data),
    onSuccess: (_, { itemId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'items', 'review-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'items', itemId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 8 — Monitoring Alerts
// ─────────────────────────────────────────────────────────────────────

/** Fetches monitoring alerts. Filter by status, entityType, entityId. */
export function useMonitoringAlerts(params: GetMonitoringAlertsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'monitoring-alerts', params],
    queryFn: () => getMonitoringAlerts(params),
    placeholderData: (prev) => prev,
  });
}

/** Mutation: acknowledge a monitoring alert */
export function useAcknowledgeMonitoringAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, data }: { alertId: string; data: AcknowledgeMonitoringAlertRequest }) =>
      acknowledgeMonitoringAlert(alertId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring-alerts'] });
    },
  });
}

/** Mutation: resolve a monitoring alert */
export function useResolveMonitoringAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, data }: { alertId: string; data: ResolveMonitoringAlertRequest }) =>
      resolveMonitoringAlert(alertId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring-alerts'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 9 — Reports
// ─────────────────────────────────────────────────────────────────────

/** Fetches admin reports list. Filter by status, entityType, entityId. */
export function useAdminReports(params: GetReportsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => getReports(params),
    placeholderData: (prev) => prev,
  });
}

/** Mutation: assign a report to an admin user */
export function useAssignReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: AssignReportRequest }) =>
      assignReport(reportId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

/** Mutation: escalate a report to emergency */
export function useEscalateReportEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: EscalateReportEmergencyRequest }) =>
      escalateReportEmergency(reportId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

/** Mutation: resolve a report */
export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: ResolveReportRequest }) =>
      resolveReport(reportId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 10 — Seller Profiles
// ─────────────────────────────────────────────────────────────────────

/** Fetches all seller profiles */
export function useAdminSellerProfiles() {
  return useQuery({
    queryKey: ['admin', 'seller-profiles'],
    queryFn: getSellerProfiles,
  });
}

/** Mutation: verify (approve) a seller profile */
export function useVerifySellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => verifySellerProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'seller-profiles'] });
    },
  });
}

/** Mutation: reject a seller profile */
export function useRejectSellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectSellerProfile(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'seller-profiles'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 11 — Verifications / KYC
// ─────────────────────────────────────────────────────────────────────

/** Fetches all pending KYC verifications */
export function useAdminVerifications() {
  return useQuery({
    queryKey: ['admin', 'verifications'],
    queryFn: getPendingVerifications,
  });
}

/** Fetches a single verification by ID. Disabled when verificationId is undefined. */
export function useAdminVerification(verificationId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'verifications', verificationId],
    queryFn: () => getVerificationById(verificationId!),
    enabled: !!verificationId,
  });
}

/** Mutation: approve a KYC verification */
export function useApproveVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (verificationId: string) => approveVerification(verificationId),
    onSuccess: (_, verificationId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications', verificationId] });
    },
  });
}

/** Mutation: reject a KYC verification with reason + rejectionCode */
export function useRejectVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ verificationId, data }: { verificationId: string; data: RejectVerificationRequest }) =>
      rejectVerification(verificationId, data),
    onSuccess: (_, { verificationId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verifications', verificationId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 12 — Terms Documents
// ─────────────────────────────────────────────────────────────────────

/** Fetches all terms documents. Filter by type, isActive. */
export function useAdminTerms(params: GetTermsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'terms', params],
    queryFn: () => getTermsDocuments(params),
  });
}

/** Mutation: create a new terms document via mediaUploadId */
export function useCreateTermsDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTermsDocumentRequest) => createTermsDocument(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'terms'] });
    },
  });
}

/** Mutation: activate a specific terms document version */
export function useActivateTermsDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateTermsDocument(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'terms'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 13 — Payments: Summary
// ─────────────────────────────────────────────────────────────────────

/** Fetches payment summary stats. Optionally filter by date range { from, to }. */
export function useAdminPaymentSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['admin', 'payments', 'summary', params ?? {}],
    queryFn: () => getPaymentSummary(params),
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 14 — Payments: Transactions
// ─────────────────────────────────────────────────────────────────────

/** Fetches paginated transactions. Filter by Status, Type, UserId, OrderId. */
export function useAdminTransactions(params: GetTransactionsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'payments', 'transactions', params],
    queryFn: () => getTransactions(params),
    placeholderData: (prev) => prev,
  });
}

/** Fetches a single transaction by ID. Disabled when transactionId is undefined. */
export function useAdminTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'payments', 'transactions', transactionId],
    queryFn: () => getTransactionById(transactionId!),
    enabled: !!transactionId,
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 15 — Payments: Escrows
// ─────────────────────────────────────────────────────────────────────

/** Fetches paginated escrow list. Filter by Status, OrderId, BuyerId, SellerId. */
export function useAdminEscrows(params: GetEscrowsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'payments', 'escrows', params],
    queryFn: () => getEscrows(params),
    placeholderData: (prev) => prev,
  });
}

/** Fetches detailed escrow by ID. Disabled when escrowId is undefined. */
export function useAdminEscrow(escrowId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'payments', 'escrows', escrowId],
    queryFn: () => getEscrowById(escrowId!),
    enabled: !!escrowId,
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 16 — Payments: Withdrawals
// ─────────────────────────────────────────────────────────────────────

/** Fetches paginated withdrawal requests. Filter by Status, UserId. */
export function useAdminWithdrawals(params: GetWithdrawalsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'payments', 'withdrawals', params],
    queryFn: () => getWithdrawals(params),
    placeholderData: (prev) => prev,
  });
}

/** Fetches a single withdrawal with full detail. Disabled when withdrawalId is undefined. */
export function useAdminWithdrawal(withdrawalId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'payments', 'withdrawals', withdrawalId],
    queryFn: () => getWithdrawalById(withdrawalId!),
    enabled: !!withdrawalId,
  });
}

/** Mutation: approve a withdrawal request */
export function useApproveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (withdrawalId: string) => approveWithdrawal(withdrawalId),
    onSuccess: (_, withdrawalId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'withdrawals'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'withdrawals', withdrawalId] });
    },
  });
}

/** Mutation: reject a withdrawal request with a reason */
export function useRejectWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ withdrawalId, data }: { withdrawalId: string; data: RejectWithdrawalRequest }) =>
      rejectWithdrawal(withdrawalId, data),
    onSuccess: (_, { withdrawalId }) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'withdrawals'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'withdrawals', withdrawalId] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 17 — Auction Admin Actions
// ─────────────────────────────────────────────────────────────────────

/** Mutation: flag an auction with a monitoring alert */
export function useFlagAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ auctionId, data }: { auctionId: string; data: FlagAuctionRequest }) =>
      flagAuction(auctionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring-alerts'] });
    },
  });
}

/** Mutation: cancel an invalid bid in an auction */
export function useCancelInvalidBid() {
  return useMutation({
    mutationFn: ({ auctionId, bidId, data }: { auctionId: string; bidId: string; data: CancelInvalidBidRequest }) =>
      cancelInvalidBid(auctionId, bidId, data),
  });
}

/** Mutation: set curation metadata on an auction (featured, priority, assigned admin) */
export function useSetAuctionCuration() {
  return useMutation({
    mutationFn: ({ auctionId, data }: { auctionId: string; data: SetAuctionCurationRequest }) =>
      setAuctionCuration(auctionId, data),
  });
}

/** Mutation: trigger an emergency on an auction */
export function useTriggerAuctionEmergency() {
  return useMutation({
    mutationFn: ({ auctionId, data }: { auctionId: string; data: TriggerAuctionEmergencyRequest }) =>
      triggerAuctionEmergency(auctionId, data),
  });
}

/** Mutation: resolve an existing auction emergency */
export function useResolveAuctionEmergency() {
  return useMutation({
    mutationFn: ({
      auctionId,
      emergencyId,
      data,
    }: {
      auctionId: string;
      emergencyId: string;
      data: ResolveAuctionEmergencyRequest;
    }) => resolveAuctionEmergency(auctionId, emergencyId, data),
  });
}

/** Mutation: reveal a sealed bid in a sealed-bid auction */
export function useRevealSealedBid() {
  return useMutation({
    mutationFn: ({ auctionId, sealedBidId }: { auctionId: string; sealedBidId: string }) =>
      revealSealedBid(auctionId, sealedBidId),
  });
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 18 — Disputes
// ─────────────────────────────────────────────────────────────────────

/** Mutation: resolve a dispute */
export function useResolveDispute() {
  return useMutation({
    mutationFn: ({ disputeId, data }: { disputeId: string; data: ResolveDisputeRequest }) =>
      resolveDispute(disputeId, data),
  });
}