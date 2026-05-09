import { Card, Typography, Tag, Empty, Flex, Skeleton } from 'antd'
import { LockOutlined, LinkOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useActiveDeposits, type ActiveDepositDto } from '@/features/payment/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const { Text } = Typography

/**
 * Displays currently active (held) auction deposits for the buyer.
 * Uses the dedicated `/me/deposits/active` BE endpoint which queries
 * `AuctionDeposit` entities with `Status == Held` — the single source
 * of truth for deposit state.
 */
export function ActiveDepositsPanel() {
  const { t } = useTranslation('payment')
  const { isMobile } = useBreakpoint()
  const { data: activeDeposits, isLoading } = useActiveDeposits()

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Card key={i} styles={{ body: { padding: 16 } }} style={{ borderRadius: 12 }}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>
    )
  }

  if (!activeDeposits || activeDeposits.length === 0) {
    return (
      <Card
        styles={{ body: { padding: isMobile ? 32 : 48, textAlign: 'center' } }}
        style={{
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
        }}
      >
        <Empty
          image={<LockOutlined style={{ fontSize: 48, color: 'var(--color-text-tertiary)' }} />}
          description={
            <div>
              <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>
                {t('activeDeposits.empty', 'No active deposits')}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t('activeDeposits.emptyDesc', 'You have no funds currently held for auction deposits.')}
              </Text>
            </div>
          }
        />
      </Card>
    )
  }

  const totalHeld = activeDeposits.reduce((sum, d) => sum + d.amount, 0)
  const currency = activeDeposits[0]?.currency ?? 'VND'

  return (
    <div>
      {/* Summary bar */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: '12px 16px',
          background: 'var(--color-bg-secondary)',
          borderRadius: 12,
          marginBottom: 16,
          border: '1px solid var(--color-border)',
        }}
      >
        <Flex align="center" gap={8}>
          <LockOutlined style={{ color: 'var(--color-warning)', fontSize: 16 }} />
          <Text strong style={{ fontSize: 14 }}>
            {t('activeDeposits.count', '{{count}} active deposit(s)', { count: activeDeposits.length })}
          </Text>
        </Flex>
        <Text
          strong
          style={{
            fontSize: 16,
            color: 'var(--color-warning)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {formatCurrency(totalHeld, currency)}
        </Text>
      </Flex>

      {/* Deposit cards */}
      <div style={{ display: 'grid', gap: 12 }}>
        {activeDeposits.map((deposit) => (
          <DepositCard key={deposit.depositId} deposit={deposit} />
        ))}
      </div>
    </div>
  )
}

function DepositCard({ deposit }: { deposit: ActiveDepositDto }) {
  const { t } = useTranslation('payment')

  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        transition: 'all 0.2s ease',
      }}
      hoverable
    >
      <Flex justify="space-between" align="flex-start" gap={12}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Auction title */}
          {deposit.auctionTitle ? (
            <Link
              to={`/auctions/${deposit.auctionId}`}
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}
            >
              {deposit.auctionTitle}
            </Link>
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('activeDeposits.depositDesc', 'Auction deposit from wallet for auction {{auctionId}}', {
                auctionId: deposit.auctionId.slice(0, 8),
              })}
            </Text>
          )}

          {/* Event description */}
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
            {t('event.auction_deposit_hold', 'Đặt cọc đấu giá')}
          </Text>

          {/* Time + status */}
          <Flex align="center" gap={8} style={{ marginTop: 8 }}>
            <ClockCircleOutlined style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatDateTime(deposit.createdAt)}
            </Text>
            <Tag color="warning" bordered={false} style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
              {t('activeDeposits.held', 'Held')}
            </Tag>
          </Flex>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <Text
            strong
            style={{
              fontSize: 16,
              color: 'var(--color-warning)',
              fontFamily: 'var(--font-mono)',
              display: 'block',
            }}
          >
            {formatCurrency(deposit.amount, deposit.currency)}
          </Text>
          <Link
            to={`/auctions/${deposit.auctionId}`}
            style={{ fontSize: 11, color: 'var(--color-accent)' }}
          >
            <LinkOutlined style={{ marginRight: 4 }} />
            {t('activeDeposits.viewAuction', 'View Auction')}
          </Link>
        </div>
      </Flex>
    </Card>
  )
}
