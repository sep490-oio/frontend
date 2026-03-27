import { useState } from 'react'
import { Typography, Select, Space, Button, Tag, App, Modal, Input, Switch } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
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
  { value: AlertStatus.Open, label: 'Open' },
  { value: AlertStatus.Acknowledged, label: 'Acknowledged' },
  { value: AlertStatus.Resolved, label: 'Resolved' },
  { value: AlertStatus.Ignored, label: 'Ignored' },
] as const

const SEVERITY_COLORS: Record<string, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
  critical: 'magenta',
}

export default function AdminMonitoringPage() {
  const { t } = useTranslation('admin')
  const { message } = App.useApp()

  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Acknowledge modal state
  const [ackModalOpen, setAckModalOpen] = useState(false)
  const [ackAlertId, setAckAlertId] = useState<string>('')
  const [ackNotes, setAckNotes] = useState('')

  // Resolve modal state
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveAlertId, setResolveAlertId] = useState<string>('')
  const [resolveIgnored, setResolveIgnored] = useState(false)
  const [resolveNotes, setResolveNotes] = useState('')

  const { data, isLoading } = useMonitoringAlerts({
    ...(severityFilter ? { severity: severityFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const acknowledgeAlert = useAcknowledgeAlert()
  const resolveAlert = useResolveAlert()

  const handleAcknowledge = (id: string) => {
    setAckAlertId(id)
    setAckNotes('')
    setAckModalOpen(true)
  }

  const handleAcknowledgeConfirm = async () => {
    try {
      await acknowledgeAlert.mutateAsync({ id: ackAlertId, notes: ackNotes || undefined })
      message.success(t('monitoring.acknowledgeSuccess'))
      setAckModalOpen(false)
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleResolve = (id: string) => {
    setResolveAlertId(id)
    setResolveIgnored(false)
    setResolveNotes('')
    setResolveModalOpen(true)
  }

  const handleResolveConfirm = async () => {
    try {
      await resolveAlert.mutateAsync({ id: resolveAlertId, ignored: resolveIgnored, notes: resolveNotes || undefined })
      message.success(t('monitoring.resolveSuccess'))
      setResolveModalOpen(false)
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
          {record.status === AlertStatus.Open && (
            <Button type="link" size="small" onClick={() => handleAcknowledge(record.id)}>
              {t('monitoring.acknowledge')}
            </Button>
          )}
          {(record.status === AlertStatus.Open || record.status === AlertStatus.Acknowledged) && (
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
          onChange={(val) => setSeverityFilter(val)}
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
          onChange={(val) => setStatusFilter(val)}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('monitoring.allStatuses'),
          }))}
        />
      </Space>

      <ResponsiveTable<MonitoringAlertDto>
        rowKey="id"
        columns={columns}
        dataSource={data ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{ pageSize: 20 }}
      />

      {/* Acknowledge Modal */}
      <Modal
        title={t('monitoring.acknowledge')}
        open={ackModalOpen}
        onOk={handleAcknowledgeConfirm}
        onCancel={() => setAckModalOpen(false)}
        confirmLoading={acknowledgeAlert.isPending}
      >
        <div style={{ marginBottom: 8 }}>Ghi ch\u00fa</div>
        <Input.TextArea
          rows={3}
          value={ackNotes}
          onChange={(e) => setAckNotes(e.target.value)}
          placeholder="Nh\u1eadp ghi ch\u00fa (kh\u00f4ng b\u1eaft bu\u1ed9c)"
        />
      </Modal>

      {/* Resolve Modal */}
      <Modal
        title={t('monitoring.resolve')}
        open={resolveModalOpen}
        onOk={handleResolveConfirm}
        onCancel={() => setResolveModalOpen(false)}
        confirmLoading={resolveAlert.isPending}
      >
        <div style={{ marginBottom: 8 }}>
          <span style={{ marginRight: 8 }}>B\u1ecf qua</span>
          <Switch checked={resolveIgnored} onChange={setResolveIgnored} />
        </div>
        <div style={{ marginBottom: 8 }}>Ghi ch\u00fa</div>
        <Input.TextArea
          rows={3}
          value={resolveNotes}
          onChange={(e) => setResolveNotes(e.target.value)}
          placeholder="Nh\u1eadp ghi ch\u00fa (kh\u00f4ng b\u1eaft bu\u1ed9c)"
        />
      </Modal>
    </div>
  )
}
