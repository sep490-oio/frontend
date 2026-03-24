// Auction
export const AuctionStatus = {
  Draft: 'draft',
  Pending: 'pending',
  Approved: 'approved',
  Scheduled: 'scheduled',
  Active: 'active',
  Ended: 'ended',
  Sold: 'sold',
  PaymentDefaulted: 'payment_defaulted',
  Cancelled: 'cancelled',
  Failed: 'failed',
  Terminated: 'terminated',
} as const
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus]

export const AuctionType = {
  Regular: 'regular',
  Sealed: 'sealed',
} as const
export type AuctionType = (typeof AuctionType)[keyof typeof AuctionType]

export const BidStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
  Retracted: 'retracted',
} as const
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus]

export const AutoBidStatus = {
  Active: 'active',
  Paused: 'paused',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const
export type AutoBidStatus = (typeof AutoBidStatus)[keyof typeof AutoBidStatus]

export const SealedBidStatus = {
  Submitted: 'submitted',
  Revealed: 'revealed',
  Invalid: 'invalid',
  Expired: 'expired',
} as const
export type SealedBidStatus = (typeof SealedBidStatus)[keyof typeof SealedBidStatus]

// User
export const UserStatus = {
  Active: 'active',
  Inactive: 'inactive',
  Locked: 'locked',
  Banned: 'banned',
  Suspended: 'suspended',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const SellerProfileStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Suspended: 'suspended',
} as const
export type SellerProfileStatus = (typeof SellerProfileStatus)[keyof typeof SellerProfileStatus]

export const VerificationType = {
  Identity: 'identity',
  Business: 'business',
  BankAccount: 'bank_account',
} as const
export type VerificationType = (typeof VerificationType)[keyof typeof VerificationType]

export const VerificationDocumentType = {
  Passport: 'passport',
  NationalId: 'national_id',
  DriverLicense: 'driver_license',
  BusinessRegistration: 'business_registration',
} as const
export type VerificationDocumentType = (typeof VerificationDocumentType)[keyof typeof VerificationDocumentType]

export const IdentityVerificationStatus = {
  Unverified: 'unverified',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const
export type IdentityVerificationStatus = (typeof IdentityVerificationStatus)[keyof typeof IdentityVerificationStatus]

export const Gender = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
} as const
export type Gender = (typeof Gender)[keyof typeof Gender]

// Order
export const OrderStatus = {
  PendingPayment: 'pending_payment',
  Paid: 'paid',
  Processing: 'processing',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
  Disputed: 'disputed',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderReturnStatus = {
  Requested: 'requested',
  Approved: 'approved',
  Rejected: 'rejected',
  Shipped: 'shipped',
  Received: 'received',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const
export type OrderReturnStatus = (typeof OrderReturnStatus)[keyof typeof OrderReturnStatus]

// Payment
export const PaymentMethodType = {
  Card: 'card',
  Wallet: 'wallet',
  BankTransfer: 'bank_transfer',
  VnPay: 'vnpay',
} as const
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType]

export const TransactionStatus = {
  Pending: 'pending',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Processing: 'processing',
} as const
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]

export const WalletTransactionType = {
  Credit: 'credit',
  Debit: 'debit',
  Refund: 'refund',
  Fee: 'fee',
} as const
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType]

export const WithdrawalStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus]

export const EscrowStatus = {
  Held: 'held',
  Released: 'released',
  Disputed: 'disputed',
  Refunded: 'refunded',
} as const
export type EscrowStatus = (typeof EscrowStatus)[keyof typeof EscrowStatus]

// Moderation
export const ReportStatus = {
  Open: 'open',
  Assigned: 'assigned',
  InProgress: 'in_progress',
  Resolved: 'resolved',
  Closed: 'closed',
} as const
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export const DisputeStatus = {
  Open: 'open',
  Assigned: 'assigned',
  InProgress: 'in_progress',
  PendingResponse: 'pending_response',
  Resolved: 'resolved',
  Closed: 'closed',
} as const
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus]

export const AlertSeverity = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
} as const
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity]

export const AlertStatus = {
  Active: 'active',
  Acknowledged: 'acknowledged',
  Resolved: 'resolved',
  Closed: 'closed',
} as const
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus]

// Catalog
export const ItemStatus = {
  Draft: 'draft',
  PendingReview: 'pending_review',
  PendingVerify: 'pending_verify',
  PendingConditionConfirmation: 'pending_condition_confirmation',
  Approved: 'approved',
  Active: 'active',
  InAuction: 'in_auction',
  Sold: 'sold',
  Rejected: 'rejected',
  Removed: 'removed',
} as const
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus]

export const ItemCondition = {
  New: 'new',
  LikeNew: 'like_new',
  VeryGood: 'very_good',
  Good: 'good',
  Acceptable: 'acceptable',
} as const
export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition]

// Notification
export const NotificationStatus = {
  Unread: 'unread',
  Read: 'read',
  Archived: 'archived',
} as const
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus]

// Warehouse
export const ShipmentStatus = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  InTransit: 'in_transit',
  Arrived: 'arrived',
  Stored: 'stored',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
} as const
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus]

// Address
export const AddressType = {
  Home: 'home',
  Work: 'work',
} as const
export type AddressType = (typeof AddressType)[keyof typeof AddressType]
