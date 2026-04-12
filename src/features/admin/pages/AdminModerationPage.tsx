import { useState } from 'react'
import { Typography, Tabs, Select, Space, Button, Modal, Input, Switch, App } from 'antd'
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

export default function AdminModerationPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

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

  // Report modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignReportId, setAssignReportId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const [resolveReportModalOpen, setResolveReportModalOpen] = useState(false)
  const [resolveReportId, setResolveReportId] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [dismissedFlag, setDismissedFlag] = useState(false)
  const [enforcementAction, setEnforcementAction] = useState('none')

  const [escalateModalOpen, setEscalateModalOpen] = useState(false)
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

  // Count unresolved items for tab badges
  const unresolvedReports = reports.data?.items?.filter(
    (r: ReportDto) => r.status === ReportStatus.Open || r.status === ReportStatus.UnderReview
  ).length ?? 0
  const unresolvedDisputes = disputes.data?.items?.filter(
    (d: DisputeDto) => d.status === DisputeStatus.Open || d.status === DisputeStatus.UnderReview
  ).length ?? 0

  // Reports columns
  const reportColumns = [
    {
      title: t('moderation.columns.reporter'),
      dataIndex: 'reporterId',
      key: 'reporterId',
      render: (v: string) => v?.slice(0, 8) + '...',
    },
    {
      title: t('moderation.columns.entity'),
      dataIndex: 'entityType',
      key: 'entityType',
      render: (type: string, r: ReportDto) => (
        <span>{type} #{r.entityId?.slice(0, 8)}</span>
      ),
    },
    { title: t('moderation.columns.reason'), dataIndex: 'reasonCode', key: 'reasonCode' },
    {
      title: tc('tableHeader.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('moderation.columns.assigned'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (v: string | null) => v ? v.slice(0, 8) + '...' : '-',
    },
    {
      title: t('moderation.columns.dispute'),
      dataIndex: 'disputeId',
      key: 'disputeId',
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
      render: (v: string) => formatDateTime(v),
    },
    {
      title: tc('tableHeader.actions'),
      key: 'actions',
      render: (_: unknown, record: ReportDto) => {
        const canAct = record.status === ReportStatus.Open || record.status === ReportStatus.UnderReview
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
                  setResolveReportModalOpen(true)
                }}>{t('moderation.resolve')}</Button>
                <Button size="small" type="primary" onClick={() => {
                  setEscalateReportId(record.id)
                  setEscalateTitle(t('moderation.escalatedFromReport'))
                  setEscalateDisputeType('other')
                  setEscalatePriority('medium')
                  setEscalateModalOpen(true)
                }}>{t('moderation.escalate')}</Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  // Dispute columns
  const disputeColumns = [
    {
      title: t('moderation.columns.id'),
      dataIndex: 'disputeNumber',
      key: 'disputeNumber',
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
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('moderation.columns.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (s: string) => <StatusBadge status={s} size="small" />,
    },
    {
      title: tc('tableHeader.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: tc('tableHeader.actions'),
      key: 'actions',
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
      setResolveReportModalOpen(false)
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
      setEscalateModalOpen(false)
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
          <Space style={{ marginBottom: 16 }}>
            <Select
              value={reportStatusFilter}
              onChange={(v) => { setReportStatusFilter(v); setReportPage(1) }}
              options={REPORT_STATUS_OPTIONS}
              style={{ width: 160 }}
              placeholder={t('moderation.filterByStatus')}
            />
          </Space>
          <ResponsiveTable
            columns={reportColumns}
            dataSource={reports.data?.items ?? []}
            rowKey="id"
            loading={reports.isLoading}
            pagination={{
              current: reportPage,
              pageSize,
              total: reports.data?.metadata?.totalCount ?? 0,
              onChange: setReportPage,
            }}
            mobileMode="card"
          />
        </>
      ),
    },
    {
      key: 'disputes',
      label: `${t('moderation.tabDisputes')}${unresolvedDisputes > 0 ? ` (${unresolvedDisputes})` : ''}`,
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              value={disputeStatusFilter}
              onChange={(v) => { setDisputeStatusFilter(v); setDisputePage(1) }}
              options={DISPUTE_STATUS_OPTIONS}
              style={{ width: 180 }}
              placeholder={t('moderation.filterByStatus')}
            />
          </Space>
          <ResponsiveTable
            columns={disputeColumns}
            dataSource={disputes.data?.items ?? []}
            rowKey="id"
            loading={disputes.isLoading}
            pagination={{
              current: disputePage,
              pageSize,
              total: disputes.data?.metadata?.totalCount ?? 0,
              onChange: setDisputePage,
            }}
            mobileMode="card"
          />
        </>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2}>{t('moderation.title')}</Typography.Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Assign Report Modal */}
      <Modal
        title={t('moderation.assignReportTitle')}
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => setAssignModalOpen(false)}
        confirmLoading={assignReport.isPending}
      >
        <Input
          placeholder={t('moderation.assigneePlaceholder')}
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        />
      </Modal>

      {/* Resolve Report Modal (with Enforcement) */}
      <Modal
        title={t('moderation.resolveReportTitle')}
        open={resolveReportModalOpen}
        onOk={handleResolveReport}
        onCancel={() => setResolveReportModalOpen(false)}
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

      {/* Escalate to Dispute Modal */}
      <Modal
        title={t('moderation.escalateToDisputeTitle')}
        open={escalateModalOpen}
        onOk={handleEscalateToDispute}
        onCancel={() => setEscalateModalOpen(false)}
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

    </div>
  )
}
