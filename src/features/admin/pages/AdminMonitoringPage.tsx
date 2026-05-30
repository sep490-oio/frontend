import { useState } from 'react'
import {
  Typography, Card, Tabs, Tag, Button, Space, App,
  Tooltip, Flex, Badge, Statistic, Row, Col, Select, Input, Switch,
  DatePicker, Alert as AntAlert,
} from 'antd'
import {
  AlertOutlined, CheckCircleOutlined, BellOutlined,
  WarningOutlined, FireOutlined, ExclamationCircleOutlined,
  EyeOutlined, LinkOutlined, FilterOutlined, ReloadOutlined, DownloadOutlined, QuestionCircleOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { fetchMonitoringAlerts, useMonitoringAlerts, useAcknowledgeAlert, useAdminCompletedAuctions } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime } from '@/utils/format'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import { MonitoringDashboard } from '@/features/admin/components/MonitoringDashboard'
import { MonitoringAlertDrawer } from '@/features/admin/components/MonitoringAlertDrawer'
import { shortId } from '@/features/admin/utils/parseAlertPayload'
import { getMonitoringAlertView } from '@/features/admin/utils/monitoringAlertView'
import { formatMonitoringDuration } from '@/features/admin/utils/monitoringFormat'
import type { MonitoringAlertDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const { RangePicker } = DatePicker

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

const SCORE_STYLE = [
  { min: 90, color: 'error' },
  { min: 70, color: 'warning' },
  { min: 0, color: 'default' },
] as const

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

const pad2 = (n: number) => String(n).padStart(2, '0')

type DateRangeFilter = [Dayjs | null, Dayjs | null] | null

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
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [alertTypeFilter, setAlertTypeFilter] = useState<string | undefined>()
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>()
  const [onlyUnackFilter, setOnlyUnackFilter] = useState<boolean>(false)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(null)
  const [isExporting, setIsExporting] = useState(false)
  const createdFrom = dateRangeFilter?.[0]?.startOf('day').toISOString()
  const createdTo = dateRangeFilter?.[1]?.endOf('day').toISOString()
  const monitoringParams = {
    pageNumber: page,
    pageSize: 15,
    ...(onlyUnackFilter
      ? { status: AlertStatus.Open }
      : statusTab && statusTab !== 'all'
        ? { status: statusTab }
        : {}),
    ...(severityFilter ? { severity: severityFilter } : {}),
    ...(alertTypeFilter ? { alertType: alertTypeFilter } : {}),
    ...(entityTypeFilter ? { entityType: entityTypeFilter } : {}),
    ...(createdFrom ? { createdFrom } : {}),
    ...(createdTo ? { createdTo } : {}),
    ...(searchFilter.trim() ? { keyword: searchFilter.trim() } : {}),
  }

  const {
    data: allAlertsPage,
    refetch: refetchAll,
    isFetching: isFetchingAll,
    isError: isAllError,
    dataUpdatedAt,
  } = useMonitoringAlerts({ pageNumber: 1, pageSize: 200 })
  const {
    data: filteredAlertsPage,
    isLoading,
    refetch: refetchFiltered,
    isFetching: isFetchingFiltered,
    isError: isFilteredError,
  } = useMonitoringAlerts(monitoringParams)
  const {
    data: completedAuctions,
    isLoading: isCompletedAuctionsLoading,
  } = useAdminCompletedAuctions({ pageSize: 1 })

  const acknowledgeAlert = useAcknowledgeAlert()
  const allAlerts = allAlertsPage?.items ?? []
  const filteredAlerts = filteredAlertsPage?.items ?? []
  const isRefreshing = isFetchingAll || isFetchingFiltered
  const hasError = isAllError || isFilteredError
  const dashboardLoading = !allAlertsPage && isFetchingAll
  const searchLower = searchFilter.trim().toLowerCase()

  const clearAllFilters = () => {
    setSeverityFilter(undefined)
    setSearchFilter('')
    setAlertTypeFilter(undefined)
    setEntityTypeFilter(undefined)
    setOnlyUnackFilter(false)
    setDateRangeFilter(null)
    setPage(1)
  }

  const handleRefresh = () => {
    void refetchAll()
    void refetchFiltered()
  }

  const openCount = allAlerts.filter((a) => a.status === AlertStatus.Open).length

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ id })
      message.success(t('monitoring.acknowledgeSuccess'))
      handleRefresh()
    } catch {
      message.error(t('monitoring.genericError'))
    }
  }

  const navigateToEntity = (entityType: string, entityId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const routeFn = ENTITY_ROUTES[entityType?.toLowerCase()]
    if (routeFn) navigate(routeFn(entityId))
  }

  const displayedAlerts = filteredAlerts
    .filter((a) => (severityFilter ? a.severity === severityFilter : true))
    .filter((a) => (alertTypeFilter ? a.alertType.toLowerCase().includes(alertTypeFilter) : true))
    .filter((a) => (entityTypeFilter ? a.entityType?.toLowerCase() === entityTypeFilter : true))
    .filter((a) => (onlyUnackFilter ? a.status === AlertStatus.Open : true))
    .filter((a) => {
      if (!dateRangeFilter?.[0] || !dateRangeFilter?.[1]) return true
      const createdAt = dayjs(a.createdAt)
      return (
        !createdAt.isBefore(dateRangeFilter[0].startOf('day')) &&
        !createdAt.isAfter(dateRangeFilter[1].endOf('day'))
      )
    })
    .filter((a) => {
      if (!searchLower) return true
      const alertView = getMonitoringAlertView(a)
      const haystack = [
        a.alertType,
        a.alertTitle,
        a.entityType,
        a.entityId,
        a.id,
        alertView.summary,
        ...Object.values(alertView.details),
        ...alertView.evidenceRefs.flatMap((ref) => [ref.type, ref.value, ref.label]),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchLower)
    })
    .slice()
    .sort((a, b) => {
      const aOpen = a.status === AlertStatus.Open ? 0 : 1
      const bOpen = b.status === AlertStatus.Open ? 0 : 1
      if (aOpen !== bOpen) return aOpen - bOpen
      const aSev = SEVERITY_RANK[a.severity] ?? 99
      const bSev = SEVERITY_RANK[b.severity] ?? 99
      if (aSev !== bSev) return aSev - bSev
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const hasActiveFilter =
    !!searchFilter ||
    !!severityFilter ||
    !!alertTypeFilter ||
    !!entityTypeFilter ||
    onlyUnackFilter ||
    !!dateRangeFilter?.[0] ||
    !!dateRangeFilter?.[1]

  const exportCsv = async () => {
    setIsExporting(true)
    try {
      const firstPage = await fetchMonitoringAlerts({
        ...monitoringParams,
        pageNumber: 1,
        pageSize: 50,
      })
      const exportAlerts = [...(firstPage.items ?? [])]
      const totalPages = firstPage.metadata?.totalPages ?? 1

      for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
        const pageResult = await fetchMonitoringAlerts({
          ...monitoringParams,
          pageNumber: nextPage,
          pageSize: 50,
        })
        exportAlerts.push(...(pageResult.items ?? []))
      }

      if (!exportAlerts.length) {
        message.info(t('monitoring.exportEmpty'))
        return
      }

      const headers = [
        'Alert Record ID',
        'Alert type',
        'Severity',
        'Status',
        'Score',
        'Primary Entity Type',
        'Primary Entity ID',
        'Details summary',
        'Evidence References',
        'Created at',
        'Acknowledged by',
        'Acknowledged at',
        'Resolved by',
        'Resolved at',
      ]

      const rows = exportAlerts.map((alert) => {
        const alertView = getMonitoringAlertView(alert)
        return [
          alert.id,
          alertView.title,
          alert.severity,
          alert.status,
          alertView.score ?? '',
          alert.primaryEntity?.type ?? alert.entityType,
          alert.primaryEntity?.id ?? alert.entityId,
          alertView.summary,
          alertView.evidenceRefs.map((ref) => `${ref.label} (${ref.value})`).join('; '),
          alert.createdAt,
          alert.acknowledgedBy ?? '',
          alert.acknowledgedAt ?? '',
          alert.resolvedBy ?? '',
          alert.resolvedAt ?? '',
        ]
      })

      const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\r\n')}`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `monitoring-alerts_${dayjs().format('YYYYMMDD_HHmm')}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      message.success(t('monitoring.exportSuccess', { count: exportAlerts.length }))
    } catch {
      message.error(t('monitoring.genericError'))
    } finally {
      setIsExporting(false)
    }
  }

  const columns: ColumnsType<MonitoringAlertDto> = [
    {
      title: t('monitoring.alert'),
      dataIndex: 'alertType',
      key: 'alertType',
      width: 280,
      fixed: isMobile ? undefined : 'left',
      render: (_type: string, record) => {
        const alertView = getMonitoringAlertView(record)
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {alertView.title}
            </Typography.Text>
            <Tooltip title={t('monitoring.alertIdTooltip')}>
              <Typography.Text type="secondary" copyable={{ text: record.id }} style={{ fontSize: 11 }}>
                {t('monitoring.alertRecordShort', { id: shortId(record.id) })}
              </Typography.Text>
            </Tooltip>
          </Space>
        )
      },
    },
    {
      title: t('monitoring.severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 150,
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
      title: (
        <Tooltip title={t('monitoring.scoreTooltip')}>
          <span>{t('monitoring.score')}</span>
        </Tooltip>
      ),
      key: 'score',
      width: 100,
      render: (_, record) => {
        const alertView = getMonitoringAlertView(record)
        if (alertView.score === undefined) {
          return <Typography.Text type="secondary">-</Typography.Text>
        }
        const color = SCORE_STYLE.find((style) => alertView.score! >= style.min)?.color
        return <Tag color={color}>{alertView.score}</Tag>
      },
      sorter: (a, b) => {
        const aScore = getMonitoringAlertView(a).score ?? -1
        const bScore = getMonitoringAlertView(b).score ?? -1
        return aScore - bScore
      },
    },
    {
      title: t('monitoring.status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: (
        <Tooltip title={t('monitoring.entityTooltip')}>
          <span>{t('monitoring.entity')} <QuestionCircleOutlined style={{ fontSize: 12 }} /></span>
        </Tooltip>
      ),
      key: 'entity',
      width: 230,
      render: (_, record) => {
        const entityType = record.primaryEntity?.type ?? record.entityType
        const entityId = record.primaryEntity?.id ?? record.entityId
        const hasRoute = !!ENTITY_ROUTES[entityType?.toLowerCase()]
        const entityLabel = entityType || '-'
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {t('monitoring.primaryEntity')}: {entityLabel}
            </Typography.Text>
            <Button
              type="link"
              size="small"
              icon={hasRoute ? <LinkOutlined /> : undefined}
              onClick={(e) => navigateToEntity(entityType, entityId, e)}
              disabled={!hasRoute}
              style={{ padding: 0, fontSize: 12, minHeight: isMobile ? 44 : undefined }}
            >
              {hasRoute ? t('monitoring.viewEntityType', { type: entityLabel }) : entityLabel}
            </Button>
            <Tooltip title={t('monitoring.entityIdTooltip')}>
              <Typography.Text type="secondary" copyable={{ text: entityId }} style={{ fontSize: 11 }}>
                {t('monitoring.entityIdShort', { type: entityLabel, id: shortId(entityId) })}
              </Typography.Text>
            </Tooltip>
          </Space>
        )
      },
    },
    {
      title: (
        <Tooltip title={t('monitoring.detailsTooltip')}>
          <span>{t('monitoring.details')} <QuestionCircleOutlined style={{ fontSize: 12 }} /></span>
        </Tooltip>
      ),
      dataIndex: 'payload',
      key: 'payload',
      width: 320,
      ellipsis: true,
      render: (_payload: string, record) => {
        const alertView = getMonitoringAlertView(record)
        return (
          <Tooltip title={alertView.summary}>
            <Typography.Text style={{ fontSize: 13 }} type="secondary">
              {alertView.summary}
            </Typography.Text>
          </Tooltip>
        )
      },
    },
    {
      title: t('monitoring.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => (
        <Tooltip title={`UTC: ${new Date(date).toISOString()}`}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(date)}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: t('monitoring.age'),
      key: 'age',
      width: 120,
      render: (_, record) => {
        if (record.status !== AlertStatus.Open) {
          return <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>
        }
        const totalSec = record.ageSeconds ?? Math.floor((Date.now() - new Date(record.createdAt).getTime()) / 1000)
        if (totalSec < 0) return <Typography.Text type="secondary" style={{ fontSize: 12 }}>-</Typography.Text>
        const days = Math.floor(totalSec / 86400)
        const hours = Math.floor((totalSec % 86400) / 3600)
        const mins = Math.floor((totalSec % 3600) / 60)
        const label = formatMonitoringDuration(`${days}.${pad2(hours)}:${pad2(mins)}:00`)
        const overdue = record.isOverdue || days >= 7
        return (
          <Tag color={overdue ? 'error' : days >= 1 ? 'warning' : undefined} style={{ fontSize: 11 }}>
            {label}{overdue ? ` · ${t('monitoring.overdue')}` : ''}
          </Tag>
        )
      },
    },
    {
      title: t('monitoring.actions'),
      key: 'actions',
      width: 150,
      fixed: isMobile ? undefined : 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('monitoring.viewDetails')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              style={{ minHeight: isMobile ? 44 : undefined, minWidth: isMobile ? 44 : undefined }}
              onClick={(e) => { e.stopPropagation(); setDrawerAlert(record) }}
            />
          </Tooltip>
          {record.status === AlertStatus.Open && (
            <Tooltip title={t('monitoring.acknowledge')}>
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
            <Tooltip title={t('monitoring.resolve')}>
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
                style={{ minHeight: isMobile ? 44 : undefined, minWidth: isMobile ? 44 : undefined }}
                onClick={(e) => { e.stopPropagation(); setDrawerAlert(record) }}
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
          <span style={{ padding: '0 4px' }}>{t('monitoring.open')}</span>
        </Badge>
      ),
    },
    { key: 'acknowledged', label: t('monitoring.acknowledged') },
    { key: 'resolved', label: t('monitoring.resolved') },
    { key: 'all', label: t('monitoring.all') },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <style>{`
        .oio-monitoring-table .ant-table-cell { vertical-align: top; }
        .oio-monitoring-table .ant-table-thead > tr > th { white-space: nowrap; }
        .oio-monitoring-table .ant-table-cell-fix-left,
        .oio-monitoring-table .ant-table-cell-fix-right { background: #fff; }
        .oio-row-critical td { background: #fff1f0 !important; }
        .oio-row-critical td:first-child { border-left: 3px solid #ff4d4f; }
        .oio-row-critical .ant-table-cell-fix-left,
        .oio-row-critical .ant-table-cell-fix-right { background: #fff1f0 !important; }
      `}</style>

      <Flex
        justify="space-between"
        align={isMobile ? 'flex-start' : 'center'}
        vertical={isMobile}
        gap={isMobile ? 12 : 16}
        style={{ marginBottom: isMobile ? 16 : 24 }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0, fontSize: isMobile ? 18 : undefined }}>
            <AlertOutlined style={{ marginRight: 8 }} />
            {t('monitoring.title')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('monitoring.subtitle')}
          </Typography.Text>
        </div>
        <Flex align="center" gap={12} wrap="wrap">
          {dataUpdatedAt > 0 && (
            <Tooltip title={new Date(dataUpdatedAt).toISOString()}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('monitoring.lastUpdated')}: {formatDateTime(new Date(dataUpdatedAt).toISOString())}
              </Typography.Text>
            </Tooltip>
          )}
          <Button
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            {t('monitoring.refresh')}
          </Button>
        </Flex>
      </Flex>

      {hasError && (
        <AntAlert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('monitoring.errorTitle')}
          description={t('monitoring.errorDescription')}
          action={<Button size="small" onClick={handleRefresh}>{t('monitoring.retry')}</Button>}
        />
      )}

      <MonitoringDashboard alerts={allAlerts} loading={dashboardLoading} />

      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            loading={isCompletedAuctionsLoading}
            onClick={() => navigate('/admin/auctions/completed')}
            style={{ cursor: 'pointer', borderRadius: 12 }}
            styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
          >
            <Statistic
              title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('monitoring.completedAuctions')}</span>}
              value={completedAuctions?.metadata?.totalCount ?? 0}
              valueStyle={{ fontSize: isMobile ? 20 : 28 }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: isMobile ? '0 0 12px' : '24px' } }}>
        <div style={{ padding: isMobile ? '12px 16px 8px' : '16px 16px 0' }}>
          <Flex gap={8} wrap="wrap" align="center">
            <Input.Search
              allowClear
              placeholder={t('monitoring.searchPlaceholder')}
              value={searchFilter}
              onChange={(e) => { setSearchFilter(e.target.value); setPage(1) }}
              style={{ width: isMobile ? '100%' : 300 }}
            />
            <Select
              placeholder={
                <span><FilterOutlined style={{ marginRight: 4 }} />{t('monitoring.severity')}</span>
              }
              value={severityFilter}
              onChange={(v) => { setSeverityFilter(v); setPage(1) }}
              allowClear
              style={{ width: isMobile ? '100%' : 150 }}
              options={[
                { value: 'critical', label: tc('statusLabel.critical') },
                { value: 'high', label: tc('statusLabel.high') },
                { value: 'medium', label: tc('statusLabel.medium') },
                { value: 'low', label: tc('statusLabel.low') },
              ]}
            />
            <Select
              placeholder={t('monitoring.alertTypeFilter')}
              value={alertTypeFilter}
              onChange={(v) => { setAlertTypeFilter(v); setPage(1) }}
              allowClear
              style={{ width: isMobile ? '100%' : 190 }}
              options={[
                { value: 'collusion', label: t('monitoring.alertTypeCollusion') },
                { value: 'repeated', label: t('monitoring.alertTypeRepeatedPair') },
                { value: 'non_payment', label: t('monitoring.alertTypeNonPayment') },
                { value: 'suspicious', label: t('monitoring.alertTypeSuspicious') },
              ]}
            />
            <Select
              placeholder={t('monitoring.entityTypeFilter')}
              value={entityTypeFilter}
              onChange={(v) => { setEntityTypeFilter(v); setPage(1) }}
              allowClear
              style={{ width: isMobile ? '100%' : 160 }}
              options={[
                { value: 'auction', label: t('monitoring.entityAuction') },
                { value: 'user', label: t('monitoring.entityUser') },
                { value: 'order', label: t('monitoring.entityOrder') },
              ]}
            />
            <RangePicker
              value={dateRangeFilter}
              onChange={(dates) => {
                setDateRangeFilter(dates as DateRangeFilter)
                setPage(1)
              }}
              style={{ width: isMobile ? '100%' : 260 }}
              placeholder={[t('monitoring.dateFrom'), t('monitoring.dateTo')]}
            />
            <Tooltip title={t('monitoring.onlyUnackTooltip')}>
              <Flex align="center" gap={6} style={{ padding: '0 4px' }}>
                <Switch
                  size="small"
                  checked={onlyUnackFilter}
                  onChange={(v) => { setOnlyUnackFilter(v); setPage(1) }}
                />
                <Typography.Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {t('monitoring.onlyUnack')}
                </Typography.Text>
              </Flex>
            </Tooltip>
            {hasActiveFilter && (
              <Button size="small" onClick={clearAllFilters}>
                {t('monitoring.clearFilters')}
              </Button>
            )}
            <Button
              size="small"
              icon={<ReloadOutlined spin={isRefreshing} />}
              onClick={handleRefresh}
              loading={isRefreshing}
            >
              {t('monitoring.refresh')}
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => { void exportCsv() }}
              disabled={!filteredAlertsPage?.metadata?.totalCount}
              loading={isExporting}
            >
              {t('monitoring.exportCsv')}
            </Button>
          </Flex>
        </div>

        <Tabs
          activeKey={statusTab}
          onChange={(key) => { setStatusTab(key); setPage(1) }}
          items={tabItems}
          style={{ padding: isMobile ? '0 16px' : '0 16px', marginTop: 8 }}
        />

        <ResponsiveTable<MonitoringAlertDto>
          className="oio-monitoring-table"
          rowKey="id"
          columns={columns}
          dataSource={displayedAlerts}
          loading={isLoading || (!filteredAlertsPage && isFetchingFiltered)}
          mobileMode="list"
          scroll={{ x: 1500, y: isMobile ? undefined : 560 }}
          sticky={!isMobile}
          locale={{
            emptyText: hasActiveFilter
              ? t('monitoring.emptyFiltered')
              : t('monitoring.emptyAll'),
          }}
          pagination={{
            current: page,
            pageSize: 15,
            onChange: setPage,
            total: filteredAlertsPage?.metadata?.totalCount ?? displayedAlerts.length,
            showTotal: isMobile ? undefined : (total, range) =>
              `${range[0]}-${range[1]} / ${total} ${t('monitoring.totalAlerts')}`,
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
      </Card>

      <MonitoringAlertDrawer
        alert={drawerAlert}
        open={!!drawerAlert}
        onClose={() => setDrawerAlert(null)}
      />
    </div>
  )
}

function csvValue(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}
