import { useState } from 'react'
import { Card, Tag, Space, Input, Select, Button, Typography, Image, Empty } from 'antd'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminItems } from '../api'
import { useCategories } from '@/features/item/api'
import { SearchOutlined, HomeOutlined, BankOutlined, CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'

const { Title, Text } = Typography

export default function AdminItemsPage() {
  const { t } = useTranslation('admin')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [status, setStatus] = useState<string>()
  const [physicalLocation, setPhysicalLocation] = useState<string>()
  const [searchTerm, setSearchTerm] = useState<string>()
  const [searchInput, setSearchInput] = useState<string>('')

  const { data, isLoading } = useAdminItems({
    pageNumber: currentPage,
    pageSize,
    status,
    physicalLocation,
    searchTerm,
  })

  const { data: categories } = useCategories()

  const columns = [
    {
      title: t('items.columns.item', 'Item'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (_: any, record: any) => (
        <Space>
          <Image
            src={record.primaryImageUrl}
            fallback="/placeholder.png"
            alt={record.title}
            width={44}
            height={44}
            style={{ objectFit: 'cover', borderRadius: 6 }}
            preview={{ mask: 'View' }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.title}</div>
            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              ID: {record.id.substring(0, 8)}...
              <Typography.Text copyable={{ text: record.id, icon: [<CopyOutlined key="copy" style={{ fontSize: 12 }} />, <CopyOutlined key="copied" style={{ fontSize: 12, color: '#52c41a' }} />] }} />
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('items.columns.seller', 'Seller'),
      key: 'seller',
      width: 180,
      ellipsis: true,
      responsive: ['md'] as any,
      render: (_: any, record: any) => (
        <Link to={`/admin/users/${record.sellerId}`}>{record.sellerName || record.sellerDisplayName || record.sellerId.substring(0,8) + '...'}</Link>
      ),
    },
    {
      title: t('items.columns.category', 'Category'),
      dataIndex: 'categoryId',
      key: 'category',
      width: 140,
      responsive: ['lg'] as any,
      render: (categoryId: string) => {
        const cat = categories?.find(c => c.id === categoryId)
        return <Text>{cat ? cat.name : categoryId}</Text>
      }
    },
    {
      title: t('items.columns.condition', 'Condition'),
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      responsive: ['md'] as any,
      render: (cond: string) => {
        const titleCase = cond.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        return <Tag color="blue">{titleCase}</Tag>
      },
    },
    {
      title: t('items.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const colors: Record<string, string> = {
          draft: 'default',
          pending_review: 'orange',
          pending_verify: 'orange',
          approved: 'blue',
          active: 'green',
          in_auction: 'cyan',
          sold: 'purple',
          rejected: 'red',
          removed: 'red',
        }
        const titleCase = status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        return <Tag color={colors[status.toLowerCase()] || 'default'}>{titleCase}</Tag>
      },
    },
    {
      title: t('items.columns.location', 'Location'),
      dataIndex: 'currentPhysicalLocation',
      key: 'physicalLocation',
      width: 130,
      responsive: ['lg'] as any,
      render: (loc: string) => {
        if (!loc) return <Text type="secondary">Unknown</Text>
        const isWarehouse = loc.toLowerCase().includes('warehouse')
        return (
          <Space>
            {isWarehouse ? <BankOutlined style={{ color: '#722ed1' }} /> : <HomeOutlined style={{ color: '#2f54eb' }} />}
            <Text>{isWarehouse ? t('items.locationOptions.warehouse', 'Warehouse') : t('items.locationOptions.withSeller', 'With Seller')}</Text>
          </Space>
        )
      },
    },
    {
      title: t('items.columns.totalAuctions', 'Total Auctions'),
      dataIndex: 'totalAuctions',
      key: 'totalAuctions',
      width: 130,
      align: 'center' as const,
      responsive: ['lg'] as any,
      render: (count: number) => count ?? 0,
    },
    {
      title: t('items.columns.addedDate', 'Added Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      responsive: ['xl'] as any,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY, HH:mm'),
    },
    {
      title: t('items.columns.action', 'Action'),
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Link to={`/admin/items/${record.id}`}>
          <Button type="link" size="small" style={{ padding: 0 }}>
            {t('items.action.viewDetails', 'View Details')}
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>{t('items.title', 'Item Inventory')}</Title>
      </div>

      <Card>
        <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
          <Input
            placeholder={t('items.filters.search', 'Search Title or ID...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => setSearchTerm(searchInput)}
            style={{ width: 250 }}
            suffix={<SearchOutlined />}
          />
          <Select
            placeholder={t('items.filters.status', 'Filter Status')}
            style={{ width: 150 }}
            allowClear
            onChange={setStatus}
            options={[
              { value: 'pending_review', label: t('items.statusOptions.pending_review', 'Pending Review') },
              { value: 'approved', label: t('items.statusOptions.approved', 'Approved') },
              { value: 'active', label: t('items.statusOptions.active', 'Active') },
              { value: 'in_auction', label: t('items.statusOptions.in_auction', 'In Auction') },
              { value: 'sold', label: t('items.statusOptions.sold', 'Sold') },
              { value: 'rejected', label: t('items.statusOptions.rejected', 'Rejected') },
            ]}
          />
          <Select
            placeholder={t('items.filters.location', 'Filter Location')}
            style={{ width: 180 }}
            allowClear
            onChange={setPhysicalLocation}
            options={[
              { value: 'warehouse', label: t('items.locationOptions.warehouse', 'Warehouse') },
              { value: 'seller', label: t('items.locationOptions.withSeller', 'With Seller') },
            ]}
          />
          <Button onClick={() => setSearchTerm(searchInput)} type="primary">
            {t('items.filters.apply', 'Apply Filters')}
          </Button>
        </Space>

        <ResponsiveTable
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          mobileMode="card"
          locale={{ emptyText: <Empty description={t('items.empty', 'No items found matching the selected criteria')} /> }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.metadata?.totalCount || 0,
            onChange: (p, ps) => {
              setCurrentPage(p)
              setPageSize(ps)
            },
            showSizeChanger: true,
          }}
        />
      </Card>
    </Space>
  )
}
