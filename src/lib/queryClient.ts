import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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
    list: (params?: unknown) => [...queryKeys.auctions.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.auctions.all, 'detail', id] as const,
    bids: (auctionId: string) => [...queryKeys.auctions.all, 'bids', auctionId] as const,
    myAuctions: (params?: unknown) => [...queryKeys.auctions.all, 'my', params] as const,
    myAutoBid: (auctionId: string) => [...queryKeys.auctions.all, 'autoBid', auctionId] as const,
    watchlist: (params?: unknown) => [...queryKeys.auctions.all, 'watchlist', params] as const,
    myBids: (params?: unknown) => ['myBids', params] as const,
    myPendingWinnerOffers: () => [...queryKeys.auctions.all, 'myPendingWinnerOffers'] as const,
  },
  items: {
    all: ['items'] as const,
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
    list: (params?: unknown) => [...queryKeys.orders.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    summary: () => [...queryKeys.wallet.all, 'summary'] as const,
    transactions: (params?: unknown) => [...queryKeys.wallet.all, 'transactions', params] as const,
    withdrawals: (params?: unknown) => [...queryKeys.wallet.all, 'withdrawals', params] as const,
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
    inbound: (params?: unknown) => [...queryKeys.warehouse.all, 'inbound', 'list', params] as const,
    inboundDetail: (id: string) => [...queryKeys.warehouse.all, 'inbound', 'detail', id] as const,
    outbound: (params?: unknown) => [...queryKeys.warehouse.all, 'outbound', 'list', params] as const,
    outboundDetail: (id: string) => [...queryKeys.warehouse.all, 'outbound', 'detail', id] as const,
    items: (params?: unknown) => [...queryKeys.warehouse.all, 'items', params] as const,
    locations: () => [...queryKeys.warehouse.all, 'locations'] as const,
    inspectionQueue: (params?: unknown) => [...queryKeys.warehouse.all, 'inspectionQueue', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (params?: unknown) => [...queryKeys.notifications.all, 'list', params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  disputes: {
    all: ['disputes'] as const,
    list: (params?: unknown) => [...queryKeys.disputes.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.disputes.all, 'detail', id] as const,
    messages: (disputeId: string, params?: unknown) => [...queryKeys.disputes.all, 'messages', disputeId, params] as const,
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
    users: (params?: unknown) => ['admin', 'users', params] as const,
    userDetail: (id: string) => ['admin', 'users', id] as const,
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
  },
} as const
