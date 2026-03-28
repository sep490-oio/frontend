import { useState } from 'react'
import { Typography, Select, Space, Button, Modal, Input, InputNumber, App } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ExceptionOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminDisputes, useAdminResolveDispute } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { DisputeStatus } from '@/types/enums'
import type { DisputeDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_OPTIONS = [
  { value: '', label: '' },
  { value: DisputeStatus.Draft, label: 'Draft' },
  { value: DisputeStatus.Open, label: 'Open' },
  { value: DisputeStatus.UnderReview, label: 'Under Review' },
  { value: DisputeStatus.AwaitingResponse, label: 'Awaiting Response' },
  { value: DisputeStatus.Escalated, label: 'Escalated' },
  { value: DisputeStatus.Resolved, label: 'Resolved' },
  { value: DisputeStatus.Closed, label: 'Closed' },
  { value: DisputeStatus.Cancelled, label: 'Cancelled' },
] as const

const RESOLUTION_TYPES = [
  { value: 'full_refund', labelKey: 'disputes.fullRefund' },
  { value: 'partial_refund', labelKey: 'disputes.partialRefund' },
  { value: 'no_refund', labelKey: 'disputes.noRefund' },
  { value: 'dismiss', labelKey: 'disputes.dismiss' },
] as const

export default function AdminDisputesPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveDisputeId, setResolveDisputeId] = useState('')
  const [resolutionType, setResolutionType] = useState('full_refund')
  const [refundAmount, setRefundAmount] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const { data, isLoading } = useAdminDisputes({
    pageNumber: page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const resolveDispute = useAdminResolveDispute()

  const handleResolve = async () => {
    try {
      await resolveDispute.mutateAsync({
        id: resolveDisputeId,
        resolutionType,
        amount: refundAmount ?? undefined,
        notes: notes || undefined,
      })
      message.success(t('disputes.resolveSuccess'))
      setResolveModalOpen(false)
      setNotes('')
      setRefundAmount(null)
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<DisputeDto> = [
    {
      title: t('disputes.disputeId'),
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('disputes.title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('disputes.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('disputes.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => <StatusBadge status={priority} size="small" />,
    },
    {
      title: t('disputes.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('disputes.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (record.status === DisputeStatus.Resolved || record.status === DisputeStatus.Closed) return null
        return (
          <Button
            type="link"
            size="small"
            onClick={() => {
              setResolveDisputeId(record.id)
              setResolveModalOpen(true)
            }}
          >
            {t('disputes.resolve')}
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <ExceptionOutlined /> {t('disputes.title')}
      </Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('disputes.filterStatus')}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('disputes.allStatuses'),
          }))}
        />
      </Space>

      <ResponsiveTable<DisputeDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        mobileMode="card"
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />

      {/* Resolve dispute modal */}
      <Modal
        title={t('disputes.resolveDispute')}
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); setNotes(''); setRefundAmount(null) }}
        confirmLoading={resolveDispute.isPending}
        width={480}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text strong>{t('disputes.resolutionType')}</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={resolutionType}
              onChange={setResolutionType}
              options={RESOLUTION_TYPES.map((rt) => ({
                value: rt.value,
                label: t(rt.labelKey),
              }))}
            />
          </div>
          {(resolutionType === 'full_refund' || resolutionType === 'partial_refund') && (
            <div>
              <Typography.Text strong>{t('disputes.refundAmount')}</Typography.Text>
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                min={0}
                value={refundAmount}
                onChange={(val) => setRefundAmount(val)}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </div>
          )}
          <div>
            <Typography.Text strong>{t('disputes.notes')}</Typography.Text>
            <Input.TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('disputes.notesPlaceholder')}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
