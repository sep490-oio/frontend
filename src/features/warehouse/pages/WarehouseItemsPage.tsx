import { useState } from 'react'
import { Typography, Space, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useWarehouseItems } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { WarehouseItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { MONO_FONT } from '@/styles/tokens'

export default function WarehouseItemsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const params = {
    pageNumber: page,
    pageSize,
  }

  const navigate = useNavigate()
  const { data, isLoading } = useWarehouseItems(params)

  const columns: ColumnsType<WarehouseItemDto> = [
    {
      title: t('item', 'Item'),
      dataIndex: 'itemId',
      key: 'itemId',
      ellipsis: true,
      render: (itemId: string) => (
        <Button type="link" size="small" onClick={() => navigate(`/items/${itemId}`)} style={{ padding: 0, fontFamily: MONO_FONT, fontSize: 12 }}>
          {itemId.slice(0, 12)}...
        </Button>
      ),
    },
    {
      title: tc('tableHeader.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('storageLocation', 'Storage Location'),
      dataIndex: 'storageLocationId',
      key: 'storageLocationId',
      width: 160,
      render: (val: string) => val ? val.slice(0, 8) + '...' : '-',
    },
    {
      title: t('receivedAt', 'Received'),
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 160,
      render: (date: string) => date ? formatDateTime(date) : '-',
    },
    {
      title: tc('tableHeader.createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('warehouseItems', 'Warehouse Items')}
        </Typography.Title>
      </Space>

      <ResponsiveTable<WarehouseItemDto>
        mobileMode="card"
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
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
    </div>
  )
}
