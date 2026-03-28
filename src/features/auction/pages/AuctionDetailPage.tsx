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
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTermsGate } from '@/features/user/hooks/useTermsGate'
import {
  useAuctionDetail,
  useAuctionBids,
  usePlaceBid,
  useWatchAuction,
  useUnwatchAuction,
  useMyAutoBid,
  useConfigureAutoBid,
  usePauseAutoBid,
  useResumeAutoBid,
  useBuyNow,
  useChooseAuctionShipping,
  useRecordAuctionView,
} from '@/features/auction/api'
import { useWallet, useCreateDepositPayment, useDepositFromWallet } from '@/features/payment/api'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
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
import { AuctionDetailTabs } from '@/features/auction/components/AuctionDetailTabs'
import { AuctionSidebar } from '@/features/auction/components/AuctionSidebar'

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
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()
  const bidderTerms = useTermsGate('bidder')
  const { isAuthenticated } = useAuth()
  const { data: currentUser } = useCurrentUser()

  const { data, isLoading } = useAuctionDetail(id ?? '')
  const { data: bidsData } = useAuctionBids(id ?? '')
  // Only fetch authenticated-user data when logged in (this is a public page)
  const { data: myAutoBid } = useMyAutoBid(isAuthenticated ? (id ?? '') : '')

  const { data: walletData } = useWallet({ enabled: isAuthenticated })
  const { data: categories } = useCategories()
  const categoryName = useMemo(() => {
    if (!categories || !data?.item?.categoryId) return data?.item?.categoryId
    const found = categories.find((c: { id: string; name: string }) => c.id === data?.item?.categoryId)
    return found?.name ?? data?.item?.categoryId
  }, [categories, data?.item?.categoryId])

  const hub = useAuctionHub(id ?? '', data?.item?.id)

  const placeBidMutation = usePlaceBid()
  const watchMutation = useWatchAuction()
  const unwatchMutation = useUnwatchAuction()
  const autoBidMutation = useConfigureAutoBid()
  const pauseAutoBidMutation = usePauseAutoBid()
  const resumeAutoBidMutation = useResumeAutoBid()
  const depositMutation = useCreateDepositPayment()
  const walletDepositMutation = useDepositFromWallet()
  const buyNowMutation = useBuyNow()
  const chooseShipping = useChooseAuctionShipping()
  const [shippingForm] = Form.useForm<ShippingDetailsFormValues>()

  const [bidAmount, setBidAmount] = useState<number | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [autoBidModalOpen, setAutoBidModalOpen] = useState(false)
  const [autoBidMax, setAutoBidMax] = useState<number | null>(null)
  const [buyNowConfirmOpen, setBuyNowConfirmOpen] = useState(false)
  const [shippingModalOpen, setShippingModalOpen] = useState(false)

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

  // ── Derived auction state ──────────────────────────────────────────
  const auction = data?.auction
  const item = data?.item
  const recentBids = bidsData?.items ?? data?.recentBids ?? []
  const isActive = auction?.status === AuctionStatus.Active
  const isScheduled = auction?.status === AuctionStatus.Scheduled
  const currentPrice = hub.priceUpdate?.currentPrice ?? auction?.currentPrice?.amount ?? 0
  const currency = auction?.currency ?? DEFAULT_CURRENCY
  const minBid = auction?.minimumBidAmount?.amount ?? (currentPrice + (auction?.bidIncrement?.amount ?? 0))
  const bidCount = hub.lastBid?.totalBids ?? hub.priceUpdate?.totalBids ?? auction?.bidCount ?? 0
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
    }, 30000)
    return () => clearInterval(interval)
  }, [auction?.status, id, hub.connected])

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
    if (bidderTerms.hasPending) { bidderTerms.redirect(); return }
    if (isSeller) return
    if (!id || !bidAmount) return
    try {
      const result = await placeBidMutation.mutateAsync({ auctionId: id, amount: bidAmount, currency })
      let successMsg = `${t('bidPlaced', 'Bid placed')}: ${formatCurrency(bidAmount, currency)}`

      if (result.autoBidsCascaded > 0) {
        successMsg += `. ${t('autoBidsCascaded', 'Your bid triggered {{count}} auto-bids. Current price: {{price}} VND.', { count: result.autoBidsCascaded, price: formatCurrency(result.finalPrice, currency) })}`
      }

      if (result.wasImmediatelyOutbid) {
        message.warning(successMsg + ` ${t('immediatelyOutbid', 'You were immediately outbid. Consider increasing your bid.')}`)
      } else {
        message.success(successMsg)
      }

      setBidAmount(null)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('bidError', 'Failed to place bid'))
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
      await autoBidMutation.mutateAsync({ auctionId: id, maxAmount: autoBidMax, currency })
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
      // BuyNowCheckoutDto has: reservationId, paymentUrl, expiresAt, buyNowPrice, depositAppliedAmount, amountDue
      if (result.paymentUrl) {
        localStorage.setItem('oio_deposit_auction_id', id)
        window.location.href = result.paymentUrl
      } else {
        message.success(t('buyNowSuccess', 'Buy now successful!'))
      }
      setBuyNowConfirmOpen(false)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('buyNowError', 'Buy now failed'))
    }
  }, [id, buyNowMutation, message, t])

  const handleDeposit = async () => {
    if (bidderTerms.hasPending) { bidderTerms.redirect(); return }
    if (!id || !auction) return
    try {
      const depositAmount = auction.startingPrice?.amount ?? 0
      const result = await depositMutation.mutateAsync({
        amount: depositAmount,
        currency,
        auctionId: id,
        description: `Dat coc dau gia - ${item?.title ?? id}`,
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
    if (bidderTerms.hasPending) { bidderTerms.redirect(); return }
    if (!id || !auction) return
    const depositAmount = auction.startingPrice?.amount ?? 0

    Modal.confirm({
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

  // ── Loading / empty states ──────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 48px' : '24px 24px 80px' }}>
        <Skeleton active paragraph={{ rows: 0 }} style={{ marginBottom: isMobile ? 16 : 32 }} />
        <Row gutter={isMobile ? [0, 16] : [48, 32]}>
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
  const endTime = hub.auctionExtended?.newEndTime ?? auction.endTime

  return (
    <div className="oio-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 48px' : '24px 24px 80px' }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <a onClick={() => navigate('/')}>Home</a> },
          { title: <a onClick={() => navigate('/auctions')}>Auctions</a> },
          { title: item?.title ?? t('auctionDetail', 'Auction Detail') },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/auctions')}
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
        <ArrowLeftOutlined /> Back to Auctions
      </button>

      {/* Seller banner */}
      {isSeller && (
        <div
          style={{
            marginBottom: 24,
            padding: isMobile ? '12px 14px' : '14px 20px',
            borderRadius: 8,
            background: 'rgba(196, 147, 61, 0.08)',
            border: '1px solid rgba(196, 147, 61, 0.2)',
          }}
        >
          <Typography.Text style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: 14 }}>
            {t('yourAuction', 'This is your auction')}
          </Typography.Text>
          <Button
            type="primary"
            size="small"
            style={{ marginTop: 8, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            onClick={() => { shippingForm.resetFields(); setShippingModalOpen(true) }}
          >
            Cấu hình vận chuyển
          </Button>
        </div>
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

      <Row gutter={isMobile ? [0, 16] : [48, 32]}>
        {/* ══ LEFT COLUMN ══════════════════════════════════ */}
        <Col xs={24} lg={14}>
          {/* 1. Image Gallery */}
          <ImageGallery
            images={images}
            alt={item.title}
            showOverlayBadges
            isVerified={auction.verifyByPlatform}
            viewCount={viewCount}
            maxThumbnails={5}
          />

          {/* 2. Product Title & Subtitle */}
          <div style={{ marginTop: 24 }}>
            <h1
              className="oio-serif"
              style={{ fontSize: isMobile ? 22 : 28, lineHeight: 1.2, margin: '0 0 8px' }}
            >
              {item.title}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {item.categoryId && <span>{categoryName ?? item.categoryId}</span>}
              {item.categoryId && item.condition && <span>&middot;</span>}
              {item.condition && <span>{item.condition}</span>}
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
                await pauseAutoBidMutation.mutateAsync(id!)
                message.success(t('autoBidCancelled', 'Auto-bid cancelled'))
              } catch { message.error(t('autoBidError', 'Failed')) }
            }}
            isPauseLoading={pauseAutoBidMutation.isPending}
            isResumeLoading={resumeAutoBidMutation.isPending}
            priceHistory={data?.priceHistory}
            qualificationStatus={data?.currentUserParticipant?.qualificationStatus ?? (qualState === 'qualified' ? 'qualified' : undefined)}
            depositStatus={data?.currentUserParticipant?.depositStatus}
            depositAmount={data?.currentUserParticipant?.depositAmount ?? auction.startingPrice?.amount}
            onDepositWallet={handleWalletDeposit}
            onDepositVnPay={handleDeposit}
            isWalletDepositLoading={walletDepositMutation.isPending}
            isVnPayDepositLoading={depositMutation.isPending}
            onBuyNowClick={() => setBuyNowConfirmOpen(true)}
            isBuyNowLoading={buyNowMutation.isPending}
            onCheckoutClick={() => navigate('/me/orders')}
            onCountdownEnd={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
            }}
            currentUserId={currentUser?.id}
          />
        </Col>
      </Row>

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
          {autoBidMax && autoBidMax > currentPrice && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(139, 115, 85, 0.06)', border: '1px solid var(--color-border-light)' }}>
              <Typography.Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                {t('autoBidSummary', 'Summary')}
              </Typography.Text>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <div>{t('maxBidAmount', 'Max bid')}: <strong>{formatCurrency(autoBidMax, currency)}</strong></div>
                <div>{t('walletBalance', 'Wallet')}: {formatCurrency(walletBalance, currency)}</div>
                <div>{t('bidIncrementLabel', 'Increment')}: {formatCurrency(bidInc, currency)}</div>
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
        title="Thông tin vận chuyển"
        open={shippingModalOpen}
        onCancel={() => setShippingModalOpen(false)}
        onOk={async () => {
          try {
            const values = await shippingForm.validateFields()
            await chooseShipping.mutateAsync({ auctionId: id!, ...values })
            message.success('Đã lưu thông tin vận chuyển')
            setShippingModalOpen(false)
            shippingForm.resetFields()
          } catch { message.error('Vui lòng điền đầy đủ thông tin') }
        }}
        okText="Xác nhận"
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
    </div>
  )
}
