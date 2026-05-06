import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Card, Button, Space, Spin, Switch, InputNumber, Input, App, Select, Modal, Tooltip, Alert } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined, ThunderboltOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionDetail, useAuctionBids } from '@/features/auction/auctionApi.ts'
import { useSetCuration, useTriggerEmergency, useResolveEmergency, useCancelBid, useFlagAuction } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { BidDto } from '@/types'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import type { ColumnsType } from 'antd/es/table'
import type { AxiosError } from 'axios'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { isBidCancellable } from '@/features/admin/utils/monitoringFormat'

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

  // Cancel-bid modal state. Tracks which bid the admin clicked "Cancel" on
  // and the required reason they entered. Reason is required by the BE
  // ([Required] string Reason on CancelInvalidBidEndpoint.Request) — submitting
  // without it returned 400 in the previous version.
  const [cancelBidTarget, setCancelBidTarget] = useState<BidDto | null>(null)
  const [cancelBidReason, setCancelBidReason] = useState('')

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
      width: 130,
      render: (_, record) => {
        const cancellable = isBidCancellable(record.status)
        if (!cancellable) {
          return (
            <Tooltip title={t('auctionControl.cancelBidNotAllowed', 'Bid này không thể hủy ở trạng thái hiện tại.')}>
              {/* span wrapper so the disabled Button still receives Tooltip events */}
              <span>
                <Button type="link" size="small" danger disabled>
                  {t('auctionControl.cancelBid')}
                </Button>
              </span>
            </Tooltip>
          )
        }
        return (
          <Button
            type="link"
            size="small"
            danger
            onClick={() => {
              setCancelBidTarget(record)
              setCancelBidReason('')
            }}
          >
            {t('auctionControl.cancelBid')}
          </Button>
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
    </div>
  )
}
