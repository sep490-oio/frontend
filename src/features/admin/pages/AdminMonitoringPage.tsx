import { useState } from 'react'
import {
  Typography, Card, Tabs, Tag, Button, Space, App,
  Tooltip, Flex, Badge, Statistic, Row, Col, Select,
} from 'antd'
import {
  AlertOutlined, CheckCircleOutlined, BellOutlined,
  WarningOutlined, FireOutlined, ExclamationCircleOutlined,
  EyeOutlined, LinkOutlined, FilterOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMonitoringAlerts, useAcknowledgeAlert, useResolveAlert, useAdminCompletedAuctions } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime } from '@/utils/format'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import { MonitoringDashboard } from '@/features/admin/components/MonitoringDashboard'
import { MonitoringAlertDrawer } from '@/features/admin/components/MonitoringAlertDrawer'
import { parseAlertPayload, formatAlertType } from '@/features/admin/utils/parseAlertPayload'
import type { MonitoringAlertDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const SEVERITY_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  low: { color: '#52c41a', icon: <CheckCircleOutlined /> },
  medium: { color: '#faad14', icon: <ExclamationCircleOutlined /> },
  high: { color: '#ff4d4f', icon: <WarningOutlined /> },
  critical: { color: 'var(--color-danger)', icon: <FireOutlined /> },
}

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}`,
  auction: (id) => `/admin/auctions/${id}`,
  order: (id) => `/admin/orders/${id}`,
  inbound_shipment: (id) => `/admin/warehouse/inbound/${id}`,
}

export default function AdminMonitoringPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [statusTab, setStatusTab] = useState<string>('open')
  const [page, setPage] = useState(1)
  const [drawerAlert, setDrawerAlert] = useState<MonitoringAlertDto | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string | undefined>()

  const { data: allAlerts } = useMonitoringAlerts({})
  const { data: filteredAlerts, isLoading } = useMonitoringAlerts({
    ...(statusTab && statusTab !== 'all' ? { status: statusTab } : {}),
  })
  const { data: completedAuctions } = useAdminCompletedAuctions({ pageSize: 1 })

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


  const displayedAlerts = (filteredAlerts ?? []).filter((a) =>
    severityFilter ? a.severity === severityFilter : true
  )

  const columns: ColumnsType<MonitoringAlertDto> = [
    {
      title: t('monitoring.type', 'Type'),
      dataIndex: 'alertType',
      key: 'alertType',
      width: 220,
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
      width: 160,
      
      ...(!isMobile ? {
        filters: [
          { text: tc('statusLabel.low'), value: 'low' },
          { text: tc('statusLabel.medium'), value: 'medium' },
          { text: tc('statusLabel.high'), value: 'high' },
          { text: tc('statusLabel.critical'), value: 'critical' },
        ],
        onFilter: (value: unknown, record: MonitoringAlertDto) => record.severity === value,
      } : {}),
      render: (severity: string) => {
        const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.low
        return (
          <Tag icon={style.icon} color={style.color} style={{ fontWeight: 600 }}>
            {tc(`statusLabel.${severity}`)}
          </Tag>
        )
      },
    },
    {
      title: t('monitoring.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 220,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('monitoring.entity', 'Entity'),
      key: 'entity',
      width: 160,
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
              style={{ padding: 0, fontSize: 12, minHeight: isMobile ? 44 : undefined }}
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
      width: 180,
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
              style={{ minHeight: isMobile ? 44 : undefined, minWidth: isMobile ? 44 : undefined }}
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
                style={{ minHeight: isMobile ? 44 : undefined, minWidth: isMobile ? 44 : undefined }}
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
                style={{ minHeight: isMobile ? 44 : undefined, minWidth: isMobile ? 44 : undefined }}
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
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <style>{`
        .oio-row-critical td { background: #fff1f0 !important; border-left: 3px solid #ff4d4f; }
      `}</style>

      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Typography.Title level={isMobile ? 3 : 3} style={{ margin: 0, fontSize: isMobile ? 18 : undefined }}>
          <AlertOutlined style={{ marginRight: 8 }} />
          {t('monitoring.title', 'System Monitoring')}
        </Typography.Title>
      </Flex>

      {/* Dashboard Summary Cards */}
      <MonitoringDashboard alerts={allAlerts ?? []} />

      {/* Quick-links row */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/admin/auctions/completed')}
            style={{ cursor: 'pointer', borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          >
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('monitoring.completedAuctions', 'Completed Auction Queue')}</span>}
              value={completedAuctions?.metadata?.totalCount ?? 0}
              valueStyle={{ fontSize: isMobile ? 20 : 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs + Table */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: isMobile ? '0 0 12px' : '24px' } }}>

        {isMobile && (
          <div style={{ padding: '12px 16px 8px' }}>
            <Select
              placeholder={
                <span><FilterOutlined style={{ marginRight: 4 }} />{t('monitoring.severity', 'Severity')}</span>
              }
              value={severityFilter}
              onChange={(v) => setSeverityFilter(v)}
              allowClear
              onClear={() => setSeverityFilter(undefined)}
              style={{ width: '100%' }}
              options={[
                { value: 'low', label: tc('statusLabel.low') },
                { value: 'medium', label: tc('statusLabel.medium') },
                { value: 'high', label: tc('statusLabel.high') },
                { value: 'critical', label: tc('statusLabel.critical') },
              ]}
            />
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <Tabs
            activeKey={statusTab}
            onChange={(key) => { setStatusTab(key); setPage(1) }}
            items={tabItems}
            style={{ padding: isMobile ? '0 16px' : '0' }}
          />

          <ResponsiveTable<MonitoringAlertDto>
            rowKey="id"
            columns={columns}
            dataSource={displayedAlerts}
            loading={isLoading}
            mobileMode="list"
            pagination={{
              current: page,
              pageSize: 15,
              onChange: setPage,
              showTotal: isMobile ? undefined : (total) => `${total} ${t('monitoring.totalAlerts', 'alerts')}`,
              showSizeChanger: false,
              simple: isMobile,
            }}
            rowClassName={(record) =>
              record.severity === AlertSeverity.Critical && record.status === AlertStatus.Open
                ? 'oio-row-critical'
                : ''
            }
            onRow={(record) => ({
              onClick: () => setDrawerAlert(record),
              style: { cursor: 'pointer', minHeight: isMobile ? 56 : undefined },
            })}
          />
        </div>
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
