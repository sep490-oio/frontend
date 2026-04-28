import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Card, Button, Space, Spin, Switch, InputNumber, Input, App, Popconfirm, Select } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionDetail, useAuctionBids } from '@/features/auction/api'
import { useSetCuration, useTriggerEmergency, useResolveEmergency, useCancelBid, useFlagAuction } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { BidDto } from '@/types'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

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

  const handleCancelBid = async (bidId: string) => {
    try {
      await cancelBid.mutateAsync({ auctionId: id!, bidId })
      message.success(t('auctionControl.cancelBidSuccess'))
    } catch {
      message.error(t('common.error'))
    }
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
      width: 110,
      render: (_, record) => (
        <Popconfirm
          title={t('auctionControl.cancelBidConfirm')}
          onConfirm={() => handleCancelBid(record.id)}
        >
          <Button type="link" size="small" danger>
            {t('auctionControl.cancelBid')}
          </Button>
        </Popconfirm>
      ),
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
    </div>
  )
}
