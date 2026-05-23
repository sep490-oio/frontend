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
} from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyAuctions } from '@/features/auction/auctionApi'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { AuctionStatus } from '@/types/enums'
import type { AuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

export default function SellerAuctionsPage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('auction')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState(10)
  const activeTab = searchParams.get('tab') || 'all'

  const getStatusFilter = (tab: string) => {
    if (tab === 'active') return AuctionStatus.Active
    if (tab === 'ended') return `${AuctionStatus.Ended},${AuctionStatus.Sold},${AuctionStatus.Failed},${AuctionStatus.Cancelled}`
    return undefined
  }

  const { data, isLoading } = useMyAuctions({
    pageNumber: page,
    pageSize,
    sortBy: 'CreatedAt desc',
    status: getStatusFilter(activeTab),
  })

  const handleTabChange = (key: string) => {
    setPage(1)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', key)
    nextParams.delete('page')
    navigate({ search: nextParams.toString() })
  }

  const columns: ColumnsType<AuctionListItemDto> = [
    {
      title: ta('item', 'Item'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      render: (_, record) => (
        <Space align="center">
          {record.primaryImageUrl && (
            <img
              src={record.primaryImageUrl}
              alt=""
              style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }}
            />
          )}
          <Text strong>{record.itemTitle}</Text>
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
      render: (val) => formatCurrency(val.amount, val.currency),
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
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`${prefix}/auctions/${record.id}/dashboard`)}
          title={t('viewDashboard', 'View Dashboard')}
        />
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

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small" bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Text type="secondary">{t('totalAuctions', 'Total Auctions')}</Text>
            <Title level={3} style={{ margin: 0 }}>
              {activeTab === 'all' ? (data?.metadata?.totalCount || 0) : '-'}
            </Title>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Text type="secondary">{t('activeAuctions', 'Active')}</Text>
            <Title level={3} style={{ margin: 0 }}>
              {activeTab === 'active' ? (data?.metadata?.totalCount || 0) : '-'}
            </Title>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Text type="secondary">{t('endedAuctions', 'Ended')}</Text>
            <Title level={3} style={{ margin: 0 }}>
              {activeTab === 'ended' ? (data?.metadata?.totalCount || 0) : '-'}
            </Title>
          </Card>
        </Col>
      </Row>

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

      {!isLoading && data?.items.length === 0 ? (
        <Empty
          description={t('noAuctionsYet', "You haven't created any auctions yet.")}
        />
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
