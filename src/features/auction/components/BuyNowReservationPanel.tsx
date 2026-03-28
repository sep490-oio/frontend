import { Button, Card, Popconfirm, Space, Tag, Typography } from 'antd'
import {
  DollarOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { BuyNowReservationStatus } from '@/types/enums'
import { formatCurrency as _formatCurrency } from '@/utils/format'

const { Text, Title } = Typography

interface BuyNowReservationPanelProps {
  reservationId: string
  auctionId: string
  status: BuyNowReservationStatus
  amountDue: number
  currency: string
  paymentDeadline: string
  onCancel: (reservationId: string) => void
  cancelLoading?: boolean
}

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  [BuyNowReservationStatus.PendingPayment]: {
    color: 'warning',
    icon: <ClockCircleOutlined />,
    label: 'Pending Payment',
  },
  [BuyNowReservationStatus.Paid]: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: 'Paid',
  },
  [BuyNowReservationStatus.Expired]: {
    color: 'default',
    icon: <ExclamationCircleOutlined />,
    label: 'Expired',
  },
  [BuyNowReservationStatus.Cancelled]: {
    color: 'default',
    icon: <CloseCircleOutlined />,
    label: 'Cancelled',
  },
  [BuyNowReservationStatus.Failed]: {
    color: 'error',
    icon: <ExclamationCircleOutlined />,
    label: 'Failed',
  },
}

export function BuyNowReservationPanel({
  reservationId,
  auctionId,
  status,
  amountDue,
  currency,
  paymentDeadline,
  onCancel,
  cancelLoading = false,
}: BuyNowReservationPanelProps) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[BuyNowReservationStatus.PendingPayment]
  const isPending = status === BuyNowReservationStatus.PendingPayment

  const handlePayNow = () => {
    navigate(`/payment/buy-now/${auctionId}?reservationId=${reservationId}`)
  }

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        border: isPending ? '1px solid var(--color-warning)' : '1px solid var(--color-border)',
        background: isPending ? 'var(--color-warning-bg, #fffbe6)' : undefined,
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            {t('buyNowReservation', 'Buy Now Reservation')}
          </Title>
          <Tag icon={config.icon} color={config.color}>
            {t(`reservationStatus.${status}`, config.label)}
          </Tag>
        </div>

        {/* Amount due */}
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('amountDue', 'Amount Due')}
          </Text>
          <div style={{ marginTop: 4 }}>
            <PriceDisplay price={{ amount: amountDue, currency, symbol: '' }} size="large" />
          </div>
        </div>

        {/* Payment countdown — only show when pending */}
        {isPending && paymentDeadline && (
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('paymentDeadline', 'Payment Deadline')}
            </Text>
            <div style={{ marginTop: 4 }}>
              <CountdownTimer endTime={paymentDeadline} size="default" />
            </div>
          </div>
        )}

        {/* Action buttons */}
        {isPending && (
          <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Popconfirm
              title={t('cancelReservationTitle', 'Cancel Reservation')}
              description={t(
                'cancelReservationDesc',
                'Are you sure you want to cancel this reservation? This action cannot be undone.',
              )}
              onConfirm={() => onCancel(reservationId)}
              okText={t('confirmCancel', 'Yes, Cancel')}
              cancelText={t('keepReservation', 'Keep')}
              okButtonProps={{ danger: true, loading: cancelLoading }}
            >
              <Button
                icon={<CloseCircleOutlined />}
                danger
                disabled={cancelLoading}
              >
                {t('cancelReservation', 'Cancel Reservation')}
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={handlePayNow}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {t('payNow', 'Pay Now')}
            </Button>
          </Space>
        )}

        {/* Paid confirmation */}
        {status === BuyNowReservationStatus.Paid && (
          <Text type="success" style={{ fontSize: 13 }}>
            <CheckCircleOutlined style={{ marginRight: 6 }} />
            {t('paymentCompleted', 'Payment completed successfully. Your order is being processed.')}
          </Text>
        )}

        {/* Expired / Failed info */}
        {(status === BuyNowReservationStatus.Expired || status === BuyNowReservationStatus.Failed) && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            <ExclamationCircleOutlined style={{ marginRight: 6 }} />
            {status === BuyNowReservationStatus.Expired
              ? t('reservationExpired', 'This reservation has expired. The item is available for other buyers.')
              : t('reservationFailed', 'Payment failed. Please try again or contact support.')}
          </Text>
        )}
      </Space>
    </Card>
  )
}
