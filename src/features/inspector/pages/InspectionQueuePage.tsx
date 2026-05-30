import { useState } from 'react'
import { Typography, Select, Button, Space, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useInspectionQueue } from '@/features/inspector/api'
import type { InspectionQueueItem } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { SERIF_FONT } from '@/styles/tokens'

export default function InspectionQueuePage() {
  const { t } = useTranslation('inspector')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const STATUS_OPTIONS = [
    { value: '', label: t('queue.statusAll') },
    { value: 'awaiting_inspection', label: t('queue.statusAwaitingInspection') },
    { value: 'pending_review', label: t('queue.statusPendingReview') },
  ]
  const [statusFilter, setStatusFilter] = useState('')


  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const { data, isLoading } = useInspectionQueue({
    pageNumber: page,
    pageSize,
    status: statusFilter || undefined,
  })

  const renderItemCell = (_: unknown, record: InspectionQueueItem) => {
    const condition = record.conditionOnArrival ?? record.declaredCondition
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {record.itemImageUrl ? (
          <img
            src={record.itemImageUrl}
            alt={record.itemTitle}
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0, background: 'var(--color-surface-muted, #f0f0f0)' }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 4,
              background: 'var(--color-surface-muted, #f0f0f0)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary, #999)',
              fontSize: 10,
            }}
          >
            {t('queue.noImage')}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.itemTitle}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #8c8c8c)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.itemId}
          </div>
          <div style={{ marginTop: 4 }}>
            <StatusBadge status={condition} size="small" />
          </div>
        </div>
      </div>
    )
  }

  const columns = [
    {
      title: t('queue.columnItem'),
      key: 'item',
      render: renderItemCell,
    },
    {
      title: t('queue.columnQueueStatus'),
      dataIndex: 'queueStatus',
      key: 'queueStatus',
      width: 150,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('queue.columnLocation'),
      dataIndex: 'storageLocationLabel',
      key: 'storageLocationLabel',
      width: 130,
      render: (label?: string) => label ?? '-',
    },
    {
      title: t('queue.columnArrived'),
      dataIndex: 'arrivedAt',
      key: 'arrivedAt',
      width: 160,
      render: (date: string) => date ? formatDateTime(date) : '-',
    },
    {
      title: t('queue.columnActions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: InspectionQueueItem) => (
        <Button
          type="link"
          icon={<SearchOutlined />}
          onClick={() => navigate(`/inspector/inspections/${record.inboundShipmentId}`)}
          style={{ color: 'var(--color-accent)' }}
        >
          {t('queue.inspect')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)' }}
      >
        {t('queue.title')}
      </Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            style={{ width: 200 }}
            placeholder={t('queue.filterByStatus')}
          />
        </Space>
      </Card>

      <Card>
        <ResponsiveTable<InspectionQueueItem>
          mobileMode="card"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="inboundShipmentId"
          loading={isLoading}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </div>
  )
}
