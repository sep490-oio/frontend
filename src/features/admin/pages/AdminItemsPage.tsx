import { useState } from 'react'
import { Card, Table, Tag, Space, Input, Select, Button, Typography, Image, Empty } from 'antd'
import { Link } from 'react-router'
import { useAdminItems } from '../api'
import { useCategories } from '@/features/item/api'
import { SearchOutlined, HomeOutlined, BankOutlined, CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function AdminItemsPage() {
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
      title: 'Item',
      dataIndex: 'title',
      key: 'title',
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
      title: 'Seller',
      key: 'seller',
      render: (_: any, record: any) => (
        <Link to={`/admin/users/${record.sellerId}`}>{record.sellerName || record.sellerDisplayName || record.sellerId.substring(0,8) + '...'}</Link>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryId',
      key: 'category',
      render: (categoryId: string) => {
        const cat = categories?.find(c => c.id === categoryId)
        return <Text>{cat ? cat.name : categoryId}</Text>
      }
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (cond: string) => {
        const titleCase = cond.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        return <Tag color="blue">{titleCase}</Tag>
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
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
      title: 'Location',
      dataIndex: 'currentPhysicalLocation',
      key: 'physicalLocation',
      render: (loc: string) => {
        if (!loc) return <Text type="secondary">Unknown</Text>
        const isWarehouse = loc.toLowerCase().includes('warehouse')
        return (
          <Space>
            {isWarehouse ? <BankOutlined style={{ color: '#722ed1' }} /> : <HomeOutlined style={{ color: '#2f54eb' }} />}
            <Text>{isWarehouse ? 'Warehouse' : 'With Seller'}</Text>
          </Space>
        )
      },
    },
    {
      title: 'Added Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY, HH:mm'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Link to={`/admin/items/${record.id}`}>
          <Button type="link">View Details</Button>
        </Link>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Item Inventory</Title>
      </div>

      <Card>
        <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search Title or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => setSearchTerm(searchInput)}
            style={{ width: 250 }}
            suffix={<SearchOutlined />}
          />
          <Select
            placeholder="Filter Status"
            style={{ width: 150 }}
            allowClear
            onChange={setStatus}
            options={[
              { value: 'pending_review', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'active', label: 'Active' },
              { value: 'in_auction', label: 'In Auction' },
              { value: 'sold', label: 'Sold' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select
            placeholder="Filter Location"
            style={{ width: 180 }}
            allowClear
            onChange={setPhysicalLocation}
            options={[
              { value: 'warehouse', label: 'Warehouse' },
              { value: 'seller', label: 'With Seller' },
            ]}
          />
          <Button onClick={() => setSearchTerm(searchInput)} type="primary">
            Apply Filters
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          locale={{ emptyText: <Empty description="No items found matching the selected criteria" /> }}
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
