import { useState } from 'react'
import {
  Typography,
  Tabs,
  Table,
  Button,
  Space,
  App,
  Popconfirm,
  Tag,
  Empty,
  Modal,
  Input,
  Form,
} from 'antd'
import { QrcodeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import {
  useStaffPendingReturns,
  useRecordWarehouseReturnDeliveryFailure,
} from '@/features/warehouse-staff/api'
import type { WarehouseToSellerShipmentDto } from '@/types'
import { WarehouseToSellerShipmentStatus } from '@/types/enums'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MarkReturnShippedModal } from '@/features/warehouse-staff/components/MarkReturnShippedModal'
import { ReturnQrDisplayModal } from '@/features/order/components/ReturnQrDisplayModal'

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
  // Persistent QR re-access for already-shipped rows. Staff can reopen the
  // QR label after the initial MarkShipped success modal has been closed.
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrShipment, setQrShipment] = useState<WarehouseToSellerShipmentDto | null>(null)

  const { data: pendingData, isLoading: pendingLoading } = useStaffPendingReturns({ status: 'pending' })
  const { data: inTransitData, isLoading: inTransitLoading } = useStaffPendingReturns({ status: 'in_transit' })
  const recordFailure = useRecordWarehouseReturnDeliveryFailure()

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
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) message.error(detail)
    }
  }

  const buildColumns = (tab: TabKey): ColumnsType<WarehouseToSellerShipmentDto> => [
    {
      title: t('staffReturns.columns.item', 'Item'),
      key: 'item',
      render: (_: unknown, record) => (
        <div>
          <Typography.Text strong>{record.itemTitle ?? '—'}</Typography.Text>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {record.warehouseItemId.slice(0, 8)}…
          </div>
        </div>
      ),
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
    },
    {
      title: t('staffReturns.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('staffReturns.columns.tracking', 'Tracking'),
      key: 'tracking',
      render: (_: unknown, record) =>
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
    },
    {
      title: t('staffReturns.columns.shippedAt', 'Shipped at'),
      dataIndex: 'shippedAt',
      key: 'shippedAt',
      render: (v: string | null | undefined) => (v ? formatDateTime(v) : '—'),
    },
    {
      title: t('staffReturns.columns.action', 'Action'),
      key: 'action',
      render: (_: unknown, record) => {
        if (tab === 'pending') {
          return (
            <Button type="primary" size="small" onClick={() => openShipModal(record.id)}>
              {t('staffReturns.enterTracking', 'Enter tracking')}
            </Button>
          )
        }
        // in_transit row: allow recording delivery failure, and re-access
        // the QR label if one has been issued.
        return (
          <Space>
            {record.qrToken && (
              <Button
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => {
                  setQrShipment(record)
                  setQrModalOpen(true)
                }}
              >
                {t('staffReturns.viewQr', 'QR label')}
              </Button>
            )}
            <Popconfirm
              title={t('staffReturns.failureConfirm', 'Record this return as delivery-failed?')}
              onConfirm={() => openFailureModal(record.id)}
              okText={tc('action.confirm', 'Confirm')}
              cancelText={tc('action.cancel', 'Cancel')}
            >
              <Button danger size="small">
                {t('staffReturns.markFailed', 'Mark delivery failed')}
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const rowsForTab = (tab: TabKey): WarehouseToSellerShipmentDto[] => {
    if (tab === 'pending') {
      return (pendingData ?? []).filter((r) => r.status === WarehouseToSellerShipmentStatus.Pending)
    }
    return (inTransitData ?? []).filter((r) => r.status === WarehouseToSellerShipmentStatus.InTransit)
  }

  return (
    <div style={{ padding: isMobile ? '0 4px' : undefined }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginBottom: 8 }}>
        {t('staffReturns.pageTitle', 'Pending returns')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {t(
          'staffReturns.pageSubtitle',
          'Route rejected items back to their sellers. Enter carrier tracking once handed off.',
        )}
      </Typography.Text>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={[
          {
            key: 'pending',
            label: t('staffReturns.tabs.pending', 'Pending'),
            children: (
              <Table<WarehouseToSellerShipmentDto>
                rowKey="id"
                columns={buildColumns('pending')}
                dataSource={rowsForTab('pending')}
                loading={pendingLoading}
                pagination={false}
                scroll={{ x: isMobile ? 'max-content' : undefined }}
                locale={{
                  emptyText: (
                    <Empty description={t('staffReturns.emptyPending', 'No pending returns.')} />
                  ),
                }}
              />
            ),
          },
          {
            key: 'in_transit',
            label: t('staffReturns.tabs.inTransit', 'In transit'),
            children: (
              <Table<WarehouseToSellerShipmentDto>
                rowKey="id"
                columns={buildColumns('in_transit')}
                dataSource={rowsForTab('in_transit')}
                loading={inTransitLoading}
                pagination={false}
                scroll={{ x: isMobile ? 'max-content' : undefined }}
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
