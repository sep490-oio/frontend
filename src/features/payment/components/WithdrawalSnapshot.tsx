import { Card, Button, Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { WithdrawalRequestDto } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface WithdrawalSnapshotProps {
  pendingAmount: number
  recentRequest?: WithdrawalRequestDto
  currency?: string
  onViewAll?: () => void
}

export function WithdrawalSnapshot({
  pendingAmount,
  recentRequest,
  currency,
  onViewAll,
}: WithdrawalSnapshotProps) {
  const { t } = useTranslation('payment')

  return (
    <Card
      size="small"
      style={{
        background: 'var(--color-bg-container)',
        backdropFilter: 'var(--oio-blur)',
        WebkitBackdropFilter: 'var(--oio-blur)',
        borderColor: 'var(--color-border)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-sm)',
      }}
      title={
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {t('pendingWithdrawalSnapshot', 'Pending Withdrawals')}
        </span>
      }
      extra={
        onViewAll ? (
          <Button type="link" size="small" onClick={onViewAll}>
            {t('viewAll', 'View all')}
          </Button>
        ) : null
      }
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Typography.Text strong style={{ fontSize: 18 }}>
          {formatCurrency(pendingAmount, currency)}
        </Typography.Text>
        {recentRequest ? (
          <Space size={8} wrap>
            <StatusBadge status={recentRequest.status} size="small" />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatCurrency(recentRequest.amount, currency)} · {formatDateTime(recentRequest.createdAt)}
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('noPendingWithdrawals', 'No pending withdrawal requests')}
          </Typography.Text>
        )}
      </Space>
    </Card>
  )
}

export default WithdrawalSnapshot
