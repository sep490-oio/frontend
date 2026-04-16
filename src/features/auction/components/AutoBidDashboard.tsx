import { Typography, Progress, Button, Flex, Popconfirm, Alert, Grid } from 'antd'
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
const { useBreakpoint } = Grid

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
  onCancel?: () => Promise<void>
  onCancelAutoBid: () => Promise<void>
  isPauseLoading: boolean
  isResumeLoading: boolean
  isCancelLoading?: boolean
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
  onCancel: _onCancel,
  onCancelAutoBid,
  isPauseLoading,
  isResumeLoading,
  isCancelLoading,
}: AutoBidDashboardProps) {
  const { t } = useTranslation('auction')
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const maxAmount = autoBid.maxAmount?.amount ?? 0
  const remainingBudget = autoBid.remainingBudget?.amount ?? 0
  const usedAmount = maxAmount - remainingBudget
  const usedPercent = maxAmount > 0 ? (usedAmount / maxAmount) * 100 : 0
  const status = autoBid.status ?? (autoBid.isEnabled ? AutoBidStatus.Active : AutoBidStatus.Paused)
  const isActive = status === AutoBidStatus.Active
  const isPaused = status === AutoBidStatus.Paused
  const isTerminal =
    status === AutoBidStatus.Exhausted ||
    status === AutoBidStatus.Won ||
    status === AutoBidStatus.Outbid

  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: isMobile ? 16 : 20,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <RobotOutlined style={{ fontSize: 18, color: 'var(--color-accent)', flexShrink: 0 }} />
          <Title level={5} style={{ margin: 0, letterSpacing: '0.06em', fontSize: 14 }}>
            AUTO-BID
          </Title>
          <StatusBadge status={status} size="small" />
        </Flex>

        {!isTerminal &&
          (isActive ? (
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
          ) : null)}
      </Flex>

      <div style={{ marginBottom: 16 }}>
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

      {/* Stats grid — responsive 2-col on mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '12px 8px',
          marginBottom: 16,
        }}
      >
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
            value={formatCurrency(
              autoBid.incrementAmount.amount,
              autoBid.incrementAmount.currency ?? currency,
            )}
          />
        )}
        <StatItem
          label={t('autoBid.totalPlaced', 'Total Placed')}
          value={String(autoBid.totalAutoBids ?? 0)}
        />
      </div>

      {/* Status alerts */}
      {status === AutoBidStatus.Exhausted && (
        <Alert
          type="warning"
          showIcon
          message={t('autoBid.exhaustedMessage', 'Auto-bid budget is exhausted.')}
          style={{ marginBottom: 12 }}
        />
      )}
      {status === AutoBidStatus.Won && (
        <Alert
          type="success"
          showIcon
          message={t('autoBid.wonMessage', 'Auto-bid has won the auction!')}
          style={{ marginBottom: 12 }}
        />
      )}
      {status === AutoBidStatus.Outbid && (
        <Alert
          type="error"
          showIcon
          message={t('autoBid.outbidMessage', 'Auto-bid has been outbid.')}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Cascade warning */}
      <Text
        type="secondary"
        style={{
          display: 'block',
          fontSize: 11,
          fontStyle: 'italic',
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        {t(
          'autoBid.cascadeWarning',
          'In competitive situations, multiple automatic bids may trigger consecutively.',
        )}
      </Text>

      {/* Action buttons */}
      {!isTerminal && (
        <Flex gap={8} wrap="wrap">
          <Button icon={<EditOutlined />} onClick={onModify} style={{ minHeight: 36 }}>
            {t('autoBid.modify', 'Modify')}
          </Button>
          {isActive && (
            <Popconfirm
              title={t('autoBid.pauseTitle', 'Pause auto-bid')}
              description={t(
                'autoBid.pauseWarning',
                'Pausing will stop automatic bidding but keep your deposit. You can resume at any time.',
              )}
              onConfirm={onPause}
              okText={t('common.confirm', 'Confirm')}
              cancelText={t('common.cancel', 'Cancel')}
            >
              <Button
                icon={<PauseCircleOutlined />}
                loading={isPauseLoading}
                style={{ minHeight: 36 }}
              >
                {t('autoBid.pause', 'Pause')}
              </Button>
            </Popconfirm>
          )}
          {(isActive || isPaused) && (
            <Popconfirm
              title={t('autoBid.cancelTitle', 'Cancel auto-bid')}
              description={t(
                'autoBid.cancelWarning',
                'Canceling will permanently stop automatic bidding and refund your deposit. This action cannot be undone.',
              )}
              onConfirm={onCancelAutoBid}
              okText={t('common.confirm', 'Confirm')}
              cancelText={t('common.cancel', 'Cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={isCancelLoading}
                style={{ minHeight: 36 }}
              >
                {t('autoBid.cancel', 'Cancel')}
              </Button>
            </Popconfirm>
          )}
        </Flex>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Text
        type="secondary"
        style={{ fontSize: 11, display: 'block', marginBottom: 2, lineHeight: 1.3 }}
      >
        {label}
      </Text>
      <Text
        strong
        style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {value}
      </Text>
    </div>
  )
}