import { useState } from 'react'
import {
  Typography, Card, Tabs, Tag, Button, Space, App,
  Tooltip, Flex, Badge,
} from 'antd'
import {
  AlertOutlined, CheckCircleOutlined, BellOutlined,
  WarningOutlined, FireOutlined, ExclamationCircleOutlined,
  EyeOutlined, LinkOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMonitoringAlerts, useAcknowledgeAlert, useResolveAlert } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime } from '@/utils/format'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import { MonitoringDashboard } from '@/features/admin/components/MonitoringDashboard'
import { MonitoringAlertDrawer } from '@/features/admin/components/MonitoringAlertDrawer'
import { parseAlertPayload, formatAlertType } from '@/features/admin/utils/parseAlertPayload'
import type { MonitoringAlertDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const SEVERITY_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  low: { color: '#52c41a', icon: <CheckCircleOutlined />, label: 'Low' },
  medium: { color: '#faad14', icon: <ExclamationCircleOutlined />, label: 'Medium' },
  high: { color: '#ff4d4f', icon: <WarningOutlined />, label: 'High' },
  critical: { color: 'var(--color-danger)', icon: <FireOutlined />, label: 'Critical' },
}

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  auction: (id) => `/admin/auctions/${id}`,
  order: (id) => `/admin/orders/${id}`,
  inbound_shipment: (id) => `/admin/warehouse/inbound/${id}`,
}

export default function AdminMonitoringPage() {
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [statusTab, setStatusTab] = useState<string>('open')
  const [page, setPage] = useState(1)
  const [drawerAlert, setDrawerAlert] = useState<MonitoringAlertDto | null>(null)

  // Fetch all alerts for dashboard stats (no filter)
  const { data: allAlerts } = useMonitoringAlerts({})
  // Fetch filtered alerts for table
  const { data: filteredAlerts, isLoading } = useMonitoringAlerts({
    ...(statusTab && statusTab !== 'all' ? { status: statusTab } : {}),
  })

  const acknowledgeAlert = useAcknowledgeAlert()
  const resolveAlert = useResolveAlert()

  const openCount = (allAlerts ?? []).filter((a) => a.status === AlertStatus.Open).length

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ id })
      message.success(t('monitoring.acknowledgeSuccess', 'Alert acknowledged'))
    } catch {
      message.error(t('common.error', 'An error occurred'))
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert.mutateAsync({ id, ignored: false })
      message.success(t('monitoring.resolveSuccess', 'Alert resolved'))
    } catch {
      message.error(t('common.error', 'An error occurred'))
    }
  }

  const navigateToEntity = (entityType: string, entityId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const routeFn = ENTITY_ROUTES[entityType?.toLowerCase()]
    if (routeFn) navigate(routeFn(entityId))
  }

  const columns: ColumnsType<MonitoringAlertDto> = [
    {
      title: t('monitoring.type', 'Type'),
      dataIndex: 'alertType',
      key: 'alertType',
      width: 200,
      render: (type: string) => (
        <Typography.Text strong style={{ fontSize: 13 }}>
          {formatAlertType(type)}
        </Typography.Text>
      ),
    },
    {
      title: t('monitoring.severity', 'Severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 110,
      filters: [
        { text: 'Low', value: 'low' },
        { text: 'Medium', value: 'medium' },
        { text: 'High', value: 'high' },
        { text: 'Critical', value: 'critical' },
      ],
      onFilter: (value, record) => record.severity === value,
      render: (severity: string) => {
        const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.low
        return (
          <Tag icon={cfg.icon} color={cfg.color} style={{ fontWeight: 600 }}>
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: t('monitoring.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('monitoring.entity', 'Entity'),
      key: 'entity',
      width: 140,
      render: (_, record) => {
        const hasRoute = !!ENTITY_ROUTES[record.entityType?.toLowerCase()]
        return (
          <Tooltip title={hasRoute ? t('monitoring.viewEntity', 'View entity') : record.entityId}>
            <Button
              type="link"
              size="small"
              icon={hasRoute ? <LinkOutlined /> : undefined}
              onClick={(e) => navigateToEntity(record.entityType, record.entityId, e)}
              disabled={!hasRoute}
              style={{ padding: 0, fontSize: 12 }}
            >
              {record.entityType}
            </Button>
          </Tooltip>
        )
      },
    },
    {
      title: t('monitoring.details', 'Details'),
      dataIndex: 'payload',
      key: 'payload',
      ellipsis: true,
      render: (payload: string, record) => {
        const parsed = parseAlertPayload(record.alertType, payload)
        return (
          <Typography.Text style={{ fontSize: 13 }} type="secondary">
            {parsed.summary}
          </Typography.Text>
        )
      },
    },
    {
      title: t('monitoring.createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (date: string) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {formatDateTime(date)}
        </Typography.Text>
      ),
    },
    {
      title: t('monitoring.actions', 'Actions'),
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('monitoring.viewDetails', 'View details')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); setDrawerAlert(record) }}
            />
          </Tooltip>
          {record.status === AlertStatus.Open && (
            <Tooltip title={t('monitoring.acknowledge', 'Acknowledge')}>
              <Button
                type="text"
                size="small"
                icon={<BellOutlined />}
                loading={acknowledgeAlert.isPending}
                onClick={(e) => { e.stopPropagation(); void handleAcknowledge(record.id) }}
              />
            </Tooltip>
          )}
          {(record.status === AlertStatus.Open || record.status === AlertStatus.Acknowledged) && (
            <Tooltip title={t('monitoring.resolve', 'Resolve')}>
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
                loading={resolveAlert.isPending}
                onClick={(e) => { e.stopPropagation(); void handleResolve(record.id) }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'open',
      label: (
        <Badge count={openCount} size="small" offset={[8, -2]}>
          <span style={{ padding: '0 4px' }}>{t('monitoring.open', 'Open')}</span>
        </Badge>
      ),
    },
    { key: 'acknowledged', label: t('monitoring.acknowledged', 'Acknowledged') },
    { key: 'resolved', label: t('monitoring.resolved', 'Resolved') },
    { key: 'all', label: t('monitoring.all', 'All') },
  ]

  return (
    <div>
      <style>{`
        .oio-row-critical td { background: #fff1f0 !important; border-left: 3px solid #ff4d4f; }
      `}</style>

      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          <AlertOutlined style={{ marginRight: 8 }} />
          {t('monitoring.title', 'System Monitoring')}
        </Typography.Title>
      </Flex>

      {/* Dashboard Summary Cards */}
      <MonitoringDashboard alerts={allAlerts ?? []} />

      {/* Tabs + Table */}
      <Card>
        <Tabs
          activeKey={statusTab}
          onChange={(key) => { setStatusTab(key); setPage(1) }}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />

        <ResponsiveTable<MonitoringAlertDto>
          rowKey="id"
          columns={columns}
          dataSource={filteredAlerts ?? []}
          loading={isLoading}
          mobileMode="list"
          pagination={{
            current: page,
            pageSize: 15,
            onChange: setPage,
            showTotal: (total) => `${total} alerts`,
            showSizeChanger: false,
          }}
          rowClassName={(record) =>
            record.severity === AlertSeverity.Critical && record.status === AlertStatus.Open
              ? 'oio-row-critical'
              : ''
          }
          onRow={(record) => ({
            onClick: () => setDrawerAlert(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Detail Drawer */}
      <MonitoringAlertDrawer
        alert={drawerAlert}
        open={!!drawerAlert}
        onClose={() => setDrawerAlert(null)}
      />
    </div>
  )
}
