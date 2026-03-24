import { useState } from 'react'
import { Typography, Card, Table, Tag, Space } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyBids } from '@/features/auction/api'
import type { MyBidDto } from '@/features/auction/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { formatDateTime } from '@/utils/format'
import type { ColumnsType } from 'antd/es/table'

interface StatusPill {
  value: string
  label: string
}

const STATUS_PILLS: StatusPill[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'outbid', label: 'Outbid' },
  { value: 'won', label: 'Won' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function MyBidsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = useMyBids({
    pageNumber: page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const columns: ColumnsType<MyBidDto> = [
    {
      title: t('auctionTitle', 'Auction'),
      dataIndex: 'auctionTitle',
      key: 'auctionTitle',
      ellipsis: true,
      render: (title: string, record) => (
        <Link to={`/auctions/${record.auctionId}`} className="oio-link">
          {title}
        </Link>
      ),
    },
    {
      title: t('bidAmount', 'Bid Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: MyBidDto['amount']) => (
        <PriceDisplay amount={amount.amount} currency={amount.currency} size="small" />
      ),
    },
    {
      title: t('autoBid', 'Auto-Bid'),
      dataIndex: 'isAutoBid',
      key: 'isAutoBid',
      width: 100,
      render: (isAuto: boolean) =>
        isAuto ? <Tag color="blue">Auto</Tag> : null,
    },
    {
      title: t('bidStatus', 'Bid Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('highestBid', 'Highest'),
      dataIndex: 'isHighestBid',
      key: 'isHighestBid',
      width: 110,
      render: (isHighest: boolean) =>
        isHighest ? (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--color-success-bg, #f0fdf4)',
              color: 'var(--color-success, #16a34a)',
              border: '1px solid var(--color-success-border, #bbf7d0)',
            }}
          >
            {t('highest', 'Highest')}
          </span>
        ) : (
          <Tag color="orange">{t('outbid', 'Outbid')}</Tag>
        ),
    },
    {
      title: t('auctionStatusCol', 'Auction Status'),
      dataIndex: 'auctionStatus',
      key: 'auctionStatus',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('bidDate', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {formatDateTime(date)}
        </span>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <HistoryOutlined /> {t('myBids', 'My Bids')}
      </Typography.Title>

      <Card>
        {/* Status filter pills */}
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          {STATUS_PILLS.map((pill) => {
            const isActive = statusFilter === pill.value
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => {
                  setStatusFilter(pill.value)
                  setPage(1)
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 200ms ease',
                }}
              >
                {t(`statusFilter.${pill.label.toLowerCase()}`, pill.label)}
              </button>
            )
          })}
        </Space>

        <Table<MyBidDto>
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          scroll={{ x: 800 }}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>
    </div>
  )
}
