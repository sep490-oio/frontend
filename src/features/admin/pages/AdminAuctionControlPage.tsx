import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Card, Button, Space, Spin, Switch, InputNumber, Input, App, Select, Modal, Tooltip, Alert, DatePicker, Divider } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined, ThunderboltOutlined, ExclamationCircleOutlined, StopOutlined, ClockCircleOutlined, SwapOutlined, PoweroffOutlined, RedoOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionDetail, useAuctionBids } from '@/features/auction/auctionApi.ts'
import { useSetCuration, useTriggerEmergency, useResolveEmergency, useCancelBid, useFlagAuction, useAdminForceCancelAuction, useAdminTerminateAuction, useAdminExtendAuctionTime, useAdminOverrideAuctionStatus, useAdminForceEndAuction, useAdminRelistAuction, useAdminRemoveBidWithRefund } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { BidDto } from '@/types'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import type { ColumnsType } from 'antd/es/table'
import type { AxiosError } from 'axios'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { isBidCancellable } from '@/features/admin/utils/monitoringFormat'
import dayjs from 'dayjs'

export default function AdminAuctionControlPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: detail, isLoading, error, refetch } = useAuctionDetail(id!)
  const { data: bidsData } = useAuctionBids(id!)

  const setCuration = useSetCuration()
  const triggerEmergency = useTriggerEmergency()
  const resolveEmergency = useResolveEmergency()
  const flagAuction = useFlagAuction()
  const cancelBid = useCancelBid()
  const forceCancelAuction = useAdminForceCancelAuction()
  const terminateAuction = useAdminTerminateAuction()
  const extendAuctionTime = useAdminExtendAuctionTime()
  const overrideAuctionStatus = useAdminOverrideAuctionStatus()
  const forceEndAuction = useAdminForceEndAuction()
  const relistAuction = useAdminRelistAuction()
  const removeBidWithRefund = useAdminRemoveBidWithRefund()

  const [featured, setFeatured] = useState(false)
  const [priority, setPriority] = useState(0)
  const [emergencyReason, setEmergencyReason] = useState('')
  const [emergencyTriggerSource, setEmergencyTriggerSource] = useState('')
  const [emergencyPayload, setEmergencyPayload] = useState('')

  const [flagAlertType, setFlagAlertType] = useState<string>('')
  const [flagSeverity, setFlagSeverity] = useState<string>('')
  const [flagPayload, setFlagPayload] = useState('')

  const [resolveEmStatus, setResolveEmStatus] = useState<string>('')
  const [resolveEmPayload, setResolveEmPayload] = useState('')
  const [resolveEmId, setResolveEmId] = useState('')

  const [cancelBidTarget, setCancelBidTarget] = useState<BidDto | null>(null)
  const [cancelBidReason, setCancelBidReason] = useState('')

  // Admin lifecycle action modals
  const [lifecycleModal, setLifecycleModal] = useState<'forceCancel' | 'terminate' | 'forceEnd' | null>(null)
  const [lifecycleReason, setLifecycleReason] = useState('')

  // Extend time
  const [extendMinutes, setExtendMinutes] = useState(30)
  const [extendReason, setExtendReason] = useState('')

  // Override status
  const [overrideStatus, setOverrideStatus] = useState<string>('')
  const [overrideReason, setOverrideReason] = useState('')

  // Relist
  const [relistModalOpen, setRelistModalOpen] = useState(false)
  const [relistQualStart, setRelistQualStart] = useState<dayjs.Dayjs | null>(null)
  const [relistQualEnd, setRelistQualEnd] = useState<dayjs.Dayjs | null>(null)
  const [relistStart, setRelistStart] = useState<dayjs.Dayjs | null>(null)
  const [relistEnd, setRelistEnd] = useState<dayjs.Dayjs | null>(null)
  const [relistReason, setRelistReason] = useState('')

  // Remove bid with refund
  const [removeBidTarget, setRemoveBidTarget] = useState<BidDto | null>(null)
  const [removeBidReason, setRemoveBidReason] = useState('')

  const auction = detail?.auction

  useEffect(() => {
    if (auction) {
      setFeatured(auction.isFeatured ?? false)
      setPriority(auction.priority ?? 0)
    }
  }, [auction])

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !auction) return <AdminErrorState message={t('common.error')} onRetry={refetch} backPath="/admin/auctions" />

  const handleSaveCuration = async () => {
    try {
      await setCuration.mutateAsync({ auctionId: id!, isFeatured: featured, priority })
      message.success(t('auctionControl.curationSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleTriggerEmergency = async () => {
    if (!emergencyReason || !emergencyTriggerSource) return
    let parsedPayload: unknown = undefined
    if (emergencyPayload) {
      try {
        parsedPayload = JSON.parse(emergencyPayload)
      } catch {
        message.error(t('auctionControl.invalidJsonPayload', 'Payload is not valid JSON'))
        return
      }
    }
    try {
      await triggerEmergency.mutateAsync({
        auctionId: id!,
        reason: emergencyReason,
        triggerSource: emergencyTriggerSource,
        payload: parsedPayload as object,
      })
      message.success(t('auctionControl.emergencySuccess'))
      setEmergencyReason('')
      setEmergencyTriggerSource('')
      setEmergencyPayload('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleFlagAuction = async () => {
    if (!flagAlertType || !flagSeverity) return
    try {
      await flagAuction.mutateAsync({
        auctionId: id!,
        alertType: flagAlertType,
        severity: flagSeverity,
        payload: { detail: flagPayload },
      })
      message.success(t('auctionControl.flagSuccess', 'Auction flagged successfully'))
      setFlagAlertType('')
      setFlagSeverity('')
      setFlagPayload('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleResolveEmergency = async () => {
    if (!resolveEmId || !resolveEmStatus) return
    try {
      await resolveEmergency.mutateAsync({
        auctionId: id!,
        emergencyId: resolveEmId,
        status: resolveEmStatus,
        payload: resolveEmPayload ? { detail: resolveEmPayload } : {},
      })
      message.success(t('auctionControl.resolveEmergencySuccess', 'Emergency resolved successfully'))
      setResolveEmId('')
      setResolveEmStatus('')
      setResolveEmPayload('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleConfirmCancelBid = async () => {
    if (!cancelBidTarget) return
    const reason = cancelBidReason.trim()
    if (!reason) return
    try {
      await cancelBid.mutateAsync({ auctionId: id!, bidId: cancelBidTarget.id, reason })
      message.success(t('auctionControl.cancelBidSuccess'))
      setCancelBidTarget(null)
      setCancelBidReason('')
    } catch (err) {
      // Surface server-side validation messages so admins get a real reason
      // instead of the generic "An error occurred" toast.
      const axiosErr = err as AxiosError<{ detail?: string; title?: string; errors?: Record<string, string[]> }>
      const apiData = axiosErr?.response?.data
      const fieldErrors = apiData?.errors
      const reasonError = fieldErrors?.['reason'] ?? fieldErrors?.['Reason']
      const detail =
        (Array.isArray(reasonError) && reasonError[0]) ||
        apiData?.detail ||
        apiData?.title ||
        t('common.error')
      message.error(detail)
    }
  }

  const closeCancelBidModal = () => {
    if (cancelBid.isPending) return
    setCancelBidTarget(null)
    setCancelBidReason('')
  }

  const handleLifecycleAction = async () => {
    if (!lifecycleModal || !lifecycleReason.trim()) return
    try {
      const payload = { auctionId: id!, reason: lifecycleReason.trim() }
      if (lifecycleModal === 'forceCancel') await forceCancelAuction.mutateAsync(payload)
      else if (lifecycleModal === 'terminate') await terminateAuction.mutateAsync(payload)
      else if (lifecycleModal === 'forceEnd') await forceEndAuction.mutateAsync(payload)
      message.success('Action completed successfully')
      setLifecycleModal(null)
      setLifecycleReason('')
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleExtendTime = async () => {
    if (!extendReason.trim() || extendMinutes <= 0) return
    try {
      await extendAuctionTime.mutateAsync({ auctionId: id!, extensionMinutes: extendMinutes, reason: extendReason.trim() })
      message.success('Auction time extended')
      setExtendReason('')
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleOverrideStatus = async () => {
    if (!overrideStatus || !overrideReason.trim()) return
    try {
      await overrideAuctionStatus.mutateAsync({ auctionId: id!, newStatus: overrideStatus, reason: overrideReason.trim() })
      message.success('Status overridden')
      setOverrideStatus('')
      setOverrideReason('')
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleRelist = async () => {
    if (!relistQualStart || !relistQualEnd || !relistStart || !relistEnd) return
    try {
      await relistAuction.mutateAsync({
        auctionId: id!,
        qualificationStartAt: relistQualStart.toISOString(),
        qualificationEndAt: relistQualEnd.toISOString(),
        startAt: relistStart.toISOString(),
        endAt: relistEnd.toISOString(),
        reason: relistReason || undefined,
      })
      message.success('Auction relisted')
      setRelistModalOpen(false)
      setRelistReason('')
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const handleRemoveBidWithRefund = async () => {
    if (!removeBidTarget || !removeBidReason.trim()) return
    try {
      await removeBidWithRefund.mutateAsync({ auctionId: id!, bidId: removeBidTarget.id, reason: removeBidReason.trim() })
      message.success('Bid removed and deposit refunded')
      setRemoveBidTarget(null)
      setRemoveBidReason('')
      refetch()
    } catch { message.error(t('common.error')) }
  }

  const lifecycleLoading = forceCancelAuction.isPending || terminateAuction.isPending || forceEndAuction.isPending

  const bidColumns: ColumnsType<BidDto> = [
    {
      title: t('auctionControl.bidder'),
      dataIndex: 'bidderId',
      key: 'bidderId',
      ellipsis: true,
    },
    {
      title: t('auctionControl.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: unknown) => {
        if (amount != null && typeof amount === 'object' && 'amount' in amount) {
          const money = amount as { amount: number; currency: string }
          return formatCurrency(money.amount, money.currency)
        }
        return formatCurrency(amount as number, auction.currency)
      },
    },
    {
      title: t('auctionControl.bidStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('auctionControl.bidDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reviewQueue.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => {
        const cancellable = isBidCancellable(record.status)
        return (
          <Space size={4} direction="vertical">
            {cancellable ? (
              <>
                <Button type="link" size="small" danger onClick={() => { setCancelBidTarget(record); setCancelBidReason('') }}>
                  {t('auctionControl.cancelBid')}
                </Button>
                <Button type="link" size="small" onClick={() => { setRemoveBidTarget(record); setRemoveBidReason('') }} icon={<DeleteOutlined />}>
                  Remove + Refund
                </Button>
              </>
            ) : (
              <Tooltip title={t('auctionControl.cancelBidNotAllowed', 'Bid này không thể hủy ở trạng thái hiện tại.')}>
                <span>
                  <Button type="link" size="small" danger disabled>{t('auctionControl.cancelBid')}</Button>
                </span>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  const fieldSpacing = isMobile ? 8 : 'middle' as const

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ minHeight: 44 }}>
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {t('auctionControl.title')} - {detail?.item?.title ?? id}
      </Typography.Title>

      {/* Curation controls */}
      <Card title={t('auctionControl.curation')} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space direction="vertical" size={fieldSpacing} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
            <Typography.Text strong>{t('auctionControl.featured')}:</Typography.Text>
            <Switch checked={featured} onChange={setFeatured} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.priority')}:</Typography.Text>
            <InputNumber
              min={0}
              max={100}
              value={priority}
              onChange={(val) => setPriority(val ?? 0)}
              style={{ width: '100%', minHeight: 44 }}
            />
          </div>
          <Button
            type="primary"
            onClick={handleSaveCuration}
            loading={setCuration.isPending}
            block={isMobile}
            style={{ minHeight: 44 }}
          >
            {t('auctionControl.saveCuration')}
          </Button>
        </Space>
      </Card>

      {/* T012: Flag Auction section */}
      <Card title={t('auctionControl.flagAuction', 'Flag Auction')} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={fieldSpacing}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.alertType', 'Alert Type')}:</Typography.Text>
            <Select
              style={{ width: '100%' }}
              value={flagAlertType || undefined}
              onChange={setFlagAlertType}
              placeholder={t('auctionControl.selectAlertType', 'Select alert type')}
              options={[
                { value: 'fraud', label: t('auctionControl.alertTypeOption.fraud') },
                { value: 'suspicious', label: t('auctionControl.alertTypeOption.suspicious') },
                { value: 'collusion', label: t('auctionControl.alertTypeOption.collusion') },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.severity', 'Severity')}:</Typography.Text>
            <Select
              style={{ width: '100%' }}
              value={flagSeverity || undefined}
              onChange={setFlagSeverity}
              placeholder={t('auctionControl.selectSeverity', 'Select severity')}
              options={[
                { value: 'low', label: tc('statusLabel.low') },
                { value: 'medium', label: tc('statusLabel.medium') },
                { value: 'high', label: tc('statusLabel.high') },
                { value: 'critical', label: tc('statusLabel.critical') },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.details', 'Details')}:</Typography.Text>
            <Input.TextArea
              rows={2}
              value={flagPayload}
              onChange={(e) => setFlagPayload(e.target.value)}
              placeholder={t('auctionControl.enterAlertDetails', 'Enter alert details')}
            />
          </div>
          <Button
            type="primary"
            danger
            onClick={handleFlagAuction}
            loading={flagAuction.isPending}
            disabled={!flagAlertType || !flagSeverity}
            block={isMobile}
            style={{ minHeight: 44 }}
          >
            {t('auctionControl.flagButton', 'Flag')}
          </Button>
        </Space>
      </Card>

      {/* Emergency section */}
      <Card
        title={<><ThunderboltOutlined /> {t('auctionControl.emergency')}</>}
        style={{ marginBottom: 16, borderRadius: 12 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={fieldSpacing}>
          <Input.TextArea
            rows={2}
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            placeholder={t('auctionControl.emergencyReasonPlaceholder')}
          />
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.triggerSource', 'Trigger Source')}:</Typography.Text>
            <Input
              value={emergencyTriggerSource}
              onChange={(e) => setEmergencyTriggerSource(e.target.value)}
              placeholder={t('auctionControl.enterTriggerSource', 'Enter trigger source')}
              style={{ minHeight: 44 }}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.detailsJson', 'Details (JSON)')}:</Typography.Text>
            <Input.TextArea
              rows={2}
              value={emergencyPayload}
              onChange={(e) => setEmergencyPayload(e.target.value)}
              placeholder={t('auctionControl.enterJsonDetails', 'Enter details as JSON, e.g. {"key": "value"}')}
            />
          </div>
          <Button
            danger
            onClick={handleTriggerEmergency}
            loading={triggerEmergency.isPending}
            disabled={!emergencyReason || !emergencyTriggerSource}
            block={isMobile}
            style={{ minHeight: 44 }}
          >
            {t('auctionControl.triggerEmergency')}
          </Button>
        </Space>
      </Card>

      {/* T014: Resolve Emergency section */}
      <Card title={t('auctionControl.resolveEmergency', 'Resolve Emergency')} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={fieldSpacing}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.emergencyId', 'Emergency ID')}:</Typography.Text>
            <Input
              value={resolveEmId}
              onChange={(e) => setResolveEmId(e.target.value)}
              placeholder={t('auctionControl.enterEmergencyId', 'Enter Emergency ID')}
              style={{ minHeight: 44 }}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.status', 'Status')}:</Typography.Text>
            <Select
              style={{ width: '100%' }}
              value={resolveEmStatus || undefined}
              onChange={setResolveEmStatus}
              placeholder={t('auctionControl.selectStatus', 'Select status')}
              options={[
                { value: 'resolved', label: t('auctionControl.resolutionStatus.resolved') },
                { value: 'dismissed', label: t('auctionControl.resolutionStatus.dismissed') },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('auctionControl.details', 'Details')}:</Typography.Text>
            <Input.TextArea
              rows={2}
              value={resolveEmPayload}
              onChange={(e) => setResolveEmPayload(e.target.value)}
              placeholder={t('auctionControl.enterResolutionDetails', 'Enter resolution details')}
            />
          </div>
          <Button
            type="primary"
            onClick={handleResolveEmergency}
            loading={resolveEmergency.isPending}
            disabled={!resolveEmId || !resolveEmStatus}
            block={isMobile}
            style={{ minHeight: 44 }}
          >
            {t('auctionControl.resolveButton', 'Resolve Emergency')}
          </Button>
        </Space>
      </Card>

      {/* Admin Lifecycle Actions */}
      <Card title={<><PoweroffOutlined /> Admin Lifecycle Actions</>} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Alert type="warning" showIcon message="These actions are irreversible and affect all bidders, deposits, and orders." style={{ marginBottom: 16 }} />
        <Space wrap size={12}>
          <Button danger icon={<StopOutlined />} onClick={() => { setLifecycleModal('forceCancel'); setLifecycleReason('') }} style={{ minHeight: 44 }}>
            Force Cancel
          </Button>
          <Button danger type="primary" icon={<PoweroffOutlined />} onClick={() => { setLifecycleModal('terminate'); setLifecycleReason('') }} style={{ minHeight: 44 }}>
            Terminate
          </Button>
          <Button type="primary" icon={<StopOutlined />} onClick={() => { setLifecycleModal('forceEnd'); setLifecycleReason('') }} style={{ minHeight: 44 }}>
            Force End
          </Button>
        </Space>
      </Card>

      {/* Extend Time */}
      <Card title={<><ClockCircleOutlined /> Extend Auction Time</>} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Space direction="vertical" size={fieldSpacing} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Extension (minutes):</Typography.Text>
            <InputNumber min={1} max={1440} value={extendMinutes} onChange={(v) => setExtendMinutes(v ?? 30)} style={{ width: '100%', minHeight: 44 }} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Reason:</Typography.Text>
            <Input.TextArea rows={2} value={extendReason} onChange={(e) => setExtendReason(e.target.value)} placeholder="Reason for extending..." />
          </div>
          <Button type="primary" onClick={handleExtendTime} loading={extendAuctionTime.isPending} disabled={!extendReason.trim()} block={isMobile} style={{ minHeight: 44 }}>
            Extend Time
          </Button>
        </Space>
      </Card>

      {/* Override Status */}
      <Card title={<><SwapOutlined /> Override Auction Status</>} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Alert type="error" showIcon message="Status override bypasses normal state machine. No domain events are raised." style={{ marginBottom: 16 }} />
        <Space direction="vertical" size={fieldSpacing} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>New Status:</Typography.Text>
            <Select style={{ width: '100%' }} value={overrideStatus || undefined} onChange={setOverrideStatus} placeholder="Select new status" options={[
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'active', label: 'Active' },
              { value: 'ended', label: 'Ended' },
              { value: 'sold', label: 'Sold' },
              { value: 'completed', label: 'Completed' },
              { value: 'payment_defaulted', label: 'Payment Defaulted' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'failed', label: 'Failed' },
              { value: 'terminated', label: 'Terminated' },
            ]} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Reason:</Typography.Text>
            <Input.TextArea rows={2} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason for status override..." />
          </div>
          <Button type="primary" danger onClick={handleOverrideStatus} loading={overrideAuctionStatus.isPending} disabled={!overrideStatus || !overrideReason.trim()} block={isMobile} style={{ minHeight: 44 }}>
            Override Status
          </Button>
        </Space>
      </Card>

      {/* Relist Auction */}
      <Card title={<><RedoOutlined /> Relist Auction</>} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Typography.Text type="secondary">Create a new auction from this one (for failed/cancelled/terminated auctions).</Typography.Text>
        <Divider style={{ margin: '12px 0' }} />
        <Button type="primary" onClick={() => setRelistModalOpen(true)} block={isMobile} style={{ minHeight: 44 }}>
          Open Relist Form
        </Button>
      </Card>

      {/* Recent bids */}
      <Card title={t('auctionControl.recentBids')} style={{ borderRadius: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <ResponsiveTable<BidDto>
            rowKey="id"
            columns={bidColumns}
            dataSource={bidsData?.items ?? []}
            mobileMode="card"
            pagination={{ pageSize: 10 }}
          />
        </div>
      </Card>

      {/* Cancel-bid confirmation modal — replaces the old inline Popconfirm.
          Reason is required by the BE; submit button stays disabled until the
          admin enters a non-blank reason. */}
      <Modal
        title={t('auctionControl.cancelBidConfirm', 'Hủy đặt giá')}
        open={!!cancelBidTarget}
        onCancel={closeCancelBidModal}
        onOk={handleConfirmCancelBid}
        okText={t('auctionControl.confirmCancelBid', 'Xác nhận hủy bid')}
        cancelText={tc('common.cancel', 'Cancel')}
        okButtonProps={{
          danger: true,
          loading: cancelBid.isPending,
          disabled: !cancelBidReason.trim() || cancelBid.isPending,
        }}
        cancelButtonProps={{ disabled: cancelBid.isPending }}
        maskClosable={!cancelBid.isPending}
        destroyOnClose
        width={520}
      >
        {cancelBidTarget && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message={t(
                'auctionControl.cancelBidAuditWarning',
                'Hành động này sẽ hủy bid và được ghi audit. Lý do hủy sẽ được lưu lại.',
              )}
            />
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('auctionControl.bidder', 'Bidder')}
              </Typography.Text>
              <Typography.Text copyable={{ text: cancelBidTarget.bidderId }} style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                {cancelBidTarget.bidderId.length > 12
                  ? `${cancelBidTarget.bidderId.slice(0, 8)}…`
                  : cancelBidTarget.bidderId}
              </Typography.Text>
            </Space>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('auctionControl.amount', 'Amount')}
              </Typography.Text>
              <Typography.Text strong>
                {(() => {
                  const amt = cancelBidTarget.amount as unknown
                  if (amt != null && typeof amt === 'object' && 'amount' in amt) {
                    const m = amt as { amount: number; currency: string }
                    return formatCurrency(m.amount, m.currency)
                  }
                  return formatCurrency(amt as number, auction?.currency ?? 'VND')
                })()}
              </Typography.Text>
            </Space>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('auctionControl.bidStatus', 'Status')}
              </Typography.Text>
              <StatusBadge status={cancelBidTarget.status} />
            </Space>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                {t('auctionControl.cancelReasonLabel', 'Lý do hủy')}{' '}
                <span style={{ color: 'var(--color-danger)' }}>*</span>
              </Typography.Text>
              <Input.TextArea
                rows={4}
                value={cancelBidReason}
                onChange={(e) => setCancelBidReason(e.target.value)}
                placeholder={t(
                  'auctionControl.cancelReasonPlaceholder',
                  'Nhập lý do hủy bid (sẽ lưu vào audit log)…',
                )}
                disabled={cancelBid.isPending}
                maxLength={500}
                showCount
              />
            </div>
          </Space>
        )}
      </Modal>

      {/* Lifecycle Action Modal (shared for force cancel / terminate / force end) */}
      <Modal
        title={lifecycleModal === 'forceCancel' ? 'Force Cancel Auction' : lifecycleModal === 'terminate' ? 'Terminate Auction' : 'Force End Auction'}
        open={!!lifecycleModal}
        onCancel={() => { if (!lifecycleLoading) { setLifecycleModal(null); setLifecycleReason('') } }}
        onOk={handleLifecycleAction}
        okText="Confirm"
        okButtonProps={{ danger: lifecycleModal !== 'forceEnd', loading: lifecycleLoading, disabled: !lifecycleReason.trim() }}
        cancelButtonProps={{ disabled: lifecycleLoading }}
        destroyOnClose
        width={520}
      >
        <Alert
          type={lifecycleModal === 'terminate' ? 'error' : 'warning'}
          showIcon
          message={
            lifecycleModal === 'forceCancel' ? 'This will cancel the auction, release all bids, return deposits, and release the item back to active.'
            : lifecycleModal === 'terminate' ? 'This will permanently terminate the auction. All bids are cancelled, winner is cleared, and the item cannot be relisted from this auction.'
            : 'This will immediately end the auction and resolve the winner (if any).'
          }
          style={{ marginBottom: 16 }}
        />
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
          Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
        </Typography.Text>
        <Input.TextArea
          rows={4}
          value={lifecycleReason}
          onChange={(e) => setLifecycleReason(e.target.value)}
          placeholder="Enter the reason for this action..."
          maxLength={500}
          showCount
          disabled={lifecycleLoading}
        />
      </Modal>

      {/* Relist Modal */}
      <Modal
        title="Relist Auction"
        open={relistModalOpen}
        onCancel={() => { if (!relistAuction.isPending) setRelistModalOpen(false) }}
        onOk={handleRelist}
        okText="Create Relisted Auction"
        okButtonProps={{ loading: relistAuction.isPending, disabled: !relistQualStart || !relistQualEnd || !relistStart || !relistEnd }}
        cancelButtonProps={{ disabled: relistAuction.isPending }}
        destroyOnClose
        width={600}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Qualification Start:</Typography.Text>
            <DatePicker showTime style={{ width: '100%' }} value={relistQualStart} onChange={setRelistQualStart} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Qualification End:</Typography.Text>
            <DatePicker showTime style={{ width: '100%' }} value={relistQualEnd} onChange={setRelistQualEnd} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Auction Start:</Typography.Text>
            <DatePicker showTime style={{ width: '100%' }} value={relistStart} onChange={setRelistStart} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Auction End:</Typography.Text>
            <DatePicker showTime style={{ width: '100%' }} value={relistEnd} onChange={setRelistEnd} />
          </div>
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>Reason (optional):</Typography.Text>
            <Input.TextArea rows={2} value={relistReason} onChange={(e) => setRelistReason(e.target.value)} placeholder="Reason for relisting..." />
          </div>
        </Space>
      </Modal>

      {/* Remove Bid + Refund Modal */}
      <Modal
        title="Remove Bid + Refund Deposit"
        open={!!removeBidTarget}
        onCancel={() => { if (!removeBidWithRefund.isPending) { setRemoveBidTarget(null); setRemoveBidReason('') } }}
        onOk={handleRemoveBidWithRefund}
        okText="Remove & Refund"
        okButtonProps={{ danger: true, loading: removeBidWithRefund.isPending, disabled: !removeBidReason.trim() }}
        cancelButtonProps={{ disabled: removeBidWithRefund.isPending }}
        destroyOnClose
        width={520}
      >
        <Alert type="warning" showIcon icon={<ExclamationCircleOutlined />} message="This will cancel the bid AND return the bidder's held deposit to their wallet." style={{ marginBottom: 16 }} />
        {removeBidTarget && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary">Bidder: <Typography.Text copyable={{ text: removeBidTarget.bidderId }} code>{removeBidTarget.bidderId.slice(0, 8)}…</Typography.Text></Typography.Text>
            <Typography.Text type="secondary">Status: <StatusBadge status={removeBidTarget.status} /></Typography.Text>
            <div>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
              </Typography.Text>
              <Input.TextArea rows={3} value={removeBidReason} onChange={(e) => setRemoveBidReason(e.target.value)} placeholder="Reason for removing bid and refunding deposit..." maxLength={500} showCount disabled={removeBidWithRefund.isPending} />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}
