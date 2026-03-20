/**
 * Admin Service — full coverage of all 53 admin endpoints.
 *
 * Original 16 (users, roles, permissions, settings) +
 * New 40 across: auctions, disputes, items, monitoring-alerts,
 * payments, reports, seller-profiles, terms, risk-flags, verifications.
 */
import { api } from './api';

// ─── Shared ──────────────────────────────────────────────────────────

export interface Metadata {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PagedList<T> {
  items: T[] | null;
  metadata: Metadata;
}

// ─── User Types ───────────────────────────────────────────────────────

export interface UserProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface UserDto {
  id: string;
  userName?: string | null;
  email?: string | null;
  emailConfirmed: boolean;
  phoneNumber?: string | null;
  countryCode?: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  twoFactorProvider?: string | null;
  status?: string | null;
  createdAt: string;
  profile?: UserProfileDto | null;
}

export interface UserListItemDto {
  id: string;
  userName?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
  emailConfirmed: boolean;
  roles?: string[] | null;
  createdAt: string;
}

export interface GetUsersParams {
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ChangeUserStatusRequest { status?: string | null; }

export interface FlagUserRequest {
  flagType?: string | null;
  reason?: string | null;
  severity?: string | null;
}

export interface UserRiskFlagDto {
  id: string;
  userId?: string | null;
  flagType?: string | null;
  reason?: string | null;
  severity?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

// ─── Role & Permission Types ──────────────────────────────────────────

export interface RoleDto {
  name?: string | null;
  permissions?: string[] | null;
}

export interface TogglePermissionFromRoleRequest { isActive: boolean; }

export interface GetPermissionsParams {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ─── Settings Types ───────────────────────────────────────────────────

export interface SystemSettingDto {
  key?: string | null;
  value?: unknown;
  valueType?: string | null;
  description?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
  modifiedBy?: string | null;
}

export interface UpdateSystemSettingRequest {
  key?: string | null;
  value?: string | null;
}

// ─── Auction Admin Types ──────────────────────────────────────────────

export interface FlagAuctionRequest {
  alertType?: string | null;
  severity?: string | null;
  payload?: unknown;
}

export interface CancelInvalidBidRequest { reason?: string | null; }

export interface SetAuctionCurationRequest {
  assignedAdminId?: string | null;
  clearAssignedAdmin?: boolean;
  priority?: string | null;
  priorityReason?: string | null;
  isFeatured?: boolean;
}

export interface TriggerAuctionEmergencyRequest {
  triggerSource?: string | null;
  reason?: string | null;
  payload?: unknown;
}

export interface ResolveAuctionEmergencyRequest {
  status?: string | null;
  payload?: unknown;
}

export interface BidDto {
  id: string;
  auctionId: string;
  bidderId: string;
  amount?: number;
  status?: string | null;
  createdAt: string;
}

// ─── Monitoring Alert Types ───────────────────────────────────────────

export interface MonitoringAlertDto {
  id: string;
  entityType?: string | null;
  entityId?: string | null;
  alertType?: string | null;
  severity?: string | null;
  payload?: unknown;
  status?: string | null;
  notes?: string | null;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface GetMonitoringAlertsParams {
  status?: string;
  entityType?: string;
  entityId?: string;
}

export interface AcknowledgeMonitoringAlertRequest { notes?: string | null; }
export interface ResolveMonitoringAlertRequest { ignored?: boolean; notes?: string | null; }

// ─── Dispute Types ────────────────────────────────────────────────────

export interface ResolveDisputeRequest {
  resolutionType?: string | null;
  notes?: string | null;
  amount?: number | null;
}

// ─── Item Review Types ────────────────────────────────────────────────

export interface ItemReviewQueueParams {
  Status?: string;
  AssignedAdminId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface AssignItemReviewerRequest { adminId?: string | null; }
export interface RejectItemRequest { reason?: string | null; }

// ─── Payment Types ────────────────────────────────────────────────────

export interface PaymentSummaryDto {
  completedPayments?: number;
  failedPayments?: number;
  walletTopUps?: number;
  withdrawalPendingCount?: number;
  holdingEscrowCount?: number;
  releasedEscrowTotal?: number;
  refundedEscrowTotal?: number;
}

export interface PaymentTransactionDto {
  id: string;
  transactionNumber?: string | null;
  userId?: string | null;
  orderId?: string | null;
  type?: string | null;
  amount?: number;
  fee?: number;
  netAmount?: number;
  currency?: string | null;
  status?: string | null;
  gatewayProvider?: string | null;
  description?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface GetTransactionsParams {
  Status?: string;
  Type?: string;
  UserId?: string;
  OrderId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface EscrowDto {
  id: string;
  orderId?: string | null;
  buyerId?: string | null;
  sellerId?: string | null;
  amount?: number;
  currency?: string | null;
  status?: string | null;
  holdTransactionId?: string | null;
  createdAt: string;
  releasedAt?: string | null;
  refundedAt?: string | null;
}

export interface EscrowDetailDto extends EscrowDto {
  releaseTransactionId?: string | null;
  releasedTo?: string | null;
  releaseEvents?: unknown[];
}

export interface GetEscrowsParams {
  Status?: string;
  OrderId?: string;
  BuyerId?: string;
  SellerId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface WithdrawalRequestDto {
  id: string;
  userId?: string | null;
  amount?: number;
  fee?: number;
  netAmount?: number;
  status?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  createdAt: string;
}

export interface AdminWithdrawalRequestDetailDto extends WithdrawalRequestDto {
  walletId?: string | null;
  rejectionReason?: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
}

export interface GetWithdrawalsParams {
  Status?: string;
  UserId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface RejectWithdrawalRequest { reason?: string | null; }

// ─── Report Types ─────────────────────────────────────────────────────

export interface ReportDto {
  id: string;
  reporterId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  reasonCode?: string | null;
  description?: string | null;
  status?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
}

export interface GetReportsParams {
  status?: string;
  entityType?: string;
  entityId?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface AssignReportRequest { assignedToUserId?: string | null; }
export interface EscalateReportEmergencyRequest { reasonOverride?: string | null; }
export interface ResolveReportRequest { dismissed?: boolean; resolutionNotes?: string | null; }

// ─── Seller Profile Types ─────────────────────────────────────────────

export interface SellerProfileDto {
  id: string;
  storeName?: string | null;
  storeDescription?: string | null;
  status?: string | null;
  verifiedAt?: string | null;
  totalSalesCount?: number;
  totalSalesAmount?: number;
  createdAt: string;
  modifiedAt?: string | null;
}

// ─── Terms Types ──────────────────────────────────────────────────────

export interface TermsDocumentDto {
  id: string;
  type?: string | null;
  version?: string | null;
  isActive: boolean;
  publishedAt?: string | null;
  createdAt: string;
  contentUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface CreateTermsDocumentRequest {
  type?: string | null;
  mediaUploadId?: string | null;
}

export interface GetTermsParams { type?: string; isActive?: boolean; }

// ─── Verification Types ───────────────────────────────────────────────

export interface VerificationDto {
  id: string;
  userId?: string | null;
  verificationType?: string | null;
  status?: string | null;
  createdAt: string;
  [key: string]: unknown;
}

export interface RejectVerificationRequest {
  reason?: string | null;
  rejectionCode?: string | null;
}

// ═════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═════════════════════════════════════════════════════════════════════

// ── Users ─────────────────────────────────────────────────────────────

export async function getUsers(params: GetUsersParams = {}): Promise<PagedList<UserListItemDto>> {
  const response = await api.get<PagedList<UserListItemDto>>('/api/admin/users', {
    params: {
      Search: params.search,
      Status: params.status,
      Role: params.role,
      SortBy: params.sortBy,
      PageNumber: params.pageNumber,
      PageSize: params.pageSize,
    },
  });
  return response.data;
}

export async function getUserById(userId: string): Promise<UserDto> {
  const response = await api.get<UserDto>(`/api/admin/users/${userId}`);
  return response.data;
}

export async function removeUser(userId: string): Promise<void> {
  await api.delete(`/api/admin/users/${userId}`);
}

export async function changeUserStatus(userId: string, data: ChangeUserStatusRequest): Promise<void> {
  await api.patch(`/api/admin/users/${userId}/status`, data);
}

export async function unlockUser(userId: string): Promise<void> {
  await api.patch(`/api/admin/users/${userId}/unlock`);
}

export async function assignRole(userId: string, role: string): Promise<void> {
  await api.post(`/api/admin/users/${userId}/roles/${role}`);
}

export async function revokeRole(userId: string, role: string): Promise<void> {
  await api.delete(`/api/admin/users/${userId}/roles/${role}`);
}

export async function grantPermission(userId: string, permission: string): Promise<void> {
  await api.post(`/api/admin/users/${userId}/permissions/${permission}`);
}

export async function denyPermission(userId: string, permission: string): Promise<void> {
  await api.put(`/api/admin/users/${userId}/permissions/${permission}`);
}

export async function revokePermission(userId: string, permission: string): Promise<void> {
  await api.delete(`/api/admin/users/${userId}/permissions/${permission}`);
}

export async function flagUser(userId: string, data: FlagUserRequest): Promise<UserRiskFlagDto> {
  const response = await api.post<UserRiskFlagDto>(`/api/admin/users/${userId}/risk-flags`, data);
  return response.data;
}

// ── Roles & Permissions ───────────────────────────────────────────────

export async function getRoles(): Promise<RoleDto[]> {
  const response = await api.get('/api/admin/roles');
  const data = response.data;
  if (Array.isArray(data)) return data as RoleDto[];
  if (data?.items && Array.isArray(data.items)) return data.items as RoleDto[];
  return [];
}

export async function togglePermissionOnRole(
  role: string, permission: string, data: TogglePermissionFromRoleRequest
): Promise<void> {
  await api.put(`/api/admin/roles/${role}/permissions/${permission}`, data);
}

export async function getPermissions(params: GetPermissionsParams = {}): Promise<PagedList<string>> {
  const response = await api.get<PagedList<string>>('/api/admin/permissions', {
    params: { Search: params.search, PageNumber: params.pageNumber, PageSize: params.pageSize },
  });
  return response.data;
}

// ── Settings ──────────────────────────────────────────────────────────

export async function getAllSettings(): Promise<SystemSettingDto[]> {
  const response = await api.get<SystemSettingDto[]>('/api/admin/settings');
  return response.data;
}

export async function getSettingByKey(key: string): Promise<SystemSettingDto> {
  const response = await api.get<SystemSettingDto>(`/api/admin/settings/${key}`);
  return response.data;
}

export async function updateSetting(key: string, data: UpdateSystemSettingRequest): Promise<void> {
  await api.put(`/api/admin/settings/${key}`, data);
}

// ── Auction Admin ─────────────────────────────────────────────────────

export async function flagAuction(auctionId: string, data: FlagAuctionRequest): Promise<MonitoringAlertDto> {
  const response = await api.post<MonitoringAlertDto>(`/api/admin/auctions/${auctionId}/alerts`, data);
  return response.data;
}

export async function cancelInvalidBid(auctionId: string, bidId: string, data: CancelInvalidBidRequest): Promise<BidDto> {
  const response = await api.post<BidDto>(`/api/admin/auctions/${auctionId}/bids/${bidId}/cancel`, data);
  return response.data;
}

export async function setAuctionCuration(auctionId: string, data: SetAuctionCurationRequest): Promise<void> {
  await api.put(`/api/admin/auctions/${auctionId}/curation`, data);
}

export async function triggerAuctionEmergency(auctionId: string, data: TriggerAuctionEmergencyRequest): Promise<void> {
  await api.post(`/api/admin/auctions/${auctionId}/emergencies`, data);
}

export async function resolveAuctionEmergency(
  auctionId: string, emergencyId: string, data: ResolveAuctionEmergencyRequest
): Promise<void> {
  await api.post(`/api/admin/auctions/${auctionId}/emergencies/${emergencyId}/resolve`, data);
}

export async function revealSealedBid(auctionId: string, sealedBidId: string): Promise<void> {
  await api.post(`/api/admin/auctions/${auctionId}/sealed-bids/${sealedBidId}/reveal`);
}

// ── Disputes ──────────────────────────────────────────────────────────

export async function resolveDispute(disputeId: string, data: ResolveDisputeRequest): Promise<void> {
  await api.post(`/api/admin/disputes/${disputeId}/resolve`, data);
}

// ── Item Review Queue ─────────────────────────────────────────────────

export async function getItemReviewQueue(params: ItemReviewQueueParams = {}): Promise<PagedList<unknown>> {
  const response = await api.get<PagedList<unknown>>('/api/admin/items/review-queue', { params });
  return response.data;
}

export async function getAdminItemDetail(itemId: string): Promise<unknown> {
  const response = await api.get(`/api/admin/items/${itemId}`);
  return response.data;
}

export async function approveItem(itemId: string): Promise<void> {
  await api.post(`/api/admin/items/${itemId}/approve`);
}

export async function assignItemReviewer(itemId: string, data: AssignItemReviewerRequest): Promise<void> {
  await api.post(`/api/admin/items/${itemId}/assign`, data);
}

export async function rejectItem(itemId: string, data: RejectItemRequest): Promise<void> {
  await api.post(`/api/admin/items/${itemId}/reject`, data);
}

export async function getItemReviewHistory(itemId: string): Promise<unknown[]> {
  const response = await api.get(`/api/admin/items/${itemId}/reviews`);
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}

// ── Monitoring Alerts ─────────────────────────────────────────────────

export async function getMonitoringAlerts(params: GetMonitoringAlertsParams = {}): Promise<MonitoringAlertDto[]> {
  const response = await api.get('/api/admin/monitoring-alerts', { params });
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}

export async function acknowledgeMonitoringAlert(
  alertId: string, data: AcknowledgeMonitoringAlertRequest
): Promise<MonitoringAlertDto> {
  const response = await api.post<MonitoringAlertDto>(`/api/admin/monitoring-alerts/${alertId}/acknowledge`, data);
  return response.data;
}

export async function resolveMonitoringAlert(
  alertId: string, data: ResolveMonitoringAlertRequest
): Promise<MonitoringAlertDto> {
  const response = await api.post<MonitoringAlertDto>(`/api/admin/monitoring-alerts/${alertId}/resolve`, data);
  return response.data;
}

// ── Payments ──────────────────────────────────────────────────────────

export async function getPaymentSummary(params?: { from?: string; to?: string }): Promise<PaymentSummaryDto> {
  const response = await api.get<PaymentSummaryDto>('/api/admin/payments/summary', { params });
  return response.data;
}

export async function getTransactions(params: GetTransactionsParams = {}): Promise<PagedList<PaymentTransactionDto>> {
  const response = await api.get<PagedList<PaymentTransactionDto>>('/api/admin/payments/transactions', { params });
  return response.data;
}

export async function getTransactionById(transactionId: string): Promise<PaymentTransactionDto> {
  const response = await api.get<PaymentTransactionDto>(`/api/admin/payments/transactions/${transactionId}`);
  return response.data;
}

export async function getEscrows(params: GetEscrowsParams = {}): Promise<PagedList<EscrowDto>> {
  const response = await api.get<PagedList<EscrowDto>>('/api/admin/payments/escrows', { params });
  return response.data;
}

export async function getEscrowById(escrowId: string): Promise<EscrowDetailDto> {
  const response = await api.get<EscrowDetailDto>(`/api/admin/payments/escrows/${escrowId}`);
  return response.data;
}

export async function getWithdrawals(params: GetWithdrawalsParams = {}): Promise<PagedList<WithdrawalRequestDto>> {
  const response = await api.get<PagedList<WithdrawalRequestDto>>('/api/admin/payments/withdrawals', { params });
  return response.data;
}

export async function getWithdrawalById(withdrawalId: string): Promise<AdminWithdrawalRequestDetailDto> {
  const response = await api.get<AdminWithdrawalRequestDetailDto>(`/api/admin/payments/withdrawals/${withdrawalId}`);
  return response.data;
}

export async function approveWithdrawal(withdrawalId: string): Promise<void> {
  await api.post(`/api/admin/payments/withdrawals/${withdrawalId}/approve`);
}

export async function rejectWithdrawal(withdrawalId: string, data: RejectWithdrawalRequest): Promise<void> {
  await api.post(`/api/admin/payments/withdrawals/${withdrawalId}/reject`, data);
}

// ── Reports ───────────────────────────────────────────────────────────

export async function getReports(params: GetReportsParams = {}): Promise<PagedList<ReportDto>> {
  const response = await api.get<PagedList<ReportDto>>('/api/admin/reports', { params });
  return response.data;
}

export async function assignReport(reportId: string, data: AssignReportRequest): Promise<ReportDto> {
  const response = await api.post<ReportDto>(`/api/admin/reports/${reportId}/assign`, data);
  return response.data;
}

export async function escalateReportEmergency(reportId: string, data: EscalateReportEmergencyRequest): Promise<ReportDto> {
  const response = await api.post<ReportDto>(`/api/admin/reports/${reportId}/escalate-emergency`, data);
  return response.data;
}

export async function resolveReport(reportId: string, data: ResolveReportRequest): Promise<ReportDto> {
  const response = await api.post<ReportDto>(`/api/admin/reports/${reportId}/resolve`, data);
  return response.data;
}

// ── Seller Profiles ───────────────────────────────────────────────────

export async function getSellerProfiles(): Promise<SellerProfileDto[]> {
  const response = await api.get('/api/admin/seller-profiles');
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}

export async function verifySellerProfile(id: string): Promise<void> {
  await api.post(`/api/admin/seller-profiles/${id}/verify`);
}

export async function rejectSellerProfile(id: string): Promise<void> {
  await api.post(`/api/admin/seller-profiles/${id}/reject`);
}

// ── Terms Documents ───────────────────────────────────────────────────

export async function getTermsDocuments(params: GetTermsParams = {}): Promise<TermsDocumentDto[]> {
  const response = await api.get('/api/admin/terms', { params });
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}

export async function createTermsDocument(data: CreateTermsDocumentRequest): Promise<TermsDocumentDto> {
  const response = await api.post<TermsDocumentDto>('/api/admin/terms', data);
  return response.data;
}

export async function activateTermsDocument(id: string): Promise<void> {
  await api.put(`/api/admin/terms/${id}/activate`);
}

// ── Verifications / KYC ───────────────────────────────────────────────

export async function getPendingVerifications(): Promise<VerificationDto[]> {
  const response = await api.get('/api/admin/verifications');
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}

export async function getVerificationById(verificationId: string): Promise<VerificationDto> {
  const response = await api.get<VerificationDto>(`/api/admin/verifications/${verificationId}`);
  return response.data;
}

export async function approveVerification(verificationId: string): Promise<void> {
  await api.post(`/api/admin/verifications/${verificationId}/approve`);
}

export async function rejectVerification(verificationId: string, data: RejectVerificationRequest): Promise<void> {
  await api.post(`/api/admin/verifications/${verificationId}/reject`, data);
}