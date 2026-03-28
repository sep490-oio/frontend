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
  Active: 'active',
  Outbid: 'outbid',
  Winning: 'winning',
  Won: 'won',
  Cancelled: 'cancelled',
} as const
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus]

export const AutoBidStatus = {
  Active: 'active',
  Paused: 'paused',
  Exhausted: 'exhausted',
  Won: 'won',
  Outbid: 'outbid',
} as const
export type AutoBidStatus = (typeof AutoBidStatus)[keyof typeof AutoBidStatus]

export const SealedBidStatus = {
  Submitted: 'submitted',
  Revealed: 'revealed',
  Invalidated: 'invalidated',
  Withdrawn: 'withdrawn',
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
  Verified: 'verified',
  Rejected: 'rejected',
  Suspended: 'suspended',
} as const
export type SellerProfileStatus = (typeof SellerProfileStatus)[keyof typeof SellerProfileStatus]

export const VerificationType = {
  GovernmentId: 'government_id',
  Passport: 'passport',
  BusinessOwner: 'business_owner',
  Manual: 'manual',
} as const
export type VerificationType = (typeof VerificationType)[keyof typeof VerificationType]

export const VerificationDocumentType = {
  IdFront: 'id_front',
  IdBack: 'id_back',
  Selfie: 'selfie',
  SelfieWithId: 'selfie_with_id',
  BusinessLicense: 'business_license',
  BankStatement: 'bank_statement',
  Other: 'other',
} as const
export type VerificationDocumentType = (typeof VerificationDocumentType)[keyof typeof VerificationDocumentType]

export const IdentityVerificationStatus = {
  Pending: 'pending',
  Submitted: 'submitted',
  UnderReview: 'under_review',
  Approved: 'approved',
  Rejected: 'rejected',
  Expired: 'expired',
  Suspended: 'suspended',
  Cancelled: 'cancelled',
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
  ReturnInTransit: 'return_in_transit',
  SellerReceived: 'seller_received',
  BuyerFollowup: 'buyer_followup',
  Resolved: 'resolved',
  Cancelled: 'cancelled',
} as const
export type OrderReturnStatus = (typeof OrderReturnStatus)[keyof typeof OrderReturnStatus]

// Payment
export const PaymentMethodType = {
  CreditCard: 'credit_card',
  DebitCard: 'debit_card',
  BankAccount: 'bank_account',
  EWallet: 'e_wallet',
  VnPay: 'vnpay',
} as const
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType]

export const TransactionStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Refunded: 'refunded',
} as const
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]

export const WalletTransactionType = {
  Credit: 'credit',
  Debit: 'debit',
  Hold: 'hold',
  Release: 'release',
} as const
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType]

export const WithdrawalStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Processing: 'processing',
  Completed: 'completed',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
} as const
export type WithdrawalStatus = (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus]

export const EscrowStatus = {
  Holding: 'holding',
  ReleasedToSeller: 'released_to_seller',
  Disputed: 'disputed',
  RefundedToBuyer: 'refunded_to_buyer',
} as const
export type EscrowStatus = (typeof EscrowStatus)[keyof typeof EscrowStatus]

// Moderation
export const ReportStatus = {
  Open: 'open',
  UnderReview: 'under_review',
  ActionTaken: 'action_taken',
  Dismissed: 'dismissed',
  Closed: 'closed',
} as const
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export const DisputeStatus = {
  Draft: 'draft',
  Open: 'open',
  UnderReview: 'under_review',
  AwaitingResponse: 'awaiting_response',
  Escalated: 'escalated',
  Resolved: 'resolved',
  Closed: 'closed',
  Cancelled: 'cancelled',
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
  Open: 'open',
  Acknowledged: 'acknowledged',
  Resolved: 'resolved',
  Ignored: 'ignored',
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
  Deleted: 'deleted',
} as const
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus]

// Warehouse
export const ShipmentStatus = {
  AwaitingPickup: 'awaiting_pickup',
  InTransit: 'in_transit',
  Arrived: 'arrived',
  Inspected: 'inspected',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Failed: 'failed',
} as const
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus]

// Address
export const AddressType = {
  Home: 'home',
  Work: 'work',
  Other: 'other',
} as const
export type AddressType = (typeof AddressType)[keyof typeof AddressType]

// Participant Qualification (server-sourced, replaces localStorage)
export const ParticipantQualificationStatus = {
  Pending: 'pending',
  Qualified: 'qualified',
  Rejected: 'rejected',
  Expired: 'expired',
  Waived: 'waived',
} as const
export type ParticipantQualificationStatus = (typeof ParticipantQualificationStatus)[keyof typeof ParticipantQualificationStatus]

// Deposit Status
export const DepositStatus = {
  Held: 'held',
  Returned: 'returned',
  Forfeited: 'forfeited',
  ConvertedToPayment: 'converted_to_payment',
} as const
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus]

// Buy Now Reservation
export const BuyNowReservationStatus = {
  PendingPayment: 'pending_payment',
  Paid: 'paid',
  Expired: 'expired',
  Cancelled: 'cancelled',
  Failed: 'failed',
} as const
export type BuyNowReservationStatus = (typeof BuyNowReservationStatus)[keyof typeof BuyNowReservationStatus]

// Winner Offer (runner-up flow)
export const WinnerOfferStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Declined: 'declined',
  Expired: 'expired',
  Cancelled: 'cancelled',
} as const
export type WinnerOfferStatus = (typeof WinnerOfferStatus)[keyof typeof WinnerOfferStatus]

// Participant Join Status
export const ParticipantJoinStatus = {
  Invited: 'invited',
  Requested: 'requested',
  Joined: 'joined',
  Withdrawn: 'withdrawn',
  Rejected: 'rejected',
} as const
export type ParticipantJoinStatus = (typeof ParticipantJoinStatus)[keyof typeof ParticipantJoinStatus]
