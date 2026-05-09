import { useState } from 'react'
import {
  Typography,
  Tabs,
  Button,
  Space,
  App,
  Popconfirm,
  Tag,
  Empty,
  Modal,
  Input,
  Form,
  Image,
  Flex,
} from 'antd'
import {
  QrcodeOutlined,
  SendOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import {
  useStaffPendingReturns,
  useRecordWarehouseReturnDeliveryFailure,
  useMarkWarehouseReturnDelivered,
} from '@/features/warehouse-staff/api'
import type { WarehouseToSellerShipmentDto } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MarkReturnShippedModal } from '@/features/warehouse-staff/components/MarkReturnShippedModal'
import { ReturnQrDisplayModal } from '@/features/order/components/ReturnQrDisplayModal'
import { SERIF_FONT } from '@/styles/tokens'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

type TabKey = 'pending' | 'in_transit'

export default function PendingReturnsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [failureForm] = Form.useForm<{ reason: string }>()
  const [failureOpen, setFailureOpen] = useState(false)
  const [failureShipmentId, setFailureShipmentId] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrShipment, setQrShipment] = useState<WarehouseToSellerShipmentDto | null>(null)

  const { data: pendingData, isLoading: pendingLoading } = useStaffPendingReturns({ status: 'pending' })
  const { data: inTransitData, isLoading: inTransitLoading } = useStaffPendingReturns({ status: 'in_transit' })
  const recordFailure = useRecordWarehouseReturnDeliveryFailure()
  const markDelivered = useMarkWarehouseReturnDelivered()

  const pendingCount = pendingData?.length ?? 0
  const inTransitCount = inTransitData?.length ?? 0

  const openShipModal = (id: string) => {
    setSelectedShipmentId(id)
    setShipModalOpen(true)
  }

  const openFailureModal = (id: string) => {
    failureForm.resetFields()
    setFailureShipmentId(id)
    setFailureOpen(true)
  }

  const handleFailureSubmit = async () => {
    if (!failureShipmentId) return
    try {
      const values = await failureForm.validateFields()
      await recordFailure.mutateAsync({ id: failureShipmentId, reason: values.reason.trim() })
      message.success(t('staffReturns.failureRecorded', 'Delivery failure recorded'))
      setFailureOpen(false)
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        message.error(normalizeErrorMessage(err, t('staffReturns.failureError', 'Failed to record delivery failure')))
      }
    }
  }

  const buildColumns = (tab: TabKey): ColumnsType<WarehouseToSellerShipmentDto> => [
    {
      title: t('staffReturns.columns.item', 'Item'),
      key: 'item',
      render: (_: unknown, sourceRecord) => {
        const title = sourceRecord.item?.itemTitle ?? sourceRecord.itemTitle
        const img = sourceRecord.item?.primaryImageUrl ?? sourceRecord.itemImageUrl
        return (
          <Flex gap={10} align="center">
            {img ? (
              <Image
                src={img}
                alt={title ?? ''}
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                preview={false}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: 'var(--color-bg-surface, #f0f0f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: 'var(--color-text-secondary)',
                  flexShrink: 0,
                }}
              >
                <InboxOutlined />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <Typography.Text strong ellipsis style={{ display: 'block', maxWidth: 180 }}>
                {title ?? '—'}
              </Typography.Text>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {sourceRecord.warehouseItemId.slice(0, 8)}…
              </div>
            </div>
          </Flex>
        )
      },
    },
    {
      title: t('staffReturns.columns.seller', 'Seller'),
      key: 'seller',
      render: (_: unknown, record) => (
        <span>{record.sellerDisplayName ?? record.sellerId.slice(0, 8) + '…'}</span>
      ),
    },
    {
      title: t('staffReturns.columns.reason', 'Reason'),
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      ellipsis: true,
      responsive: ['md'] as ('md')[],
    },
    {
      title: t('staffReturns.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    ...(tab === 'in_transit'
      ? [
          {
            title: t('staffReturns.columns.tracking', 'Tracking'),
            key: 'tracking',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record: WarehouseToSellerShipmentDto) =>
              record.trackingNumber ? (
                <div style={{ fontSize: 12 }}>
                  <div>{record.providerCode}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {record.trackingNumber}
                  </div>
                </div>
              ) : (
                <Tag>—</Tag>
              ),
          } as ColumnsType<WarehouseToSellerShipmentDto>[number],
          {
            title: t('staffReturns.columns.shippedAt', 'Shipped at'),
            dataIndex: 'shippedAt',
            key: 'shippedAt',
            responsive: ['xl'] as ('xl')[],
            render: (v: string | null | undefined) => (v ? formatDateTime(v) : '—'),
          } as ColumnsType<WarehouseToSellerShipmentDto>[number],
        ]
      : []),
    {
      title: t('staffReturns.columns.action', 'Action'),
      key: 'action',
      fixed: 'right' as const,
      width: tab === 'in_transit' ? 120 : undefined,
      render: (_: unknown, record) => {
        if (tab === 'pending') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => openShipModal(record.id)}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {t('staffReturns.enterTracking', 'Ship return')}
            </Button>
          )
        }
        return (
          <Space size={4}>
            <Popconfirm
              title={t('staffReturns.deliveredConfirm', 'Mark this return as delivered to seller?')}
              onConfirm={async () => {
                try {
                  await markDelivered.mutateAsync(record.id)
                  message.success(t('staffReturns.deliveredSuccess', 'Marked as delivered'))
                } catch { /* handled by React Query */ }
              }}
              okText={tc('action.confirm', 'Confirm')}
              cancelText={tc('action.cancel', 'Cancel')}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                title={t('staffReturns.markDelivered', 'Mark delivered')}
                loading={markDelivered.isPending}
                style={{ background: 'var(--color-success, #52c41a)', borderColor: 'var(--color-success, #52c41a)' }}
              />
            </Popconfirm>
            {record.qrToken && (
              <Button
                size="small"
                icon={<QrcodeOutlined />}
                title={t('staffReturns.viewQr', 'QR label')}
                onClick={() => {
                  setQrShipment(record)
                  setQrModalOpen(true)
                }}
              />
            )}
            <Popconfirm
              title={t('staffReturns.failureConfirm', 'Record this return as delivery-failed?')}
              onConfirm={() => openFailureModal(record.id)}
              okText={tc('action.confirm', 'Confirm')}
              cancelText={tc('action.cancel', 'Cancel')}
            >
              <Button
                danger
                size="small"
                icon={<WarningOutlined />}
                title={t('staffReturns.markFailed', 'Failed')}
              />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const rowsForTab = (tab: TabKey): WarehouseToSellerShipmentDto[] => {
    if (tab === 'pending') {
      return pendingData ?? []
    }
    return inTransitData ?? []
  }

  return (
    <div style={{
      maxWidth: 1000,
      margin: '0 auto',
      padding: isMobile ? '0 8px' : '0 16px',
    }}>
      {/* Header */}
      <Typography.Title
        level={isMobile ? 4 : 3}
        style={{ marginBottom: 4, fontFamily: SERIF_FONT }}
      >
        {t('staffReturns.pageTitle', 'Pending returns')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
        {t(
          'staffReturns.pageSubtitle',
          'Route rejected items back to their sellers. Enter carrier tracking once handed off.',
        )}
      </Typography.Text>

      {/* Stats */}
      <Flex gap={12} style={{ marginBottom: 20 }} wrap="wrap">
        <div
          className="oio-widget"
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 140,
          }}
        >
          <InboxOutlined style={{ fontSize: 20, color: 'var(--color-warning, #faad14)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {t('staffReturns.pendingLabel', 'Pending')}
            </div>
          </div>
        </div>
        <div
          className="oio-widget"
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 140,
          }}
        >
          <SendOutlined style={{ fontSize: 20, color: 'var(--color-accent, #1677ff)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {inTransitCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {t('staffReturns.inTransitLabel', 'In transit')}
            </div>
          </div>
        </div>
      </Flex>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={[
          {
            key: 'pending',
            label: `${t('staffReturns.tabs.pending', 'Pending')} (${pendingCount})`,
            children: (
              <ResponsiveTable<WarehouseToSellerShipmentDto>
                mobileMode="card"
                rowKey="id"
                columns={buildColumns('pending')}
                dataSource={rowsForTab('pending')}
                loading={pendingLoading}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty description={t('staffReturns.emptyPending', 'No return shipments ready to ship.')} />
                  ),
                }}
              />
            ),
          },
          {
            key: 'in_transit',
            label: `${t('staffReturns.tabs.inTransit', 'In transit')} (${inTransitCount})`,
            children: (
              <ResponsiveTable<WarehouseToSellerShipmentDto>
                mobileMode="card"
                rowKey="id"
                columns={buildColumns('in_transit')}
                dataSource={rowsForTab('in_transit')}
                loading={inTransitLoading}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty description={t('staffReturns.emptyInTransit', 'No in-transit returns.')} />
                  ),
                }}
              />
            ),
          },
        ]}
      />

      <MarkReturnShippedModal
        open={shipModalOpen}
        shipmentId={selectedShipmentId}
        onClose={() => setShipModalOpen(false)}
      />

      <ReturnQrDisplayModal
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false)
          setQrShipment(null)
        }}
        qrToken={qrShipment?.qrToken ?? ''}
        title={t('staffReturns.qrTitle', 'Return shipment QR')}
        subtitle={t(
          'staffReturns.qrSubtitle',
          'Attach this label to the parcel so the seller can scan on arrival',
        )}
        lines={
          qrShipment?.trackingNumber
            ? [
                {
                  label: t('staffReturns.columns.tracking', 'Tracking'),
                  value: qrShipment.trackingNumber,
                },
              ]
            : []
        }
      />

      <Modal
        title={t('staffReturns.failureTitle', 'Record delivery failure')}
        open={failureOpen}
        onCancel={() => setFailureOpen(false)}
        onOk={handleFailureSubmit}
        okText={tc('action.confirm', 'Confirm')}
        cancelText={tc('action.cancel', 'Cancel')}
        okButtonProps={{ danger: true, loading: recordFailure.isPending }}
        centered
        destroyOnClose
      >
        <Form<{ reason: string }> form={failureForm} layout="vertical">
          <Form.Item
            name="reason"
            label={t('staffReturns.failureReason', 'Failure reason')}
            rules={[{ required: true, whitespace: true, message: t('staffReturns.reasonRequired', 'Reason is required') }]}
          >
            <Input.TextArea rows={3} placeholder={t('staffReturns.reasonPlaceholder', 'Describe why delivery failed…')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
