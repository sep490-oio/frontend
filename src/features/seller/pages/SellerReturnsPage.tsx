import { useState, useEffect } from 'react'
import { Typography, Tabs, Table, Tag, Button, Popconfirm, App, Alert, Empty, Space, Divider } from 'antd'
import { ScanOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useSellerWarehouseReturns,
  useConfirmWarehouseReturnReceipt,
  useAddWarehouseReturnEvidenceSeller,
  useScanWarehouseReturn,
} from '@/features/seller/api'
import {
  useAddOrderReturnEvidenceSeller,
  useScanOrderReturn,
  useConfirmReturnReceived,
} from '@/features/order/api'
import type { WarehouseToSellerShipmentDto } from '@/types'
import {
  OrderReturnEvidenceCategory,
  OrderReturnStatus,
  WarehouseReturnEvidenceCategory,
  WarehouseToSellerShipmentStatus,
} from '@/types/enums'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useMyOrders } from '@/features/order/api'
import type { OrderDto } from '@/types'
import { ReturnEvidenceUploader } from '@/features/order/components/ReturnEvidenceUploader'
import { ReturnQrScanModal } from '@/features/order/components/ReturnQrScanModal'

type TabKey = 'warehouse' | 'order'

function WarehouseReturnsTab() {
  const { t } = useTranslation('seller')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const { data, isLoading } = useSellerWarehouseReturns()
  const confirmReceipt = useConfirmWarehouseReturnReceipt()
  const addEvidence = useAddWarehouseReturnEvidenceSeller()
  const scanReturn = useScanWarehouseReturn()

  const [scanOpen, setScanOpen] = useState(false)
  const [scanShipmentId, setScanShipmentId] = useState<string | null>(null)

  const handleConfirm = async (id: string) => {
    try {
      await confirmReceipt.mutateAsync({ id })
      message.success(t('returns.confirmSuccess', 'Receipt confirmed'))
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('returns.confirmError', 'Failed to confirm receipt'))
    }
  }

  const handleScan = async (qrToken: string) => {
    if (!scanShipmentId) return
    try {
      await scanReturn.mutateAsync({ id: scanShipmentId, qrToken })
      message.success(t('returns.scanSuccess', 'Shipment marked as received'))
      setScanOpen(false)
      setScanShipmentId(null)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('returns.scanError', 'Failed to scan QR'))
      throw err
    }
  }

  const columns: ColumnsType<WarehouseToSellerShipmentDto> = [
    {
      title: t('returns.columns.item', 'Item'),
      key: 'item',
      render: (_: unknown, record) => (
        <div>
          <Typography.Text strong>{record.itemTitle ?? record.warehouseItemId.slice(0, 8) + '…'}</Typography.Text>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {record.warehouseItemId.slice(0, 8)}…
          </div>
        </div>
      ),
    },
    {
      title: t('returns.columns.reason', 'Reason'),
      dataIndex: 'rejectionReason',
      key: 'rejectionReason',
      ellipsis: true,
    },
    {
      title: t('returns.columns.carrier', 'Carrier / Tracking'),
      key: 'carrier',
      render: (_: unknown, record) => (
        <div style={{ fontSize: 12 }}>
          <div>{record.providerCode ?? '—'}</div>
          {record.trackingNumber && (
            <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {record.trackingNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('returns.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('returns.columns.delivered', 'Delivered'),
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      render: (value: string | null | undefined) => (value ? formatDateTime(value) : '—'),
    },
    {
      title: t('returns.columns.action', 'Action'),
      key: 'action',
      render: (_: unknown, record) => {
        const canScan = record.status === WarehouseToSellerShipmentStatus.InTransit
        const canConfirm =
          record.status === WarehouseToSellerShipmentStatus.Delivered && !record.sellerConfirmedAt
        const receiptPhotos = (record.evidence ?? []).filter(
          (e) => e.category === WarehouseReturnEvidenceCategory.ReceiptBySeller,
        )
        const hasReceiptEvidence = receiptPhotos.length >= 1

        if (record.sellerConfirmedAt) {
          return <Tag color="green">{t('returns.confirmed', 'Confirmed')}</Tag>
        }
        return (
          <Space direction="vertical" size={4}>
            {canScan && (
              <Button
                size="small"
                icon={<ScanOutlined />}
                onClick={() => {
                  setScanShipmentId(record.id)
                  setScanOpen(true)
                }}
              >
                {t('returns.scanQr', 'Scan QR')}
              </Button>
            )}
            {canConfirm && (
              <Popconfirm
                title={t('returns.confirmPrompt', 'Confirm you received this returned item?')}
                onConfirm={() => handleConfirm(record.id)}
                disabled={!hasReceiptEvidence}
              >
                <Button
                  type="primary"
                  size="small"
                  loading={confirmReceipt.isPending}
                  disabled={!hasReceiptEvidence}
                >
                  {t('returns.confirmReceipt', 'Confirm receipt')}
                </Button>
              </Popconfirm>
            )}
            {canConfirm && !hasReceiptEvidence && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {t('returns.receiptPhotoRequired', 'Receipt photo required')}
              </Typography.Text>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Table<WarehouseToSellerShipmentDto>
        rowKey="id"
        columns={columns}
        dataSource={data ?? []}
        loading={isLoading}
        expandable={{
          expandedRowRender: (record) => {
            const receiptPhotos = (record.evidence ?? []).filter(
              (e) => e.category === WarehouseReturnEvidenceCategory.ReceiptBySeller,
            )
            return (
              <div style={{ padding: '8px 0' }}>
                <ReturnEvidenceUploader
                  existingEvidence={receiptPhotos.map((e) => ({
                    id: e.id,
                    mediaUpload: { secureUrl: e.mediaUpload.secureUrl },
                  }))}
                  category={WarehouseReturnEvidenceCategory.ReceiptBySeller}
                  minRequired={1}
                  maxPhotos={5}
                  disabled={addEvidence.isPending}
                  onUpload={async (mediaUploadId) => {
                    await addEvidence.mutateAsync({
                      id: record.id,
                      mediaUploadId,
                      category: WarehouseReturnEvidenceCategory.ReceiptBySeller,
                    })
                  }}
                />
              </div>
            )
          },
          rowExpandable: (record) => !record.sellerConfirmedAt,
        }}
        locale={{
          emptyText: (
            <Empty description={t('returns.emptyWarehouse', 'No warehouse returns yet.')} />
          ),
        }}
        pagination={false}
        scroll={{ x: isMobile ? 'max-content' : undefined }}
      />
      <ReturnQrScanModal
        open={scanOpen}
        onClose={() => {
          setScanOpen(false)
          setScanShipmentId(null)
        }}
        onScanned={handleScan}
        title={t('returns.scanTitle', 'Scan warehouse return QR')}
        subtitle={t(
          'returns.scanSubtitle',
          'Point camera at the QR label on the parcel to mark it received.',
        )}
      />
    </>
  )
}

function OrderReturnsTab() {
  const { t } = useTranslation('seller')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const addEvidence = useAddOrderReturnEvidenceSeller()
  const scanReturn = useScanOrderReturn()
  const confirmReceived = useConfirmReturnReceived()

  const [scanOpen, setScanOpen] = useState(false)
  const [scanOrder, setScanOrder] = useState<{ orderId: string; returnId: string } | null>(null)

  // The seller-side order list includes the `return` nav — we filter client-
  // side for orders with an active return. If BE later adds a dedicated
  // endpoint this becomes a single-line swap.
  const { data, isLoading } = useMyOrders({ pageNumber: 1, pageSize: 100 })

  const activeReturns = (data?.items ?? []).filter(
    (o) =>
      o.return &&
      (o.return.status === OrderReturnStatus.Approved ||
        o.return.status === OrderReturnStatus.ReturnInTransit ||
        o.return.status === OrderReturnStatus.SellerReceived),
  )

  const handleScan = async (qrToken: string) => {
    if (!scanOrder) return
    try {
      await scanReturn.mutateAsync({ ...scanOrder, qrToken })
      message.success(t('returns.scanSuccess', 'Shipment marked as received'))
      setScanOpen(false)
      setScanOrder(null)
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('returns.scanError', 'Failed to scan QR'))
      throw err
    }
  }

  const handleConfirmReceived = async (orderId: string, returnId: string) => {
    try {
      await confirmReceived.mutateAsync({ orderId, returnId })
      message.success(t('returns.confirmSuccess', 'Receipt confirmed'))
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      message.error(detail ?? t('returns.confirmError', 'Failed to confirm receipt'))
    }
  }

  const columns: ColumnsType<OrderDto> = [
    {
      title: t('returns.columns.orderNumber', 'Order'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (num: string, record) => (
        <Button
          type="link"
          style={{ padding: 0, fontFamily: 'var(--font-mono)', fontSize: 13 }}
          onClick={() => navigate(`/seller/orders/${record.id}`)}
        >
          {num}
        </Button>
      ),
    },
    {
      title: t('returns.columns.buyer', 'Buyer'),
      key: 'buyer',
      render: (_: unknown, record) => (
        <span>{record.buyerDisplayName ?? record.buyerId.slice(0, 8) + '…'}</span>
      ),
    },
    {
      title: t('returns.columns.returnStatus', 'Return status'),
      key: 'returnStatus',
      render: (_: unknown, record) => (record.return ? <StatusBadge status={record.return.status} /> : null),
    },
    {
      title: t('returns.columns.shippedAt', 'Shipped at'),
      key: 'shippedAt',
      render: (_: unknown, record) =>
        record.return?.shippedAt ? formatDateTime(record.return.shippedAt) : '—',
    },
    {
      title: t('returns.columns.tracking', 'Tracking'),
      key: 'tracking',
      render: (_: unknown, record) =>
        record.return?.trackingNumber ? (
          <Typography.Text style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {record.return.trackingNumber}
          </Typography.Text>
        ) : (
          '—'
        ),
    },
    {
      title: t('returns.columns.action', 'Action'),
      key: 'action',
      render: (_: unknown, record) => {
        const ret = record.return
        if (!ret) return null
        const canScan = ret.status === OrderReturnStatus.ReturnInTransit
        const canConfirm = ret.status === OrderReturnStatus.SellerReceived
        const receiptPhotos = (ret.evidence ?? []).filter(
          (e) => e.category === OrderReturnEvidenceCategory.ReceiptBySeller,
        )
        const hasReceiptEvidence = receiptPhotos.length >= 1
        return (
          <Space direction="vertical" size={4}>
            {canScan && (
              <Button
                size="small"
                icon={<ScanOutlined />}
                onClick={() => {
                  setScanOrder({ orderId: record.id, returnId: ret.id })
                  setScanOpen(true)
                }}
              >
                {t('returns.scanQr', 'Scan QR')}
              </Button>
            )}
            {canConfirm && (
              <Popconfirm
                title={t('returns.confirmPrompt', 'Confirm you received this returned item?')}
                onConfirm={() => handleConfirmReceived(record.id, ret.id)}
                disabled={!hasReceiptEvidence}
              >
                <Button
                  type="primary"
                  size="small"
                  loading={confirmReceived.isPending}
                  disabled={!hasReceiptEvidence}
                >
                  {t('returns.confirmReceipt', 'Confirm receipt')}
                </Button>
              </Popconfirm>
            )}
            {canConfirm && !hasReceiptEvidence && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {t('returns.receiptPhotoRequired', 'Receipt photo required')}
              </Typography.Text>
            )}
            <Button size="small" onClick={() => navigate(`/seller/orders/${record.id}`)}>
              {t('returns.openOrder', 'Open order')}
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Table<OrderDto>
        rowKey="id"
        columns={columns}
        dataSource={activeReturns}
        loading={isLoading}
        expandable={{
          expandedRowRender: (record) => {
            const ret = record.return
            if (!ret) return null
            const receiptPhotos = (ret.evidence ?? []).filter(
              (e) => e.category === OrderReturnEvidenceCategory.ReceiptBySeller,
            )
            return (
              <div style={{ padding: '8px 0' }}>
                <ReturnEvidenceUploader
                  existingEvidence={receiptPhotos.map((e) => ({
                    id: e.id,
                    mediaUpload: { secureUrl: e.mediaUpload.secureUrl },
                  }))}
                  category={OrderReturnEvidenceCategory.ReceiptBySeller}
                  minRequired={1}
                  maxPhotos={5}
                  disabled={addEvidence.isPending}
                  onUpload={async (mediaUploadId) => {
                    await addEvidence.mutateAsync({
                      orderId: record.id,
                      returnId: ret.id,
                      mediaUploadId,
                      category: OrderReturnEvidenceCategory.ReceiptBySeller,
                    })
                  }}
                />
                <Divider />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t(
                    'returns.orderScanHint',
                    'Use "Scan QR" while the return is in transit — the status flips to SellerReceived without requiring photos. Photos are required before "Confirm receipt".',
                  )}
                </Typography.Text>
              </div>
            )
          },
          rowExpandable: (record) =>
            record.return?.status === OrderReturnStatus.ReturnInTransit ||
            record.return?.status === OrderReturnStatus.SellerReceived,
        }}
        locale={{
          emptyText: <Empty description={t('returns.emptyOrder', 'No active buyer returns.')} />,
        }}
        pagination={false}
        scroll={{ x: isMobile ? 'max-content' : undefined }}
      />
      <ReturnQrScanModal
        open={scanOpen}
        onClose={() => {
          setScanOpen(false)
          setScanOrder(null)
        }}
        onScanned={handleScan}
        title={t('returns.scanTitle', 'Scan return QR')}
        subtitle={t(
          'returns.scanSubtitleOrder',
          'Point camera at the buyer-provided QR label to mark the return received.',
        )}
      />
    </>
  )
}

export default function SellerReturnsPage() {
  const { t } = useTranslation('seller')
  const { isMobile } = useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = (searchParams.get('tab') as TabKey | null) ?? 'warehouse'
  const [activeKey, setActiveKey] = useState<TabKey>(
    initial === 'order' ? 'order' : 'warehouse',
  )

  // Keep URL and active tab in sync so links like /seller/returns?tab=order work.
  useEffect(() => {
    const urlTab = (searchParams.get('tab') as TabKey | null) ?? 'warehouse'
    const normalized: TabKey = urlTab === 'order' ? 'order' : 'warehouse'
    if (normalized !== activeKey) setActiveKey(normalized)
  }, [searchParams, activeKey])

  const onChange = (k: string) => {
    const next = k === 'order' ? 'order' : 'warehouse'
    setActiveKey(next)
    setSearchParams({ tab: next })
  }

  return (
    <div style={{ padding: isMobile ? '0 12px' : undefined }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginBottom: 8 }}>
        {t('returns.pageTitle', 'Returns')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {t(
          'returns.pageSubtitle',
          'Track items coming back from the warehouse and buyer-initiated returns.',
        )}
      </Typography.Text>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t(
          'returns.receiptHint',
          'Confirm receipt once you have physically inspected the returned item. Unconfirmed returns auto-close after 7 days.',
        )}
      />

      <Tabs
        activeKey={activeKey}
        onChange={onChange}
        items={[
          {
            key: 'warehouse',
            label: t('returns.tabs.warehouse', 'Warehouse returns'),
            children: <WarehouseReturnsTab />,
          },
          {
            key: 'order',
            label: t('returns.tabs.order', 'Order returns'),
            children: <OrderReturnsTab />,
          },
        ]}
      />
    </div>
  )
}
