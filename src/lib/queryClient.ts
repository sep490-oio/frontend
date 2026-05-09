import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Query key factory
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },
  users: {
    all: ['users'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
    addresses: () => [...queryKeys.users.all, 'addresses'] as const,
    sessions: () => [...queryKeys.users.all, 'sessions'] as const,
    loginHistory: (params?: unknown) => [...queryKeys.users.all, 'loginHistory', params] as const,
    notificationPrefs: () => [...queryKeys.users.all, 'notificationPrefs'] as const,
  },
  auctions: {
    all: ['auctions'] as const,
    // Root keys (no params) — use these for invalidation so we don't call
    // the params factory with `undefined`, which produces a key segment
    // that TanStack Query cannot match against real param-bearing keys.
    listRoot: () => [...queryKeys.auctions.all, 'list'] as const,
    myAuctionsRoot: () => [...queryKeys.auctions.all, 'my'] as const,
    watchlistRoot: () => [...queryKeys.auctions.all, 'watchlist'] as const,
    myBidsRoot: () => ['myBids'] as const,
    list: (params?: unknown) => [...queryKeys.auctions.all, 'list', params] as const,
    // Prefix-only key used for invalidation. Matches all scopes (anon + every userScope).
    detail: (id: string) => [...queryKeys.auctions.all, 'detail', id] as const,
    // Auth-scoped key: every query/read/write of a detail entry uses this so that
    // the anonymous cache cannot shadow a user-specific response (which contains
    // currentUserBidState). Invalidation via `detail(id)` still matches all scopes.
    detailFor: (id: string, userScope: string | null | undefined) =>
      [...queryKeys.auctions.all, 'detail', id, userScope ?? 'anon'] as const,
    bids: (auctionId: string) => [...queryKeys.auctions.all, 'bids', auctionId] as const,
    myAuctions: (params?: unknown) => [...queryKeys.auctions.all, 'my', params] as const,
    myAutoBid: (auctionId: string) => [...queryKeys.auctions.all, 'autoBid', auctionId] as const,
    watchlist: (params?: unknown) => [...queryKeys.auctions.all, 'watchlist', params] as const,
    myBids: (params?: unknown) => ['myBids', params] as const,
    myPendingWinnerOffers: () => [...queryKeys.auctions.all, 'myPendingWinnerOffers'] as const,
  },
  items: {
    all: ['items'] as const,
    listRoot: () => [...queryKeys.items.all, 'list'] as const,
    myRoot: () => [...queryKeys.items.all, 'my'] as const,
    list: (params?: unknown) => [...queryKeys.items.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.items.all, 'detail', id] as const,
    my: (params?: unknown) => [...queryKeys.items.all, 'my', params] as const,
    questionsRoot: (itemId: string) => [...queryKeys.items.all, 'questions', itemId] as const,
    questions: (itemId: string, params?: unknown) => [...queryKeys.items.all, 'questions', itemId, params] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.categories.all, 'detail', id] as const,
    children: (id: string) => [...queryKeys.categories.all, 'children', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    listRoot: () => [...queryKeys.orders.all, 'list'] as const,
    sellerDirectShipRoot: () => ['orders', 'seller-direct-ship'] as const,
    list: (params?: unknown) => [...queryKeys.orders.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  directShipments: {
    all: ['directShipments'] as const,
    detail: (id: string) => ['directShipments', 'detail', id] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    summary: () => [...queryKeys.wallet.all, 'summary'] as const,
    sellerOverview: () => [...queryKeys.wallet.all, 'sellerOverview'] as const,
    transactions: (params?: unknown) => [...queryKeys.wallet.all, 'transactions', params] as const,
    withdrawals: (params?: unknown) => [...queryKeys.wallet.all, 'withdrawals', params] as const,
    activeDeposits: () => [...queryKeys.wallet.all, 'activeDeposits'] as const,
  },
  sellerFinance: {
    all: ['sellerFinance'] as const,
    overview: () => [...queryKeys.sellerFinance.all, 'overview'] as const,
    escrowLedger: () => [...queryKeys.sellerFinance.all, 'escrowLedger'] as const,
    auctionDeposits: () => [...queryKeys.sellerFinance.all, 'auctionDeposits'] as const,
  },
  paymentMethods: {
    all: ['paymentMethods'] as const,
    list: () => [...queryKeys.paymentMethods.all, 'list'] as const,
  },
  seller: {
    all: ['seller'] as const,
    myProfile: () => [...queryKeys.seller.all, 'myProfile'] as const,
    detail: (id: string) => [...queryKeys.seller.all, 'detail', id] as const,
    items: (sellerId: string, params?: unknown) => [...queryKeys.seller.all, 'items', sellerId, params] as const,
    verifications: () => [...queryKeys.seller.all, 'verifications'] as const,
  },
  warehouse: {
    all: ['warehouse'] as const,
    inboundRoot: () => [...queryKeys.warehouse.all, 'inbound', 'list'] as const,
    outboundRoot: () => [...queryKeys.warehouse.all, 'outbound', 'list'] as const,
    itemsRoot: () => [...queryKeys.warehouse.all, 'items'] as const,
    inbound: (params?: unknown) => [...queryKeys.warehouse.all, 'inbound', 'list', params] as const,
    inboundDetail: (id: string) => [...queryKeys.warehouse.all, 'inbound', 'detail', id] as const,
    outbound: (params?: unknown) => [...queryKeys.warehouse.all, 'outbound', 'list', params] as const,
    outboundDetail: (id: string) => [...queryKeys.warehouse.all, 'outbound', 'detail', id] as const,
    items: (params?: unknown) => [...queryKeys.warehouse.all, 'items', params] as const,
    locations: () => [...queryKeys.warehouse.all, 'locations'] as const,
    inspectionQueue: (params?: unknown) => [...queryKeys.warehouse.all, 'inspectionQueue', params] as const,
    staffOutboundQueueRoot: () => ['warehouse-staff', 'outbound-queue'] as const,
    staffOutboundQueue: (params?: unknown) => ['warehouse-staff', 'outbound-queue', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    listRoot: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (params?: unknown) => [...queryKeys.notifications.all, 'list', params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  disputes: {
    all: ['disputes'] as const,
    list: (params?: unknown) => [...queryKeys.disputes.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.disputes.all, 'detail', id] as const,
    messages: (disputeId: string, params?: unknown) => [...queryKeys.disputes.all, 'messages', disputeId, params] as const,
    myList: (params?: unknown) => [...queryKeys.disputes.all, 'my', params] as const,
    myDetail: (id: string) => [...queryKeys.disputes.all, 'my', 'detail', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    my: (params?: unknown) => [...queryKeys.reports.all, 'my', params] as const,
  },
  terms: {
    all: ['terms'] as const,
    active: () => [...queryKeys.terms.all, 'active'] as const,
    myAccepted: () => [...queryKeys.terms.all, 'myAccepted'] as const,
  },
  media: {
    all: ['media'] as const,
    contexts: () => [...queryKeys.media.all, 'contexts'] as const,
  },
  admin: {
    // Root keys — use these for invalidation so params-based list queries are
    // matched by prefix regardless of their concrete params object.
    usersRoot: () => ['admin', 'users'] as const,
    verificationsRoot: () => ['admin', 'verifications'] as const,
    sellerProfilesRoot: () => ['admin', 'sellerProfiles'] as const,
    reviewQueueRoot: () => ['admin', 'reviewQueue'] as const,
    reportsRoot: () => ['admin', 'reports'] as const,
    alertsRoot: () => ['admin', 'alerts'] as const,
    disputesRoot: () => ['admin', 'disputes'] as const,
    disputeDetail: (id: string) => ['admin', 'disputes', 'detail', id] as const,
    disputeAssignees: (id: string) => ['admin', 'disputes', 'assignees', id] as const,
    withdrawalsRoot: () => ['admin', 'withdrawals'] as const,
    transactionsRoot: () => ['admin', 'transactions'] as const,
    escrowsRoot: () => ['admin', 'escrows'] as const,
    termsRoot: () => ['admin', 'terms'] as const,
    users: (params?: unknown) => ['admin', 'users', params] as const,
    userDetail: (id: string) => ['admin', 'users', id] as const,
    userRiskFlags: (id: string) => ['admin', 'users', id, 'riskFlags'] as const,
    roles: () => ['admin', 'roles'] as const,
    permissions: () => ['admin', 'permissions'] as const,
    verifications: (params?: unknown) => ['admin', 'verifications', params] as const,
    sellerProfiles: (params?: unknown) => ['admin', 'sellerProfiles', params] as const,
    reviewQueue: (params?: unknown) => ['admin', 'reviewQueue', params] as const,
    reports: (params?: unknown) => ['admin', 'reports', params] as const,
    alerts: (params?: unknown) => ['admin', 'alerts', params] as const,
    disputes: (params?: unknown) => ['admin', 'disputes', params] as const,
    withdrawals: (params?: unknown) => ['admin', 'withdrawals', params] as const,
    transactions: (params?: unknown) => ['admin', 'transactions', params] as const,
    escrows: (params?: unknown) => ['admin', 'escrows', params] as const,
    paymentSummary: () => ['admin', 'paymentSummary'] as const,
    platformWallet: () => ['admin', 'platformWallet'] as const,
    terms: (params?: unknown) => ['admin', 'terms', params] as const,
    completedAuctionsRoot: () => ['admin', 'completedAuctions'] as const,
    completedAuctions: (params?: unknown) => ['admin', 'completedAuctions', params] as const,
    completedAuctionDetail: (auctionId: string) => ['admin', 'completedAuctions', 'detail', auctionId] as const,
    revenueHistory: (params?: unknown) => ['admin', 'revenueHistory', params] as const,
    platformWalletTransactions: (params?: unknown) => ['admin', 'platformWalletTransactions', params] as const,
    ordersRoot: () => ['admin', 'orders'] as const,
    orders: (params?: unknown) => ['admin', 'orders', params] as const,
    orderDetail: (orderId: string) => ['admin', 'orders', 'detail', orderId] as const,
  },
} as const
