import { useState, useMemo } from 'react'
import { Row, Col, Card, Table, Button, Space, Tag, Spin, Input, Flex, Empty, Tooltip, Typography, Badge } from 'antd'
import {
  AppstoreOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyItems, useItemAuctions } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { AuctionStatus } from '@/types/enums'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'
import type { ItemDto, AuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

/* ── Styles ───────────────────────────────────────────────────────────── */

const glassCard: React.CSSProperties = {
  background: 'var(--color-bg-container)',
  backdropFilter: 'var(--oio-blur)',
  WebkitBackdropFilter: 'var(--oio-blur)',
  border: '1px solid var(--color-border)',
  borderRadius: 24,
  boxShadow: 'var(--shadow-sm)',
}

/* ── Auction sub-table (expanded) ─────────────────────────────────────── */

function ItemAuctionRows({ item }: { item: ItemDto }) {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const { data: auctions, isLoading } = useItemAuctions(item.id)

  const cols: ColumnsType<AuctionListItemDto> = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, idx) => (
        <Text type="secondary" style={{ fontFamily: MONO_FONT, fontSize: 12 }}>
          {idx + 1}
        </Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'auctionType',
      key: 'type',
      width: 100,
      render: (val: string | undefined) => <Tag color="purple">{val ?? '—'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Current Price',
      key: 'price',
      width: 150,
      render: (_, record) => {
        const p = record.currentPrice
        if (p && typeof p === 'object' && 'amount' in p) {
          return <PriceDisplay price={{ amount: (p as { amount: number; currency: string }).amount, currency: (p as { amount: number; currency: string }).currency, symbol: '' }} size="small" />
        }
        return <PriceDisplay price={(p as number) ?? 0} size="small" />
      },
    },
    {
      title: 'Bids',
      dataIndex: 'bidCount',
      key: 'bids',
      width: 70,
      align: 'center',
      render: (val: number) => <Text style={{ fontFamily: MONO_FONT }}>{val ?? 0}</Text>,
    },
    {
      title: 'Start',
      dataIndex: 'startTime',
      key: 'start',
      width: 150,
      responsive: ['md'] as any,
      render: (d: string | undefined) => d ? <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(d)}</Text> : '—',
    },
    {
      title: 'End',
      dataIndex: 'endTime',
      key: 'end',
      width: 160,
      render: (d: string | undefined, record) => {
        if (!d) return '—'
        if (record.status === AuctionStatus.Active) return <CountdownTimer endTime={d} size="small" />
        return <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(d)}</Text>
      },
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/auctions/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Dashboard">
            <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate(`/seller/auctions/${record.id}/dashboard`)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  if (isLoading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="small" /></div>
  }

  if (!auctions?.length) {
    return (
      <div style={{ padding: '16px 24px', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No auction sessions yet"
        >
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/seller/items/${item.id}/create-auction`)}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', borderRadius: 8 }}
          >
            Create Auction
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <Table<AuctionListItemDto>
      rowKey="id"
      columns={cols}
      dataSource={auctions}
      pagination={false}
      size="small"
      style={{ margin: isMobile ? '0' : '0 16px 16px 48px' }}
    />
  )
}

/* ── Main page ────────────────────────────────────────────────────────── */

export default function SellerAuctionOverviewPage() {
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  useTranslation('seller')
  const { t: tc } = useTranslation('common')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: itemsData, isLoading } = useMyItems({
    pageNumber: page,
    pageSize,
    sortBy: 'CreatedAt',
    isDescending: true,
  })

  const items = itemsData?.items ?? []

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => item.title.toLowerCase().includes(q))
  }, [items, search])

  // Summary stats
  const totalItems = itemsData?.metadata?.totalCount ?? items.length
  const itemsWithAuction = items.filter((i) => !!i.auction).length
  const activeAuctions = items.filter((i) => i.auction?.auctionStatus?.toLowerCase() === 'active').length
  const soldAuctions = items.filter((i) => i.auction?.auctionStatus?.toLowerCase() === 'sold' || i.auction?.auctionStatus?.toLowerCase() === 'completed').length

  /* ── Item columns ───────────────────────────────────────────── */

  const itemColumns: ColumnsType<ItemDto> = [
    {
      title: 'Item',
      key: 'item',
      ellipsis: true,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {record.images?.[0]?.thumbnailUrl || record.images?.[0]?.url ? (
            <img
              src={record.images.find(i => i.isPrimary)?.thumbnailUrl ?? record.images[0].thumbnailUrl ?? record.images[0].url}
              alt=""
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-fill-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingOutlined style={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <Button
              type="link"
              onClick={() => navigate(`/seller/items/${record.id}`)}
              style={{ padding: 0, fontWeight: 500, fontSize: 14, height: 'auto', textAlign: 'left', maxWidth: '100%' }}
            >
              <Text ellipsis style={{ color: 'inherit', maxWidth: isMobile ? 180 : 300 }}>{record.title}</Text>
            </Button>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {record.condition}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Item Status',
      dataIndex: 'status',
      key: 'itemStatus',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Latest Auction',
      key: 'latestAuction',
      width: 180,
      render: (_, record) => {
        if (!record.auction) {
          return <Text type="secondary" style={{ fontSize: 12 }}>No auction</Text>
        }
        return (
          <Space direction="vertical" size={0}>
            <StatusBadge status={record.auction.auctionStatus} />
            <Text style={{ fontFamily: MONO_FONT, fontSize: 12 }}>
              {formatCurrency(record.auction.currentPrice, record.auction.currency)}
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Auction Sessions',
      key: 'sessions',
      width: 130,
      align: 'center',
      render: (_, record) => {
        if (!record.auction) {
          return (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => { e.stopPropagation(); navigate(`/seller/items/${record.id}/create-auction`) }}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', borderRadius: 8, fontSize: 12 }}
            >
              Create
            </Button>
          )
        }
        return (
          <Badge count={record.hasLiveAuction ? 'LIVE' : 0} size="small" style={{ backgroundColor: 'var(--color-success)' }}>
            <Tag
              color="blue"
              style={{ borderRadius: 100, cursor: 'pointer', margin: 0 }}
              onClick={(e) => { e.stopPropagation(); navigate(`/auctions/${record.auction!.auctionId}`) }}
            >
              View <RightOutlined style={{ fontSize: 10 }} />
            </Tag>
          </Badge>
        )
      },
    },
    {
      title: 'End Time',
      key: 'endTime',
      width: 160,
      responsive: ['lg'] as any,
      render: (_, record) => {
        if (!record.auction?.endTime) return <Text type="secondary">—</Text>
        if (record.auction.auctionStatus?.toLowerCase() === 'active') {
          return <CountdownTimer endTime={record.auction.endTime} size="small" />
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(record.auction.endTime)}</Text>
      },
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 24px' : undefined }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={12}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF_FONT,
              fontWeight: 400,
              fontSize: isMobile ? 22 : 28,
              color: 'var(--color-text-primary)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            <AppstoreOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
            Auction Overview
          </h1>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
            All your items and their auction sessions in one place
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/seller/items/create')}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', borderRadius: 10, fontWeight: 500, height: 40 }}
        >
          {!isMobile && 'New Item'}
        </Button>
      </Flex>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {[
          { icon: <AppstoreOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />, label: 'Total Items', value: totalItems },
          { icon: <ShoppingOutlined style={{ color: '#52c41a', fontSize: 16 }} />, label: 'With Auctions', value: itemsWithAuction },
          { icon: <ThunderboltOutlined style={{ color: '#faad14', fontSize: 16 }} />, label: 'Active', value: activeAuctions },
          { icon: <DollarOutlined style={{ color: '#722ed1', fontSize: 16 }} />, label: 'Sold', value: soldAuctions },
        ].map((stat) => (
          <Col key={stat.label} xs={12} sm={6}>
            <Card style={glassCard} styles={{ body: { padding: isMobile ? '12px 14px' : '18px 24px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {stat.icon}
                <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 12 }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 22 : 26, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {stat.value}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search items..."
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 360, borderRadius: 10 }}
        />
      </div>

      {/* ── Items Table with expandable auctions ────────────────────── */}
      <Card style={{ ...glassCard, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table<ItemDto>
          rowKey="id"
          columns={itemColumns}
          dataSource={filteredItems}
          loading={isLoading}
          expandable={{
            expandedRowRender: (record) => <ItemAuctionRows item={record} />,
            rowExpandable: () => true,
          }}
          pagination={{
            current: page,
            pageSize,
            total: itemsData?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
            style: { padding: '0 16px' },
          }}
          size={isMobile ? 'small' : 'middle'}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}
