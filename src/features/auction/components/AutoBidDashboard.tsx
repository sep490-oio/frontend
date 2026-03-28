import { Typography, Progress, Button, Flex, Popconfirm, Alert } from 'antd'
import {
  RobotOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'
import { AutoBidStatus } from '@/types/enums'

const { Text, Title } = Typography

interface AutoBidDashboardProps {
  autoBid: {
    maxAmount?: { amount: number; currency?: string }
    remainingBudget?: { amount: number; currency?: string }
    totalAutoBids?: number
    isEnabled: boolean
    status?: string
    incrementAmount?: { amount: number; currency?: string }
  }
  currency: string
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onModify: () => void
  onCancel: () => Promise<void>
  isPauseLoading: boolean
  isResumeLoading: boolean
}

function getBudgetColor(percent: number): string {
  if (percent < 50) return 'var(--color-success)'
  if (percent < 80) return '#C4923D'
  return 'var(--color-danger)'
}

export function AutoBidDashboard({
  autoBid,
  currency,
  onPause,
  onResume,
  onModify,
  onCancel,
  isPauseLoading,
  isResumeLoading,
}: AutoBidDashboardProps) {
  const { t } = useTranslation('auction')

  const maxAmount = autoBid.maxAmount?.amount ?? 0
  const remainingBudget = autoBid.remainingBudget?.amount ?? 0
  const usedAmount = maxAmount - remainingBudget
  const usedPercent = maxAmount > 0 ? (usedAmount / maxAmount) * 100 : 0
  const status = autoBid.status ?? (autoBid.isEnabled ? AutoBidStatus.Active : AutoBidStatus.Paused)
  const isActive = status === AutoBidStatus.Active
  const isPaused = status === AutoBidStatus.Paused
  const isTerminal = status === AutoBidStatus.Exhausted || status === AutoBidStatus.Won || status === AutoBidStatus.Outbid

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Flex align="center" gap={12}>
          <RobotOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
          <Title level={5} style={{ margin: 0, letterSpacing: '0.06em' }}>
            AUTO-BID
          </Title>
          <StatusBadge status={status} size="small" />
        </Flex>

        {!isTerminal && (
          isActive ? (
            <Button
              icon={<PauseCircleOutlined />}
              loading={isPauseLoading}
              onClick={onPause}
              size="small"
            >
              {t('autoBid.pause', 'Pause')}
            </Button>
          ) : isPaused ? (
            <Button
              icon={<PlayCircleOutlined />}
              loading={isResumeLoading}
              onClick={onResume}
              size="small"
              type="primary"
            >
              {t('autoBid.resume', 'Resume')}
            </Button>
          ) : null
        )}
      </Flex>

      {/* Budget progress bar */}
      <div style={{ marginBottom: 20 }}>
        <Flex justify="space-between" style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('autoBid.budgetUsed', 'Budget Used')}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: 500 }}>
            {formatCurrency(usedAmount, currency)} / {formatCurrency(maxAmount, currency)}
          </Text>
        </Flex>
        <Progress
          percent={Math.min(usedPercent, 100)}
          showInfo={false}
          strokeColor={getBudgetColor(usedPercent)}
          trailColor="var(--color-border)"
          size="small"
        />
        <Flex justify="flex-end" style={{ marginTop: 2 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {t('autoBid.remaining', 'Remaining')}: {formatCurrency(remainingBudget, currency)}
          </Text>
        </Flex>
      </div>

      {/* Stats */}
      <Flex wrap="wrap" gap={16} style={{ marginBottom: 20 }}>
        <StatItem
          label={t('autoBid.maxAmount', 'Max Amount')}
          value={formatCurrency(maxAmount, currency)}
        />
        <StatItem
          label={t('autoBid.used', 'Used')}
          value={formatCurrency(usedAmount, currency)}
        />
        <StatItem
          label={t('autoBid.remaining', 'Remaining')}
          value={formatCurrency(remainingBudget, currency)}
        />
        {autoBid.incrementAmount && (
          <StatItem
            label={t('autoBid.increment', 'Increment')}
            value={formatCurrency(autoBid.incrementAmount.amount, autoBid.incrementAmount.currency ?? currency)}
          />
        )}
        <StatItem
          label={t('autoBid.totalPlaced', 'Auto-Bids Placed')}
          value={String(autoBid.totalAutoBids ?? 0)}
        />
      </Flex>

      {/* Status alerts */}
      {status === AutoBidStatus.Exhausted && (
        <Alert
          type="warning"
          showIcon
          message={t('autoBid.exhaustedMessage', 'Your auto-bid budget has been fully used.')}
          style={{ marginBottom: 16 }}
        />
      )}
      {status === AutoBidStatus.Won && (
        <Alert
          type="success"
          showIcon
          message={t('autoBid.wonMessage', 'Your auto-bid won the auction!')}
          style={{ marginBottom: 16 }}
        />
      )}
      {status === AutoBidStatus.Outbid && (
        <Alert
          type="error"
          showIcon
          message={t('autoBid.outbidMessage', 'Your auto-bid was outbid.')}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Cascade warning */}
      <Text
        type="secondary"
        style={{
          display: 'block',
          fontSize: 12,
          fontStyle: 'italic',
          marginBottom: 20,
        }}
      >
        {t(
          'autoBid.cascadeWarning',
          'In competitive situations, multiple auto-bids may fire rapidly.',
        )}
      </Text>

      {/* Action buttons */}
      {!isTerminal && (
        <Flex gap={12}>
          <Button icon={<EditOutlined />} onClick={onModify}>
            {t('autoBid.modify', 'Modify')}
          </Button>
          <Popconfirm
            title={t('autoBid.cancelTitle', 'Cancel Auto-Bid')}
            description={t(
              'autoBid.cancelWarning',
              'Cancelling will release any held wallet funds back to your available balance. This action cannot be undone.',
            )}
            onConfirm={onCancel}
            okText={t('common.confirm', 'Confirm')}
            cancelText={t('common.cancel', 'Cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<CloseCircleOutlined />}>
              {t('autoBid.cancel', 'Cancel Auto-Bid')}
            </Button>
          </Popconfirm>
        </Flex>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 100 }}>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
        {label}
      </Text>
      <Text strong style={{ fontSize: 14 }}>
        {value}
      </Text>
    </div>
  )
}
