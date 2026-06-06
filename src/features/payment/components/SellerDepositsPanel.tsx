import { Card, Typography, Tag, Empty, Flex, Table, Skeleton, Collapse } from 'antd'
import {
  LockOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useSellerAuctionDeposits } from '@/features/payment/api'
import type { SellerAuctionDepositRowDto, DepositDetailDto } from '@/types/payment'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

const DEPOSIT_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  Held: { color: 'warning', icon: <LockOutlined />, label: 'Held' },
  Returned: { color: 'success', icon: <CheckCircleOutlined />, label: 'Returned' },
  Forfeited: { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Forfeited' },
  ConvertedToPayment: { color: 'processing', icon: <SwapOutlined />, label: 'Converted' },
}

/**
 * Seller view: shows which auctions have deposits, with a breakdown of each bidder deposit.
 */
export function SellerDepositsPanel() {
  const { t } = useTranslation('payment')
  const { isMobile } = useBreakpoint()
  const { data: rows, isLoading } = useSellerAuctionDeposits({ refetchInterval: 30_000 })

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <Card key={i} styles={{ body: { padding: 16 } }} style={{ borderRadius: 12 }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    )
  }

  if (!rows || rows.length === 0) {
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
                {t('sellerDeposits.empty', 'No auction deposits')}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t('sellerDeposits.emptyDesc', 'None of your auctions have any deposits yet.')}
              </Text>
            </div>
          }
        />
      </Card>
    )
  }

  // Summary stats
  const totalActiveDeposits = rows.reduce((sum, r) => sum + r.activeDeposits, 0)
  const totalHeldAmount = rows.reduce((sum, r) => sum + r.totalHeldAmount, 0)
  const currency = rows[0]?.currency ?? 'VND'

  const depositColumns: ColumnsType<DepositDetailDto> = [
    {
      title: t('sellerDeposits.bidder', 'Bidder'),
      dataIndex: 'bidderDisplayName',
      key: 'bidder',
      render: (name: string) => (
        <Flex align="center" gap={6}>
          <UserOutlined style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }} />
          <Text strong style={{ fontSize: 13 }}>{name}</Text>
        </Flex>
      ),
    },
    {
      title: t('sellerDeposits.amount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record) => (
        <Text style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
          {formatCurrency(amount, record.currency)}
        </Text>
      ),
    },
    {
      title: t('sellerDeposits.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const cfg = DEPOSIT_STATUS_CONFIG[status] ?? { color: 'default', icon: null, label: status }
        // Map PascalCase to camelCase/snake_case for translation keys
        const transKey = status === 'ConvertedToPayment' ? 'converted_to_payment' : status.toLowerCase()
        return (
          <Tag color={cfg.color} bordered={false} icon={cfg.icon} style={{ borderRadius: 4 }}>
            {t(`depositStatus.${transKey}`, cfg.label)}
          </Tag>
        )
      },
    },
    {
      title: t('sellerDeposits.date', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {formatDateTime(date)}
        </Text>
      ),
    },
  ]

  return (
    <div>
      {/* Summary bar */}
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={12}
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
            {t('sellerDeposits.summary', '{{auctions}} auction(s), {{deposits}} active deposit(s)', {
              auctions: rows.filter((r) => r.activeDeposits > 0).length,
              deposits: totalActiveDeposits,
            })}
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
          {formatCurrency(totalHeldAmount, currency)}
        </Text>
      </Flex>

      {/* Auction deposit cards */}
      <Collapse
        accordion
        bordered={false}
        style={{ background: 'transparent' }}
        items={rows.map((row) => ({
          key: row.auctionId,
          label: (
            <AuctionDepositHeader row={row} />
          ),
          children: (
            <Table<DepositDetailDto>
              dataSource={row.deposits}
              columns={depositColumns}
              rowKey="depositId"
              pagination={false}
              size="small"
              style={{ background: 'var(--color-bg-card)' }}
            />
          ),
          style: {
            marginBottom: 12,
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-card)',
            overflow: 'hidden',
          },
        }))}
      />
    </div>
  )
}

function AuctionDepositHeader({ row }: { row: SellerAuctionDepositRowDto }) {
  const { t } = useTranslation('payment')

  return (
    <Flex justify="space-between" align="center" style={{ width: '100%' }}>
      <div>
        <Text strong style={{ fontSize: 14, display: 'block' }}>
          {row.itemTitle || t('sellerDeposits.untitled', 'Untitled Auction')}
        </Text>
        <Flex gap={8} align="center" style={{ marginTop: 4 }}>
          <Tag
            color={row.activeDeposits > 0 ? 'warning' : 'default'}
            bordered={false}
            style={{ fontSize: 10, borderRadius: 4, margin: 0 }}
          >
            {row.activeDeposits > 0
              ? t('sellerDeposits.activeCount', '{{count}} active', { count: row.activeDeposits })
              : t('sellerDeposits.allReleased', 'All released')}
          </Tag>
          <Tag bordered={false} style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
            {t('sellerDeposits.totalCount', '{{count}} total', { count: row.totalDeposits })}
          </Tag>
        </Flex>
      </div>
      {row.activeDeposits > 0 && (
        <Text
          strong
          style={{
            fontSize: 15,
            color: 'var(--color-warning)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {formatCurrency(row.totalHeldAmount, row.currency)}
        </Text>
      )}
    </Flex>
  )
}
