import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  Typography,
  Row,
  Col,
  Button,
  InputNumber,
  Skeleton,
  Modal,
  Alert,
  App,
  Form,
  Breadcrumb,
  Input,
  Popconfirm,
  DatePicker,
  Flex,
} from 'antd'
import dayjs from 'dayjs'
import { ArrowLeftOutlined, FlagOutlined } from '@ant-design/icons'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTermsGate } from '@/features/user/hooks/useTermsGate'
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'
import { useSellerById } from '@/features/seller/api'
import {
  useAuctionDetail,
  usePlaceBid,
  useWatchAuction,
  useUnwatchAuction,
  useMyAutoBid,
  useConfigureAutoBid,
  usePauseAutoBid,
  useResumeAutoBid,
  useCancelAutoBid,
  useBuyNow,
  useChooseAuctionShipping,
  useRecordAuctionView,
  useOfferRunnerUp,
  useRelistAuction,
  useSubmitAuction,
  useCancelAuction,
  useSetAuctionTiming,
} from '@/features/auction/api'
import { useWallet, useCreateDepositPayment, useDepositFromWallet } from '@/features/payment/api'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { useUserHub } from '@/features/auction/hooks/useUserHub'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/features/user/api'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCategories } from '@/features/item/api'
import ShippingDetailsForm from '@/components/ui/ShippingDetailsForm'
import type { ShippingDetailsFormValues } from '@/components/ui/ShippingDetailsForm'
import { AuctionStatus } from '@/types/enums'
import { formatCurrency, formatDate } from '@/utils/format'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import { NotificationAggregator } from '@/features/auction/utils/NotificationAggregator'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AuctionDetailTabs } from '@/features/auction/components/AuctionDetailTabs'
import { AuctionSidebar } from '@/features/auction/components/AuctionSidebar'
import { AuctionDepositModal } from '@/features/auction/components/AuctionDepositModal'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import { SellerActionBar } from '@/features/auction/components/SellerActionBar'
import { CreateDisputeModal } from '@/features/order/components/CreateDisputeModal'

// ── Qualification state helper ──────────────────────────────────────

type QualificationState =
  | 'before_window'
  | 'window_open'
  | 'qualified'
  | 'window_closed'
  | 'is_seller'

function computeQualificationState(
  auction: { qualificationStartAt?: string; qualificationEndAt?: string; sellerId: string; status: string },
  userId: string | undefined,
  isQualified: boolean,
): QualificationState {
  if (userId && auction.sellerId === userId) return 'is_seller'
  if (isQualified) return 'qualified'

  const now = Date.now()
  const qualStart = auction.qualificationStartAt ? new Date(auction.qualificationStartAt).getTime() : null
  const qualEnd = auction.qualificationEndAt ? new Date(auction.qualificationEndAt).getTime() : null

  if (qualStart && now < qualStart) return 'before_window'
  if (qualStart && qualEnd && now >= qualStart && now < qualEnd) return 'window_open'
  if (qualEnd && now >= qualEnd) return 'window_closed'

  // No qualification window configured — treat as open
  return 'window_open'
}

// ── Component ───────────────────────────────────────────────────────

export default function AuctionDetailPage() {
  const { t } = useTranslation('auction')
  const { t: td } = useTranslation('dispute')
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  // Navigation fallback: when the user navigates from /me/bids to an ended auction,
  // the source card passes `knownPosition` via router state so the outcome block
  // can render the correct Won/Lost card immediately — before the detail refetch
  // resolves and provides the authoritative `currentUserBidState` from the server.
  const navState = (location.state as {
    knownPosition?: 'leading' | 'outbid' | 'won' | 'lost' | 'none'
    returnTo?: string
    returnLabel?: string
  } | null) ?? null
  const knownPositionFromNav = navState?.knownPosition ?? null
  // Navigation source memory: when coming from /me/bids etc., the calling page
  // passes `returnTo` + `returnLabel` so Back/breadcrumb return to the right origin.
  const returnTo = navState?.returnTo ?? '/auctions'
  const returnLabel = navState?.returnLabel ?? t('auctions', 'Auctions')
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
  const bidderTerms = useTermsGate('bidder')
  const { isAuthenticated } = useAuth()
  const { data: currentUser } = useCurrentUser()

  // Cache key is scoped by auth context (anon vs. userId). When the user logs in
  // or `useCurrentUser` resolves, `userScope` changes and React Query refetches
  // so `currentUserBidState` is always based on the real identity — never on
  // a stale anonymous response.
  const detailUserScope = isAuthenticated ? (currentUser?.id ?? null) : null
  // Short-term polling enabled when user is the winner but currentBuyerOrder
  // hasn't materialized yet (race between PlaceBid sweep-to-buy-now and the
  // AuctionSoldEvent handler creating the Order). Capped at ~12s.
  const [orderPollAttempts, setOrderPollAttempts] = useState(0)
  const [pollingForOrder, setPollingForOrder] = useState(false)
  const { data, isLoading, refetch } = useAuctionDetail(
    id ?? '',
    detailUserScope,
    { refetchInterval: pollingForOrder ? 2000 : false },
  )
  // Only fetch authenticated-user data when logged in (this is a public page)
  const { data: myAutoBid } = useMyAutoBid(isAuthenticated ? (id ?? '') : '')

  const { data: walletData } = useWallet({ enabled: isAuthenticated })
  const { data: categories } = useCategories()
  const categoryName = useMemo(() => {
    if (!categories || !data?.item?.categoryId) return data?.item?.categoryId
    const found = categories.find((c: { id: string; name: string }) => c.id === data?.item?.categoryId)
    return found?.name ?? data?.item?.categoryId
  }, [categories, data?.item?.categoryId])

  const hub = useAuctionHub(id ?? '', data?.item?.id, currentUser?.id)
  useUserHub(id ?? '', currentUser?.id ?? null)

  // Winner Pay Now CTA — prefer server-authoritative CurrentBuyerOrder from
  // AuctionDetailDto. It is populated when the current user is the auction
  // winner (or buy-now reservation holder) and reflects the real order state.
  const winnerPayNowOrderId = useMemo(() => {
    const cbo = data?.currentBuyerOrder
    return cbo?.canPayNow && cbo.orderId ? cbo.orderId : null
  }, [data?.currentBuyerOrder])

  const placeBidMutation = usePlaceBid()
  const watchMutation = useWatchAuction()
  const unwatchMutation = useUnwatchAuction()
  const autoBidMutation = useConfigureAutoBid()
  const pauseAutoBidMutation = usePauseAutoBid()
  const resumeAutoBidMutation = useResumeAutoBid()
  const cancelAutoBidMutation = useCancelAutoBid()
  const depositMutation = useCreateDepositPayment()
  const walletDepositMutation = useDepositFromWallet()
  const buyNowMutation = useBuyNow()
  const chooseShipping = useChooseAuctionShipping()
  const offerRunnerUp = useOfferRunnerUp()
  const relistAuction = useRelistAuction()
  const submitAuctionMutation = useSubmitAuction()
  const cancelAuctionMutation = useCancelAuction()
  const setAuctionTimingMutation = useSetAuctionTiming()
  const [shippingForm] = Form.useForm<ShippingDetailsFormValues>()

  const [bidAmount, setBidAmount] = useState<number | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [autoBidModalOpen, setAutoBidModalOpen] = useState(false)
  const [autoBidMax, setAutoBidMax] = useState<number | null>(null)
  const [autoBidIncrement, setAutoBidIncrement] = useState<number | null>(null)
  const [buyNowConfirmOpen, setBuyNowConfirmOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [shippingModalOpen, setShippingModalOpen] = useState(false)
  const [relistModalOpen, setRelistModalOpen] = useState(false)
  const [relistForm, setRelistForm] = useState<{
    qualificationStartAt: dayjs.Dayjs | null
    qualificationEndAt: dayjs.Dayjs | null
    startAt: dayjs.Dayjs | null
    endAt: dayjs.Dayjs | null
  }>({ qualificationStartAt: null, qualificationEndAt: null, startAt: null, endAt: null })
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [timingModalOpen, setTimingModalOpen] = useState(false)
  const [buyNowCapModal, setBuyNowCapModal] = useState<{
    open: boolean
    rawBid: number
    payableAmount: number
    orderId?: string
  }>({ open: false, rawBid: 0, payableAmount: 0 })
  const [timingForm, setTimingForm] = useState({
    startTime: null as dayjs.Dayjs | null,
    endTime: null as dayjs.Dayjs | null,
    qualificationStartAt: null as dayjs.Dayjs | null,
    qualificationEndAt: null as dayjs.Dayjs | null,
    autoExtend: false,
    extensionMinutes: 5,
  })
  const [submitPendingTiming, setSubmitPendingTiming] = useState(false)
  const [pendingActivation, setPendingActivation] = useState(false)
  // Report/dispute modal uses CreateDisputeModal — no inline hook needed

  // Qualification status — check localStorage + URL param after VnPay return
  const [searchParams] = useSearchParams()
  const depositedParam = searchParams.get('deposited') === 'true'
  const storageKey = id ? `oio_qualified_${id}` : ''

  const [isQualified, setIsQualified] = useState(() => {
    if (!id) return false
    return localStorage.getItem(storageKey) === 'true'
  })

  // If returning from VnPay deposit with success flag, mark qualified
  useEffect(() => {
    if (depositedParam && id) {
      localStorage.setItem(storageKey, 'true')
      setIsQualified(true)
      // Clean URL params
      const url = new URL(window.location.href)
      url.searchParams.delete('deposited')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [depositedParam, id, storageKey])

  useEffect(() => {
    if (!id || !data?.currentUserParticipant?.qualificationStatus) return

    const qualificationStatus = data.currentUserParticipant.qualificationStatus
    if (qualificationStatus === 'qualified' || qualificationStatus === 'waived') {
      localStorage.setItem(storageKey, 'true')
      setIsQualified(true)
      return
    }

    if (qualificationStatus === 'rejected' || qualificationStatus === 'expired') {
      localStorage.removeItem(storageKey)
      setIsQualified(false)
    }
  }, [data?.currentUserParticipant?.qualificationStatus, id, storageKey])

  // Sync isWatching from API response
  useEffect(() => {
    if (data?.isWatched != null) setIsWatching(data.isWatched)
  }, [data?.isWatched])

  // Winner-order polling: when current user is the winner but the Order has
  // not yet been provisioned (transient race window), poll the auction detail
  // every 2s up to 6 attempts (~12s) and invalidate related caches.
  const isWinnerWithoutOrder = useMemo(() => {
    if (!data?.auction || !currentUser?.id) return false
    const status = data.auction.status
    const isTerminalSold = status === AuctionStatus.Sold || status === AuctionStatus.Ended
    const isWinner =
      data.auction.currentWinnerId === currentUser.id ||
      data.currentUserBidState?.position === 'won'
    return isTerminalSold && isWinner && !data.currentBuyerOrder
  }, [data?.auction, data?.currentBuyerOrder, currentUser?.id])

  useEffect(() => {
    if (isWinnerWithoutOrder && !pollingForOrder && orderPollAttempts === 0) {
      setPollingForOrder(true)
      // Invalidate adjacent caches so the order list picks up the new order.
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    }
  }, [isWinnerWithoutOrder, pollingForOrder, orderPollAttempts, id])

  useEffect(() => {
    if (!pollingForOrder) return
    if (data?.currentBuyerOrder) {
      setPollingForOrder(false)
      setOrderPollAttempts(0)
      return
    }
    setOrderPollAttempts((prev) => {
      const next = prev + 1
      if (next >= 6) {
        setPollingForOrder(false)
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // ── Derived auction state ──────────────────────────────────────────
  const auction = data?.auction
  const item = data?.item
  const sellerId = item?.sellerId ?? auction?.sellerId
  const { data: sellerProfile } = useSellerById(sellerId ?? '')
  // Use data.recentBids as the canonical source (realtime-patched by useAuctionHub).
  // The public /auctions/{id} endpoint already embeds recentBids, and the protected
  // /auctions/{id}/bids endpoint is not needed on this page.
  const recentBids = data?.recentBids ?? []
  const isActive = auction?.status === AuctionStatus.Active
  const isScheduled = auction?.status === AuctionStatus.Scheduled
  // Terminal states: auction detail becomes a public read-only results page.
  // All interactive panels (BidForm, EligibilityPanel, Buy Now, mobile sticky bar)
  // must be hidden. Product info + bid history remain visible from the embedded DTO.
  const isTerminal =
    auction?.status === AuctionStatus.Ended ||
    auction?.status === AuctionStatus.Sold ||
    auction?.status === AuctionStatus.Failed ||
    auction?.status === AuctionStatus.Cancelled ||
    auction?.status === AuctionStatus.Terminated
  const currentPrice = auction?.currentPrice?.amount ?? 0
  const currency = auction?.currency ?? DEFAULT_CURRENCY
  const minBid = auction?.minimumBidAmount?.amount ?? (currentPrice + (auction?.bidIncrement?.amount ?? 0))
  const bidCount = auction?.bidCount ?? 0
  const watchCount = auction?.watchCount ?? 0
  const viewCount = auction?.viewCount ?? 0
  const walletBalance = walletData?.availableBalance ?? 0
  const insufficientBalance = walletBalance < minBid
  const bidInc = auction?.bidIncrement?.amount ?? 50000
  const isSeller = currentUser?.id === auction?.sellerId || currentUser?.id === item?.sellerId

  // ── Record view (once per page visit, skip for seller) ────────────
  const recordView = useRecordAuctionView()
  const viewRecorded = useRef(false)
  useEffect(() => {
    if (id && !isSeller && !viewRecorded.current) {
      viewRecorded.current = true
      recordView.mutate(id)
    }
  }, [id, isSeller]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── SignalR bid notifications (aggregated) ────────────────────────
  const aggregatorRef = useRef<NotificationAggregator | null>(null)

  // Create aggregator once, tear down on unmount
  useEffect(() => {
    aggregatorRef.current = new NotificationAggregator(500, (aggregated, individual) => {
      if (aggregated) {
        // Batched: >3 bids arrived within 500ms (cascade)
        const autoPart = aggregated.hasAutoBids ? ` (${t('includingAutoBids', 'including auto-bids')})` : ''
        message.info({
          content: `${aggregated.count} ${t('bidsPlaced', 'bids placed')}${autoPart}. ${t('priceNow', 'Price')}: ${formatCurrency(aggregated.startPrice, currency)} → ${formatCurrency(aggregated.endPrice, currency)}`,
          duration: 5,
        })
      } else if (individual) {
        // Individual: ≤3 bids, show each
        const prefix = individual.isAutoBid ? '[Auto] ' : ''
        message.info({
          content: `${prefix}${t('newBid', 'New bid')}: ${formatCurrency(individual.amount, currency)}`,
          duration: 3,
        })
      }
    })
    return () => { aggregatorRef.current?.destroy() }
    // message and t are stable refs, currency changes rarely
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Push each bid event into the aggregator
  useEffect(() => {
    if (hub.lastBid && aggregatorRef.current) {
      aggregatorRef.current.push(hub.lastBid)
    }
  }, [hub.lastBid])

  useEffect(() => {
    if (hub.outbid) {
      const newHigh = hub.outbid.newHighAmount ?? hub.outbid.newAmount
      const minNext = hub.outbid.minimumNextBid
      message.warning({
        content: newHigh
          ? `${t('outbidNotification', 'Outbid!')} ${t('newPrice', 'New price')}: ${formatCurrency(newHigh, currency)}${minNext ? `. ${t('bidAtLeast', 'Bid at least')} ${formatCurrency(minNext, currency)}` : ''}`
          : t('outbidNotification', 'You have been outbid!'),
        duration: 8,
      })
    }
  }, [hub.outbid, message, t, currency])

  // Handle auction end — show win/loss notification and clean up
  useEffect(() => {
    if (hub.auctionEnded && storageKey) {
      localStorage.removeItem(storageKey)
      setIsQualified(false)

      const isWinner = currentUser?.id && hub.auctionEnded.winnerId === currentUser.id
      if (isWinner) {
        message.success({
          content: `🎉 ${t('youWon', 'Congratulations! You won')} "${item?.title ?? ''}" ${t('for', 'for')} ${formatCurrency(hub.auctionEnded.finalPrice, hub.auctionEnded.currency)}. ${t('completePayment', 'Complete payment to secure your item.')}`,
          duration: 10,
        })
      } else if (hub.auctionEnded.winnerId) {
        message.info({
          content: `${t('auctionEndedLost', 'Auction ended.')} ${t('finalPrice', 'Final price')}: ${formatCurrency(hub.auctionEnded.finalPrice, hub.auctionEnded.currency)}. ${t('depositRefund', 'Your deposit will be refunded.')}`,
          duration: 8,
        })
      } else {
        message.info({
          content: t('auctionEndedNoWinner', 'Auction ended without a sale.'),
          duration: 5,
        })
      }
    }
  }, [hub.auctionEnded, storageKey, currentUser?.id, message, t, item?.title])

  // Fallback polling only when SignalR is NOT connected
  useEffect(() => {
    if (auction?.status !== AuctionStatus.Active) return
    if (hub.connected) return // SignalR handles realtime — no polling needed
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.bids(id!) })
    }, 5000)
    return () => clearInterval(interval)
  }, [auction?.status, id, hub.connected])

  // Poll for Scheduled → Active transition after countdown expires
  useEffect(() => {
    if (!pendingActivation || !id) return
    if (auction?.status === AuctionStatus.Active) {
      setPendingActivation(false)
      return
    }
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id) })
    }, 3000)
    const timeout = setTimeout(() => {
      setPendingActivation(false)
    }, 60000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [pendingActivation, id, auction?.status])

  // Re-evaluate qualification state only when the window crosses a boundary.
  const [qualificationBoundaryTick, setQualificationBoundaryTick] = useState(0)
  useEffect(() => {
    if (!auction) return

    const nextBoundary = [auction.qualificationStartAt, auction.qualificationEndAt]
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => value > Date.now())
      .sort((a, b) => a - b)[0]

    if (!nextBoundary) return

    const timeout = window.setTimeout(() => {
      setQualificationBoundaryTick((value) => value + 1)
    }, Math.max(0, nextBoundary - Date.now()) + 250)

    return () => window.clearTimeout(timeout)
  }, [auction, auction?.qualificationEndAt, auction?.qualificationStartAt, qualificationBoundaryTick])

  // Prefer server-sourced qualification status over localStorage
  const serverQualStatus = data?.currentUserParticipant?.qualificationStatus
  const qualState = useMemo(
    () => {
      // If server provides qualification status, use it directly
      if (serverQualStatus === 'qualified' || serverQualStatus === 'waived') return 'qualified' as QualificationState
      if (serverQualStatus === 'rejected') return 'window_closed' as QualificationState
      if (serverQualStatus === 'expired') return 'window_closed' as QualificationState

      // Otherwise fall back to client-side computation (for backward compatibility until BE is updated)
      return auction
        ? computeQualificationState(
          { ...auction, sellerId: item?.sellerId ?? auction.sellerId ?? '' },
          currentUser?.id,
          isQualified,
        )
        : ('before_window' as QualificationState)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auction, item, currentUser?.id, isQualified, qualificationBoundaryTick, serverQualStatus],
  )

  // ── Handlers ────────────────────────────────────────────────────

  const handlePlaceBid = async () => {
    if (bidderTerms.hasPending) { bidderTerms.openModal(); return }
    if (isSeller) return
    if (!id || !bidAmount) return
    const rawBid = bidAmount
    try {
      let result: Partial<import('@/types').PlaceBidResultDto> = {}

      if (hub.connected) {
        // Prefer SignalR for lower latency
        const idempotencyKey = crypto.randomUUID()
        const hubResult = await hub.placeBid(rawBid, currency, idempotencyKey)
        if (!hubResult.success) {
          throw new Error(hubResult.error ?? t('bidError', 'Failed to place bid'))
        }
        result = hubResult.data ?? {}
      } else {
        // Fallback to REST when SignalR disconnected
        result = await placeBidMutation.mutateAsync({ auctionId: id, amount: rawBid, currency })
      }

      const triggeredBuyNowCap = result.triggeredBuyNowCap === true
      // When capped, the canonical settled price is finalPrice (= buyNowPrice),
      // NOT the raw bid the buyer typed.
      const effectiveAmount = triggeredBuyNowCap && typeof result.finalPrice === 'number'
        ? result.finalPrice
        : rawBid

      // Optimistic update — will be corrected by SignalR broadcast
      queryClient.setQueryData(
        queryKeys.auctions.detailFor(id, detailUserScope),
        (old: import('@/types').AuctionDetailDto | undefined) => old ? {
          ...old,
          auction: {
            ...old.auction,
            currentPrice: { ...old.auction.currentPrice, amount: effectiveAmount },
            bidCount: (old.auction.bidCount ?? 0) + 1,
          },
        } : old,
      )

      if (triggeredBuyNowCap) {
        // Capped sale: show dedicated modal explaining the buy-now ceiling and
        // the payable amount. Let it own the UX instead of a toast.
        setBuyNowCapModal({
          open: true,
          rawBid,
          payableAmount: effectiveAmount,
          orderId: result.orderId,
        })
        setBidAmount(null)
        return
      }

      let successMsg = `${t('bidPlaced', 'Bid placed')}: ${formatCurrency(effectiveAmount, currency)}`

      if (result.autoBidsCascaded && result.autoBidsCascaded > 0) {
        successMsg += `. ${t('autoBidsCascaded', 'Your bid triggered {{count}} auto-bids. Current price: {{price}} VND.', { count: result.autoBidsCascaded, price: formatCurrency(result.finalPrice ?? effectiveAmount, currency) })}`
      }

      if (result.wasImmediatelyOutbid) {
        message.warning(successMsg + ` ${t('immediatelyOutbid', 'You were immediately outbid. Consider increasing your bid.')}`)
      } else {
        message.success(successMsg)
      }

      setBidAmount(null)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? (err as Error)?.message ?? t('bidError', 'Failed to place bid'))
    }
  }

  const handleWatch = async () => {
    if (!id) return
    try {
      if (isWatching) {
        await unwatchMutation.mutateAsync(id)
        setIsWatching(false)
      } else {
        await watchMutation.mutateAsync({ auctionId: id })
        setIsWatching(true)
      }
    } catch {
      message.error(t('watchError', 'Failed to update watchlist'))
    }
  }

  const handleAutoBid = async () => {
    if (!id || !autoBidMax) return
    try {
      await autoBidMutation.mutateAsync({ auctionId: id, maxAmount: autoBidMax, currency, incrementAmount: autoBidIncrement ?? undefined })
      message.success(t('autoBidConfigured', 'Auto-bid configured'))
      setAutoBidModalOpen(false)
    } catch {
      message.error(t('autoBidError', 'Failed to configure auto-bid'))
    }
  }

  const handleBuyNow = useCallback(async () => {
    if (!id) return
    try {
      const result = await buyNowMutation.mutateAsync(id)
      setBuyNowConfirmOpen(false)
      navigate(`/checkout/${result.orderId}`)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('buyNowError', 'Buy now failed'))
    }
  }, [id, buyNowMutation, message, t, navigate])

  const handleDeposit = async () => {
    if (bidderTerms.hasPending) { bidderTerms.openModal(); return }
    if (!id || !auction) return
    try {
      const depositAmount = auction.startingPrice?.amount ?? 0
      const result = await depositMutation.mutateAsync({
        amount: depositAmount,
        currency,
        auctionId: id,
        description: `Dat coc dau gia - ${item?.title ?? id}`,
        clientReturnPath: `/auctions/${id}?deposited=true`,
      })
      // Store auction ID so VnPay return page can redirect back
      localStorage.setItem('oio_deposit_auction_id', id)
      // Redirect to VNPay
      window.location.href = result.paymentUrl
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('depositError', 'Failed to create deposit payment'))
    }
  }

  const handleWalletDeposit = async () => {
    if (bidderTerms.hasPending) { bidderTerms.openModal(); return }
    if (!id || !auction) return
    const depositAmount = auction.startingPrice?.amount ?? 0

    modal.confirm({
      title: t('confirmDeposit', 'Confirm Deposit'),
      content: (
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div>{t('depositAmountLabel', 'Deposit amount')}: <strong>{formatCurrency(depositAmount, currency)}</strong></div>
          <div style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>
            {t('depositConditions', 'Your deposit will be held until the auction ends. If you win, it is applied to your payment. If you lose, it is returned to your wallet. If you win and do not pay within 48 hours, your deposit is forfeited.')}
          </div>
        </div>
      ),
      okText: t('confirmDepositBtn', 'Deposit Now'),
      cancelText: t('cancel', 'Cancel'),
      onOk: async () => {
        try {
          await walletDepositMutation.mutateAsync({ auctionId: id, amount: depositAmount, currency })
          localStorage.setItem(storageKey, 'true')
          setIsQualified(true)
          message.success(t('depositSuccess', 'Deposit successful — you are now qualified to bid!'))
          queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id) })
        } catch (err) {
          const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          message.error(detail ?? t('depositError', 'Deposit failed'))
        }
      },
    })
  }

  // Keep original VnPay deposit handler (redirects to external gateway)
  const _handleWalletDepositDirect = async () => {
    if (!id || !auction) return
    const depositAmount = auction.startingPrice?.amount ?? 0
    try {
      await walletDepositMutation.mutateAsync({ auctionId: id, amount: depositAmount, currency })
      localStorage.setItem(storageKey, 'true')
      setIsQualified(true)
      message.success(t('depositSuccess', 'Deposit successful — you are now qualified to bid!'))
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id) })
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('depositError', 'Deposit failed'))
    }
  }
  void _handleWalletDepositDirect
  void handleDeposit
  void handleWalletDeposit

  // ── Seller action handlers ──
  const handleSellerSubmit = () => {
    if (!id) return
    const hasTiming = auction?.startTime && auction?.endTime
    if (hasTiming) {
      submitAuctionMutation.mutate(id, {
        onSuccess: () => message.success(t('submitSuccess', 'Auction submitted for review')),
      })
    } else {
      setSubmitPendingTiming(true)
      setTimingModalOpen(true)
    }
  }

  const handleSellerCancel = () => {
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const handleCancelConfirm = () => {
    if (!id || !cancelReason.trim()) return
    cancelAuctionMutation.mutate({ auctionId: id, reason: cancelReason.trim() }, {
      onSuccess: () => {
        message.success(t('cancelSuccess', 'Auction cancelled'))
        setCancelModalOpen(false)
      },
    })
  }

  const handleSetTiming = () => {
    setTimingForm({
      startTime: null, endTime: null,
      qualificationStartAt: null, qualificationEndAt: null,
      autoExtend: false, extensionMinutes: 5,
    })
    setSubmitPendingTiming(false)
    setTimingModalOpen(true)
  }

  const handleTimingConfirm = async () => {
    if (!id || !timingForm.startTime || !timingForm.endTime) return
    const payload = {
      auctionId: id,
      startTime: timingForm.startTime.toISOString(),
      endTime: timingForm.endTime.toISOString(),
      ...(timingForm.qualificationStartAt ? { qualificationStartAt: timingForm.qualificationStartAt.toISOString() } : {}),
      ...(timingForm.qualificationEndAt ? { qualificationEndAt: timingForm.qualificationEndAt.toISOString() } : {}),
      autoExtend: timingForm.autoExtend,
      extensionMinutes: timingForm.extensionMinutes,
    }
    if (submitPendingTiming) {
      try {
        await submitAuctionMutation.mutateAsync(id)
        try {
          await setAuctionTimingMutation.mutateAsync(payload)
          message.success(t('submitAndTimingSuccess', 'Auction submitted and timing set'))
        } catch {
          message.warning(t('submitSuccessTimingFailed', 'Submitted but timing failed. Set timing manually.'))
        }
      } catch {
        message.error(t('submitFailed', 'Failed to submit auction'))
      }
      setSubmitPendingTiming(false)
      setTimingModalOpen(false)
    } else {
      setAuctionTimingMutation.mutate(payload, {
        onSuccess: () => {
          message.success(t('timingSuccess', 'Timing configured'))
          setTimingModalOpen(false)
        },
      })
    }
  }

  // ── Loading / empty states ──────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 100px' : isTablet ? '20px 16px 80px' : '24px 24px 80px' }}>
        <Skeleton active paragraph={{ rows: 0 }} style={{ marginBottom: isMobile ? 16 : 32 }} />
        <Row gutter={isDesktop ? [48, 32] : isTablet ? [0, 20] : [0, 12]}>
          <Col xs={24} lg={14}>
            <Skeleton.Image active style={{ width: '100%', height: isMobile ? 240 : 400, borderRadius: 8 }} />
            <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: isMobile ? 16 : 24 }} />
          </Col>
          <Col xs={24} lg={10}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Col>
        </Row>
      </div>
    )
  }

  if (!auction || !item) {
    return <EmptyState title={t('notFound', 'Auction not found')} />
  }

  const images = item.images ?? []
  const endTime = auction.endTime

  return (
    <div className="oio-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 100px' : isTablet ? '20px 16px 80px' : '24px 24px 80px' }}>
      {/* Breadcrumb — segment before detail reflects navigation origin (returnTo/returnLabel) */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate(returnTo)}>{returnLabel}</a> },
          { title: item?.title ?? t('auctionDetail', 'Auction Detail') },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Back link — returns to the origin the user came from (defaults to /auctions). */}
      <button
        type="button"
        onClick={() => navigate(returnTo)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
          marginBottom: isMobile ? 16 : 32,
        }}
      >
        <ArrowLeftOutlined /> {t('backTo', 'Back to')} {returnLabel}
      </button>

      {/* Report Auction button */}
      {isAuthenticated && !isSeller && (
        <Button
          size="small"
          icon={<FlagOutlined />}
          danger
          style={{ marginBottom: isMobile ? 16 : 32, marginLeft: 12 }}
          onClick={() => setReportModalOpen(true)}
        >
          {td('reportAuction', 'Report')}
        </Button>
      )}

      {/* Seller action bar */}
      {isSeller && (
        <SellerActionBar
          status={auction?.status ?? ''}
          verifyByPlatform={auction?.verifyByPlatform}
          itemStatus={item?.status}
          isMobile={isMobile}
          onEdit={() => navigate(`/seller/items/${item?.id}/edit`)}
          onSubmit={handleSellerSubmit}
          onSetTiming={handleSetTiming}
          onViewDetail={() => { /* already on detail page */ }}
          onCancel={handleSellerCancel}
          onConfigureShipping={() => { shippingForm.resetFields(); setShippingModalOpen(true) }}
          onOfferRunnerUp={() => offerRunnerUp.mutateAsync(id!).then(() => message.success(t('offerRunnerUpSuccess', 'Offer sent')))}
          onRelist={() => { setRelistForm({ qualificationStartAt: null, qualificationEndAt: null, startAt: null, endAt: null }); setRelistModalOpen(true) }}
          isSubmitLoading={submitAuctionMutation.isPending}
          isCancelLoading={cancelAuctionMutation.isPending}
          isOfferRunnerUpLoading={offerRunnerUp.isPending}
          isRelistLoading={relistAuction.isPending}
        />
      )}

      {/* Status explanation banners */}
      {auction.status === AuctionStatus.PaymentDefaulted && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message={t('paymentDefaultedTitle', 'Payment Defaulted')}
          description={t('paymentDefaultedDesc', 'The winning bidder failed to complete payment. The seller may relist this item or offer it to the runner-up.')}
        />
      )}
      {auction.status === AuctionStatus.Terminated && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          message={t('terminatedTitle', 'Auction Terminated')}
          description={t('terminatedDesc', 'This auction was terminated by an administrator. Contact support for details.')}
        />
      )}

      <Row gutter={isDesktop ? [48, 32] : isTablet ? [0, 20] : [0, 12]}>
        {/* ══ LEFT COLUMN ══════════════════════════════════ */}
        <Col xs={24} lg={14}>
          {/* 1. Image Gallery */}
          <ImageGallery
            images={images}
            alt={item.title}
            showOverlayBadges
            isVerified={auction.verifyByPlatform}
            viewCount={viewCount}
            maxThumbnails={isMobile ? 3 : 5}
          />

          {/* 2. Product Title & Subtitle */}
          <div style={{ marginTop: 24 }}>
            <h1
              className="oio-serif"
              style={{ fontSize: isDesktop ? 28 : 24, lineHeight: 1.2, margin: '0 0 8px' }}
            >
              {item.title}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {item.categoryId && <span>{categoryName ?? item.categoryId}</span>}
              {item.categoryId && item.condition && <span>&middot;</span>}
              {item.condition && <StatusBadge status={item.condition} size="small" />}
              {item.createdAt && (
                <>
                  <span>&middot;</span>
                  <span>{formatDate(item.createdAt)}</span>
                </>
              )}
            </div>
          </div>

          {/* 3. Tabs */}
          <div style={{ marginTop: isMobile ? 20 : 32 }}>
            <AuctionDetailTabs
              item={item}
              auction={auction}
              recentBids={recentBids}
              currency={currency}
              bidCount={bidCount}
              isSeller={isSeller}
              categoryName={categoryName}
              sellerUsername={sellerProfile?.storeName}
              qaConnected={hub.connected}
              qaLastSyncedAt={hub.lastSyncedAt}
            />
          </div>
        </Col>

        {/* ══ RIGHT COLUMN ═════════════════════════════════ */}
        <Col xs={24} lg={10} className="oio-fade-in oio-fade-in-delay-1">
          <AuctionSidebar
            auction={auction}
            item={item}
            currentPrice={currentPrice}
            currency={currency}
            minBid={minBid}
            bidIncrement={bidInc}
            bidCount={bidCount}
            watchCount={watchCount}
            viewCount={viewCount}
            endTime={endTime}
            walletBalance={walletBalance}
            insufficientBalance={insufficientBalance}
            bidAmount={bidAmount}
            onBidAmountChange={setBidAmount}
            isActive={isActive}
            isScheduled={isScheduled}
            isTerminal={isTerminal}
            isSeller={isSeller}
            qualState={qualState}
            hubConnected={hub.connected}
            outbid={hub.outbid}
            auctionEnded={hub.auctionEnded}
            isWatching={isWatching}
            onWatch={handleWatch}
            watchLoading={watchMutation.isPending || unwatchMutation.isPending}
            onPlaceBid={handlePlaceBid}
            isPlacingBid={placeBidMutation.isPending}
            myAutoBid={myAutoBid}
            onAutoBidClick={() => {
              setAutoBidMax(myAutoBid?.maxAmount?.amount ?? null)
              setAutoBidModalOpen(true)
            }}
            onPauseAutoBid={async () => {
              try {
                await pauseAutoBidMutation.mutateAsync(id!)
                message.success(t('autoBidPausedMsg', 'Auto-bid paused'))
              } catch { message.error(t('autoBidError', 'Failed')) }
            }}
            onResumeAutoBid={async () => {
              try {
                await resumeAutoBidMutation.mutateAsync(id!)
                message.success(t('autoBidResumedMsg', 'Auto-bid resumed'))
              } catch { message.error(t('autoBidError', 'Failed')) }
            }}
            onModifyAutoBid={() => {
              setAutoBidMax(myAutoBid?.maxAmount?.amount ?? null)
              setAutoBidModalOpen(true)
            }}
            onCancelAutoBid={async () => {
              try {
                await cancelAutoBidMutation.mutateAsync(id!)
                message.success(t('autoBidCancelled', 'Auto-bid cancelled'))
              } catch { message.error(t('autoBidError', 'Failed')) }
            }}
            isPauseLoading={pauseAutoBidMutation.isPending}
            isResumeLoading={resumeAutoBidMutation.isPending}
            isCancelLoading={cancelAutoBidMutation.isPending}
            priceHistory={data?.priceHistory}
            onExpandChart={() => setChartModalOpen(true)}
            qualificationStatus={data?.currentUserParticipant?.qualificationStatus ?? (qualState === 'qualified' ? 'qualified' : undefined)}
            depositStatus={data?.currentUserParticipant?.depositStatus}
            depositAmount={data?.currentUserParticipant?.depositAmount ?? auction.startingPrice?.amount}
            onDeposit={() => {
              if (bidderTerms.hasPending) { bidderTerms.openModal(); return }
              setDepositModalOpen(true)
            }}
            depositLoading={walletDepositMutation.isPending || depositMutation.isPending}
            onBuyNowClick={() => setBuyNowConfirmOpen(true)}
            isBuyNowLoading={buyNowMutation.isPending}
            onCheckoutClick={
              winnerPayNowOrderId
                ? () => navigate(`/checkout/${winnerPayNowOrderId}`)
                : undefined
            }
            currentBuyerOrder={data?.currentBuyerOrder}
            onViewOrderClick={(orderId) => navigate(`/me/orders/${orderId}`)}
            isOrderProvisioning={pollingForOrder}
            onReloadOrder={() => {
              setOrderPollAttempts(0)
              setPollingForOrder(true)
              queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
              refetch()
            }}
            onCountdownEnd={() => {
              if (auction?.status === AuctionStatus.Scheduled) {
                setPendingActivation(true)
                // Optimistic local transition so UI is responsive immediately
                queryClient.setQueryData(queryKeys.auctions.detailFor(id!, detailUserScope), (old: import('@/types').AuctionDetailDto | undefined) =>
                  old ? { ...old, auction: { ...old.auction, status: AuctionStatus.Active } } : old,
                )
              }
              queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
            }}
            serverTimeOffset={hub.serverTimeOffset}
            currentUserId={currentUser?.id}
            currentUserBidState={
              data?.currentUserBidState ??
              (knownPositionFromNav
                ? {
                  position: knownPositionFromNav,
                  isCurrentWinner: knownPositionFromNav === 'won',
                }
                : undefined)
            }
            isMobile={isMobile}
            isDesktop={isDesktop}
            auctionId={id}
            sealedBidInfo={data?.sealedBidInfo}
          />
        </Col>
      </Row>

      {/* Sticky mobile bid bar */}
      {!isDesktop && isActive && qualState === 'qualified' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--color-bg-card)',
            borderTop: '1px solid var(--color-border)',
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          {data?.currentUserBidState?.position === 'outbid' && (
            <div style={{ marginBottom: 8, textAlign: 'center' }}>
              <Typography.Text style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: 13 }}>
                {t('positionOutbid', 'You have been outbid')}
              </Typography.Text>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
            <InputNumber
              style={{ flex: 1, width: '100%', height: 44 }}
              size="large"
              min={minBid}
              step={auction?.bidIncrement?.amount ?? 10000}
              value={bidAmount}
              onChange={(v) => setBidAmount(v)}
              placeholder={formatCurrency(minBid, currency)}
              addonAfter={currency}
              status={bidAmount != null && bidAmount < minBid ? 'error' : undefined}
            />
            <Popconfirm
              title={t('confirmBidTitle', 'Confirm your bid')}
              description={`${t('bidAmount', 'Bid')}: ${formatCurrency(bidAmount ?? 0, currency)}`}
              onConfirm={handlePlaceBid}
              okText={t('confirmBid', 'Confirm')}
              cancelText={t('cancel', 'Cancel')}
              okButtonProps={{ loading: placeBidMutation.isPending }}
              disabled={!bidAmount || bidAmount < minBid || placeBidMutation.isPending}
            >
              <Button
                type="primary"
                block={isMobile}
                loading={placeBidMutation.isPending}
                disabled={!bidAmount || bidAmount < minBid}
                style={{
                  height: 44,
                  padding: isMobile ? undefined : '0 32px',
                  fontWeight: 500,
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('bid', 'Bid')}
              </Button>
            </Popconfirm>
          </div>
          <Typography.Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 4, textAlign: 'center' }}>
            {t('minimumBid', 'Min')}: {formatCurrency(minBid, currency)}
          </Typography.Text>
        </div>
      )}

      {/* Buy-Now Cap Modal — shown when a bid crossed the buy-now ceiling and was capped to buyNowPrice */}
      <Modal
        title={t('buyNowCapTitle', 'Bid exceeded Buy Now price')}
        open={buyNowCapModal.open}
        onCancel={() => setBuyNowCapModal((prev) => ({ ...prev, open: false }))}
        onOk={() => {
          const { orderId } = buyNowCapModal
          setBuyNowCapModal((prev) => ({ ...prev, open: false }))
          if (orderId) {
            navigate(`/checkout/${orderId}`)
          }
        }}
        okText={
          buyNowCapModal.orderId
            ? t('buyNowCapGoToCheckout', 'Go to Checkout')
            : t('close', 'Close')
        }
        cancelButtonProps={{ style: { display: buyNowCapModal.orderId ? undefined : 'none' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Alert
            type="info"
            showIcon
            message={t(
              'buyNowCapExplain',
              'Your bid of {{raw}} met or exceeded the Buy Now price. The auction has been settled at the Buy Now price, and you only need to pay {{payable}}.',
              {
                raw: formatCurrency(buyNowCapModal.rawBid, currency),
                payable: formatCurrency(buyNowCapModal.payableAmount, currency),
              },
            )}
          />
          <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {buyNowCapModal.orderId
              ? t('buyNowCapOrderReady', 'Your order is ready. Proceed to checkout to complete payment.')
              : t('buyNowCapOrderPending', 'Your order is being prepared. You can close this dialog — the checkout option will appear automatically once it is ready.')}
          </Typography.Text>
        </div>
      </Modal>

      {/* Auto-Bid Modal */}
      <Modal
        title={t('configureAutoBid', 'Configure Auto-Bid')}
        open={autoBidModalOpen}
        onCancel={() => setAutoBidModalOpen(false)}
        onOk={handleAutoBid}
        confirmLoading={autoBidMutation.isPending}
        okText={t('confirmAutoBid', 'Confirm Auto-Bid')}
        okButtonProps={{ disabled: !autoBidMax || autoBidMax <= currentPrice }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Typography.Paragraph style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('autoBidExplain', 'The system will automatically place bids on your behalf up to your maximum amount when you are outbid.')}
          </Typography.Paragraph>
          <Alert
            type="warning"
            showIcon
            message={t('autoBidCascadeWarning', 'In competitive situations, multiple auto-bids may fire rapidly. Your entire budget could be used within seconds.')}
            style={{ fontSize: 12 }}
          />
          <div>
            <span className="oio-label" style={{ display: 'block', marginBottom: 6 }}>
              {t('maxAmount', 'Maximum Amount')}
            </span>
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={minBid}
              step={auction?.bidIncrement?.amount ?? 0}
              value={autoBidMax}
              onChange={(v) => setAutoBidMax(v)}
              addonAfter={currency}
            />
            <Typography.Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 4 }}>
              {t('autoBidMinHelp', 'Must be higher than current price')}: {formatCurrency(currentPrice, currency)}
            </Typography.Text>
          </div>
          <div>
            <span className="oio-label" style={{ display: 'block', marginBottom: 6 }}>
              {t('bidIncrement', 'Bid Increment')} <Typography.Text type="secondary" style={{ fontSize: 11 }}>({t('optional', 'optional')})</Typography.Text>
            </span>
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={auction?.bidIncrement?.amount ?? 1000}
              step={auction?.bidIncrement?.amount ?? 1000}
              value={autoBidIncrement}
              onChange={(v) => setAutoBidIncrement(v)}
              addonAfter={currency}
              placeholder={t('autoBidIncrementPlaceholder', 'Default: auction increment ({{amount}})', { amount: formatCurrency(auction?.bidIncrement?.amount ?? 0, currency) })}
            />
            <Typography.Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 4 }}>
              {t('autoBidIncrementHelp', 'Custom step size for each auto-bid. Leave empty to use the auction default.')}
            </Typography.Text>
          </div>
          {autoBidMax && autoBidMax > currentPrice && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(139, 115, 85, 0.06)', border: '1px solid var(--color-border-light)' }}>
              <Typography.Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                {t('autoBidSummary', 'Summary')}
              </Typography.Text>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <div>{t('maxBidAmount', 'Max bid')}: <strong>{formatCurrency(autoBidMax, currency)}</strong></div>
                <div>{t('walletBalance', 'Wallet')}: {formatCurrency(walletBalance, currency)}</div>
                <div>{t('bidIncrementLabel', 'Increment')}: {formatCurrency(autoBidIncrement ?? bidInc, currency)}{autoBidIncrement ? ` (${t('custom', 'custom')})` : ''}</div>
              </div>
            </div>
          )}
          {myAutoBid && (
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('currentAutoBid', 'Current auto-bid max')}: {formatCurrency(myAutoBid?.maxAmount?.amount ?? 0, myAutoBid?.maxAmount?.currency ?? currency)}
            </Typography.Text>
          )}
        </div>
      </Modal>

      {/* Shipping Details Modal */}
      <Modal
        title={t('shippingDetails', 'Shipping Details')}
        open={shippingModalOpen}
        onCancel={() => setShippingModalOpen(false)}
        onOk={async () => {
          try {
            const values = await shippingForm.validateFields()
            await chooseShipping.mutateAsync({ auctionId: id!, ...values })
            message.success(t('shippingSaved', 'Shipping details saved'))
            setShippingModalOpen(false)
            shippingForm.resetFields()
          } catch { message.error(t('shippingError', 'Please fill in all required fields')) }
        }}
        okText={t('confirm', 'Confirm')}
        okButtonProps={{ loading: chooseShipping.isPending }}
        centered
        width={isMobile ? '95%' : 520}
      >
        <ShippingDetailsForm form={shippingForm} />
      </Modal>

      {/* Buy Now Confirmation Modal */}
      <Modal
        title={t('confirmBuyNow', 'Confirm Buy Now')}
        open={buyNowConfirmOpen}
        onCancel={() => setBuyNowConfirmOpen(false)}
        onOk={handleBuyNow}
        okText={t('confirm', 'Confirm')}
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph>
          {t('buyNowConfirmText', 'You are about to purchase this item at the Buy Now price of {{price}}.', {
            price: formatCurrency(auction?.buyNowPrice?.amount ?? 0, currency),
          })}
        </Typography.Paragraph>
      </Modal>

      {/* Auction Deposit Modal */}
      {id && auction && (
        <AuctionDepositModal
          open={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          auctionId={id}
          requiredDepositAmount={auction.startingPrice?.amount ?? 0}
          currency={currency}
        />
      )}

      {/* Relist Auction Modal */}
      <Modal
        title={t('relistAuction', 'Relist Auction')}
        open={relistModalOpen}
        onCancel={() => setRelistModalOpen(false)}
        onOk={async () => {
          if (!relistForm.qualificationStartAt || !relistForm.qualificationEndAt || !relistForm.startAt || !relistForm.endAt) return
          try {
            const result = await relistAuction.mutateAsync({
              auctionId: id ?? '',
              qualificationStartAt: relistForm.qualificationStartAt.toISOString(),
              qualificationEndAt: relistForm.qualificationEndAt.toISOString(),
              startAt: relistForm.startAt.toISOString(),
              endAt: relistForm.endAt.toISOString(),
            })
            message.success(t('relistSuccess', 'Auction relisted'))
            setRelistModalOpen(false)
            if (result.id) navigate(`/auctions/${result.id}`)
          } catch {
            message.error(t('relistError', 'Failed to relist auction'))
          }
        }}
        okText={t('confirmRelist', 'Relist')}
        okButtonProps={{
          loading: relistAuction.isPending,
          disabled: !relistForm.qualificationStartAt || !relistForm.qualificationEndAt || !relistForm.startAt || !relistForm.endAt,
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        centered
        width={480}
      >
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              {t('qualificationStart', 'Qualification Start')} *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.qualificationStartAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, qualificationStartAt: v }))}
              placeholder={t('selectStartTime', 'Select start time')}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              {t('qualificationEnd', 'Qualification End')} *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.qualificationEndAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, qualificationEndAt: v }))}
              placeholder={t('selectEndTime', 'Select end time')}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              {t('auctionStart', 'Auction Start')} *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.startAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, startAt: v }))}
              placeholder={t('selectStartTime', 'Select start time')}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              {t('auctionEnd', 'Auction End')} *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.endAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, endAt: v }))}
              placeholder={t('selectEndTime', 'Select end time')}
            />
          </div>
        </Flex>
      </Modal>

      {/* Report Auction Modal */}
      <CreateDisputeModal
        targetType="auction"
        targetId={id!}
        auctionId={id!}
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Cancel Auction Modal */}
      <Modal
        open={cancelModalOpen}
        title={t('cancelAuctionTitle', 'Cancel Auction')}
        onCancel={() => setCancelModalOpen(false)}
        onOk={handleCancelConfirm}
        okText={t('confirm', 'Confirm')}
        okButtonProps={{ danger: true, disabled: !cancelReason.trim(), loading: cancelAuctionMutation.isPending }}
      >
        <Typography.Text style={{ display: 'block', marginBottom: 8 }}>
          {t('cancelReasonLabel', 'Please provide a reason for cancellation:')}
        </Typography.Text>
        <Input.TextArea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
          placeholder={t('cancelReasonPlaceholder', 'Reason for cancellation...')}
        />
      </Modal>

      {/* Set Timing Modal */}
      <Modal
        open={timingModalOpen}
        title={submitPendingTiming ? t('submitAndSetTiming', 'Submit & Set Timing') : t('setTimingTitle', 'Set Auction Timing')}
        onCancel={() => { setTimingModalOpen(false); setSubmitPendingTiming(false) }}
        onOk={handleTimingConfirm}
        okText={submitPendingTiming ? t('submitAndConfirm', 'Submit & Confirm') : t('confirm', 'Confirm')}
        okButtonProps={{
          disabled: !timingForm.startTime || !timingForm.endTime,
          loading: submitAuctionMutation.isPending || setAuctionTimingMutation.isPending,
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div>
            <Typography.Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              {t('qualificationStart', 'Qualification Start')}
            </Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              value={timingForm.qualificationStartAt}
              onChange={(v) => setTimingForm((p) => ({ ...p, qualificationStartAt: v }))}
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            />
          </div>
          <div>
            <Typography.Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              {t('qualificationEnd', 'Qualification End')}
            </Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              value={timingForm.qualificationEndAt}
              onChange={(v) => setTimingForm((p) => ({ ...p, qualificationEndAt: v }))}
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            />
          </div>
          <div>
            <Typography.Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              {t('auctionStart', 'Auction Start')} *
            </Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              value={timingForm.startTime}
              onChange={(v) => setTimingForm((p) => ({ ...p, startTime: v }))}
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            />
          </div>
          <div>
            <Typography.Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
              {t('auctionEnd', 'Auction End')} *
            </Typography.Text>
            <DatePicker
              style={{ width: '100%' }}
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              value={timingForm.endTime}
              onChange={(v) => setTimingForm((p) => ({ ...p, endTime: v }))}
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            />
          </div>
        </div>
      </Modal>

      {/* Expanded Price Chart Modal */}
      <Modal
        open={chartModalOpen}
        onCancel={() => setChartModalOpen(false)}
        title={t('priceHistory', 'Price History')}
        footer={null}
        width={960}
        centered
      >
        {data?.priceHistory && data.priceHistory.length > 0 && (
          <PriceHistoryChart
            priceHistory={data.priceHistory}
            currency={currency}
            mode="expanded"
            enableZoom
          />
        )}
      </Modal>

      <TermsAcceptanceModal
        open={bidderTerms.modalOpen}
        onClose={bidderTerms.closeModal}
        termType="bidder"
        onAccepted={() => {
          message.success(t('termsAcceptedToast', 'Terms accepted. You can place your bid now.'))
        }}
      />
    </div>
  )
}
