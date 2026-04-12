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

const REPORT_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: ReportStatus.Open, label: 'Open' },
  { value: ReportStatus.UnderReview, label: 'Under Review' },
  { value: ReportStatus.ActionTaken, label: 'Action Taken' },
  { value: ReportStatus.Dismissed, label: 'Dismissed' },
  { value: ReportStatus.Closed, label: 'Closed' },
]

const DISPUTE_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: DisputeStatus.Open, label: 'Open' },
  { value: DisputeStatus.AwaitingRespondent, label: 'Awaiting Respondent' },
  { value: DisputeStatus.AwaitingEvidence, label: 'Awaiting Evidence' },
  { value: DisputeStatus.UnderReview, label: 'Under Review' },
  { value: DisputeStatus.AwaitingInternalReview, label: 'Awaiting Internal Review' },
  { value: DisputeStatus.AwaitingResolutionApproval, label: 'Awaiting Resolution Approval' },
  { value: DisputeStatus.Resolved, label: 'Resolved' },
  { value: DisputeStatus.Rejected, label: 'Rejected' },
  { value: DisputeStatus.Cancelled, label: 'Cancelled' },
]

const DISPUTE_TYPE_OPTIONS = [
  { value: 'item_not_as_described', label: 'Item Not As Described' },
  { value: 'damaged_item', label: 'Damaged Item' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'counterfeit', label: 'Counterfeit' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const ENFORCEMENT_OPTIONS = [
  { value: 'none', label: 'No action' },
  { value: 'warn_user', label: 'Warn user' },
  { value: 'suspend_listing', label: 'Suspend listing' },
  { value: 'remove_listing', label: 'Remove listing' },
]

export default function AdminModerationPage() {
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

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
      title: 'Reporter',
      dataIndex: 'reporterId',
      key: 'reporterId',
      render: (v: string) => v?.slice(0, 8) + '...',
    },
    {
      title: 'Entity',
      dataIndex: 'entityType',
      key: 'entityType',
      render: (type: string, r: ReportDto) => (
        <span>{type} #{r.entityId?.slice(0, 8)}</span>
      ),
    },
    { title: 'Reason', dataIndex: 'reasonCode', key: 'reasonCode' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Assigned',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (v: string | null) => v ? v.slice(0, 8) + '...' : '-',
    },
    {
      title: 'Dispute',
      dataIndex: 'disputeId',
      key: 'disputeId',
      render: (v: string | null) => v ? (
        <Button type="link" size="small" onClick={() => navigate(`/admin/disputes/${v}`)}>
          View
        </Button>
      ) : '-',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Actions',
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
                }}>Assign</Button>
                <Button size="small" onClick={() => {
                  setResolveReportId(record.id)
                  setResolutionNotes('')
                  setDismissedFlag(false)
                  setEnforcementAction('none')
                  setResolveReportModalOpen(true)
                }}>Resolve</Button>
                <Button size="small" type="primary" onClick={() => {
                  setEscalateReportId(record.id)
                  setEscalateTitle('Escalated from report')
                  setEscalateDisputeType('other')
                  setEscalatePriority('medium')
                  setEscalateModalOpen(true)
                }}>Escalate</Button>
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
      title: 'ID',
      dataIndex: 'disputeNumber',
      key: 'disputeNumber',
      render: (v: string) => v || '-',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (s: string) => <StatusBadge status={s} size="small" />,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: DisputeDto) => (
        <Button size="small" onClick={() => navigate(`/admin/disputes/${record.id}`)}>
          View
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
      label: `Reports${unresolvedReports > 0 ? ` (${unresolvedReports})` : ''}`,
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              value={reportStatusFilter}
              onChange={(v) => { setReportStatusFilter(v); setReportPage(1) }}
              options={REPORT_STATUS_OPTIONS}
              style={{ width: 160 }}
              placeholder="Filter by status"
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
      label: `Disputes${unresolvedDisputes > 0 ? ` (${unresolvedDisputes})` : ''}`,
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              value={disputeStatusFilter}
              onChange={(v) => { setDisputeStatusFilter(v); setDisputePage(1) }}
              options={DISPUTE_STATUS_OPTIONS}
              style={{ width: 180 }}
              placeholder="Filter by status"
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
      <Typography.Title level={2}>Moderation Center</Typography.Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Assign Report Modal */}
      <Modal
        title="Assign Report"
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => setAssignModalOpen(false)}
        confirmLoading={assignReport.isPending}
      >
        <Input
          placeholder="Assignee user ID"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        />
      </Modal>

      {/* Resolve Report Modal (with Enforcement) */}
      <Modal
        title="Resolve Report"
        open={resolveReportModalOpen}
        onOk={handleResolveReport}
        onCancel={() => setResolveReportModalOpen(false)}
        confirmLoading={resolveReport.isPending}
        width={480}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Dismiss</span>
            <Switch checked={dismissedFlag} onChange={setDismissedFlag} />
          </div>
          {!dismissedFlag && (
            <div>
              <div style={{ marginBottom: 4 }}>Enforcement Action</div>
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
            placeholder="Resolution notes"
          />
        </Space>
      </Modal>

      {/* Escalate to Dispute Modal */}
      <Modal
        title="Escalate to Dispute"
        open={escalateModalOpen}
        onOk={handleEscalateToDispute}
        onCancel={() => setEscalateModalOpen(false)}
        confirmLoading={escalateToDispute.isPending}
        width={480}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 4 }}>Title</div>
            <Input
              value={escalateTitle}
              onChange={(e) => setEscalateTitle(e.target.value)}
              placeholder="Dispute title"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>Dispute Type</div>
            <Select
              value={escalateDisputeType}
              onChange={setEscalateDisputeType}
              options={DISPUTE_TYPE_OPTIONS}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>Priority</div>
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
