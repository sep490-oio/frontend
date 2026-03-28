import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
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
import { ArrowLeftOutlined, RollbackOutlined, CheckOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useOrderById,
  useApproveReturn,
  useRejectReturn,
  useShipReturn,
  useConfirmReturnReceived,
  useCreateSellerReview,
} from '@/features/order/api'
import { SellerRatingForm } from '@/features/order/components/SellerRatingForm'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { OrderStatusStepper } from '@/components/ui/OrderStatusStepper'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { EscrowTimeline } from '@/features/order/components/EscrowTimeline'
import { WarrantyNotice } from '@/features/order/components/WarrantyNotice'
import { OrderStatus, OrderReturnStatus } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { formatDateTime } from '@/utils/format'

const RETURN_ELIGIBLE_STATUSES = new Set<string>([
  OrderStatus.Delivered,
  OrderStatus.Completed,
])

export default function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()

  const { message } = App.useApp()
  const { user } = useAuth()
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

  // Reject return modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Ship return modal state
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipProviderCode, setShipProviderCode] = useState('')
  const [shipTrackingNumber, setShipTrackingNumber] = useState('')

  const isSeller = user?.id === order?.sellerId
  const isBuyer = user?.id === order?.buyerId

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

  return (
    <div style={{ padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/orders`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {t('orderDetail', 'Order Detail')} #{order.orderNumber}
      </Typography.Title>

      {/* Status stepper */}
      <Card style={{ marginBottom: 24 }}>
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
      />

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
          <Descriptions.Item label={t('currency', 'Currency')}>
            {order.currency}
          </Descriptions.Item>
          <Descriptions.Item label={t('buyerId', 'Buyer')}>
            {order.buyerId}
          </Descriptions.Item>
          <Descriptions.Item label={t('sellerId', 'Seller')}>
            {order.sellerId}
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

      {/* Warranty notice */}
      <WarrantyNotice
        orderStatus={order.status}
        deliveredAt={order.deliveredAt}
        confirmedAt={(order as any).confirmedAt}
      />

      {/* Seller Rating */}
      {isBuyer &&
        order.status === OrderStatus.Completed &&
        (order as any).confirmedAt &&
        !(order as any).review &&
        !reviewSubmitted && (
          <Card
            title={t('rateThisSeller', 'Rate this Seller')}
            style={{ marginBottom: isMobile ? 16 : 24 }}
          >
            <SellerRatingForm
              orderId={order.id}
              loading={createReview.isPending}
              onSubmit={async (data) => {
                try {
                  await createReview.mutateAsync(data)
                  message.success(t('reviewSubmitted', 'Review submitted successfully'))
                  setReviewSubmitted(true)
                } catch {
                  message.error(t('reviewError', 'Failed to submit review'))
                }
              }}
            />
          </Card>
        )}

      {/* Tracking */}
      {order.trackingNumber && (
        <Card title={t('tracking', 'Tracking')} style={{ marginBottom: isMobile ? 16 : 24 }}>
          <Typography.Text strong>{t('trackingNumber', 'Tracking Number')}: </Typography.Text>
          <Typography.Text copyable>{order.trackingNumber}</Typography.Text>
        </Card>
      )}

      {/* Return section */}
      <Card title={t('returnSection', 'Return')} style={{ marginBottom: isMobile ? 16 : 24 }}>
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

            {/* Return action buttons */}
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

              {/* Buyer: Ship return after approval */}
              {isBuyer && order.return.status === OrderReturnStatus.Approved && (
                <Button type="primary" icon={<SendOutlined />} loading={shipReturn.isPending}
                  onClick={() => { setShipProviderCode(''); setShipTrackingNumber(''); setShipModalOpen(true) }}>
                  {t('shipReturn', 'Ship Return')}
                </Button>
              )}

              {/* Seller: Confirm received after shipped */}
              {isSeller && order.return.status === OrderReturnStatus.ReturnInTransit && (
                <Popconfirm
                  title={t('confirmReceivedConfirm', 'Confirm you received the returned item?')}
                  onConfirm={async () => {
                    try {
                      await confirmReturnReceived.mutateAsync({ orderId: order.id, returnId: order.return!.id })
                      message.success(t('returnReceived', 'Return received confirmed'))
                    } catch { message.error(t('returnError', 'Action failed')) }
                  }}
                >
                  <Button type="primary" icon={<CheckOutlined />} loading={confirmReturnReceived.isPending}>
                    {t('confirmReceived', 'Confirm Received')}
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </>
        ) : canRequestReturn ? (
          <Button
            type="primary"
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
      <Space>
        {order.status === OrderStatus.PendingPayment && (
          <Button type="primary" onClick={() => navigate(`/checkout/${order.id}`)}>
            {t('payNow', 'Pay Now')}
          </Button>
        )}
      </Space>

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
          <Form.Item label="Lý do từ chối" required>
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
            await shipReturn.mutateAsync({
              orderId: order.id,
              returnId: order.return!.id,
              providerCode: shipProviderCode.trim(),
              trackingNumber: shipTrackingNumber.trim(),
            })
            message.success(t('returnShipped', 'Return marked as shipped'))
            setShipModalOpen(false)
          } catch { message.error(t('returnError', 'Action failed')) }
        }}
        okText={tc('action.confirm', 'Confirm')}
        okButtonProps={{ loading: shipReturn.isPending, disabled: !shipProviderCode.trim() || !shipTrackingNumber.trim() }}
        centered
      >
        <Form layout="vertical">
          <Form.Item label="Mã nhà vận chuyển" required>
            <Input
              value={shipProviderCode}
              onChange={(e) => setShipProviderCode(e.target.value)}
              placeholder={t('providerCodePlaceholder', 'vd: ghn, ghtk, viettelpost')}
            />
          </Form.Item>
          <Form.Item label="Mã vận đơn" required>
            <Input
              value={shipTrackingNumber}
              onChange={(e) => setShipTrackingNumber(e.target.value)}
              placeholder={t('trackingNumberPlaceholder', 'Nhập mã vận đơn...')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
