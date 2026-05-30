import { useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Space,
  Empty,
  Flex,
  Tabs,
  Card,
  Row,
  Col,
  Input,
  Select,
  Dropdown,
} from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, SearchOutlined, MoreOutlined, GlobalOutlined, AppstoreOutlined, ShoppingCartOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyAuctions, useMyAuctionStats } from '@/features/auction/auctionApi'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { AuctionStatus } from '@/types/enums'
import type { AuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useDebounce } from '@/hooks/useDebounce'

const { Title, Text } = Typography

export default function SellerAuctionsPage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('auction')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState(10)
  
  const activeTab = searchParams.get('tab') || 'all'
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [sortBy, setSortBy] = useState('CreatedAt desc')

  const getStatusFilter = (tab: string) => {
    if (tab === 'active') return AuctionStatus.Active
    if (tab === 'ended') return `${AuctionStatus.Ended},${AuctionStatus.Sold},${AuctionStatus.Failed},${AuctionStatus.Cancelled},${AuctionStatus.Completed}`
    return undefined
  }

  const { data: stats } = useMyAuctionStats()

  const { data, isLoading } = useMyAuctions({
    pageNumber: page,
    pageSize,
    sortBy: sortBy,
    status: getStatusFilter(activeTab),
    search: debouncedSearch || undefined,
  })

  const handleTabChange = (key: string) => {
    setPage(1)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      next.delete('page')
      return next
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const getActionMenu = (record: AuctionListItemDto): MenuProps => {
    const items: MenuProps['items'] = []

    if (record.status === AuctionStatus.Draft) {
      items.push({
        key: 'edit',
        icon: <EditOutlined />,
        label: tc('action.edit', 'Edit'),
        onClick: () => navigate(`${prefix}/auctions/${record.id}/edit`)
      })
    }

    if (record.status !== AuctionStatus.Draft) {
      items.push({
        key: 'dashboard',
        icon: <AppstoreOutlined />,
        label: t('viewDashboard', 'View Dashboard'),
        onClick: () => navigate(`${prefix}/auctions/${record.id}/dashboard`)
      })
    }

    if (record.status === AuctionStatus.Active) {
      items.push({
        key: 'public',
        icon: <GlobalOutlined />,
        label: t('viewPublic', 'View Public Page'),
        onClick: () => window.open(`/auctions/${record.id}`, '_blank')
      })
    }

    if ([AuctionStatus.Sold, AuctionStatus.Ended, AuctionStatus.Completed].includes(record.status as any)) {
      items.push({
        key: 'order',
        icon: <ShoppingCartOutlined />,
        label: t('viewOrder', 'View Order'),
        onClick: () => navigate(`${prefix}/orders?auctionId=${record.id}`)
      })
    }

    return { items }
  }

  const columns: ColumnsType<AuctionListItemDto> = [
    {
      title: ta('item', 'Item'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      render: (_, record) => (
        <Space align="center" size={16}>
          {record.primaryImageUrl ? (
            <img
              src={record.primaryImageUrl}
              alt=""
              style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }}
            />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--color-bg-layout)', border: '1px solid var(--color-border)' }} />
          )}
          <Flex vertical gap={4}>
            <Text strong style={{ fontSize: 16 }}>{record.itemTitle}</Text>
            {record.itemStatus && (
               <Text type="secondary" style={{ fontSize: 13 }}>Condition: {record.itemStatus}</Text>
            )}
          </Flex>
        </Space>
      ),
    },
    {
      title: ta('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => <StatusBadge status={status} size="small" />,
    },
    {
      title: ta('currentPrice', 'Current Price'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 140,
      render: (val) => formatCurrency(val?.amount || 0, val?.currency || 'VND'),
    },
    {
      title: ta('bidCount', 'Bids'),
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 80,
    },
    {
      title: ta('endTime', 'End Time'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (d) => d ? formatDateTime(d) : '-',
    },
    {
      title: tc('action.actions', 'Actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {t('myAuctions', 'My Auctions')}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`${prefix}/auctions/create`)}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('createAuction', 'Create Auction')}
        </Button>
      </Flex>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="oio-glass" size="small" bordered={false} style={{ borderRadius: 12 }}>
            <Text type="secondary">{t('totalAuctions', 'Total Auctions')}</Text>
            <Title level={3} style={{ margin: 0 }}>{stats?.totalAuctions ?? '-'}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="oio-glass" size="small" bordered={false} style={{ borderRadius: 12 }}>
            <Text type="secondary">{t('activeAuctions', 'Active')}</Text>
            <Title level={3} style={{ margin: 0 }}>{stats?.activeAuctions ?? '-'}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="oio-glass" size="small" bordered={false} style={{ borderRadius: 12 }}>
            <Text type="secondary">{t('endedAuctions', 'Ended / Sold')}</Text>
            <Title level={3} style={{ margin: 0 }}>{stats?.endedAuctions ?? '-'}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="oio-glass" size="small" bordered={false} style={{ borderRadius: 12 }}>
            <Text type="secondary">{t('draftAuctions', 'Draft')}</Text>
            <Title level={3} style={{ margin: 0 }}>{stats?.draftAuctions ?? '-'}</Title>
          </Card>
        </Col>
      </Row>

      {/* Search & Filters */}
      <Flex gap={16} wrap="wrap" style={{ marginBottom: 16 }}>
        <Input
          placeholder={tc('search', 'Search...')}
          prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ maxWidth: 300, borderRadius: 8 }}
          allowClear
        />
        <Select
          value={sortBy}
          onChange={(val) => { setSortBy(val); setPage(1); }}
          style={{ width: 200 }}
          options={[
            { value: 'CreatedAt desc', label: tc('sort.newest', 'Newest first') },
            { value: 'EndTime asc', label: tc('sort.endingSoon', 'Ending soon') },
            { value: 'CurrentPrice desc', label: tc('sort.highestPrice', 'Highest price') },
            { value: 'CurrentPrice asc', label: tc('sort.lowestPrice', 'Lowest price') },
          ]}
        />
      </Flex>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'all', label: t('tabAll', 'All') },
          { key: 'active', label: t('tabActive', 'Active') },
          { key: 'ended', label: t('tabEnded', 'Ended / Sold') },
        ]}
        style={{ marginBottom: 16 }}
      />

      {!isLoading && data?.items.length === 0 && !debouncedSearch ? (
        <Empty description={t('noAuctionsYet', "You haven't created any auctions yet.")} />
      ) : (
        <Table<AuctionListItemDto>
          rowKey="id"
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.metadata?.totalCount || 0,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          scroll={{ x: 'max-content' }}
        />
      )}
    </div>
  )
}
