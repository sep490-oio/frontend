import { useState } from 'react'
import { Typography, Table, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { useWarehouseItems } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { WarehouseItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function WarehouseItemsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const params = {
    pageNumber: page,
    pageSize,
  }

  const { data, isLoading } = useWarehouseItems(params)

  const columns: ColumnsType<WarehouseItemDto> = [
    {
      title: t('item', 'Item'),
      dataIndex: 'itemId',
      key: 'itemId',
      ellipsis: true,
    },
    {
      title: t('quantity', 'Quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: t('condition', 'Condition'),
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      render: (condition: string) => <StatusBadge status={condition} size="small" />,
    },
    {
      title: t('storageLocation', 'Storage Location'),
      dataIndex: 'storageLocationId',
      key: 'storageLocationId',
      width: 160,
      render: (val: string) => val || '-',
    },
    {
      title: t('arrivedAt', 'Arrived'),
      dataIndex: 'arrivedAt',
      key: 'arrivedAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('storedAt', 'Stored'),
      dataIndex: 'storedAt',
      key: 'storedAt',
      width: 160,
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('warehouseItems', 'Warehouse Items')}
        </Typography.Title>
      </Space>

      <Table<WarehouseItemDto>
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
