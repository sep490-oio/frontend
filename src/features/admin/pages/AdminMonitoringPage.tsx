import { useState } from 'react'
import { Typography, Table, Select, Space, Button, Tag, App } from 'antd'
import { AlertOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useMonitoringAlerts, useAcknowledgeAlert, useResolveAlert } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import type { MonitoringAlertDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const SEVERITY_OPTIONS = [
  { value: '', label: '' },
  { value: AlertSeverity.Low, label: 'Low' },
  { value: AlertSeverity.Medium, label: 'Medium' },
  { value: AlertSeverity.High, label: 'High' },
  { value: AlertSeverity.Critical, label: 'Critical' },
] as const

const STATUS_OPTIONS = [
  { value: '', label: '' },
  { value: AlertStatus.Active, label: 'Active' },
  { value: AlertStatus.Acknowledged, label: 'Acknowledged' },
  { value: AlertStatus.Resolved, label: 'Resolved' },
  { value: AlertStatus.Closed, label: 'Closed' },
] as const

const SEVERITY_COLORS: Record<string, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
  critical: 'magenta',
}

export default function AdminMonitoringPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useMonitoringAlerts({
    pageNumber: page,
    pageSize,
    ...(severityFilter ? { severity: severityFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const acknowledgeAlert = useAcknowledgeAlert()
  const resolveAlert = useResolveAlert()

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert.mutateAsync(id)
      message.success(t('monitoring.acknowledgeSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert.mutateAsync({ id })
      message.success(t('monitoring.resolveSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<MonitoringAlertDto> = [
    {
      title: t('monitoring.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: t('monitoring.severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={SEVERITY_COLORS[severity] ?? 'default'}>
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t('monitoring.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('monitoring.message'),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: t('monitoring.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('monitoring.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={4}>
          {record.status === AlertStatus.Active && (
            <Button type="link" size="small" onClick={() => handleAcknowledge(record.id)}>
              {t('monitoring.acknowledge')}
            </Button>
          )}
          {(record.status === AlertStatus.Active || record.status === AlertStatus.Acknowledged) && (
            <Button type="link" size="small" onClick={() => handleResolve(record.id)}>
              {t('monitoring.resolve')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <AlertOutlined /> {t('monitoring.title')}
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('monitoring.filterSeverity')}
          value={severityFilter}
          onChange={(val) => { setSeverityFilter(val); setPage(1) }}
          style={{ width: 200 }}
          allowClear
          onClear={() => setSeverityFilter('')}
          options={SEVERITY_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('monitoring.allSeverities'),
          }))}
        />
        <Select
          placeholder={t('monitoring.filterStatus')}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('monitoring.allStatuses'),
          }))}
        />
      </Space>

      <Table<MonitoringAlertDto>
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
    </div>
  )
}
