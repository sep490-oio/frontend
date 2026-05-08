import { useState, useEffect } from 'react'
import { Typography, Tabs, Tag, Button, Popconfirm, App, Alert, Empty, Space, Divider, Flex, Image, Modal } from 'antd'
import { ScanOutlined, InboxOutlined, SendOutlined, CameraOutlined } from '@ant-design/icons'
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
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useMyOrders } from '@/features/order/api'
import type { OrderDto } from '@/types'
import { ReturnEvidenceUploader } from '@/features/order/components/ReturnEvidenceUploader'
import { ReturnQrScanModal } from '@/features/order/components/ReturnQrScanModal'
import { SERIF_FONT } from '@/styles/tokens'

type TabKey = 'warehouse' | 'order'

function WarehouseReturnsTab() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const { data, isLoading } = useSellerWarehouseReturns()
  const confirmReceipt = useConfirmWarehouseReturnReceipt()
  const addEvidence = useAddWarehouseReturnEvidenceSeller()
  const scanReturn = useScanWarehouseReturn()

  const [scanOpen, setScanOpen] = useState(false)
  const [scanShipmentId, setScanShipmentId] = useState<string | null>(null)
  const [uploadModalRecord, setUploadModalRecord] = useState<WarehouseToSellerShipmentDto | null>(null)

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
      render: (_: unknown, record) => {
        const img = record.item?.primaryImageUrl ?? record.itemImageUrl
        const title = record.item?.itemTitle ?? record.itemTitle
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
                {title ?? record.warehouseItemId.slice(0, 8) + '…'}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {record.rejectionReason ?? ''}
              </Typography.Text>
            </div>
          </Flex>
        )
      },
    },
    {
      title: t('returns.columns.carrier', 'Carrier / Tracking'),
      key: 'carrier',
      responsive: ['md'] as ('md')[],
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
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('returns.columns.action', 'Action'),
      key: 'action',
      width: isMobile ? 90 : 160,
      render: (_: unknown, record) => {
        const canScan = record.status === WarehouseToSellerShipmentStatus.InTransit
        const canConfirm =
          record.status === WarehouseToSellerShipmentStatus.Delivered && !record.sellerConfirmedAt
        const hasReceiptEvidence = !!record.hasReceiptEvidence

        if (record.sellerConfirmedAt) {
          return <Tag color="green">{t('returns.confirmed', 'Confirmed')}</Tag>
        }

        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {canScan && (
              <Button
                size="small"
                type="primary"
                block={isMobile}
                icon={<ScanOutlined />}
                onClick={() => {
                  setScanShipmentId(record.id)
                  setScanOpen(true)
                }}
              >
                {t('returns.scanQr', 'Scan QR')}
              </Button>
            )}
            {canConfirm && isMobile && (
              <Button
                size="small"
                block
                icon={<CameraOutlined />}
                onClick={() => setUploadModalRecord(record)}
              >
                {t('returns.uploadPhoto', 'Upload photo')}
              </Button>
            )}
            {canConfirm && (
              <Popconfirm
                title={t('returns.confirmPrompt', 'Confirm you received this returned item?')}
                onConfirm={() => handleConfirm(record.id)}
                disabled={!hasReceiptEvidence}
                okText={tc('action.confirm', 'Confirm')}
                cancelText={tc('action.cancel', 'Cancel')}
              >
                <Button
                  type="primary"
                  size="small"
                  block={isMobile}
                  loading={confirmReceipt.isPending}
                  disabled={!hasReceiptEvidence}
                  style={{
                    background: hasReceiptEvidence ? 'var(--color-success, #52c41a)' : undefined,
                    borderColor: hasReceiptEvidence ? 'var(--color-success, #52c41a)' : undefined,
                  }}
                >
                  {t('returns.confirmReceipt', 'Confirm receipt')}
                </Button>
              </Popconfirm>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <ResponsiveTable<WarehouseToSellerShipmentDto>
        mobileMode="card"
        rowKey="id"
        columns={columns}
        dataSource={data ?? []}
        loading={isLoading}
        expandable={{
          expandedRowRender: (record) => {
            const receiptPhotos = (record.evidence ?? []).filter(
              (e) => e.category === WarehouseReturnEvidenceCategory.ReceiptBySeller,
            )
            const isDelivered = record.status === WarehouseToSellerShipmentStatus.Delivered
            const isClosed = !!record.sellerConfirmedAt

            if (isClosed) {
              return (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  {t('returns.alreadyConfirmed', 'You have already confirmed receipt of this item.')}
                </div>
              )
            }

            return (
              <div style={{
                padding: isMobile ? 12 : 16,
                maxWidth: 480,
                margin: isMobile ? undefined : '0 auto',
              }}>
                {/* Receipt evidence section */}
                <div style={{
                  background: 'var(--color-bg-surface, #fafafa)',
                  borderRadius: 10,
                  padding: isMobile ? 12 : 16,
                  border: '1px solid var(--color-border, #f0f0f0)',
                }}>
                  <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                    <SendOutlined style={{ color: 'var(--color-accent)' }} />
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      {t('returns.uploadReceipt', 'Upload receipt photos')}
                    </Typography.Text>
                  </Flex>

                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                    {isDelivered
                      ? t(
                          'returns.receiptUploadHint',
                          'Take a photo of the returned item to verify its condition, then confirm receipt.',
                        )
                      : t(
                          'returns.waitingDelivery',
                          'This shipment is still in transit. You can upload receipt photos once it arrives.',
                        )}
                  </Typography.Text>

                  <ReturnEvidenceUploader
                    existingEvidence={receiptPhotos.map((e) => ({
                      id: e.id,
                      mediaUpload: { secureUrl: e.secureUrl ?? '' },
                    }))}
                    category={WarehouseReturnEvidenceCategory.ReceiptBySeller}
                    minRequired={1}
                    maxPhotos={5}
                    disabled={addEvidence.isPending || !isDelivered}
                    onUpload={async (mediaUploadId) => {
                      await addEvidence.mutateAsync({
                        id: record.id,
                        mediaUploadId,
                        category: WarehouseReturnEvidenceCategory.ReceiptBySeller,
                      })
                    }}
                  />
                </div>
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
      />

      {/* Receipt photo upload modal (replaces expand on mobile) */}
      <Modal
        open={!!uploadModalRecord}
        onCancel={() => setUploadModalRecord(null)}
        footer={null}
        title={t('returns.uploadReceipt', 'Upload receipt photos')}
        centered
        destroyOnClose
        width={isMobile ? '100%' : 520}
      >
        {uploadModalRecord && (() => {
          const record = uploadModalRecord
          const receiptPhotos = (record.evidence ?? []).filter(
            (e) => e.category === WarehouseReturnEvidenceCategory.ReceiptBySeller,
          )
          return (
            <div style={{ paddingTop: 8 }}>
              <Flex gap={10} align="center" style={{ marginBottom: 16 }}>
                {(record.item?.primaryImageUrl ?? record.itemImageUrl) ? (
                  <Image
                    src={record.item?.primaryImageUrl ?? record.itemImageUrl ?? ''}
                    alt=""
                    width={40}
                    height={40}
                    style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    preview={false}
                  />
                ) : (
                  <InboxOutlined style={{ fontSize: 24, color: 'var(--color-text-secondary)' }} />
                )}
                <div>
                  <Typography.Text strong>
                    {record.item?.itemTitle ?? record.itemTitle ?? '—'}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    {record.rejectionReason}
                  </Typography.Text>
                </div>
              </Flex>

              <ReturnEvidenceUploader
                existingEvidence={receiptPhotos.map((e) => ({
                  id: e.id,
                  mediaUpload: { secureUrl: e.secureUrl ?? '' },
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
        })()}
      </Modal>

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
      <ResponsiveTable<OrderDto>
        mobileMode="card"
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
                    mediaUpload: { secureUrl: e.secureUrl ?? '' },
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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '0 8px' : '0 16px' }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginBottom: 4, fontFamily: SERIF_FONT }}>
        {t('returns.pageTitle', 'Returns')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
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
