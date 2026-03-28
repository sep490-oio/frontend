import { useMemo } from 'react'
import { Card, Steps, Button, Popconfirm, Typography, Alert, Descriptions } from 'antd'
import {
  DollarOutlined,
  SafetyOutlined,
  CarOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { EscrowStatus, OrderStatus as _OrderStatus } from '@/types/enums'
import dayjs from 'dayjs'

export interface EscrowTimelineProps {
  order: {
    totalAmount?: number
    depositAppliedAmount?: number
    amountPaid?: number
    platformFee?: number
    currency?: string
    escrowStatus?: string
    paidAt?: string
    shippedAt?: string
    deliveredAt?: string
    completedAt?: string
    createdAt?: string
    decisionWindowEndsAt?: string
    status?: string
  }
  isSeller?: boolean
  onAcceptRelease?: () => void
  onDispute?: () => void
}

function getTimelineStepStatus(date?: string): 'finish' | 'wait' {
  return date ? 'finish' : 'wait'
}

function getDecisionWindowStatus(
  order: EscrowTimelineProps['order'],
): 'finish' | 'process' | 'wait' {
  if (order.completedAt || order.escrowStatus === EscrowStatus.ReleasedToSeller || order.escrowStatus === EscrowStatus.RefundedToBuyer) {
    return 'finish'
  }
  if (order.deliveredAt && order.decisionWindowEndsAt) {
    return 'process'
  }
  return 'wait'
}

function getRemainingHours(endDate: string): number {
  const diff = dayjs(endDate).diff(dayjs(), 'hour', true)
  return Math.max(0, Math.ceil(diff))
}

export function EscrowTimeline({ order, isSeller, onAcceptRelease, onDispute }: EscrowTimelineProps) {
  const { t } = useTranslation('order')
  const currency = order.currency ?? 'VND'

  const decisionWindowActive = useMemo(() => {
    if (!order.deliveredAt || !order.decisionWindowEndsAt) return false
    if (order.completedAt) return false
    if (order.escrowStatus === EscrowStatus.ReleasedToSeller || order.escrowStatus === EscrowStatus.RefundedToBuyer) return false
    return dayjs(order.decisionWindowEndsAt).isAfter(dayjs())
  }, [order.deliveredAt, order.decisionWindowEndsAt, order.completedAt, order.escrowStatus])

  const releaseStepStatus = order.escrowStatus === EscrowStatus.ReleasedToSeller || order.escrowStatus === EscrowStatus.RefundedToBuyer
    ? 'finish'
    : 'wait'

  const releaseStepDescription = useMemo(() => {
    if (order.escrowStatus === EscrowStatus.ReleasedToSeller && order.completedAt) {
      return t('escrow.releasedAt', 'Released') + ' — ' + formatDateTime(order.completedAt)
    }
    if (order.escrowStatus === EscrowStatus.RefundedToBuyer && order.completedAt) {
      return t('escrow.refundedAt', 'Refunded') + ' — ' + formatDateTime(order.completedAt)
    }
    return t('escrow.pending', 'Pending')
  }, [order.escrowStatus, order.completedAt, t])

  const decisionStepDescription = useMemo(() => {
    if (order.escrowStatus === EscrowStatus.ReleasedToSeller || order.escrowStatus === EscrowStatus.RefundedToBuyer) {
      return t('escrow.windowClosed', 'Window closed')
    }
    if (decisionWindowActive && order.decisionWindowEndsAt) {
      return t('escrow.endsAt', 'Ends') + ' ' + formatDateTime(order.decisionWindowEndsAt)
    }
    return t('escrow.pending', 'Pending')
  }, [order.escrowStatus, order.decisionWindowEndsAt, decisionWindowActive, t])

  const timelineSteps = [
    {
      title: t('escrow.paymentReceived', 'Payment Received'),
      description: order.paidAt ? formatDateTime(order.paidAt) : t('escrow.pending', 'Pending'),
      status: getTimelineStepStatus(order.paidAt),
      icon: <DollarOutlined />,
    },
    {
      title: t('escrow.escrowCreated', 'Escrow Created'),
      description: order.paidAt ? formatDateTime(order.paidAt) : t('escrow.pending', 'Pending'),
      status: getTimelineStepStatus(order.paidAt),
      icon: <SafetyOutlined />,
    },
    {
      title: t('escrow.shipped', 'Shipped'),
      description: order.shippedAt ? formatDateTime(order.shippedAt) : t('escrow.pending', 'Pending'),
      status: getTimelineStepStatus(order.shippedAt),
      icon: <CarOutlined />,
    },
    {
      title: t('escrow.delivered', 'Delivered'),
      description: order.deliveredAt ? formatDateTime(order.deliveredAt) : t('escrow.pending', 'Pending'),
      status: getTimelineStepStatus(order.deliveredAt),
      icon: <InboxOutlined />,
    },
    {
      title: t('escrow.decisionWindow', 'Decision Window'),
      description: decisionStepDescription,
      status: getDecisionWindowStatus(order),
      icon: <ClockCircleOutlined />,
    },
    {
      title: order.escrowStatus === EscrowStatus.RefundedToBuyer
        ? t('escrow.refunded', 'Refunded')
        : t('escrow.released', 'Released'),
      description: releaseStepDescription,
      status: releaseStepStatus,
      icon: <CheckCircleOutlined />,
    },
  ]

  // Calculate the current step index for Steps component
  const currentStepIndex = timelineSteps.findIndex((s) => s.status !== 'finish')

  return (
    <Card title={t('escrow.title', 'Escrow & Payment Timeline')} style={{ marginBottom: 24 }}>
      {/* Payment breakdown */}
      <Descriptions
        column={{ xs: 1, sm: 2 }}
        size="small"
        bordered
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label={t('escrow.totalAmount', 'Total Amount')}>
          <Typography.Text strong>
            {order.totalAmount != null ? formatCurrency(order.totalAmount, currency) : '—'}
          </Typography.Text>
        </Descriptions.Item>
        {order.depositAppliedAmount != null && (
          <Descriptions.Item label={t('escrow.depositOffset', 'Deposit Offset')}>
            <Typography.Text>
              −{formatCurrency(order.depositAppliedAmount, currency)}
            </Typography.Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('escrow.amountPaid', 'Amount Paid')}>
          <Typography.Text strong style={{ color: 'var(--color-success)' }}>
            {order.amountPaid != null ? formatCurrency(order.amountPaid, currency) : '—'}
          </Typography.Text>
        </Descriptions.Item>
        {order.platformFee != null && (
          <Descriptions.Item label={t('escrow.platformFee', 'Platform Fee')}>
            <Typography.Text type="secondary">
              {formatCurrency(order.platformFee, currency)}
            </Typography.Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Escrow status badge */}
      {order.escrowStatus && (
        <div style={{ marginBottom: 24 }}>
          <Typography.Text type="secondary" style={{ marginRight: 8 }}>
            {t('escrow.statusLabel', 'Escrow Status')}:
          </Typography.Text>
          <StatusBadge status={order.escrowStatus} />
        </div>
      )}

      {/* Disputed alert */}
      {order.escrowStatus === EscrowStatus.Disputed && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={t('escrow.disputedMessage', 'This order is under dispute. Funds are held until resolution.')}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Timeline steps */}
      <Steps
        direction="vertical"
        size="small"
        current={currentStepIndex === -1 ? timelineSteps.length : currentStepIndex}
        items={timelineSteps.map((step) => ({
          title: step.title,
          description: step.status === 'process' && order.decisionWindowEndsAt && decisionWindowActive
            ? (
              <span>
                {step.description} — <CountdownTimer endTime={order.decisionWindowEndsAt} size="small" />
              </span>
            )
            : step.description,
          icon: step.icon,
          status: step.status as 'finish' | 'process' | 'wait',
        }))}
      />

      {/* Decision window section - buyer actions */}
      {!isSeller && decisionWindowActive && order.decisionWindowEndsAt && (
        <div style={{ marginTop: 24 }}>
          <Alert
            type="warning"
            showIcon
            message={
              t(
                'escrow.decisionPrompt',
                { hours: getRemainingHours(order.decisionWindowEndsAt) },
              ) || `You have ${getRemainingHours(order.decisionWindowEndsAt)} hours to accept or raise a dispute`
            }
            description={t(
              'escrow.autoReleaseHint',
              'After the window closes, funds will be automatically released to the seller.',
            )}
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <Popconfirm
              title={t('escrow.confirmRelease', 'Are you sure you want to release funds to the seller?')}
              onConfirm={onAcceptRelease}
              okText={t('escrow.confirmYes', 'Yes, Release')}
              cancelText={t('escrow.confirmNo', 'Cancel')}
            >
              <Button
                type="primary"
                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              >
                {t('escrow.acceptRelease', 'Accept & Release Funds')}
              </Button>
            </Popconfirm>
            <Button onClick={onDispute}>
              {t('escrow.raiseDispute', 'Raise Dispute')}
            </Button>
          </div>
        </div>
      )}

      {/* Seller view - estimated payout */}
      {isSeller && decisionWindowActive && order.decisionWindowEndsAt && (
        <div style={{ marginTop: 24 }}>
          <Alert
            type="info"
            showIcon
            message={
              t('escrow.estimatedPayout', 'Estimated payout') + ': ' + formatDateTime(order.decisionWindowEndsAt)
            }
            description={t(
              'escrow.autoReleaseHint',
              'After the window closes, funds will be automatically released to the seller.',
            )}
          />
        </div>
      )}
    </Card>
  )
}
