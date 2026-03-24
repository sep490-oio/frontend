import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Card, Button, Space, Spin, Alert, Switch, InputNumber, Input, App, Table, Popconfirm } from 'antd'
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionDetail, useAuctionBids } from '@/features/auction/api'
import { useSetCuration, useTriggerEmergency, useResolveEmergency, useCancelBid } from '@/features/admin/api'
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
  useResolveEmergency()
  const cancelBid = useCancelBid()

  const [featured, setFeatured] = useState(false)
  const [priority, setPriority] = useState(0)
  const [emergencyReason, setEmergencyReason] = useState('')

  // Sync initial state from auction data
  const auction = detail?.auction
  if (auction && featured !== auction.isFeatured && priority === 0) {
    setFeatured(auction.isFeatured)
    setPriority(auction.priority)
  }

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
    if (!emergencyReason) return
    try {
      await triggerEmergency.mutateAsync({ auctionId: id!, reason: emergencyReason })
      message.success(t('auctionControl.emergencySuccess'))
      setEmergencyReason('')
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
          <Button danger onClick={handleTriggerEmergency} loading={triggerEmergency.isPending} disabled={!emergencyReason}>
            {t('auctionControl.triggerEmergency')}
          </Button>
        </Space>
      </Card>

      {/* Recent bids */}
      <Card title={t('auctionControl.recentBids')}>
        <Table<BidDto>
          rowKey="id"
          columns={bidColumns}
          dataSource={bidsData?.items ?? []}
          scroll={{ x: 700 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
