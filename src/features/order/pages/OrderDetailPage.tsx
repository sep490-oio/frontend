import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import {
  Typography,
  Descriptions,
  Card,
  Button,
  Space,
  Spin,
  Alert,
  App,
  Popconfirm,
  Divider,
  Modal,
  Input,
  Form,
} from 'antd'
import dayjs from 'dayjs'
import { ArrowLeftOutlined, RollbackOutlined, CheckOutlined, CloseOutlined, SendOutlined, WarningOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useOrderById,
  useApproveReturn,
  useRejectReturn,
  useShipReturn,
  useConfirmReturnReceived,
  useCreateSellerReview,
  useAddOrderReturnEvidence,
  useAddOrderReturnEvidenceSeller,
} from '@/features/order/api'
import { ReturnEvidenceUploader } from '@/features/order/components/ReturnEvidenceUploader'
import { ReturnQrDisplayModal } from '@/features/order/components/ReturnQrDisplayModal'
import { OrderReturnEvidenceCategory } from '@/types/enums'
import { CreateDisputeModal } from '@/features/order/components/CreateDisputeModal'
import { useDisputeEligibility } from '@/features/dispute/hooks/useDisputeEligibility'
import { ActiveDisputeBanner } from '@/components/dispute/ActiveDisputeBanner'
// useAcknowledgeReceivedOutboundShipment removed — actions moved to shipment page
// Tooltip removed — no longer used after shipment panel cleanup
import {
  useConfirmSellerOrder,
  useUpdateOrderShipping,
  useMarkOrderPickedUp,
  useMarkOrderOnDelivering,
  useMarkOrderDelivered,
  useCreateSellerDirectShipment,
  useConfirmOrderReceipt,
} from '@/features/order/api'
import { useAddresses, useCurrentUser, useCurrentUserProfile } from '@/features/user/api'
import type { UpdateOrderShippingRequest } from '@/types'
import { SellerRatingForm } from '@/features/order/components/SellerRatingForm'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { SellerPaymentEscrowCard } from '@/features/order/components/SellerPaymentEscrowCard'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { OrderStatusStepper } from '@/components/ui/OrderStatusStepper'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { EscrowTimeline } from '@/features/order/components/EscrowTimeline'
import { OrderActionRow } from '@/features/order/components/OrderActionRow'
import { WarrantyNotice } from '@/features/order/components/WarrantyNotice'
import { OrderStatus, OrderReturnStatus } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { formatDateTime, formatCurrency, formatDateTimeVn } from '@/utils/format'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'

const RETURN_ELIGIBLE_STATUSES = new Set<string>([
  OrderStatus.Delivered,
  OrderStatus.Completed,
])

const SELLER_REPORT_ELIGIBLE_STATUSES = new Set<string>([
  OrderStatus.Paid,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
])

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const prefix = useRoutePrefix()

  const { message } = App.useApp()
  const { user: authUser, isAuthenticated } = useAuth()
  const { data: currentUser } = useCurrentUser()
  const user = currentUser ?? authUser
  const { isMobile } = useBreakpoint()
  const qc = useQueryClient()
  const { data: order, isLoading, error } = useOrderById(id)

  // Poll order detail when status is 'paid' — auto-ship runs async after payment
  useEffect(() => {
    if (order?.status !== 'paid') return
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.detail(id) })
    }, 8000) // poll every 8s
    return () => clearInterval(interval)
  }, [order?.status, id, qc])

  const approveReturn = useApproveReturn()
  const rejectReturn = useRejectReturn()
  const shipReturn = useShipReturn()
  const confirmReturnReceived = useConfirmReturnReceived()
  const createReview = useCreateSellerReview()
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  // Reject return modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Ship return modal state
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipProviderCode, setShipProviderCode] = useState('')
  const [shipTrackingNumber, setShipTrackingNumber] = useState('')

  // Return QR display modal state — shown to the buyer after MarkShipped
  // succeeds, and reopened on demand via the persistent QR card below.
  const [returnQrModalOpen, setReturnQrModalOpen] = useState(false)

  // Evidence mutations for the return flow.
  const addBuyerEvidence = useAddOrderReturnEvidence()
  const addSellerEvidence = useAddOrderReturnEvidenceSeller()

  // Dispute modal state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)

  const { data: eligibility } = useDisputeEligibility('order', id, { enabled: !!id && isAuthenticated })

  const confirmSellerOrder = useConfirmSellerOrder()
  const markPickedUp = useMarkOrderPickedUp()
  const markOnDelivering = useMarkOrderOnDelivering()
  const markDelivered = useMarkOrderDelivered()
  const createDirectShipment = useCreateSellerDirectShipment()
  const confirmOrderReceipt = useConfirmOrderReceipt()
  // Buyer-side shipping edit (see BE flag order.buyerCanUpdateShipping)
  const updateShipping = useUpdateOrderShipping()
  const { data: addresses } = useAddresses()
  const { data: currentProfile } = useCurrentUserProfile()
  const [shippingForm] = Form.useForm<UpdateOrderShippingRequest>()

  // Viewer role is derived from the route prefix FIRST, then cross-checked
  // against ownership. `/seller/orders/:id` → seller view, `/me/orders/:id`
  // → buyer view. If the route does not match the caller's actual relation
  // to the order (e.g. buyer lands on the seller route), we redirect to the
  // correct prefix so buyer-only panels / CTAs render. This prevents the
  // dead-end where the route says "seller" but the viewer is the buyer.
  const routeIsSeller = location.pathname.startsWith('/seller/orders/')
  const routeIsBuyer = location.pathname.startsWith('/me/orders/')
  const ownsAsSeller = !!order && !!user && user.id === order.sellerId
  const ownsAsBuyer = !!order && !!user && user.id === order.buyerId
  const isSeller = routeIsSeller && ownsAsSeller
  const isBuyer = routeIsBuyer && ownsAsBuyer

  useEffect(() => {
    if (!order || !user) return
    if (routeIsSeller && !ownsAsSeller && ownsAsBuyer) {
      navigate(`/me/orders/${order.id}`, { replace: true })
      return
    }
    if (routeIsBuyer && !ownsAsBuyer && ownsAsSeller) {
      navigate(`/seller/orders/${order.id}`, { replace: true })
    }
  }, [order, user, routeIsSeller, routeIsBuyer, ownsAsSeller, ownsAsBuyer, navigate])

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 32 : 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !order) {
    return <Alert type="error" message={t('orderNotFound', 'Order not found')} showIcon />
  }

  const canRequestReturn =
    RETURN_ELIGIBLE_STATUSES.has(order.status) && !order.return

  // When a direct shipment OR warehouse outbound shipment is attached,
  // the buyer delivered-state actions live on their respective shipment
  // pages (direct-shipment panel or QR-gated outbound receive page).
  // Hide the generic legacy CTAs (Accept & Release Funds, Raise Dispute,
  // Request Return, Confirm Delivery for Warranty) while the order is
  // still in the decision/delivery phase. They come back once the order
  // is completed so warranty/return flows still work post-acceptance.
  const hideLegacyDelivered =
    isBuyer &&
    (!!order.directShipment || !!(order as any).warehouseOutboundShipment) &&
    order.status !== OrderStatus.Completed

  // Decision window open helper — buyer can still accept / dispute.
  const decisionWindowEndsAtStr = (order as any).decisionWindowEndsAt as string | undefined
  const decisionWindowOpen =
    !decisionWindowEndsAtStr || new Date(decisionWindowEndsAtStr) > new Date()

  // Bug 3 guard: if an OrderReturn already exists and is in a non-terminal
  // state (buyer is actively returning the goods), the "Inspected and Accept
  // Item" CTA must NOT render — the buyer already rejected the delivery by
  // opening the return. Terminal states re-enable the CTA because a rejected
  // / cancelled / resolved return is effectively closed.
  const RETURN_TERMINAL_STATUSES = new Set<string>([
    OrderReturnStatus.Resolved,
    OrderReturnStatus.Cancelled,
    OrderReturnStatus.Rejected,
  ])
  const hasActiveReturn =
    !!order.return && !RETURN_TERMINAL_STATUSES.has(order.return.status)

  // Shared buyer decision handlers. Passed to both the direct-shipment panel
  // and EscrowTimeline so every surfaced CTA points at the same mutation.
  const handleAcceptRelease = async () => {
    try {
      await confirmOrderReceipt.mutateAsync({ orderId: order.id })
      message.success(
        t('directShipment.confirmAndAccept', 'Inspected and Accept Item'),
      )
      setIsReviewModalOpen(true)
    } catch (e) {
      message.error((e as Error)?.message ?? t('genericError', 'Something went wrong'))
    }
  }
  const handleOpenDispute = () => {
    setDisputeModalOpen(true)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 80px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`${prefix}/orders`)}
          style={{ borderRadius: 10, fontWeight: 600 }}
        >
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <Typography.Title 
          level={2} 
          style={{ 
            margin: 0,
            fontFamily: SANS_FONT,
            fontWeight: 600,
            fontSize: isMobile ? 24 : 32,
            color: 'var(--color-text-primary)'
          }}
        >
          {t('orderDetail', 'Order Detail')} <span style={{ fontFamily: MONO_FONT, color: 'var(--color-accent)', opacity: 0.8 }}>#{order.orderNumber}</span>
        </Typography.Title>
      </div>

      {/* Active dispute banner */}
      <ActiveDisputeBanner
        show={
          !!(order as any).activeDispute ||
          !!(order.warehouseOutboundShipment?.hasActiveDispute) ||
          order.directShipment?.status === 'disputed'
        }
        disputeId={(order as any).activeDispute?.id ?? (order as any).activeDisputeId}
        disputeNumber={(order as any).activeDispute?.disputeNumber}
        disputeStatus={(order as any).activeDispute?.status}
        context={t('order', 'order')}
      />

      {/* Dispute-triggered return banner — buyer must ship item back by
          the deadline set by dispute resolution. Shown only when the return
          was auto-approved (via dispute) and the buyer hasn't shipped yet. */}
      {isBuyer &&
        order.return &&
        order.return.status === OrderReturnStatus.Approved &&
        !order.return.shippedAt &&
        (() => {
          const r = order.return!
          const dueAt = r.buyerDecisionDueAt
          const feePayer = r.shippingFeePayer ?? 'buyer'
          const now = dayjs()
          const due = dueAt ? dayjs(dueAt) : null
          const daysRemaining = due ? due.diff(now, 'day') : null
          const isNearDeadline = due ? due.diff(now) < 3 * 24 * 60 * 60 * 1000 : false

          const dueText = dueAt
            ? formatDateTimeVn(dueAt, 'DD MMM YYYY HH:mm')
            : t('returnBanner.deadlineUnset', 'soon')

          const feePayerLabel =
            feePayer === 'buyer'
              ? t('returnBanner.feePayer.buyer', 'buyer')
              : feePayer === 'seller'
              ? t('returnBanner.feePayer.seller', 'seller')
              : t('returnBanner.feePayer.platform', 'platform')

          return (
            <Alert
              type={isNearDeadline ? 'error' : 'warning'}
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={t('returnBanner.title', 'Action required: ship the item back')}
              description={
                <div>
                  <div>
                    {t(
                      'returnBanner.description',
                      'Ship the item back by {{dueAt}}. Reason: {{reason}}. Return shipping paid by {{feePayer}}.',
                      {
                        dueAt: dueText,
                        reason: r.reasonCode,
                        feePayer: feePayerLabel,
                      },
                    )}
                  </div>
                  {daysRemaining !== null && daysRemaining >= 0 && (
                    <div style={{ marginTop: 4 }}>
                      <strong>
                        {t('returnBanner.daysRemaining', '{{count}} days remaining', { count: daysRemaining })}
                      </strong>
                    </div>
                  )}
                </div>
              }
              action={
                <Button
                  type="primary"
                  size="small"
                  onClick={() => {
                    document
                      .getElementById('return-ship-section')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  {t('returnBanner.action', 'Enter tracking details')}
                </Button>
              }
            />
          )
        })()}

      {/* Escrow decision window banner — suppressed when the direct-shipment
          panel owns the delivered-state CTAs, and for sellers (seller view
          has no buyer action behind the banner). */}
      {isBuyer && !hideLegacyDelivered && order.status === 'delivered' && (order as any).decisionWindowEndsAt && new Date((order as any).decisionWindowEndsAt) > new Date() && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={t('decisionWindowActive', 'Action Required')}
          description={
            <span>
              {t('decisionWindowDesc', 'You have until')} <CountdownTimer endTime={(order as any).decisionWindowEndsAt} size="small" /> {t('decisionWindowDesc2', 'to accept delivery or raise a dispute. After this window, funds will be automatically released to the seller.')}
            </span>
          }
        />
      )}

      {/* Status stepper */}
      <Card 
        style={{ 
          marginBottom: 32,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-sm)'
        }}
        styles={{ body: { padding: isMobile ? 20 : 32 } }}
      >
        <OrderStatusStepper status={order.status} />
      </Card>

      {/* Payment deadline countdown */}
      {order.status === OrderStatus.PendingPayment && order.paymentDueAt && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message={
            <span>
              {t('payBy', 'Pay by')} {formatDateTime(order.paymentDueAt)} —{' '}
              <CountdownTimer endTime={order.paymentDueAt} size="small" /> {t('remaining', 'remaining')}
            </span>
          }
        />
      )}

      {/* Escrow timeline */}
      <EscrowTimeline
        order={order}
        isSeller={isSeller}
        hideBuyerDecisionActions={hideLegacyDelivered || hasActiveReturn}
        onAcceptRelease={isBuyer && !hasActiveReturn ? handleAcceptRelease : undefined}
        onDispute={isBuyer && order.status !== OrderStatus.Completed ? handleOpenDispute : undefined}
      />

      {/* Seller Payment & Escrow card — sourced from /seller/finance/escrow-ledger.
          Surfaces gross paid, fees, expected/actual net payout, hold reason,
          and dispute link so the seller can reason about money for this order
          without leaving the page. */}
      {isSeller && (
        <SellerPaymentEscrowCard orderId={order.id} isMobile={isMobile} />
      )}

      {/* Seller Rating Section — Displayed prominently after completion */}
      {isBuyer && order.status === OrderStatus.Completed && !reviewSubmitted && (
        <Card 
          title={<span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>{t('rateThisSeller', 'Rate this Seller')}</span>}
          style={{ 
            marginBottom: isMobile ? 16 : 24,
            borderRadius: 16,
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Typography.Text type="secondary">
              {t('rateThisSellerDesc', 'Please take a moment to rate your experience with this seller.')}
            </Typography.Text>
            <div>
              <Button type="primary" onClick={() => setIsReviewModalOpen(true)}>
                {t('rateThisSeller', 'Rate this Seller')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Review Modal */}
      <Modal
        open={isReviewModalOpen}
        onCancel={() => setIsReviewModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        width={500}
        closeIcon={null}
        styles={{ 
          body: { 
            padding: 24,
            borderRadius: 24,
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            background: 'var(--color-bg-card)'
          } 
        }}
      >
        <SellerRatingForm
          orderId={order.id}
          loading={createReview.isPending}
          onSubmit={async (data) => {
            try {
              await createReview.mutateAsync(data)
              message.success(t('reviewSubmitted', 'Review submitted successfully'))
              setReviewSubmitted(true)
              setIsReviewModalOpen(false)
            } catch (err) {
              message.error(t('reviewError', 'Failed to submit review'))
            }
          }}
        />
      </Modal>

      {/* Buyer-facing warehouse outbound shipment panel — compact summary.
          All actions now live on /me/outbound-shipments/:shipmentId. */}
      {isBuyer && !!order.warehouseOutboundShipment && (() => {
        const ws = order.warehouseOutboundShipment!
        return (
          <Card
            title={t('warehouseOutbound.title', 'Shipment Detail')}
            style={{ marginBottom: isMobile ? 16 : 24 }}
          >
            <Descriptions column={isMobile ? 1 : { xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label={t('warehouseOutbound.shipmentId', 'Shipment')}>
                <Typography.Text strong copyable={{ text: ws.shipmentId }}>
                  {ws.shipmentId.slice(0, 8)}…
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('statusLabel', 'Status')}>
                <StatusBadge status={ws.status} />
              </Descriptions.Item>
              {ws.clientOrderCode && (
                <Descriptions.Item label={t('warehouseOutbound.internalTracking', 'Internal tracking')}>
                  <Typography.Text copyable style={{ fontFamily: 'monospace' }}>
                    {ws.clientOrderCode}
                  </Typography.Text>
                </Descriptions.Item>
              )}
              {ws.carrierTrackingNumber && (
                <Descriptions.Item label={t('warehouseOutbound.carrierTracking', 'Carrier tracking')}>
                  {ws.carrierTrackingNumber}
                </Descriptions.Item>
              )}
              {ws.externalCarrierName && (
                <Descriptions.Item label={t('warehouseOutbound.carrier', 'Carrier')}>
                  {ws.externalCarrierName}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('warehouseOutbound.provider', 'Provider')}>
                {ws.providerCode}
              </Descriptions.Item>
              {ws.dispatchedAt && (
                <Descriptions.Item label={t('warehouseOutbound.dispatchedAt', 'Dispatched')}>
                  {formatDateTime(ws.dispatchedAt)}
                </Descriptions.Item>
              )}
              {ws.deliveredAt && (
                <Descriptions.Item label={t('warehouseOutbound.deliveredAt', 'Delivered')}>
                  {formatDateTime(ws.deliveredAt)}
                </Descriptions.Item>
              )}
              {ws.buyerReceivedPackageAt && (
                <Descriptions.Item label={t('warehouseOutbound.buyerReceivedAt', 'Received At')}>
                  {formatDateTime(ws.buyerReceivedPackageAt)}
                </Descriptions.Item>
              )}
              {ws.buyerAcceptedAt && (
                <Descriptions.Item label={t('warehouseOutbound.buyerAcceptedAt', 'Accepted At')}>
                  {formatDateTime(ws.buyerAcceptedAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
            {ws.hasActiveDispute && (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 12 }}
                message={t(
                  'warehouseOutbound.activeDispute',
                  'A dispute is already open for this order',
                )}
              />
            )}
            {!ws.hasBuyerReceiptProof && (
              <>
                <div style={{ marginTop: 12 }}>
                  <Typography.Text type="secondary">
                    {t('warehouseOutbound.scanQrGuidance', 'When the parcel arrives, scan the QR on the label to confirm receipt.')}
                  </Typography.Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Button type="link" style={{ paddingLeft: 0 }} onClick={() => navigate(`/me/outbound-shipments/${ws.shipmentId}`)}>
                    {t('warehouseOutbound.viewShipmentTracking', 'View shipment tracking')}
                  </Button>
                </div>
              </>
            )}
            {ws.hasBuyerReceiptProof && (
              <OrderActionRow style={{ marginTop: 16 }}>
                {ws.canAccept && !hasActiveReturn && (
                  <Button type="primary" size="middle" onClick={handleAcceptRelease} loading={confirmOrderReceipt.isPending}>
                    {t('warehouseOutbound.acceptItem', 'Inspected and Accept Item')}
                  </Button>
                )}
                {ws.canOpenDispute && !ws.hasActiveDispute && (
                  <Button danger size="middle" onClick={handleOpenDispute}>
                    {t('warehouseOutbound.reportIssue', 'Report Issue / Open Dispute')}
                  </Button>
                )}
              </OrderActionRow>
            )}
          </Card>
        )
      })()}

      {/* Buyer-facing direct shipment panel — only when the seller uses the
          self-ship flow and a shipment record exists. Mirrors the seller
          fulfillment panel above but in read-only form with buyer actions. */}
      {isBuyer && !!order.directShipment && (() => {
          const ds = order.directShipment!
          const isDelivered = ds.status === 'delivered'
          const isDisputed = ds.status === 'disputed' || !!(order as any).activeDispute
          const canShowActions =
            isDelivered &&
            order.status !== OrderStatus.Completed &&
            !isDisputed &&
            decisionWindowOpen &&
            !hasActiveReturn
          return (
            <Card
              title={t('directShipment.shipmentDetail', 'Shipment Detail')}
              style={{ marginBottom: isMobile ? 16 : 24 }}
            >
              <Descriptions column={isMobile ? 1 : { xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label={t('directShipment.shipmentDetail', 'Shipment')}>
                  <Typography.Text strong copyable={{ text: ds.shipmentIdDisplay }}>
                    {ds.shipmentIdDisplay}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('statusLabel', 'Status')}>
                  <StatusBadge status={ds.status} />
                </Descriptions.Item>
                <Descriptions.Item label={t('directShipment.internalTracking', 'Internal Tracking')}>
                  <Typography.Text copyable style={{ fontFamily: 'monospace' }}>
                    {ds.internalTrackingCode}
                  </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('directShipment.externalCarrier', 'External Carrier')}>
                  {ds.externalCarrierName ?? (
                    <Typography.Text type="secondary">{t('notYetAvailable', 'Chưa có')}</Typography.Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('directShipment.externalTracking', 'External Tracking')}>
                  {ds.externalTrackingCode ?? (
                    <Typography.Text type="secondary">{t('notYetAvailable', 'Chưa có')}</Typography.Text>
                  )}
                </Descriptions.Item>
                {ds.deliveredAt && (
                  <Descriptions.Item label={t('directShipment.deliveredAt', 'Delivered At')}>
                    {formatDateTime(ds.deliveredAt)}
                  </Descriptions.Item>
                )}
                {ds.buyerReceivedPackageAt && (
                  <Descriptions.Item label={t('directShipment.buyerReceivedAt', 'Buyer Received At')}>
                    {formatDateTime(ds.buyerReceivedPackageAt)}
                  </Descriptions.Item>
                )}
                {ds.buyerAcceptedAt && (
                  <Descriptions.Item label={t('directShipment.buyerAcceptedAt', 'Buyer Accepted At')}>
                    {formatDateTime(ds.buyerAcceptedAt)}
                  </Descriptions.Item>
                )}
                {ds.buyerPackageCondition && (
                  <Descriptions.Item label={t('directShipment.packageCondition', 'Package Condition')}>
                    <StatusBadge status={t(`directShipment.conditions.${ds.buyerPackageCondition}`, ds.buyerPackageCondition)} />
                  </Descriptions.Item>
                )}
              </Descriptions>
              {ds.manualReviewRequired && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                  message={t('directShipment.manualReview.title', 'Đơn hàng đang được xem xét thủ công')}
                  description={ds.manualReviewReason ?? undefined}
                />
              )}
              <div style={{ marginTop: 12 }}>
                <OrderActionRow>
                  <Button size="small" icon={<QrcodeOutlined />} onClick={() => navigate('/me/shipments/scan')}>
                    {t('directShipment.scanParcelQr', 'Scan Parcel QR')}
                  </Button>
                  <Button size="small" onClick={() => navigate(`/me/shipments/${ds.id}`)}>
                    {t('directShipment.viewShipment', 'View Shipment')}
                  </Button>
                </OrderActionRow>
                {canShowActions && (
                  <OrderActionRow style={{ marginTop: 8 }}>
                    {!ds.buyerReceivedPackageAt && (ds.buyerDeliveryPhotos?.length ?? 0) === 0 && (
                      <Button
                        type="primary"
                        size="middle"
                        onClick={() => navigate(`/me/shipments/${ds.id}/receive`)}
                      >
                        {t('directShipment.acknowledgeReceived', 'Đã nhận kiện')}
                      </Button>
                    )}
                    <Popconfirm
                      title={t(
                        'directShipment.confirmAndAcceptConfirm',
                        'Xác nhận đã kiểm tra và chấp nhận hàng? Tiền sẽ được giải ngân cho người bán.',
                      )}
                      onConfirm={handleAcceptRelease}
                    >
                      <Button type="primary" size="middle" loading={confirmOrderReceipt.isPending}>
                        {t('directShipment.confirmAndAccept', 'Đã kiểm tra và chấp nhận hàng')}
                      </Button>
                    </Popconfirm>
                    <Button
                      danger
                      size="middle"
                      icon={<WarningOutlined />}
                      onClick={handleOpenDispute}
                    >
                      {t('directShipment.openDispute', 'Issue / Open Dispute')}
                    </Button>
                  </OrderActionRow>
                )}
              </div>
            </Card>
          )
        })()}

      {/* Fallback buyer decision card — for orders without a direct shipment
          record. Buyer still needs a one-click path to accept / dispute and
          reach the shipments hub. Mirrors the direct-shipment panel CTAs
          without the "Đã nhận kiện" acknowledge button (no shipment entity). */}
      {isBuyer && !order.directShipment && !(order as any).warehouseOutboundShipment && order.status === OrderStatus.Delivered && decisionWindowOpen && !(order as any).activeDispute && (
        <Card
          title={t('directShipment.shipmentDetail', 'Shipment Detail')}
          style={{ marginBottom: isMobile ? 16 : 24 }}
        >
          <OrderActionRow>
            <Button size="small" icon={<QrcodeOutlined />} onClick={() => navigate('/me/shipments/scan')}>
              {t('directShipment.scanParcelQr', 'Scan Parcel QR')}
            </Button>
            {!hasActiveReturn && (
              <Popconfirm
                title={t(
                  'directShipment.confirmAndAcceptConfirm',
                  'Xác nhận đã kiểm tra và chấp nhận hàng? Tiền sẽ được giải ngân cho người bán.',
                )}
                onConfirm={handleAcceptRelease}
              >
                <Button type="primary" size="middle" loading={confirmOrderReceipt.isPending}>
                  {t('directShipment.confirmAndAccept', 'Đã kiểm tra và chấp nhận hàng')}
                </Button>
              </Popconfirm>
            )}
            <Button danger size="middle" icon={<WarningOutlined />} onClick={handleOpenDispute}>
              {t('directShipment.openDispute', 'Issue / Open Dispute')}
            </Button>
          </OrderActionRow>
        </Card>
      )}

      {/* Seller fulfillment action panel — only for the seller, at the top
          of the detail page so fulfillment actions are immediately reachable
          without returning to the list. Driven by order.sellerFulfillment
          which is populated by GET /api/orders/{id} for the seller viewer. */}
      {isSeller && order.sellerFulfillment && (
        <Card
          style={{
            marginBottom: isMobile ? 16 : 24,
            borderColor: 'var(--color-accent)',
            background: 'rgba(196, 147, 61, 0.06)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Typography.Text strong style={{ fontSize: 15 }}>
              {t('fulfillmentActions', 'Fulfillment Actions')}
            </Typography.Text>
            {!order.shipping?.isStructured && (
              <Alert
                type="warning"
                showIcon
                message={t('shippingNotStructuredWarn', 'Buyer has not provided a valid shipping address yet.')}
              />
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {order.status === OrderStatus.Paid && (
                <Button
                  type="primary"
                  loading={confirmSellerOrder.isPending}
                  disabled={!order.shipping?.isStructured}
                  onClick={() => {
                    confirmSellerOrder.mutate(
                      { orderId: order.id },
                      {
                        onSuccess: () => message.success(t('orderConfirmed', 'Order confirmed')),
                        onError: () => message.error(t('orderConfirmFailed', 'Failed to confirm order')),
                      },
                    )
                  }}
                >
                  {t('confirmOrder', 'Confirm Order')}
                </Button>
              )}
              {order.status === OrderStatus.Processing && order.sellerFulfillment.hasActiveOutboundShipment && (
                <Button
                  type="primary"
                  onClick={() => {
                    const shipmentId = order.sellerFulfillment?.outboundShipmentId
                    navigate(shipmentId ? `/seller/warehouse/outbound/${shipmentId}` : '/seller/warehouse/outbound')
                  }}
                >
                  {t('viewShipment', 'View Shipment')}
                </Button>
              )}
              {/* Legacy "Create Shipment" CTA suppressed for the self-ship
                  flow — self-ship sellers now use the manual progression
                  buttons below and do not touch outbound shipments. We
                  only surface it for warehouse-managed orders where the
                  "View Shipment" branch above has not already shown the
                  active outbound. In practice that warehouse case is
                  handled by warehouse staff booking the outbound, so the
                  button disappears from the seller UI entirely. */}
              {/* Self-ship: single "Open Shipment" CTA when a direct
                  shipment exists — all progression (dispatch details,
                  Confirm Picked Up, etc.) now lives on the shipment
                  detail page. Create flow kept for orders without a
                  shipment record yet. */}
              {order.sellerFulfillment.fulfillmentFlow === 'seller_self_ship' && (() => {
                const sf = order.sellerFulfillment!
                const ds = order.directShipment
                const useNewFlow = !!ds || !sf.outboundShipmentId
                if (!useNewFlow) return null

                if (ds) {
                  return (
                    <Button
                      type="primary"
                      onClick={() => navigate(`/seller/shipments/${ds.id}`)}
                    >
                      {t('directShipment.openShipment', 'Open Shipment')}
                    </Button>
                  )
                }

                if (order.status === OrderStatus.Processing) {
                  return (
                    <Button
                      type="primary"
                      loading={createDirectShipment.isPending}
                      disabled={!order.shipping?.isStructured}
                      onClick={() => {
                        createDirectShipment.mutate(
                          { orderId: order.id },
                          {
                            onSuccess: (data) => {
                              message.success(t('directShipment.createShipmentSuccess', 'Shipment created'))
                              navigate(`/seller/shipments/${data.id}`)
                            },
                            onError: (e) => message.error((e as Error)?.message ?? t('genericError', 'Something went wrong')),
                          },
                        )
                      }}
                    >
                      {t('directShipment.createShipment', 'Create Shipment')}
                    </Button>
                  )
                }
                return null
              })()}
              {/* Legacy outbound-based self-ship progression fallback */}
              {order.sellerFulfillment.fulfillmentFlow === 'seller_self_ship' &&
                !order.directShipment &&
                !!order.sellerFulfillment.outboundShipmentId &&
                order.status === OrderStatus.Processing && (
                <Button
                  type="primary"
                  loading={markPickedUp.isPending}
                  onClick={() => {
                    markPickedUp.mutate(
                      { orderId: order.id },
                      {
                        onSuccess: () => message.success(t('sellerActions.confirmPickedUp', 'Confirm Picked Up')),
                        onError: (e) => message.error((e as Error)?.message ?? t('genericError', 'Something went wrong')),
                      },
                    )
                  }}
                >
                  {t('sellerActions.confirmPickedUp', 'Confirm Picked Up')}
                </Button>
              )}
              {order.sellerFulfillment.fulfillmentFlow === 'seller_self_ship' &&
                !order.directShipment &&
                !!order.sellerFulfillment.outboundShipmentId &&
                order.status === OrderStatus.PickedUp && (
                <Button
                  type="primary"
                  loading={markOnDelivering.isPending}
                  onClick={() => {
                    markOnDelivering.mutate(
                      { orderId: order.id },
                      {
                        onSuccess: () => message.success(t('sellerActions.confirmOnDelivering', 'Confirm On Delivering')),
                        onError: (e) => message.error((e as Error)?.message ?? t('genericError', 'Something went wrong')),
                      },
                    )
                  }}
                >
                  {t('sellerActions.confirmOnDelivering', 'Confirm On Delivering')}
                </Button>
              )}
              {order.sellerFulfillment.fulfillmentFlow === 'seller_self_ship' &&
                !order.directShipment &&
                !!order.sellerFulfillment.outboundShipmentId &&
                (order.status === OrderStatus.OnDelivering || order.status === OrderStatus.Shipped) && (
                <Button
                  type="primary"
                  loading={markDelivered.isPending}
                  onClick={() => {
                    markDelivered.mutate(
                      { orderId: order.id },
                      {
                        onSuccess: () => message.success(t('sellerActions.markDelivered', 'Mark Delivered')),
                        onError: (e) => message.error((e as Error)?.message ?? t('genericError', 'Something went wrong')),
                      },
                    )
                  }}
                >
                  {t('sellerActions.markDelivered', 'Mark Delivered')}
                </Button>
              )}
              <Typography.Text type="secondary" style={{ fontSize: 12, alignSelf: 'center' }}>
                {order.sellerFulfillment.fulfillmentMode === 'book_outbound'
                  ? t('modeBookOutbound', 'Mode: Platform-supported provider')
                  : t('modeSelfShip', 'Mode: Self-ship')}
              </Typography.Text>

              {/* SLA banner — only for direct-ship orders with a shipByAt deadline */}
              {order.sellerFulfillment.fulfillmentFlow === 'seller_self_ship' && order.sellerFulfillment.shipByAt && (() => {
                const sf = order.sellerFulfillment!
                const isOverdue = sf.isShippingOverdue || dayjs().isAfter(dayjs(sf.shipByAt!))
                const daysLeft = dayjs(sf.shipByAt!).diff(dayjs(), 'day')
                return isOverdue ? (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginTop: 4 }}
                    message={t('sla.overdue', 'Quá hạn')}
                    description={sf.escalationReason ?? t('sla.shipBy', 'Hạn giao') + ': ' + dayjs(sf.shipByAt!).format('DD/MM/YYYY HH:mm')}
                  />
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginTop: 4 }}
                    message={
                      t('sla.shipBy', 'Hạn giao') + ': ' + dayjs(sf.shipByAt!).format('DD/MM/YYYY HH:mm')
                      + ' — ' + t('sla.remainingDays', '{{count}} ngày còn lại', { count: daysLeft })
                    }
                  />
                )
              })()}
            </div>
          </div>
        </Card>
      )}

      {/* Auction item summary — top of the page, from OrderDto.item */}
      {order.item && (
        <Card style={{ marginBottom: isMobile ? 16 : 24 }}>
          <OrderItemSummary item={order.item} variant="card" linkToAuction />
        </Card>
      )}

      {/* Order info */}
      <Card title={t('orderInfo', 'Order Information')} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Descriptions column={isMobile ? 1 : { xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={t('orderNumber', 'Order Number')}>
            {order.orderNumber}
          </Descriptions.Item>
          <Descriptions.Item label={t('statusLabel', 'Status')}>
            <StatusBadge status={order.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('totalAmount', 'Total Amount')}>
            <PriceDisplay amount={order.totalAmount} currency={order.currency} size="small" />
          </Descriptions.Item>
          {order.depositAppliedAmount != null && order.depositAppliedAmount > 0 && (
            <>
              <Descriptions.Item label={t('depositApplied', 'Deposit applied')}>
                <Typography.Text type="success">
                  −{formatCurrency(order.depositAppliedAmount, order.currency)}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('amountDue', 'Amount due')}>
                <Typography.Text strong>
                  {formatCurrency(
                    Math.max(0, (order.totalAmount ?? 0) - (order.depositAppliedAmount ?? 0)),
                    order.currency,
                  )}
                </Typography.Text>
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label={t('currency', 'Currency')}>
            {order.currency}
          </Descriptions.Item>
          <Descriptions.Item label={t('buyer', 'Buyer')}>
            <div>
              <Typography.Text strong>
                {order.buyerDisplayName ?? `${order.buyerId.slice(0, 8)}…`}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                copyable={{ text: order.buyerId }}
                style={{ display: 'block', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}
              >
                {order.buyerId.slice(0, 8)}…
              </Typography.Text>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label={t('seller', 'Seller')}>
            <div>
              <a href={`/sellers/${order.sellerId}`} style={{ fontWeight: 600 }}>
                {order.sellerDisplayName ?? `${order.sellerId.slice(0, 8)}…`}
              </a>
              <Typography.Text
                type="secondary"
                copyable={{ text: order.sellerId }}
                style={{ display: 'block', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}
              >
                {order.sellerId.slice(0, 8)}…
              </Typography.Text>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label={t('createdAt', 'Created')}>
            {formatDateTime(order.createdAt)}
          </Descriptions.Item>
          {order.paymentDueAt && (
            <Descriptions.Item label={t('paymentDueAt', 'Payment Due')}>
              {formatDateTime(order.paymentDueAt)}
            </Descriptions.Item>
          )}
          {order.paidAt && (
            <Descriptions.Item label={t('paidAt', 'Paid At')}>
              {formatDateTime(order.paidAt)}
            </Descriptions.Item>
          )}
          {order.shippedAt && (
            <Descriptions.Item label={t('shippedAt', 'Shipped At')}>
              {formatDateTime(order.shippedAt)}
            </Descriptions.Item>
          )}
          {order.deliveredAt && (
            <Descriptions.Item label={t('deliveredAt', 'Delivered At')}>
              {formatDateTime(order.deliveredAt)}
            </Descriptions.Item>
          )}
          {order.completedAt && (
            <Descriptions.Item label={t('completedAt', 'Completed At')}>
              {formatDateTime(order.completedAt)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Warranty notice — suppressed while the direct shipment panel
          owns the delivered-state CTAs. */}
      {!hideLegacyDelivered && (
        <WarrantyNotice
          orderStatus={order.status}
          deliveredAt={order.deliveredAt}
          confirmedAt={(order as any).confirmedAt}
        />
      )}

      {/* Shipping Information — editable for buyer pre-fulfillment, read-only otherwise */}
      {isBuyer && order.buyerCanUpdateShipping ? (
        <Card title={t('shippingInformation', 'Shipping Information')} style={{ marginBottom: isMobile ? 16 : 24 }}>
          {!order.shipping?.isStructured && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('shippingIncompleteWarn', 'Please confirm your shipping address before the seller begins fulfillment.')}
            />
          )}
          <Form
            form={shippingForm}
            layout="vertical"
            initialValues={(() => {
              // Priority: 1) current structured snapshot 2) default address
              // 3) first address 4) profile fallback.
              if (order.shipping?.isStructured) {
                return {
                  recipientName: order.shipping.recipientName ?? '',
                  phoneNumber: order.shipping.phoneNumber ?? '',
                  street: order.shipping.street ?? '',
                  ward: order.shipping.ward ?? '',
                  district: order.shipping.district ?? '',
                  city: order.shipping.city ?? '',
                  postalCode: order.shipping.postalCode ?? '',
                }
              }
              const def = (addresses ?? []).find((a) => a.isDefault) ?? (addresses ?? [])[0]
              if (def) {
                return {
                  recipientName: def.recipientName,
                  phoneNumber: def.phoneNumber,
                  street: def.street,
                  ward: def.ward,
                  district: def.district,
                  city: def.city,
                  postalCode: def.postalCode ?? '',
                }
              }
              const fullName =
                currentProfile?.fullName ||
                [currentProfile?.firstName, currentProfile?.lastName].filter(Boolean).join(' ').trim() ||
                currentProfile?.displayName ||
                ''
              return {
                recipientName: fullName,
                phoneNumber: '',
                street: '',
                ward: '',
                district: '',
                city: '',
                postalCode: '',
              }
            })()}
          >
            <Form.Item
              name="recipientName"
              label={t('recipientName', 'Recipient Name')}
              rules={[{ required: true, whitespace: true, message: t('recipientRequired', 'Recipient name is required') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label={t('phoneNumber', 'Phone Number')}
              rules={[{ required: true, whitespace: true, message: t('phoneRequired', 'Phone number is required') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="street"
              label={t('street', 'Street Address')}
              rules={[{ required: true, whitespace: true, message: t('streetRequired', 'Street is required') }]}
            >
              <Input />
            </Form.Item>
            <Space wrap size={12} style={{ width: '100%', display: 'flex' }}>
              <Form.Item
                name="ward"
                label={t('ward', 'Ward')}
                style={{ flex: '1 1 180px', marginBottom: 16 }}
                rules={[{ required: true, whitespace: true, message: t('wardRequired', 'Ward is required') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="district"
                label={t('district', 'District')}
                style={{ flex: '1 1 180px', marginBottom: 16 }}
                rules={[{ required: true, whitespace: true, message: t('districtRequired', 'District is required') }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="city"
                label={t('city', 'City / Province')}
                style={{ flex: '1 1 180px', marginBottom: 16 }}
                rules={[{ required: true, whitespace: true, message: t('cityRequired', 'City is required') }]}
              >
                <Input />
              </Form.Item>
            </Space>
            <Form.Item name="postalCode" label={t('postalCode', 'Postal Code (optional)')}>
              <Input />
            </Form.Item>
            <Button
              type="primary"
              loading={updateShipping.isPending}
              onClick={async () => {
                try {
                  const values = await shippingForm.validateFields()
                  await updateShipping.mutateAsync({
                    orderId: order.id,
                    recipientName: values.recipientName.trim(),
                    phoneNumber: values.phoneNumber.trim(),
                    street: values.street.trim(),
                    ward: values.ward.trim(),
                    district: values.district.trim(),
                    city: values.city.trim(),
                    postalCode: values.postalCode?.trim() || undefined,
                  })
                  message.success(t('shippingSaved', 'Shipping information saved'))
                } catch (err) {
                  if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
                    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                    message.error(detail ?? t('shippingSaveError', 'Failed to save shipping information'))
                  }
                }
              }}
            >
              {t('saveShippingInformation', 'Save Shipping Information')}
            </Button>
          </Form>
        </Card>
      ) : order.shipping && order.shipping.isStructured ? (
        <Card title={t('shippingInformation', 'Shipping Information')} style={{ marginBottom: isMobile ? 16 : 24 }}>
          <Descriptions column={isMobile ? 1 : { xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label={t('recipientName', 'Recipient Name')}>
              {order.shipping.recipientName}
            </Descriptions.Item>
            <Descriptions.Item label={t('phoneNumber', 'Phone Number')}>
              {order.shipping.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label={t('street', 'Street Address')} span={isMobile ? 1 : 2}>
              {order.shipping.street}
            </Descriptions.Item>
            <Descriptions.Item label={t('ward', 'Ward')}>
              {order.shipping.ward}
            </Descriptions.Item>
            <Descriptions.Item label={t('district', 'District')}>
              {order.shipping.district}
            </Descriptions.Item>
            <Descriptions.Item label={t('city', 'City / Province')}>
              {order.shipping.city}
            </Descriptions.Item>
            {order.shipping.postalCode && (
              <Descriptions.Item label={t('postalCode', 'Postal Code')}>
                {order.shipping.postalCode}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      ) : null}

      {/* Tracking */}
      {order.trackingNumber && (
        <Card title={t('tracking', 'Tracking')} style={{ marginBottom: isMobile ? 16 : 24 }}>
          <Typography.Text strong>{t('trackingNumber', 'Tracking Number')}: </Typography.Text>
          <Typography.Text copyable>{order.trackingNumber}</Typography.Text>
        </Card>
      )}

      {/* Return section */}
      <Card id="return-ship-section" title={t('returnSection', 'Return')} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {order.return ? (
          <>
            <Descriptions column={isMobile ? 1 : { xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label={t('returnStatus', 'Return Status')}>
                <StatusBadge status={order.return.status} />
              </Descriptions.Item>
              <Descriptions.Item label={t('returnReason', 'Reason')}>
                {order.return.reasonCode}
              </Descriptions.Item>
              {order.return.description && (
                <Descriptions.Item label={t('returnDescription', 'Description')} span={2}>
                  {order.return.description}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('returnCreatedAt', 'Requested At')}>
                {formatDateTime(order.return.requestedAt)}
              </Descriptions.Item>
              {order.return.approvedAt && (
                <Descriptions.Item label={t('returnApprovedAt', 'Approved At')}>
                  {formatDateTime(order.return.approvedAt)}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Return QR label — surfaced UPFRONT at Approved time so the
                 buyer can print the label and attach it to the parcel BEFORE
                 booking the courier. Backed by BE `OrderReturn.QrToken` which
                 is now stamped at Approve time (dispute + buyer-initiated
                 approval paths). Persistent across subsequent states too. */}
            {isBuyer && order.return.qrToken && (
              order.return.status === OrderReturnStatus.Approved ||
              order.return.status === OrderReturnStatus.ReturnInTransit ||
              order.return.status === OrderReturnStatus.SellerReceived
            ) && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={t('returnQrCard.title', 'Return QR label')}
                  description={t(
                    'returnQrCard.beforeShipHint',
                    'Print this QR label and attach it to your parcel BEFORE shipping. The seller scans it on arrival.',
                  )}
                  action={
                    <Button
                      type="primary"
                      icon={<QrcodeOutlined />}
                      onClick={() => setReturnQrModalOpen(true)}
                    >
                      {t('returnQrCard.open', 'Show QR / Print label')}
                    </Button>
                  }
                />
              </>
            )}

            {/* Return action buttons */}
            {/* ── Chain-of-custody evidence ──────────────────────────
                 Buyer uploads pickup photos while the return is Approved
                 (required before MarkShipped). Seller uploads receipt photos
                 while the return is ReturnInTransit/SellerReceived (required
                 before ConfirmReceived). Mirrors the outbound proof-of-delivery
                 pattern. */}
            {isBuyer && order.return.status === OrderReturnStatus.Approved && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <ReturnEvidenceUploader
                  existingEvidence={(order.return.evidence ?? [])
                    .filter((e) => e.category === OrderReturnEvidenceCategory.PickupByBuyer)
                    .map((e) => ({
                      id: e.id,
                      mediaUpload: { secureUrl: e.mediaUpload.secureUrl },
                    }))}
                  category={OrderReturnEvidenceCategory.PickupByBuyer}
                  minRequired={1}
                  maxPhotos={5}
                  disabled={addBuyerEvidence.isPending || shipReturn.isPending}
                  onUpload={async (mediaUploadId) => {
                    await addBuyerEvidence.mutateAsync({
                      orderId: order.id,
                      returnId: order.return!.id,
                      mediaUploadId,
                      category: OrderReturnEvidenceCategory.PickupByBuyer,
                    })
                  }}
                />
              </>
            )}

            {isSeller &&
              (order.return.status === OrderReturnStatus.ReturnInTransit ||
                order.return.status === OrderReturnStatus.SellerReceived) && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <ReturnEvidenceUploader
                    existingEvidence={(order.return.evidence ?? [])
                      .filter(
                        (e) => e.category === OrderReturnEvidenceCategory.ReceiptBySeller,
                      )
                      .map((e) => ({
                        id: e.id,
                        mediaUpload: { secureUrl: e.mediaUpload.secureUrl },
                      }))}
                    category={OrderReturnEvidenceCategory.ReceiptBySeller}
                    minRequired={1}
                    maxPhotos={5}
                    disabled={addSellerEvidence.isPending || confirmReturnReceived.isPending}
                    onUpload={async (mediaUploadId) => {
                      await addSellerEvidence.mutateAsync({
                        orderId: order.id,
                        returnId: order.return!.id,
                        mediaUploadId,
                        category: OrderReturnEvidenceCategory.ReceiptBySeller,
                      })
                    }}
                  />
                </>
              )}

            <Divider style={{ margin: '16px 0' }} />
            <Space wrap>
              {/* Seller: Approve/Reject when requested */}
              {isSeller && order.return.status === OrderReturnStatus.Requested && (
                <>
                  <Popconfirm
                    title={t('approveReturnConfirm', 'Approve this return request?')}
                    onConfirm={async () => {
                      try {
                        await approveReturn.mutateAsync({ orderId: order.id, returnId: order.return!.id })
                        message.success(t('returnApproved', 'Return approved'))
                      } catch { message.error(t('returnError', 'Action failed')) }
                    }}
                  >
                    <Button type="primary" icon={<CheckOutlined />} loading={approveReturn.isPending}
                      style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                      {t('approveReturn', 'Approve')}
                    </Button>
                  </Popconfirm>
                  <Button danger icon={<CloseOutlined />} loading={rejectReturn.isPending}
                    onClick={() => { setRejectReason(''); setRejectModalOpen(true) }}>
                    {t('rejectReturn', 'Reject')}
                  </Button>
                </>
              )}

              {/* Buyer: Ship return after approval — gated on pickup evidence. */}
              {isBuyer && order.return.status === OrderReturnStatus.Approved && (() => {
                const pickupCount = (order.return.evidence ?? []).filter(
                  (e) => e.category === OrderReturnEvidenceCategory.PickupByBuyer,
                ).length
                const canShip = pickupCount >= 1
                return (
                  <Space direction="vertical" size={4}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={shipReturn.isPending}
                      disabled={!canShip}
                      onClick={() => {
                        setShipProviderCode('')
                        setShipTrackingNumber('')
                        setShipModalOpen(true)
                      }}
                    >
                      {t('shipReturn', 'Ship Return')}
                    </Button>
                    {!canShip && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {t(
                          'shipReturnGate',
                          'Upload at least one pickup photo to enable shipping.',
                        )}
                      </Typography.Text>
                    )}
                  </Space>
                )
              })()}

              {/* Seller: Confirm received — only after scan (SellerReceived) +
                  at least one ReceiptBySeller photo uploaded. Scan step flips
                  status without requiring photos. */}
              {isSeller && order.return.status === OrderReturnStatus.SellerReceived && (() => {
                const receiptCount = (order.return.evidence ?? []).filter(
                  (e) => e.category === OrderReturnEvidenceCategory.ReceiptBySeller,
                ).length
                const canConfirm = receiptCount >= 1
                return (
                  <Space direction="vertical" size={4}>
                    <Popconfirm
                      title={t('confirmReceivedConfirm', 'Confirm you received the returned item?')}
                      disabled={!canConfirm}
                      onConfirm={async () => {
                        try {
                          await confirmReturnReceived.mutateAsync({ orderId: order.id, returnId: order.return!.id })
                          message.success(t('returnReceived', 'Return received confirmed'))
                        } catch { message.error(t('returnError', 'Action failed')) }
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={confirmReturnReceived.isPending}
                        disabled={!canConfirm}
                      >
                        {t('confirmReceived', 'Confirm Received')}
                      </Button>
                    </Popconfirm>
                    {!canConfirm && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {t(
                          'confirmReceivedGate',
                          'Upload at least one receipt photo before confirming.',
                        )}
                      </Typography.Text>
                    )}
                  </Space>
                )
              })()}

              {/* Seller: while return is in transit, direct-confirm is NOT
                  available — the seller must scan the buyer's QR first to
                  flip the status to SellerReceived. Scan action lives on the
                  SellerReturnsPage listing. */}
              {isSeller && order.return.status === OrderReturnStatus.ReturnInTransit && (
                <Alert
                  type="info"
                  showIcon
                  message={t(
                    'scanReturnHint',
                    'Scan the buyer’s return QR from the Returns page to mark this shipment received.',
                  )}
                />
              )}
            </Space>
          </>
        ) : canRequestReturn && !hideLegacyDelivered ? (
          <Button
            type="default"
            size="middle"
            icon={<RollbackOutlined />}
            onClick={() => navigate(`${prefix}/orders/${order.id}/return`)}
          >
            {t('requestReturn', 'Request Return')}
          </Button>
        ) : (
          <Typography.Text type="secondary">
            {t('returnNotEligible', 'Return is not available for this order.')}
          </Typography.Text>
        )}
      </Card>

      {/* Action buttons */}
      <OrderActionRow>
        {isBuyer && order.status === OrderStatus.PendingPayment && (
          <Button type="primary" size="middle" onClick={() => navigate(`/checkout/${order.id}`)}>
            {t('payNow', 'Pay Now')}
          </Button>
        )}
        {isBuyer &&
          !hideLegacyDelivered &&
          RETURN_ELIGIBLE_STATUSES.has(order.status) &&
          order.status !== OrderStatus.Completed &&
          !(order as any).activeDispute && (
            <Button
              danger
              size="middle"
              icon={<WarningOutlined />}
              onClick={() => setDisputeModalOpen(true)}
            >
              {t('openDispute', 'Report Issue / Open Dispute')}
            </Button>
          )}
        {isSeller &&
          SELLER_REPORT_ELIGIBLE_STATUSES.has(order.status) &&
          !(order as any).activeDispute && (
            <Button
              danger
              size="middle"
              icon={<WarningOutlined />}
              onClick={() => setDisputeModalOpen(true)}
            >
              {t('sellerReportIssue', 'Report Buyer Issue')}
            </Button>
          )}
      </OrderActionRow>

      {/* Reject Return Modal */}
      <Modal
        title={t('rejectReturn', 'Reject Return')}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={async () => {
          if (!rejectReason.trim()) return
          try {
            await rejectReturn.mutateAsync({ orderId: order.id, returnId: order.return!.id, reason: rejectReason.trim() })
            message.success(t('returnRejected', 'Return rejected'))
            setRejectModalOpen(false)
          } catch { message.error(t('returnError', 'Action failed')) }
        }}
        okText={tc('action.confirm', 'Confirm')}
        okButtonProps={{ danger: true, loading: rejectReturn.isPending, disabled: !rejectReason.trim() }}
        centered
      >
        <Form layout="vertical">
          <Form.Item label={t('rejectReason', 'Rejection Reason')} required>
            <Input.TextArea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('rejectReasonPlaceholder', 'Nhập lý do từ chối...')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Ship Return Modal */}
      <Modal
        title={t('shipReturn', 'Ship Return')}
        open={shipModalOpen}
        onCancel={() => setShipModalOpen(false)}
        onOk={async () => {
          if (!shipProviderCode.trim() || !shipTrackingNumber.trim()) return
          try {
            const updated = await shipReturn.mutateAsync({
              orderId: order.id,
              returnId: order.return!.id,
              providerCode: shipProviderCode.trim(),
              trackingNumber: shipTrackingNumber.trim(),
            })
            message.success(t('returnShipped', 'Return marked as shipped'))
            setShipModalOpen(false)
            // BE issues the signed QR on MarkShipped — surface it so the buyer
            // can attach the label to the parcel.
            if (updated?.qrToken) {
              setReturnQrModalOpen(true)
            }
          } catch { message.error(t('returnError', 'Action failed')) }
        }}
        okText={tc('action.confirm', 'Confirm')}
        okButtonProps={{ loading: shipReturn.isPending, disabled: !shipProviderCode.trim() || !shipTrackingNumber.trim() }}
        centered
      >
        <Form layout="vertical">
          <Form.Item label={t('carrierCode', 'Carrier Code')} required>
            <Input
              value={shipProviderCode}
              onChange={(e) => setShipProviderCode(e.target.value)}
              placeholder={t('providerCodePlaceholder', 'vd: ghn, ghtk, viettelpost')}
            />
          </Form.Item>
          <Form.Item label={t('trackingCode', 'Tracking Number')} required>
            <Input
              value={shipTrackingNumber}
              onChange={(e) => setShipTrackingNumber(e.target.value)}
              placeholder={t('trackingNumberPlaceholder', 'Nhập mã vận đơn...')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Open Dispute Modal */}
      {eligibility?.canReport && (
        <CreateDisputeModal
          targetType="order"
          targetId={order.id}
          orderId={order.id}
          open={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          eligibility={eligibility}
        />
      )}

      {/* Return QR display — shown after MarkShipped success and reopenable
          via the persistent QR card on the return section above. */}
      {order.return?.qrToken && (
        <ReturnQrDisplayModal
          open={returnQrModalOpen}
          onClose={() => setReturnQrModalOpen(false)}
          qrToken={order.return.qrToken}
          title={t('returnQrCard.title', 'Return QR label')}
          subtitle={t(
            'returnQrCard.subtitle',
            'Attach this label to the parcel before handing it to the carrier.',
          )}
          lines={
            order.return.trackingNumber
              ? [
                  {
                    label: t('trackingCode', 'Tracking Number'),
                    value: order.return.trackingNumber,
                  },
                ]
              : []
          }
        />
      )}
    </div>
  )
}
