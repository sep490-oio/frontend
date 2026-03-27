import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Card, Button, Space, Spin, Alert, Switch, InputNumber, Input, App, Popconfirm, Select } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionDetail, useAuctionBids } from '@/features/auction/api'
import { useSetCuration, useTriggerEmergency, useResolveEmergency, useCancelBid, useFlagAuction } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { BidDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function AdminAuctionControlPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const { data: detail, isLoading, error } = useAuctionDetail(id!)
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

  // T012: Flag Auction state
  const [flagAlertType, setFlagAlertType] = useState<string>('')
  const [flagSeverity, setFlagSeverity] = useState<string>('')
  const [flagPayload, setFlagPayload] = useState('')

  // T014: Resolve Emergency state
  const [resolveEmStatus, setResolveEmStatus] = useState<string>('')
  const [resolveEmPayload, setResolveEmPayload] = useState('')
  const [resolveEmId, setResolveEmId] = useState('')

  const auction = detail?.auction

  // Sync initial state from auction data
  useEffect(() => {
    if (auction) {
      setFeatured(auction.isFeatured ?? false)
      setPriority(auction.priority ?? 0)
    }
  }, [auction])

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !auction) return <Alert type="error" message={t('common.error')} showIcon />

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

  // T012: Flag Auction handler
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

  // T014: Resolve Emergency handler
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
      width: 160,
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
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('auctionControl.bidDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reviewQueue.actions'),
      key: 'actions',
      width: 120,
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('auctionControl.title')} - {detail?.item?.title ?? id}
      </Typography.Title>

      {/* Curation controls */}
      <Card title={t('auctionControl.curation')} style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle">
          <Space>
            <Typography.Text strong>{t('auctionControl.featured')}:</Typography.Text>
            <Switch checked={featured} onChange={setFeatured} />
          </Space>
          <Space>
            <Typography.Text strong>{t('auctionControl.priority')}:</Typography.Text>
            <InputNumber
              min={0}
              max={100}
              value={priority}
              onChange={(val) => setPriority(val ?? 0)}
            />
          </Space>
          <Button type="primary" onClick={handleSaveCuration} loading={setCuration.isPending}>
            {t('auctionControl.saveCuration')}
          </Button>
        </Space>
      </Card>

      {/* T012: Flag Auction section */}
      <Card title={t('auctionControl.flagAuction', 'Flag Auction')} style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text strong>{t('auctionControl.alertType', 'Alert Type')}:</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={flagAlertType || undefined}
              onChange={setFlagAlertType}
              placeholder={t('auctionControl.selectAlertType', 'Select alert type')}
              options={[
                { value: 'fraud', label: 'Fraud' },
                { value: 'suspicious', label: 'Suspicious' },
                { value: 'collusion', label: 'Collusion' },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong>{t('auctionControl.severity', 'Severity')}:</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={flagSeverity || undefined}
              onChange={setFlagSeverity}
              placeholder={t('auctionControl.selectSeverity', 'Select severity')}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong>{t('auctionControl.details', 'Details')}:</Typography.Text>
            <Input.TextArea
              rows={2}
              value={flagPayload}
              onChange={(e) => setFlagPayload(e.target.value)}
              placeholder={t('auctionControl.enterAlertDetails', 'Enter alert details')}
              style={{ marginTop: 4 }}
            />
          </div>
          <Button
            type="primary"
            danger
            onClick={handleFlagAuction}
            loading={flagAuction.isPending}
            disabled={!flagAlertType || !flagSeverity}
          >
            {t('auctionControl.flagButton', 'Flag')}
          </Button>
        </Space>
      </Card>

      {/* Emergency section */}
      <Card
        title={<><ThunderboltOutlined /> {t('auctionControl.emergency')}</>}
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input.TextArea
            rows={2}
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            placeholder={t('auctionControl.emergencyReasonPlaceholder')}
          />
          <div>
            <Typography.Text strong>{t('auctionControl.triggerSource', 'Trigger Source')}:</Typography.Text>
            <Input
              style={{ marginTop: 4 }}
              value={emergencyTriggerSource}
              onChange={(e) => setEmergencyTriggerSource(e.target.value)}
              placeholder={t('auctionControl.enterTriggerSource', 'Enter trigger source')}
            />
          </div>
          <div>
            <Typography.Text strong>{t('auctionControl.detailsJson', 'Details (JSON)')}:</Typography.Text>
            <Input.TextArea
              rows={2}
              value={emergencyPayload}
              onChange={(e) => setEmergencyPayload(e.target.value)}
              placeholder={t('auctionControl.enterJsonDetails', 'Enter details as JSON, e.g. {"key": "value"}')}
              style={{ marginTop: 4 }}
            />
          </div>
          <Button
            danger
            onClick={handleTriggerEmergency}
            loading={triggerEmergency.isPending}
            disabled={!emergencyReason || !emergencyTriggerSource}
          >
            {t('auctionControl.triggerEmergency')}
          </Button>
        </Space>
      </Card>

      {/* T014: Resolve Emergency section */}
      <Card title={t('auctionControl.resolveEmergency', 'Resolve Emergency')} style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text strong>{t('auctionControl.emergencyId', 'Emergency ID')}:</Typography.Text>
            <Input
              style={{ marginTop: 4 }}
              value={resolveEmId}
              onChange={(e) => setResolveEmId(e.target.value)}
              placeholder={t('auctionControl.enterEmergencyId', 'Enter Emergency ID')}
            />
          </div>
          <div>
            <Typography.Text strong>{t('auctionControl.status', 'Status')}:</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              value={resolveEmStatus || undefined}
              onChange={setResolveEmStatus}
              placeholder={t('auctionControl.selectStatus', 'Select status')}
              options={[
                { value: 'resolved', label: 'Resolved' },
                { value: 'dismissed', label: 'Dismissed' },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong>{t('auctionControl.details', 'Details')}:</Typography.Text>
            <Input.TextArea
              rows={2}
              value={resolveEmPayload}
              onChange={(e) => setResolveEmPayload(e.target.value)}
              placeholder={t('auctionControl.enterResolutionDetails', 'Enter resolution details')}
              style={{ marginTop: 4 }}
            />
          </div>
          <Button
            type="primary"
            onClick={handleResolveEmergency}
            loading={resolveEmergency.isPending}
            disabled={!resolveEmId || !resolveEmStatus}
          >
            {t('auctionControl.resolveButton', 'Resolve Emergency')}
          </Button>
        </Space>
      </Card>

      {/* Recent bids */}
      <Card title={t('auctionControl.recentBids')}>
        <ResponsiveTable<BidDto>
          rowKey="id"
          columns={bidColumns}
          dataSource={bidsData?.items ?? []}
          mobileMode="card"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
