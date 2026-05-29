import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useItemById, useItemAuctions, useCategories } from '@/features/item/api'
import {
  Typography,
  Space,
  Button,
  Tabs,
  Card,
  Descriptions,
  Tag,
  Row,
  Col,
  Table,
  Empty,
  Skeleton,
} from 'antd'
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { ItemStatus } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import type { ColumnsType } from 'antd/es/table'
import type { AuctionListItemDto } from '@/types'

const { Title, Text } = Typography

export default function SellerItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const { t: ti } = useTranslation('item')

  const { data: item, isLoading: isItemLoading } = useItemById(id || '')
  const { data: auctions, isLoading: isAuctionsLoading } = useItemAuctions(id)
  const { data: categories } = useCategories()

  if (isItemLoading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  if (!item) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <Empty description={t('notFound', 'Item not found')} />
      </div>
    )
  }

  const primaryImg = item.images?.find((img) => img.isPrimary) ?? item.images?.[0]

  const auctionColumns: ColumnsType<AuctionListItemDto> = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <StatusBadge status={status} size="small" />,
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (money) => formatCurrency(money.amount, money.currency),
    },
    {
      title: 'Bids',
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 100,
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (d) => formatDateTime(d),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (d) => formatDateTime(d),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`${prefix}/auctions/${record.id}/dashboard`)}
        />
      ),
    },
  ]

  const categoryName = categories?.find(c => c.id === item.categoryId)?.name || item.categoryId

  const overviewTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card size="small" bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
            <Descriptions column={1} labelStyle={{ width: 140, color: 'var(--color-text-secondary)' }}>
              <Descriptions.Item label={ti('condition', 'Condition')}>
                <StatusBadge status={item.condition} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label={ti('category', 'Category')}>
                <Text strong>{categoryName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={ti('createdAt', 'Created At')}>
                {formatDateTime(item.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label={ti('hasInboundShipment', 'In Warehouse')}>
                {item.hasInboundShipment ? 'Yes' : 'No'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={ti('description', 'Description')} size="small" bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
            {item.description ? (
              <SafeHtmlRenderer html={item.description} />
            ) : (
              <Text type="secondary">{tc('common.noDescription', 'No description available')}</Text>
            )}
          </Card>
        </Col>
      </Row>
      {item.images && item.images.length > 0 && (
        <Card title={ti('images', 'Images')} size="small" bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Space wrap size="middle">
            {item.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt="Item"
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
            ))}
          </Space>
        </Card>
      )}
    </div>
  )

  const auctionsTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<ShoppingOutlined />}
          disabled={item.status !== ItemStatus.Approved && item.status !== ItemStatus.Active}
          onClick={() => navigate(`${prefix}/auctions/create?itemId=${item.id}`)}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('createAuction', 'Create Auction')}
        </Button>
      </div>
      <Table<AuctionListItemDto>
        columns={auctionColumns}
        dataSource={auctions || []}
        rowKey="id"
        loading={isAuctionsLoading}
        pagination={false}
        locale={{ emptyText: t('noAuctionsFound', 'No auctions found for this item.') }}
      />
    </div>
  )

  const logisticsTab = (
    <Card bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
      {item.status === ItemStatus.PendingVerify && !item.hasInboundShipment ? (
        <Empty
          description={t('logisticsPlaceholder', 'Logistics & shipping details will be displayed here.')}
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate(`${prefix}/warehouse/inbound/book?itemId=${item.id}`)}
          >
            {t('bookInbound', 'Book Inbound Shipment')}
          </Button>
        </Empty>
      ) : (
        <Empty
          description={t('logisticsPlaceholder', 'Logistics & shipping details will be displayed here.')}
        />
      )}
    </Card>
  )

  const tabs = [
    { key: 'overview', label: t('tabOverview', 'Overview'), children: overviewTab },
    { key: 'auctions', label: t('tabAuctions', 'Auctions'), children: auctionsTab },
    { key: 'logistics', label: t('tabLogistics', 'Logistics'), children: logisticsTab },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`${prefix}/items`)}
          style={{ padding: 0, color: 'var(--color-text-secondary)' }}
        >
          {t('backToItems', 'Back to My Items')}
        </Button>

        <Card bordered={false} style={{ boxShadow: 'var(--shadow-md)', borderRadius: 12 }}>
          <Row gutter={[24, 24]} align="middle">
            <Col>
              {primaryImg ? (
                <img
                  src={primaryImg.url}
                  alt={item.title}
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
              ) : (
                <div style={{ width: 100, height: 100, background: 'var(--color-bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">No Image</Text>
                </div>
              )}
            </Col>
            <Col flex="auto">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={3} style={{ margin: 0 }}>{item.title}</Title>
                <Space size="middle" wrap>
                  <StatusBadge status={item.status} />
                  <Tag color="blue">{item.categoryId}</Tag>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        <Tabs defaultActiveKey="overview" items={tabs} />
      </Space>
    </div>
  )
}
