import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Typography,
  Row,
  Col,
  Button,
  InputNumber,
  Spin,
  Modal,
  App,
  Flex,
  Tabs,
} from 'antd'
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  ThunderboltOutlined,
  RobotOutlined,
  EyeOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useAuctionDetail,
  useAuctionBids,
  usePlaceBid,
  useWatchAuction,
  useUnwatchAuction,
  useMyAutoBid,
  useConfigureAutoBid,
  useBuyNow,
} from '@/features/auction/api'
import { useWallet, useCreateDepositPayment } from '@/features/payment/api'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/features/user/api'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import { ItemQA } from '@/features/item/components/ItemQA'
import { AuctionStatus } from '@/types/enums'
import { formatCurrency, formatDateTime, formatDate } from '@/utils/format'
import { DEFAULT_CURRENCY, MAX_EXTENSIONS_PER_AUCTION } from '@/utils/constants'

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
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  useAuth() // ensure auth context available
  const { data: currentUser } = useCurrentUser()

  const { data, isLoading } = useAuctionDetail(id ?? '')
  const { data: bidsData } = useAuctionBids(id ?? '')
  const { data: myAutoBid } = useMyAutoBid(id ?? '')

  const { data: walletData } = useWallet()

  const hub = useAuctionHub(id ?? '')

  const placeBidMutation = usePlaceBid()
  const watchMutation = useWatchAuction()
  const unwatchMutation = useUnwatchAuction()
  const autoBidMutation = useConfigureAutoBid()
  const depositMutation = useCreateDepositPayment()
  const buyNowMutation = useBuyNow()

  const [bidAmount, setBidAmount] = useState<number | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [autoBidModalOpen, setAutoBidModalOpen] = useState(false)
  const [autoBidMax, setAutoBidMax] = useState<number | null>(null)
  const [buyNowConfirmOpen, setBuyNowConfirmOpen] = useState(false)

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

  // ── SignalR bid notifications ─────────────────────────────────────
  useEffect(() => {
    if (hub.lastBid) {
      message.info({
        content: `New bid: ${formatCurrency(hub.lastBid.amount, hub.lastBid.currency)}`,
        duration: 3,
      })
    }
  }, [hub.lastBid, message])

  useEffect(() => {
    if (hub.outbid) {
      message.warning({
        content: t('outbidNotification', 'You have been outbid!'),
        duration: 5,
      })
    }
  }, [hub.outbid, message, t])

  const auction = data?.auction
  const item = data?.item
  const recentBids = hub.lastBid ? bidsData?.items ?? data?.recentBids ?? [] : data?.recentBids ?? []
  const isActive = auction?.status === AuctionStatus.Active
  const isScheduled = auction?.status === AuctionStatus.Scheduled

  // Auto-refetch auction data every 10s as fallback while active
  useEffect(() => {
    if (auction?.status !== AuctionStatus.Active) return
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
    }, 10000)
    return () => clearInterval(interval)
  }, [auction?.status, id])

  const currentPrice = hub.priceUpdate?.currentPrice ?? auction?.currentPrice?.amount ?? 0
  const currency = auction?.currency ?? DEFAULT_CURRENCY
  const minBid = auction?.minimumBidAmount?.amount ?? (currentPrice + (auction?.bidIncrement?.amount ?? 0))
  const bidCount = hub.lastBid?.bidCount ?? auction?.bidCount ?? 0
  const watchCount = auction?.watchCount ?? 0
  const viewCount = auction?.viewCount ?? 0
  const walletBalance = walletData?.availableBalance ?? 0
  const insufficientBalance = walletBalance < minBid

  const isSeller = currentUser?.id === auction?.sellerId || currentUser?.id === item?.sellerId

  // Re-evaluate qualification state every second (for countdown + auto-transition)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const qualState = useMemo(
    () =>
      auction
        ? computeQualificationState(
            { ...auction, sellerId: item?.sellerId ?? auction.sellerId ?? '' },
            currentUser?.id,
            isQualified,
          )
        : ('before_window' as QualificationState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auction, item, currentUser?.id, isQualified, tick],
  )

  // ── Handlers ────────────────────────────────────────────────────

  const handlePlaceBid = async () => {
    if (!id || !bidAmount) return
    try {
      await placeBidMutation.mutateAsync({ auctionId: id, amount: bidAmount, currency })
      message.success(t('bidPlaced', 'Bid placed successfully'))
      setBidAmount(null)
    } catch {
      message.error(t('bidError', 'Failed to place bid'))
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
      message.error(detail ?? t('depositError', 'Không thể tạo thanh toán đặt cọc'))
    }
  }

  // Note: BE only supports VnPay for deposit payments (wallet credit + hold happens automatically)

  // ── Loading / empty states ──────────────────────────────────────

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ padding: 120 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!auction || !item) {
    return <EmptyState title={t('notFound', 'Auction not found')} />
  }

  const images = item.images ?? []
  const endTime = hub.auctionExtended?.newEndTime ?? auction.endTime

  return (
    <div className="oio-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
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
          marginBottom: 32,
        }}
      >
        <ArrowLeftOutlined /> Back to Auctions
      </button>

      {/* Seller banner */}
      {isSeller && (
        <div
          style={{
            marginBottom: 24,
            padding: '14px 20px',
            borderRadius: 8,
            background: 'rgba(196, 147, 61, 0.08)',
            border: '1px solid rgba(196, 147, 61, 0.2)',
          }}
        >
          <Typography.Text style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: 14 }}>
            {t('yourAuction', 'Day la phien dau gia cua ban')}
          </Typography.Text>
          {auction.assignedAdminId && (
            <div style={{ marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Admin ID: {auction.assignedAdminId}
              {auction.assignedAt && <> &middot; {formatDateTime(auction.assignedAt)}</>}
            </div>
          )}
          {auction.rejectionCount > 0 && (
            <div style={{ marginTop: 4, fontSize: 13, color: 'var(--color-danger)' }}>
              {t('rejections', 'Tu choi')}: {auction.rejectionCount}
            </div>
          )}
        </div>
      )}

      <Row gutter={[48, 32]}>
        {/* Image gallery — 14/24 */}
        <Col xs={24} lg={14}>
          <ImageGallery images={images} alt={item.title} />
        </Col>

        {/* Info panel — 10/24 */}
        <Col xs={24} lg={10} className="oio-fade-in oio-fade-in-delay-1">
          <div style={{ position: 'sticky', top: 24 }}>

            {/* ── A. Header Section ──────────────────────────── */}
            <Flex gap={8} align="center" wrap="wrap" style={{ marginBottom: 8 }}>
              <StatusBadge status={auction.status} />
              <StatusBadge status={auction.auctionType} />
              {item.condition && <StatusBadge status={item.condition} size="small" />}
            </Flex>

            <h1
              className="oio-serif"
              style={{ fontSize: 28, lineHeight: 1.2, margin: '8px 0 16px' }}
            >
              {item.title}
            </h1>

            <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 20 }} />

            {/* ── B. Price Section ───────────────────────────── */}
            <span className="oio-label" style={{ display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              {t('currentBid', 'CURRENT BID')}
            </span>
            <PriceDisplay amount={currentPrice} currency={currency} size="large" />

            {/* Starting price */}
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {t('startingPrice', 'Gia khoi diem')}: {formatCurrency(auction.startingPrice?.amount ?? 0, currency)}
            </div>

            {/* Reserve indicator */}
            {auction.reservePrice != null && (
              <div style={{ fontSize: 13, marginTop: 4, fontWeight: 500 }}>
                {auction.isReserveMet ? (
                  <span style={{ color: 'var(--color-success)' }}>&#10003; {t('reserveMet', 'Reserve met')}</span>
                ) : (
                  <span style={{ color: 'var(--color-danger)' }}>&#10007; {t('reserveNotMet', 'Reserve not met')}</span>
                )}
              </div>
            )}

            {/* Buy now price */}
            {auction.buyNowPrice != null && (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {t('buyNowPrice', 'Mua ngay')}: {formatCurrency(auction.buyNowPrice.amount, currency)}
              </div>
            )}

            {/* Bid increment */}
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              {t('bidIncrement', 'Buoc gia')}: {formatCurrency(auction.bidIncrement?.amount ?? 0, currency)}
            </div>

            {/* ── C. Timing Section ──────────────────────────── */}
            <div style={{ marginTop: 16 }}>
              {isActive && endTime && (
                <div style={{ marginBottom: 8 }}>
                  <span className="oio-label" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                    {t('timeRemaining', 'Thoi gian con lai')}
                  </span>
                  <CountdownTimer
                    endTime={endTime}
                    size="large"
                    onEnd={() => {
                      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
                    }}
                  />
                </div>
              )}

              {isScheduled && auction.startTime && (
                <div style={{ marginBottom: 8 }}>
                  <span className="oio-label" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                    {t('startsIn', 'Bat dau sau')}
                  </span>
                  <CountdownTimer
                    endTime={auction.startTime}
                    size="large"
                    onEnd={() => {
                      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detail(id!) })
                    }}
                  />
                </div>
              )}

              {auction.startTime && (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {t('startTime', 'Bat dau')}: {formatDateTime(auction.startTime)}
                </div>
              )}
              {auction.endTime && (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {t('endTime', 'Ket thuc')}: {formatDateTime(endTime ?? auction.endTime)}
                </div>
              )}

              {/* Auto-extend info */}
              {auction.autoExtend && (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {t('autoExtend', 'Tu dong gia han')}: {t('yes', 'Co')}, +{auction.extensionMinutes}{t('min', 'min')} (max {MAX_EXTENSIONS_PER_AUCTION}, {t('used', 'da dung')} {auction.extensionCount})
                </div>
              )}
            </div>

            {/* ── D. Qualification/Deposit Section ───────────── */}
            <div
              style={{
                marginTop: 20,
                padding: '16px 20px',
                borderRadius: 8,
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              {qualState === 'before_window' && (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                    {t('depositTitle', 'Dat coc')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    {t('qualificationWindow', 'Thoi gian dang ky')}: {auction.qualificationStartAt ? formatDateTime(auction.qualificationStartAt) : '—'} → {auction.qualificationEndAt ? formatDateTime(auction.qualificationEndAt) : '—'}
                  </div>
                  {auction.qualificationStartAt && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                      {t('registrationOpensIn', 'Dang ky mo sau')}: <CountdownTimer endTime={auction.qualificationStartAt} size="small" />
                    </div>
                  )}
                  <Button
                    type="primary"
                    block
                    disabled
                    icon={<SafetyOutlined />}
                    style={{ height: 44, borderRadius: 8 }}
                  >
                    {t('deposit', 'Dat coc')}
                  </Button>
                </>
              )}

              {qualState === 'window_open' && (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                    {t('depositToJoin', 'Dat coc de tham gia')}
                  </div>
                  {auction.qualificationEndAt && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      {t('registrationClosesIn', 'Cua so dang ky dong sau')}: <CountdownTimer endTime={auction.qualificationEndAt} size="small" />
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                    {t('depositAmount', 'So tien dat coc')}: <strong>{formatCurrency(auction.startingPrice?.amount ?? 0, currency)}</strong>
                  </div>
                  <Button
                    type="primary"
                    block
                    icon={<SafetyOutlined />}
                    onClick={handleDeposit}
                    loading={depositMutation.isPending}
                    style={{
                      height: 48,
                      borderRadius: 8,
                      fontWeight: 500,
                      fontSize: 15,
                      background: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                    }}
                  >
                    {t('depositVnPay', 'Dat coc qua VNPay')}
                  </Button>
                </>
              )}

              {qualState === 'qualified' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--color-success)', fontSize: 18 }}>&#10003;</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-success)' }}>
                      {t('qualified', 'Ban da du dieu kien dau gia')}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      {t('depositPaid', 'Dat coc')}: {formatCurrency(auction.startingPrice?.amount ?? 0, currency)}
                    </div>
                  </div>
                </div>
              )}

              {qualState === 'window_closed' && (
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  {t('qualificationClosed', 'Thoi gian dang ky da ket thuc')}
                </div>
              )}

              {qualState === 'is_seller' && (
                <div style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 500 }}>
                  {t('yourAuctionNote', 'Day la phien dau gia cua ban')}
                </div>
              )}
            </div>

            {/* ── E. Bid Panel (only if qualified AND active) ── */}
            {isActive && (qualState === 'qualified' || isSeller === false) && qualState !== 'is_seller' && qualState !== 'window_closed' && qualState !== 'before_window' && (
              <div style={{ marginTop: 20 }}>
                {insufficientBalance && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: 'rgba(196, 147, 61, 0.06)',
                      border: '1px solid rgba(196, 147, 61, 0.15)',
                    }}
                  >
                    <Typography.Text style={{ color: 'var(--color-accent)', fontWeight: 500, fontSize: 13 }}>
                      {t('insufficientBalance', 'Ban can nap them tien vao vi de dat gia')}{' '}
                      <a
                        onClick={() => navigate('/me/wallet')}
                        style={{ color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {t('goToWallet', 'Di den vi')}
                      </a>
                    </Typography.Text>
                  </div>
                )}
                <InputNumber
                  style={{ width: '100%', height: 52, borderRadius: 8 }}
                  size="large"
                  min={minBid}
                  step={auction.bidIncrement?.amount ?? 0}
                  value={bidAmount}
                  onChange={(v) => setBidAmount(v)}
                  addonAfter={currency}
                  placeholder={formatCurrency(minBid, currency)}
                />
                <Typography.Text
                  style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 4 }}
                >
                  {t('minimumBid', 'Minimum bid')}: {formatCurrency(minBid, currency)}
                </Typography.Text>

                {/* Place Bid */}
                <Button
                  type="primary"
                  block
                  onClick={handlePlaceBid}
                  loading={placeBidMutation.isPending}
                  disabled={!bidAmount || bidAmount < minBid}
                  style={{
                    height: 52,
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 15,
                    marginTop: 12,
                    background: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                  }}
                >
                  {t('placeBid', 'Place Bid')}
                </Button>

                {/* Auto-Bid */}
                <Button
                  block
                  icon={<RobotOutlined />}
                  onClick={() => {
                    setAutoBidMax(myAutoBid?.maxAmount?.amount ?? null)
                    setAutoBidModalOpen(true)
                  }}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    marginTop: 8,
                    color: 'var(--color-text-secondary)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  {t('autoBid', 'Auto-Bid')}
                </Button>

                {/* Buy Now */}
                {auction.buyNowPrice != null && (
                  <Button
                    block
                    icon={<ThunderboltOutlined />}
                    onClick={() => setBuyNowConfirmOpen(true)}
                    style={{
                      height: 52,
                      borderRadius: 8,
                      marginTop: 8,
                      borderColor: 'var(--color-accent)',
                      color: 'var(--color-accent)',
                      fontWeight: 500,
                    }}
                  >
                    {t('buyNow', 'Buy Now')} &mdash; {formatCurrency(auction.buyNowPrice?.amount ?? 0, currency)}
                  </Button>
                )}
              </div>
            )}

            {/* ── F. Stats Section ───────────────────────────── */}
            <div
              style={{
                marginTop: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px 16px',
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {t('bids', 'Bids')}: <strong>{bidCount}</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <EyeOutlined style={{ marginRight: 4 }} />{t('views', 'Views')}: <strong>{viewCount}</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <HeartOutlined style={{ marginRight: 4 }} />{tc('watching', 'Watching')}: <strong>{watchCount}</strong>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {t('extensions', 'Extensions')}: <strong>{auction.extensionCount}/{MAX_EXTENSIONS_PER_AUCTION}</strong>
              </div>
            </div>

            {/* ── G. Watch Button ────────────────────────────── */}
            <Button
              type="text"
              icon={isWatching ? <HeartFilled style={{ color: '#C4513D' }} /> : <HeartOutlined />}
              onClick={handleWatch}
              loading={watchMutation.isPending || unwatchMutation.isPending}
              style={{
                marginTop: 12,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {isWatching ? t('unwatch', 'Watching') : t('watch', 'Watch')}
            </Button>

            {/* Outbid warning */}
            {hub.outbid && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'rgba(196, 81, 61, 0.06)',
                  border: '1px solid rgba(196, 81, 61, 0.15)',
                }}
              >
                <Typography.Text style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
                  {t('outbidWarning', 'You have been outbid!')} {t('newPrice', 'New price')}: {formatCurrency(hub.outbid.newAmount, hub.outbid.currency)}
                </Typography.Text>
              </div>
            )}

            {/* Auction ended */}
            {hub.auctionEnded && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: 'rgba(74, 124, 89, 0.06)',
                  border: '1px solid rgba(74, 124, 89, 0.15)',
                }}
              >
                <Typography.Text style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                  {t('auctionEnded', 'Auction has ended!')}
                  {hub.auctionEnded.winnerName && (
                    <> {t('winner', 'Winner')}: {hub.auctionEnded.winnerName} &mdash; {formatCurrency(hub.auctionEnded.finalPrice, hub.auctionEnded.currency)}</>
                  )}
                </Typography.Text>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Below fold — Tabs */}
      <div style={{ marginTop: 64 }}>
        <Tabs
          defaultActiveKey="description"
          items={[
            {
              key: 'description',
              label: t('description', 'Description'),
              children: item.description ? (
                <Typography.Paragraph
                  style={{ whiteSpace: 'pre-wrap', maxWidth: 720, lineHeight: 1.8 }}
                >
                  {item.description}
                </Typography.Paragraph>
              ) : (
                <Typography.Text type="secondary">{t('noDescription', 'No description available.')}</Typography.Text>
              ),
            },
            {
              key: 'condition',
              label: t('condition', 'Condition'),
              children: (
                <div>
                  <Flex gap={8} align="center" style={{ marginBottom: 12 }}>
                    <StatusBadge status={item.condition} />
                  </Flex>
                  <Typography.Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    {t('conditionDetails', 'Trang thai san pham theo danh gia cua nha dau gia.')}
                  </Typography.Text>
                </div>
              ),
            },
            {
              key: 'priceHistory',
              label: t('priceHistory', 'Price History'),
              children: (
                <PriceHistoryChart
                  priceHistory={data?.priceHistory ?? []}
                  currency={currency}
                />
              ),
            },
            {
              key: 'bidHistory',
              label: t('bidHistory', 'Bid History'),
              children: recentBids.length === 0 ? (
                <Typography.Text type="secondary">{t('noBids', 'No bids yet')}</Typography.Text>
              ) : (
                <div style={{ maxWidth: 600 }}>
                  {recentBids.map((bid, idx) => (
                    <Flex
                      key={idx}
                      justify="space-between"
                      align="center"
                      style={{
                        padding: '12px 0',
                        borderBottom: idx < recentBids.length - 1 ? '1px solid var(--color-border-light)' : undefined,
                      }}
                    >
                      <Flex gap={8} align="center">
                        <span className="oio-price" style={{ fontSize: 15 }}>
                          {formatCurrency(bid.amount?.amount ?? 0, bid.amount?.currency ?? currency)}
                        </span>
                        {bid.isAutoBid && <StatusBadge status="auto" size="small" />}
                        <StatusBadge status={bid.status} size="small" />
                      </Flex>
                      <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {formatDateTime(bid.createdAt)}
                      </Typography.Text>
                    </Flex>
                  ))}
                </div>
              ),
            },
            {
              key: 'itemDetails',
              label: t('itemDetails', 'Item Details'),
              children: (
                <div style={{ maxWidth: 600 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px 16px', fontSize: 14 }}>
                    {item.categoryId && (
                      <>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{t('category', 'Category')}</span>
                        <span>{item.categoryId}</span>
                      </>
                    )}
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('quantity', 'Quantity')}</span>
                    <span>{item.quantity ?? 1}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('itemStatus', 'Item Status')}</span>
                    <span>{item.status ? <StatusBadge status={item.status} size="small" /> : '—'}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('createdAt', 'Created')}</span>
                    <span>{item.createdAt ? formatDate(item.createdAt) : '—'}</span>
                  </div>
                </div>
              ),
            },
            {
              key: 'qna',
              label: t('qna', 'Q&A'),
              children: (
                <ItemQA itemId={item.id} isSeller={isSeller} />
              ),
            },
          ]}
        />
      </div>

      {/* Auto-Bid Modal */}
      <Modal
        title={t('configureAutoBid', 'Configure Auto-Bid')}
        open={autoBidModalOpen}
        onCancel={() => setAutoBidModalOpen(false)}
        onOk={handleAutoBid}
        confirmLoading={autoBidMutation.isPending}
        okButtonProps={{ disabled: !autoBidMax || autoBidMax <= currentPrice }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Typography.Paragraph style={{ margin: 0 }}>
            {t('autoBidExplain', 'Set a maximum amount and the system will automatically bid for you up to that limit.')}
          </Typography.Paragraph>
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
          </div>
          {myAutoBid && (
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('currentAutoBid', 'Current auto-bid max')}: {formatCurrency(myAutoBid?.maxAmount?.amount ?? 0, myAutoBid?.maxAmount?.currency ?? currency)}
            </Typography.Text>
          )}
        </div>
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
