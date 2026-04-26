import type { AuctionStatus, AuctionType, AutoBidStatus, BidStatus, SealedBidStatus, ParticipantQualificationStatus, DepositStatus, ParticipantJoinStatus } from './enums'
import type { MoneyDto } from './api'

export interface AuctionDto {
  id: string
  itemId: string
  sellerId: string
  auctionType: AuctionType
  startingPrice: MoneyDto
  reservePrice?: MoneyDto
  buyNowPrice?: MoneyDto
  currentPrice: MoneyDto
  bidIncrement: MoneyDto
  minimumBidAmount: MoneyDto
  isReserveMet: boolean
  hasBuyNow: boolean
  isBuyNowReserved: boolean
  buyNowReservedUntil?: string
  remainingTime?: string
  isEndingSoon: boolean
  currency: string
  startTime?: string
  endTime?: string
  actualEndTime?: string
  status: AuctionStatus
  currentWinnerId?: string
  autoExtend: boolean
  extensionMinutes: number
  extensionCount: number
  isFeatured: boolean
  priority: number
  viewCount: number
  bidCount: number
  watchCount: number
  qualificationStartAt?: string
  qualificationEndAt?: string
  assignedAdminId?: string
  assignedAt?: string
  priorityReason?: string
  verifyByPlatform: boolean
  rejectionCount: number
  createdAt: string
  isOnWatchList?: boolean
}

export interface ParticipantInfoDto {
  qualificationStatus?: ParticipantQualificationStatus
  joinStatus?: ParticipantJoinStatus
  depositStatus?: DepositStatus
  depositAmount?: number
  depositCurrency?: string
}

export interface CurrentUserBidStateDto {
  position: 'leading' | 'outbid' | 'won' | 'lost' | 'none'
  isCurrentWinner: boolean
  latestBidId?: string
  latestBidAmount?: number
  latestBidStatus?: string
  latestBidAt?: string
  hasAutoBid: boolean
  autoBidStatus?: string
}

export interface CurrentBuyerOrderDto {
  orderId: string
  orderStatus: string
  canPayNow: boolean
}

export interface SealedBidInfoDto {
  sealedBidCount: number
  currentUserHasSubmittedSealedBid: boolean
  currentUserSealedBidStatus?: string | null
}

export interface AuctionDetailDto {
  auction: AuctionDto
  item: AuctionItemDto
  recentBids: BidDto[]
  priceHistory: PriceHistoryPoint[]
  isWatched?: boolean
  isOnWatchList?: boolean
  currentUserParticipant?: ParticipantInfoDto
  currentUserBidState?: CurrentUserBidStateDto
  currentBuyerOrder?: CurrentBuyerOrderDto
  sealedBidInfo?: SealedBidInfoDto | null
}

export interface AuctionItemDto {
  id: string
  sellerId: string
  categoryId?: string
  title: string
  description?: string
  condition: string
  status: string
  quantity: number
  images: AuctionItemMediaDto[]
  createdAt: string
}

export interface AuctionItemMediaDto {
  url: string
  thumbnailUrl?: string
  isPrimary: boolean
}

export interface AuctionListItemDto {
  id: string
  itemTitle: string
  primaryImageUrl?: string
  currentPrice: MoneyDto
  startingPrice: MoneyDto
  buyNowPrice?: MoneyDto
  isBuyNowReserved: boolean
  buyNowReservedUntil?: string
  currency: string
  status: AuctionStatus
  itemStatus?: string
  auctionType?: AuctionType
  bidCount: number
  watchCount: number
  viewCount: number
  startTime?: string
  endTime?: string
  remainingTime?: string
  isEndingSoon: boolean
  isFeatured: boolean
  sellerId: string
  createdAt: string
  isWatched?: boolean
  hasWatched?: boolean
  isOnWatchList?: boolean
}

export interface BidDto {
  id: string
  auctionId: string
  bidderId: string
  bidderDisplayName?: string
  amount: MoneyDto
  isAutoBid: boolean
  status: BidStatus
  createdAt: string
}

export interface PlaceBidResultDto {
  bid: BidDto
  autoBidsCascaded: number
  finalPrice: number
  wasImmediatelyOutbid: boolean
  /**
   * True when the submitted bid met or exceeded the buy-now ceiling and the
   * auction was settled at the capped buyNowPrice instead of the raw bid.
   */
  triggeredBuyNowCap?: boolean
  /**
   * Populated when eager winner-order provisioning succeeds after a capped
   * buy-now-by-bid. Absent when provisioning is deferred to the background
   * AuctionSoldEvent handler; FE must then fall back to winner-order polling.
   */
  orderId?: string
}

export interface AutoBidDto {
  id: string
  auctionId: string
  bidderId: string
  isEnabled: boolean
  maxAmount: MoneyDto
  currentAmount: MoneyDto
  remainingBudget: MoneyDto
  incrementAmount?: MoneyDto
  status: AutoBidStatus
  totalAutoBids: number
  lastAutoBidAt?: string
  stopReason?: string
  stoppedAt?: string
  lastValidationAt?: string
  createdAt: string
}

export interface SealedBidDto {
  id: string
  auctionId: string
  bidderId: string
  encryptedAmount: string
  status: SealedBidStatus
  createdAt: string
}

export interface WinnerOfferDto {
  offerId: string
  auctionId: string
  auctionTitle: string | null
  offerAmount: number
  currency: string | null
  status: string | null
  expiresAt: string | null
  createdAt: string
}

export interface PriceHistoryPoint {
  timestamp?: string
  recordedAt?: string
  price: number | MoneyDto
  type?: string
  bidId?: string
  bidderDisplayName?: string
}

// SignalR notification types
export interface BidNotification {
  auctionId: string
  bidId: string
  bidderId: string
  bidderDisplayName: string
  bidderName?: string
  amount: number
  currency?: string
  currentPrice: number
  minimumNextBid: number
  totalBids: number
  bidCount?: number
  isAutoBid: boolean
  timestamp: string
}

export interface OutbidNotification {
  auctionId: string
  newHighAmount: number
  newAmount?: number
  minimumNextBid: number
  newHighBidderDisplayName: string
  currency?: string
}

export interface AuctionStartedNotification {
  auctionId: string
  startTime: string
  endTime: string
}

export interface AuctionEndedNotification {
  auctionId: string
  winnerId?: string
  winnerDisplayName?: string
  winnerName?: string
  finalPrice: number
  totalBids: number
  reserveMet: boolean
  currency?: string
}

export interface AuctionExtendedNotification {
  auctionId: string
  newEndTime: string
  extensionMinutes: number
  extensionCount?: number
}

export interface AuctionCancelledNotification {
  auctionId: string
  reason: string
}

export interface PriceUpdateNotification {
  auctionId: string
  currentPrice: number
  minimumNextBid: number
  totalBids: number
  remainingTime: string
  currency?: string
}

export interface AuctionStateLastBidInfo {
  bidId: string
  bidderId: string
  bidderDisplayName: string
  amount: number
  isAutoBid: boolean
  timestamp: string
}

export interface AuctionStatePriceHistoryPoint {
  price: number
  type: string
  bidId?: string
  bidderDisplayName?: string
  recordedAt: string
}

export interface AuctionStateChangedNotification {
  auctionId: string
  status: AuctionStatus | string
  currentPrice: number
  minimumNextBid: number
  currency: string
  bidCount: number
  endTime: string
  winnerId?: string
  isBuyNowReserved: boolean
  buyNowReservedUntil?: string | null
  autoExtend: boolean
  extensionMinutes: number
  extensionCount: number
  isEndingSoon: boolean
  lastBid?: AuctionStateLastBidInfo
  newPriceHistoryPoint?: AuctionStatePriceHistoryPoint
  serverTimestamp: string
  versionTimestamp: string
}

export interface BuyNowReservedNotification {
  auctionId: string
  reservationId: string
  buyerId: string
  buyNowPrice: number
  depositAppliedAmount: number
  amountDue: number
  expiresAt: string
}

export interface BuyNowReservationReleasedNotification {
  auctionId: string
  reservationId: string
  buyerId: string
  reason: string
  releasedAt: string
}

export interface BuyNowNotification {
  auctionId: string
  buyerId: string
  price: number
  currency?: string
}

export interface AuctionPositionChangedNotification {
  auctionId: string
  position: 'leading' | 'outbid' | 'won' | 'lost'
  isCurrentWinner: boolean
  currentPrice: number
  minimumNextBid: number
  currency: string
  latestBidId?: string
  latestBidAmount?: number
  latestBidStatus?: string
  timestamp: string
}

export interface ItemQuestionNotification {
  itemId: string
  questionId: string
  askerId: string
  askerDisplayName: string
  question: string
  answer?: string | null
  isPublic: boolean
  createdAt: string
}

export interface BuyNowReservationDto {
  reservationId: string
  orderId: string
  expiresAt: string
  buyNowPrice: MoneyDto
  depositAppliedAmount: MoneyDto
  amountDue: MoneyDto
}

// Filters
export type AuctionStatusGroup = 'active' | 'scheduled' | 'sold' | 'failed' | ''

export interface AuctionFilterParams {
  search?: string
  categoryId?: string
  status?: AuctionStatus
  /**
   * BE-side status bucket (maps to multiple underlying statuses):
   *  - 'active'    → Active
   *  - 'scheduled' → Scheduled
   *  - 'sold'      → Sold | Completed
   *  - 'failed'    → Failed | Cancelled | Terminated | PaymentDefaulted
   *  - ''          → no filter (all)
   * Invalid values return 400. If both `status` and `statusGroup` are sent,
   * BE uses `statusGroup` (precedence). See plan 058 / ralplan-add-completed-status.
   */
  statusGroup?: AuctionStatusGroup
  auctionType?: AuctionType
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  pageNumber?: number
  pageSize?: number
}

export interface MyBidDto {
  auctionId: string
  itemId: string
  itemTitle: string
  primaryImageUrl?: string
  auctionStatus: string
  currentPrice: MoneyDto
  myLatestBidAmount: MoneyDto
  position: string
  wonAt?: string
  lastBidAt: string
  bidCountForUser: number
  orderId?: string | null
  orderStatus?: string | null
  canPayNow?: boolean
}

export interface MyAuctionWatchlistDto {
  auctionId: string
  itemTitle: string
  primaryImageUrl?: string
  currentPrice: MoneyDto
  currency: string
  auctionStatus: string
  bidCount: number
  endTime?: string
  remainingTime?: string
  notifyOnBid: boolean
  notifyOnEnd: boolean
  watchedAt: string
}
