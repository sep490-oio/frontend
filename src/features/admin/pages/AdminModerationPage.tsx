import { useState } from 'react'
import { Typography, Tabs, Select, Space, Button, Modal, Input, Switch, App, Drawer } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import {
  useAdminReports,
  useAdminDisputes,
  useAssignReport,
  useResolveReport,
  useEscalateReportToDispute,
} from '@/features/admin/api'
import { ReportStatus, DisputeStatus } from '@/types/enums'
import type { ReportDto, DisputeDto } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function AdminModerationPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const REPORT_STATUS_OPTIONS = [
    { value: '', label: t('moderation.all') },
    { value: ReportStatus.Open, label: tc('statusLabel.open') },
    { value: ReportStatus.UnderReview, label: tc('statusLabel.under_review') },
    { value: ReportStatus.ActionTaken, label: t('moderation.reportStatus.actionTaken') },
    { value: ReportStatus.Dismissed, label: t('moderation.reportStatus.dismissed') },
    { value: ReportStatus.Closed, label: tc('statusLabel.closed') },
  ]

  const DISPUTE_STATUS_OPTIONS = [
    { value: '', label: t('moderation.all') },
    { value: DisputeStatus.Open, label: tc('statusLabel.open') },
    { value: DisputeStatus.AwaitingRespondent, label: t('moderation.disputeStatus.awaitingRespondent') },
    { value: DisputeStatus.AwaitingEvidence, label: t('moderation.disputeStatus.awaitingEvidence') },
    { value: DisputeStatus.UnderReview, label: tc('statusLabel.under_review') },
    { value: DisputeStatus.AwaitingInternalReview, label: t('moderation.disputeStatus.awaitingInternalReview') },
    { value: DisputeStatus.AwaitingResolutionApproval, label: t('moderation.disputeStatus.awaitingResolutionApproval') },
    { value: DisputeStatus.Resolved, label: tc('statusLabel.resolved') },
    { value: DisputeStatus.Rejected, label: tc('statusLabel.rejected') },
    { value: DisputeStatus.Cancelled, label: tc('statusLabel.cancelled') },
  ]

  const DISPUTE_TYPE_OPTIONS = [
    { value: 'item_not_as_described', label: t('moderation.disputeType.itemNotAsDescribed') },
    { value: 'damaged_item', label: t('moderation.disputeType.damagedItem') },
    { value: 'payment_issue', label: t('moderation.disputeType.paymentIssue') },
    { value: 'counterfeit', label: t('moderation.disputeType.counterfeit') },
    { value: 'other', label: t('moderation.disputeType.other') },
  ]

  const PRIORITY_OPTIONS = [
    { value: 'low', label: tc('statusLabel.low') },
    { value: 'medium', label: tc('statusLabel.medium') },
    { value: 'high', label: tc('statusLabel.high') },
    { value: 'urgent', label: t('moderation.priority.urgent') },
  ]

  const ENFORCEMENT_OPTIONS = [
    { value: 'none', label: t('moderation.enforcement.noAction') },
    { value: 'warn_user', label: t('moderation.enforcement.warnUser') },
    { value: 'suspend_listing', label: t('moderation.enforcement.suspendListing') },
    { value: 'remove_listing', label: t('moderation.enforcement.removeListing') },
  ]

  const [activeTab, setActiveTab] = useState('reports')
  const [reportStatusFilter, setReportStatusFilter] = useState('')
  const [disputeStatusFilter, setDisputeStatusFilter] = useState('')
  const [reportPage, setReportPage] = useState(1)
  const [disputePage, setDisputePage] = useState(1)
  const [pageSize] = useState(10)

  // Report modals/drawers state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignReportId, setAssignReportId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const [resolveDrawerOpen, setResolveDrawerOpen] = useState(false)
  const [resolveReportId, setResolveReportId] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [dismissedFlag, setDismissedFlag] = useState(false)
  const [enforcementAction, setEnforcementAction] = useState('none')

  const [escalateDrawerOpen, setEscalateDrawerOpen] = useState(false)
  const [escalateReportId, setEscalateReportId] = useState('')
  const [escalateTitle, setEscalateTitle] = useState('')
  const [escalateDisputeType, setEscalateDisputeType] = useState('other')
  const [escalatePriority, setEscalatePriority] = useState('medium')

  // Data hooks
  const reports = useAdminReports({ pageNumber: reportPage, pageSize, status: reportStatusFilter || undefined })
  const disputes = useAdminDisputes({ pageNumber: disputePage, pageSize, status: disputeStatusFilter || undefined })

  // Mutation hooks
  const assignReport = useAssignReport()
  const resolveReport = useResolveReport()
  const escalateToDispute = useEscalateReportToDispute()

  const unresolvedReports = reports.data?.items?.filter(
    (r: ReportDto) => r.status === ReportStatus.Open || r.status === ReportStatus.UnderReview
  ).length ?? 0
  const unresolvedDisputes = disputes.data?.items?.filter(
    (d: DisputeDto) => d.status === DisputeStatus.Open || d.status === DisputeStatus.UnderReview
  ).length ?? 0

  const reportColumns = [
    {
      title: t('moderation.columns.reporter'),
      dataIndex: 'reporterId',
      key: 'reporterId',
      ellipsis: true,
      render: (v: string) => v?.slice(0, 8) + '...',
    },
    {
      title: t('moderation.columns.entity'),
      dataIndex: 'entityType',
      key: 'entityType',
      width: 130,
      render: (type: string, r: ReportDto) => (
        <span>{type} #{r.entityId?.slice(0, 8)}</span>
      ),
    },
    { title: t('moderation.columns.reason'), dataIndex: 'reasonCode', key: 'reasonCode', ellipsis: true },
    {
      title: tc('tableHeader.status'),
      dataIndex: 'status',
      key: 'status',
      width: 260,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('moderation.columns.assigned'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150,
      render: (v: string | null) => v ? v.slice(0, 8) + '...' : '-',
    },
    {
      title: t('moderation.columns.dispute'),
      dataIndex: 'disputeId',
      key: 'disputeId',
      width: 100,
      render: (v: string | null) => v ? (
        <Button type="link" size="small" onClick={() => navigate(`/admin/disputes/${v}`)}>
          {tc('action.view')}
        </Button>
      ) : '-',
    },
    {
      title: tc('tableHeader.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: tc('tableHeader.actions'),
      key: 'actions',
      width: isMobile ? 100 : 240,
      render: (_: unknown, record: ReportDto) => {
        const canAct = record.status === ReportStatus.Open || record.status === ReportStatus.UnderReview
        if (isMobile) {
          // Simplified on mobile — full actions available after tapping
          return canAct ? (
            <Button
              size="small"
              type="primary"
              onClick={(e) => {
                e.stopPropagation()
                setEscalateReportId(record.id)
                setEscalateTitle(t('moderation.escalatedFromReport'))
                setEscalateDisputeType('other')
                setEscalatePriority('medium')
                setEscalateDrawerOpen(true)
              }}
              style={{ fontSize: 12 }}
            >
              {t('moderation.escalate')}
            </Button>
          ) : null
        }
        return (
          <Space size="small" wrap>
            {canAct && (
              <>
                <Button size="small" onClick={() => {
                  setAssignReportId(record.id)
                  setAssigneeId('')
                  setAssignModalOpen(true)
                }}>{t('moderation.assign')}</Button>
                <Button size="small" onClick={() => {
                  setResolveReportId(record.id)
                  setResolutionNotes('')
                  setDismissedFlag(false)
                  setEnforcementAction('none')
                  setResolveDrawerOpen(true)
                }}>{t('moderation.resolve')}</Button>
                <Button size="small" type="primary" onClick={() => {
                  setEscalateReportId(record.id)
                  setEscalateTitle(t('moderation.escalatedFromReport'))
                  setEscalateDisputeType('other')
                  setEscalatePriority('medium')
                  setEscalateDrawerOpen(true)
                }}>{t('moderation.escalate')}</Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  const disputeColumns = [
    {
      title: t('moderation.columns.id'),
      dataIndex: 'disputeNumber',
      key: 'disputeNumber',
      width: 150,
      render: (v: string) => v || '-',
    },
    {
      title: t('moderation.columns.title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: tc('tableHeader.status'),
      dataIndex: 'status',
      key: 'status',
      width: 260,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('moderation.columns.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (s: string) => <StatusBadge status={s} size="small" />,
    },
    {
      title: tc('tableHeader.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: tc('tableHeader.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: DisputeDto) => (
        <Button size="small" onClick={() => navigate(`/admin/disputes/${record.id}`)}>
          {tc('action.view')}
        </Button>
      ),
    },
  ]

  // Handlers
  const handleAssign = async () => {
    try {
      await assignReport.mutateAsync({ id: assignReportId, assignedToUserId: assigneeId })
      message.success('Report assigned')
      setAssignModalOpen(false)
    } catch {
      message.error(tc('error', 'Error'))
    }
  }

  const handleResolveReport = async () => {
    try {
      await resolveReport.mutateAsync({
        id: resolveReportId,
        dismissed: dismissedFlag,
        resolutionNotes,
        enforcementAction: dismissedFlag ? undefined : enforcementAction,
      })
      message.success('Report resolved')
      setResolveDrawerOpen(false)
    } catch {
      message.error(tc('error', 'Error'))
    }
  }

  const handleEscalateToDispute = async () => {
    try {
      const result = await escalateToDispute.mutateAsync({
        reportId: escalateReportId,
        title: escalateTitle || undefined,
        disputeType: escalateDisputeType,
        priority: escalatePriority,
      })
      message.success('Report escalated to dispute')
      setEscalateDrawerOpen(false)
      if (result?.id) navigate(`/admin/disputes/${result.id}`)
    } catch {
      message.error(tc('error', 'Error'))
    }
  }

  const tabItems = [
    {
      key: 'reports',
      label: `${t('moderation.tabReports')}${unresolvedReports > 0 ? ` (${unresolvedReports})` : ''}`,
      children: (
        <>
          <Select
            value={reportStatusFilter}
            onChange={(v) => { setReportStatusFilter(v); setReportPage(1) }}
            options={REPORT_STATUS_OPTIONS}
            style={{ width: isMobile ? '100%' : 180, marginBottom: 16 }}
            placeholder={t('moderation.filterByStatus')}
          />
          <ResponsiveTable
            columns={reportColumns}
            dataSource={reports.data?.items ?? []}
            rowKey="id"
            loading={reports.isLoading}
            mobileMode="card"
            onRow={isMobile ? (record: ReportDto) => ({
              onClick: () => {
                const canAct = record.status === ReportStatus.Open || record.status === ReportStatus.UnderReview
                if (canAct) {
                  setResolveReportId(record.id)
                  setResolutionNotes('')
                  setDismissedFlag(false)
                  setEnforcementAction('none')
                  setResolveDrawerOpen(true)
                }
              },
              style: { cursor: 'pointer', minHeight: 56 },
            }) : undefined}
            pagination={{
              current: reportPage,
              pageSize,
              total: reports.data?.metadata?.totalCount ?? 0,
              onChange: setReportPage,
              simple: isMobile,
              showSizeChanger: false,
            }}
          />
        </>
      ),
    },
    {
      key: 'disputes',
      label: `${t('moderation.tabDisputes')}${unresolvedDisputes > 0 ? ` (${unresolvedDisputes})` : ''}`,
      children: (
        <>
          <Select
            value={disputeStatusFilter}
            onChange={(v) => { setDisputeStatusFilter(v); setDisputePage(1) }}
            options={DISPUTE_STATUS_OPTIONS}
            style={{ width: isMobile ? '100%' : 200, marginBottom: 16 }}
            placeholder={t('moderation.filterByStatus')}
          />
          <ResponsiveTable
            columns={disputeColumns}
            dataSource={disputes.data?.items ?? []}
            rowKey="id"
            loading={disputes.isLoading}
            mobileMode="card"
            onRow={(record: DisputeDto) => ({
              onClick: () => navigate(`/admin/disputes/${record.id}`),
              style: { cursor: 'pointer', minHeight: 56 },
            })}
            pagination={{
              current: disputePage,
              pageSize,
              total: disputes.data?.metadata?.totalCount ?? 0,
              onChange: setDisputePage,
              simple: isMobile,
              showSizeChanger: false,
            }}
          />
        </>
      ),
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {t('moderation.title')}
      </Typography.Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ overflowX: 'auto' }}
      />

      {/* Assign Report Modal */}
      <Modal
        title={t('moderation.assignReportTitle')}
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => setAssignModalOpen(false)}
        confirmLoading={assignReport.isPending}
        centered={isMobile}
      >
        <Input
          placeholder={t('moderation.assigneePlaceholder')}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          style={{ minHeight: 44 }}
        />
      </Modal>

      {/* Resolve Report — Drawer on mobile, Modal on desktop */}
      {isMobile ? (
        <Drawer
          title={t('moderation.resolveReportTitle')}
          placement="bottom"
          open={resolveDrawerOpen}
          onClose={() => setResolveDrawerOpen(false)}
          height="auto"
          styles={{ body: { paddingBottom: 32 } }}
          extra={
            <Button
              type="primary"
              onClick={handleResolveReport}
              loading={resolveReport.isPending}
            >
              {t('moderation.resolve')}
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
              <span style={{ fontSize: 15 }}>{t('moderation.dismiss')}</span>
              <Switch checked={dismissedFlag} onChange={setDismissedFlag} />
            </div>
            {!dismissedFlag && (
              <div>
                <div style={{ marginBottom: 6, fontWeight: 500 }}>{t('moderation.enforcementAction')}</div>
                <Select
                  value={enforcementAction}
                  onChange={setEnforcementAction}
                  options={ENFORCEMENT_OPTIONS}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <Input.TextArea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder={t('moderation.resolutionNotesPlaceholder')}
            />
            {/* On mobile, also give access to Assign and Escalate */}
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Button
                block
                style={{ minHeight: 44 }}
                onClick={() => {
                  setResolveDrawerOpen(false)
                  setAssignReportId(resolveReportId)
                  setAssigneeId('')
                  setAssignModalOpen(true)
                }}
              >
                {t('moderation.assign')}
              </Button>
              <Button
                type="primary"
                block
                style={{ minHeight: 44 }}
                onClick={() => {
                  setResolveDrawerOpen(false)
                  setEscalateReportId(resolveReportId)
                  setEscalateTitle(t('moderation.escalatedFromReport'))
                  setEscalateDisputeType('other')
                  setEscalatePriority('medium')
                  setEscalateDrawerOpen(true)
                }}
              >
                {t('moderation.escalate')}
              </Button>
            </Space>
          </Space>
        </Drawer>
      ) : (
        <Modal
          title={t('moderation.resolveReportTitle')}
          open={resolveDrawerOpen}
          onOk={handleResolveReport}
          onCancel={() => setResolveDrawerOpen(false)}
          confirmLoading={resolveReport.isPending}
          width={480}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('moderation.dismiss')}</span>
              <Switch checked={dismissedFlag} onChange={setDismissedFlag} />
            </div>
            {!dismissedFlag && (
              <div>
                <div style={{ marginBottom: 4 }}>{t('moderation.enforcementAction')}</div>
                <Select
                  value={enforcementAction}
                  onChange={setEnforcementAction}
                  options={ENFORCEMENT_OPTIONS}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <Input.TextArea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder={t('moderation.resolutionNotesPlaceholder')}
            />
          </Space>
        </Modal>
      )}

      {/* Escalate to Dispute — Drawer on mobile, Modal on desktop */}
      {isMobile ? (
        <Drawer
          title={t('moderation.escalateToDisputeTitle')}
          placement="bottom"
          open={escalateDrawerOpen}
          onClose={() => setEscalateDrawerOpen(false)}
          height="auto"
          styles={{ body: { paddingBottom: 32 } }}
          extra={
            <Button
              type="primary"
              onClick={handleEscalateToDispute}
              loading={escalateToDispute.isPending}
            >
              {t('moderation.escalate')}
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>{t('moderation.columns.title')}</div>
              <Input
                value={escalateTitle}
                onChange={(e) => setEscalateTitle(e.target.value)}
                placeholder={t('moderation.disputeTitlePlaceholder')}
                style={{ minHeight: 44 }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>{t('moderation.disputeTypeLabel')}</div>
              <Select
                value={escalateDisputeType}
                onChange={setEscalateDisputeType}
                options={DISPUTE_TYPE_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 500 }}>{t('moderation.priorityLabel')}</div>
              <Select
                value={escalatePriority}
                onChange={setEscalatePriority}
                options={PRIORITY_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
          </Space>
        </Drawer>
      ) : (
        <Modal
          title={t('moderation.escalateToDisputeTitle')}
          open={escalateDrawerOpen}
          onOk={handleEscalateToDispute}
          onCancel={() => setEscalateDrawerOpen(false)}
          confirmLoading={escalateToDispute.isPending}
          width={480}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <div style={{ marginBottom: 4 }}>{t('moderation.columns.title')}</div>
              <Input
                value={escalateTitle}
                onChange={(e) => setEscalateTitle(e.target.value)}
                placeholder={t('moderation.disputeTitlePlaceholder')}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4 }}>{t('moderation.disputeTypeLabel')}</div>
              <Select
                value={escalateDisputeType}
                onChange={setEscalateDisputeType}
                options={DISPUTE_TYPE_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4 }}>{t('moderation.priorityLabel')}</div>
              <Select
                value={escalatePriority}
                onChange={setEscalatePriority}
                options={PRIORITY_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
          </Space>
        </Modal>
      )}
    </div>
  )
}
