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
} from 'antd'
import { ArrowLeftOutlined, RollbackOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useOrderById } from '@/features/order/api'
import { OrderStatusStepper } from '@/components/ui/OrderStatusStepper'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { OrderStatus } from '@/types/enums'
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

  const { data: order, isLoading, error } = useOrderById(id)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
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
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/orders`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('orderDetail', 'Order Detail')} #{order.orderNumber}
      </Typography.Title>

      {/* Status stepper */}
      <Card style={{ marginBottom: 24 }}>
        <OrderStatusStepper status={order.status} />
      </Card>

      {/* Order info */}
      <Card title={t('orderInfo', 'Order Information')} style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
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

      {/* Tracking */}
      {order.trackingNumber && (
        <Card title={t('tracking', 'Tracking')} style={{ marginBottom: 24 }}>
          <Typography.Text strong>{t('trackingNumber', 'Tracking Number')}: </Typography.Text>
          <Typography.Text copyable>{order.trackingNumber}</Typography.Text>
        </Card>
      )}

      {/* Return section */}
      <Card title={t('returnSection', 'Return')} style={{ marginBottom: 24 }}>
        {order.return ? (
          <>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
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
    </div>
  )
}
