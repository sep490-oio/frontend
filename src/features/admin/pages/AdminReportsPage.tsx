import { useState } from 'react'
import { Typography, Table, Select, Space, Button, Modal, Input, App } from 'antd'
import { FlagOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminReports, useAssignReport, useResolveReport } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { ReportStatus } from '@/types/enums'
import type { ReportDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_OPTIONS = [
  { value: '', label: '' },
  { value: ReportStatus.Open, label: 'Open' },
  { value: ReportStatus.Assigned, label: 'Assigned' },
  { value: ReportStatus.InProgress, label: 'In Progress' },
  { value: ReportStatus.Resolved, label: 'Resolved' },
  { value: ReportStatus.Closed, label: 'Closed' },
] as const

export default function AdminReportsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignReportId, setAssignReportId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveReportId, setResolveReportId] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  const { data, isLoading } = useAdminReports({
    pageNumber: page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const assignReport = useAssignReport()
  const resolveReport = useResolveReport()

  const handleAssign = async () => {
    if (!assigneeId) return
    try {
      await assignReport.mutateAsync({ id: assignReportId, assigneeId })
      message.success(t('reports.assignSuccess'))
      setAssignModalOpen(false)
      setAssigneeId('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleResolve = async () => {
    if (!resolutionNotes) return
    try {
      await resolveReport.mutateAsync({ id: resolveReportId, notes: resolutionNotes })
      message.success(t('reports.resolveSuccess'))
      setResolveModalOpen(false)
      setResolutionNotes('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<ReportDto> = [
    {
      title: t('reports.reporter'),
      dataIndex: 'reporterId',
      key: 'reporterId',
      ellipsis: true,
    },
    {
      title: t('reports.entityType'),
      dataIndex: 'entityType',
      key: 'entityType',
      width: 120,
    },
    {
      title: t('reports.reason'),
      dataIndex: 'reasonCode',
      key: 'reasonCode',
      width: 140,
    },
    {
      title: t('reports.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('reports.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 140,
      render: (val: string | undefined) => val ?? '-',
    },
    {
      title: t('reports.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reports.actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          {(record.status === ReportStatus.Open || record.status === ReportStatus.Assigned) && (
            <Button
              type="link"
              size="small"
              onClick={() => { setAssignReportId(record.id); setAssignModalOpen(true) }}
            >
              {t('reports.assign')}
            </Button>
          )}
          {record.status !== ReportStatus.Resolved && record.status !== ReportStatus.Closed && (
            <Button
              type="link"
              size="small"
              onClick={() => { setResolveReportId(record.id); setResolveModalOpen(true) }}
            >
              {t('reports.resolve')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <FlagOutlined /> {t('reports.title')}
      </Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('reports.filterStatus')}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('reports.allStatuses'),
          }))}
        />
      </Space>

      <Table<ReportDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />

      {/* Assign modal */}
      <Modal
        title={t('reports.assign')}
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => { setAssignModalOpen(false); setAssigneeId('') }}
        confirmLoading={assignReport.isPending}
      >
        <Typography.Text strong>{t('reports.assigneeId')}</Typography.Text>
        <Input
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          placeholder={t('reports.assigneeIdPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Resolve modal */}
      <Modal
        title={t('reports.resolve')}
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); setResolutionNotes('') }}
        confirmLoading={resolveReport.isPending}
      >
        <Typography.Text strong>{t('reports.resolutionNotes')}</Typography.Text>
        <Input.TextArea
          rows={3}
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder={t('reports.resolutionNotesPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  )
}
