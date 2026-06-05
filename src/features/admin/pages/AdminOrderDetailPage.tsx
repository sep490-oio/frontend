import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Typography, Card, Descriptions, Tag, Button, Space, Spin, Row, Col,
  Flex, Divider, Modal, Input, Select, App, Statistic,
} from 'antd'
import {
  ArrowLeftOutlined, ShoppingCartOutlined, CopyOutlined,
  StopOutlined, DollarOutlined, SwapOutlined,
  AlertOutlined, UserOutlined, EnvironmentOutlined,
  TruckOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useAdminOrderDetail,
  useAdminForceCancelOrder,
  useAdminForceRefundOrder,
  useAdminOverrideOrderStatus,
} from '@/features/admin/api'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { ShipmentEvidenceGallery } from '@/features/order/components/ShipmentEvidenceGallery'
import type { MonitoringAlertDto } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'orange',
  paid: 'green',
  processing: 'blue',
  picked_up: 'cyan',
  on_delivering: 'geekblue',
  shipped: 'geekblue',
  delivered: 'lime',
  completed: 'success',
  cancelled: 'default',
  refunded: 'warning',
  disputed: 'error',
}

const ALERT_SEVERITY_COLOR: Record<string, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
}

function useOrderStatusOptions() {
  const { t } = useTranslation('admin')
  return [
    { value: 'pending_payment', label: t('orderDetail.statusOptions.pending_payment', 'Pending Payment') },
    { value: 'paid', label: t('orderDetail.statusOptions.paid', 'Paid') },
    { value: 'processing', label: t('orderDetail.statusOptions.processing', 'Processing') },
    { value: 'picked_up', label: t('orderDetail.statusOptions.picked_up', 'Picked Up') },
    { value: 'on_delivering', label: t('orderDetail.statusOptions.on_delivering', 'On Delivering') },
    { value: 'delivered', label: t('orderDetail.statusOptions.delivered', 'Delivered') },
    { value: 'completed', label: t('orderDetail.statusOptions.completed', 'Completed') },
    { value: 'cancelled', label: t('orderDetail.statusOptions.cancelled', 'Cancelled') },
    { value: 'refunded', label: t('orderDetail.statusOptions.refunded', 'Refunded') },
    { value: 'disputed', label: t('orderDetail.statusOptions.disputed', 'Disputed') },
  ]
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t } = useTranslation('admin')
  const orderStatusOptions = useOrderStatusOptions()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const { data, isLoading, error, refetch } = useAdminOrderDetail(orderId!)
  const forceCancel = useAdminForceCancelOrder()
  const forceRefund = useAdminForceRefundOrder()
  const overrideStatus = useAdminOverrideOrderStatus()

  // Action modals
  const [cancelModal, setCancelModal] = useState(false)
  const [refundModal, setRefundModal] = useState(false)
  const [overrideModal, setOverrideModal] = useState(false)
  const [reason, setReason] = useState('')
  const [newStatus, setNewStatus] = useState<string | undefined>()

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <AdminErrorState
        message={t('common.error')}
        onRetry={refetch}
        backPath="/admin/orders"
      />
    )
  }

  const { order, outboundShipment, monitoringAlerts, escrowSummary } = data

  const handleForceCancel = async () => {
    if (!reason.trim()) return
    try {
      await forceCancel.mutateAsync({ orderId: orderId!, reason })
      message.success(t('orderDetail.toast.forceCancelSuccess', 'Order force-cancelled'))
      setCancelModal(false)
      setReason('')
      refetch()
    } catch {
      message.error(t('orderDetail.toast.forceCancelError', 'Failed to force-cancel order'))
    }
  }

  const handleForceRefund = async () => {
    if (!reason.trim()) return
    try {
      await forceRefund.mutateAsync({ orderId: orderId!, reason })
      message.success(t('orderDetail.toast.forceRefundSuccess', 'Order force-refunded'))
      setRefundModal(false)
      setReason('')
      refetch()
    } catch {
      message.error(t('orderDetail.toast.forceRefundError', 'Failed to force-refund order'))
    }
  }

  const handleOverrideStatus = async () => {
    if (!reason.trim() || !newStatus) return
    try {
      await overrideStatus.mutateAsync({ orderId: orderId!, newStatus, reason })
      message.success(t('orderDetail.toast.overrideSuccess', 'Order status overridden'))
      setOverrideModal(false)
      setReason('')
      setNewStatus(undefined)
      refetch()
    } catch {
      message.error(t('orderDetail.toast.overrideError', 'Failed to override order status'))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success(t('orderDetail.toast.copied', 'Copied!'))
  }

  const isTerminal = order.status === 'cancelled' || order.status === 'refunded' || order.status === 'completed'

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')}>
          {t('orderDetail.backToOrders', 'Back to Orders')}
        </Button>
      </Space>

      {/* Header */}
      <Flex justify="space-between" align="start" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Typography.Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            {t('orderDetail.title', 'Order')} {order.orderNumber ?? order.id.slice(0, 8)}
            <Button type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(order.id)} />
          </Typography.Title>
          <Flex gap={12} align="center" wrap="wrap" style={{ marginTop: 8 }}>
            <Tag color={STATUS_COLOR[order.status] ?? 'default'} style={{ fontWeight: 600, fontSize: 13, padding: '2px 12px' }}>
              {order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Tag>
            
            <Divider type="vertical" />
            
            <Flex align="center" gap={4}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('orderDetail.buyer', 'Buyer')}:</Typography.Text>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/admin/users/${order.buyerId}`)}>
                <UserOutlined /> {order.buyerDisplayName || order.buyerId.slice(0, 8)}
              </Button>
            </Flex>

            <Divider type="vertical" />

            <Flex align="center" gap={4}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('orderDetail.seller', 'Seller')}:</Typography.Text>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/admin/users/${order.sellerId}`)}>
                <UserOutlined /> {order.sellerDisplayName || order.sellerId.slice(0, 8)}
              </Button>
            </Flex>
          </Flex>
        </div>

        {/* Admin Actions */}
        {!isTerminal && (
          <Space wrap>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => setCancelModal(true)}
              loading={forceCancel.isPending}
            >
              {t('orderDetail.action.forceCancel', 'Force Cancel')}
            </Button>
            <Button
              icon={<DollarOutlined />}
              onClick={() => setRefundModal(true)}
              loading={forceRefund.isPending}
              style={{ borderColor: '#faad14', color: '#d48806' }}
            >
              {t('orderDetail.action.forceRefund', 'Force Refund')}
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() => setOverrideModal(true)}
              loading={overrideStatus.isPending}
            >
              {t('orderDetail.action.overrideStatus', 'Override Status')}
            </Button>
          </Space>
        )}
      </Flex>

      <Row gutter={[16, 16]}>
        {/* Order Info */}
        <Col xs={24} lg={14}>
          <Card
            title={<><ShoppingCartOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.orderInformation', 'Order Information')}</>}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered>
              <Descriptions.Item label={t('orderDetail.label.orderNumber', 'Order Number')}>{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.status', 'Status')}>
                <Tag color={STATUS_COLOR[order.status] ?? 'default'}>{order.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.totalAmount', 'Total Amount')}>
                <Typography.Text strong>{formatCurrency(order.totalAmount)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.currency', 'Currency')}>{order.currency}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.created', 'Created')}>{formatDateTime(order.createdAt)}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.paymentDue', 'Payment Due')}>{order.paymentDueAt ? formatDateTime(order.paymentDueAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.paidAt', 'Paid At')}>{order.paidAt ? formatDateTime(order.paidAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.shippedAt', 'Shipped At')}>{order.shippedAt ? formatDateTime(order.shippedAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.deliveredAt', 'Delivered At')}>{order.deliveredAt ? formatDateTime(order.deliveredAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.completedAt', 'Completed At')}>{order.completedAt ? formatDateTime(order.completedAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.cancelledAt', 'Cancelled At')}>{order.cancelledAt ? formatDateTime(order.cancelledAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label={t('orderDetail.label.escrowStatus', 'Escrow Status')}>
                {order.escrowStatus ? (
                  <Tag color={order.escrowStatus === 'holding' ? 'blue' : order.escrowStatus === 'released_to_seller' ? 'green' : 'orange'}>
                    {order.escrowStatus}
                  </Tag>
                ) : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Payment Breakdown */}
          <Card
            title={<><DollarOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.paymentBreakdown', 'Payment Breakdown')}</>}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title={t('orderDetail.label.depositApplied', 'Deposit Applied')} value={order.depositAppliedAmount ?? 0} precision={0} suffix={order.currency} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={8}>
                <Statistic title={t('orderDetail.label.walletApplied', 'Wallet Applied')} value={order.walletAppliedAmount ?? 0} precision={0} suffix={order.currency} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={8}>
                <Statistic title={t('orderDetail.label.gatewayPaid', 'Gateway Paid')} value={order.gatewayPaidAmount ?? 0} precision={0} suffix={order.currency} valueStyle={{ fontSize: 16 }} />
              </Col>
            </Row>
          </Card>

          {/* Shipping */}
          {order.shipping && (
            <Card
              title={<><EnvironmentOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.shippingAddress', 'Shipping Address')}</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('orderDetail.label.recipient', 'Recipient')}>{order.shipping.recipientName}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.phone', 'Phone')}>{order.shipping.phoneNumber}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.address', 'Address')}>
                  {order.shipping.composedAddress || [order.shipping.street, order.shipping.ward, order.shipping.district, order.shipping.city].filter(Boolean).join(', ')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Direct Shipment */}
          {order.directShipment && (
            <Card
              title={<><TruckOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.directShipment', 'Direct Shipment')}</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions column={isMobile ? 1 : 2} size="small">
                <Descriptions.Item label={t('orderDetail.label.shipmentId', 'Shipment ID')}>{order.directShipment.shipmentIdDisplay}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.status', 'Status')}>
                  <Tag>{order.directShipment.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.carrier', 'Carrier')}>{order.directShipment.externalCarrierName || '—'}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.tracking', 'Tracking')}>{order.directShipment.externalTrackingCode || '—'}</Descriptions.Item>
              </Descriptions>
              {order.directShipment.sellerPackagePhotos?.length > 0 && (
                <>
                  <Divider />
                  <ShipmentEvidenceGallery title={t('orderDetail.section.sellerPackagePhotos', 'Seller Package Photos')} photos={order.directShipment.sellerPackagePhotos} />
                </>
              )}
              {order.directShipment.buyerDeliveryPhotos?.length > 0 && (
                <>
                  <Divider />
                  <ShipmentEvidenceGallery title={t('orderDetail.section.buyerDeliveryPhotos', 'Buyer Delivery Photos')} photos={order.directShipment.buyerDeliveryPhotos} />
                </>
              )}
            </Card>
          )}

          {/* Outbound Shipment */}
          {outboundShipment && (
            <Card
              title={<><TruckOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.outboundShipment', 'Outbound Shipment')}</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions column={isMobile ? 1 : 2} size="small">
                <Descriptions.Item label={t('orderDetail.label.status', 'Status')}>
                  <Tag>{outboundShipment.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.carrier', 'Carrier')}>{outboundShipment.externalCarrierName || '—'}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.tracking', 'Tracking')}>{outboundShipment.carrierTrackingNumber || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Return */}
          {order.return && (
            <Card
              title={t('orderDetail.section.returnRequest', 'Return Request')}
              style={{ borderRadius: 12, marginBottom: 16, borderLeft: '3px solid #faad14' }}
            >
              <Descriptions column={isMobile ? 1 : 2} size="small">
                <Descriptions.Item label={t('orderDetail.label.status', 'Status')}>
                  <Tag color={order.return.status === 'approved' ? 'green' : order.return.status === 'rejected' ? 'red' : 'orange'}>
                    {order.return.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.reason', 'Reason')}>{order.return.reasonCode}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.description', 'Description')} span={2}>{order.return.description || '—'}</Descriptions.Item>
                <Descriptions.Item label={t('orderDetail.label.requested', 'Requested')}>{order.return.requestedAt ? formatDateTime(order.return.requestedAt) : '—'}</Descriptions.Item>
              </Descriptions>
              {order.return.evidence && order.return.evidence.length > 0 && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>{t('orderDetail.section.evidence', 'Evidence')}</Typography.Text>
                  <Flex wrap="wrap" gap={8}>
                    {order.return.evidence.map(e => (
                      <img
                        key={e.id}
                        src={e.mediaUpload?.secureUrl}
                        alt="evidence"
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
                      />
                    ))}
                  </Flex>
                </>
              )}
            </Card>
          )}
        </Col>

        {/* Right column */}
        <Col xs={24} lg={10}>
          {/* Parties */}
          <Card
            title={<><UserOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.parties', 'Parties')}</>}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Flex vertical gap={12}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('orderDetail.label.buyer', 'Buyer')}</Typography.Text>
                <Flex align="center" gap={8}>
                  <Typography.Text strong>{order.buyerDisplayName || '—'}</Typography.Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate(`/admin/users/${order.buyerId}`)}
                  >
                    {t('orderDetail.view', 'View')}
                  </Button>
                </Flex>
              </div>
              <Divider style={{ margin: 0 }} />
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('orderDetail.label.seller', 'Seller')}</Typography.Text>
                <Flex align="center" gap={8}>
                  <Typography.Text strong>{order.sellerDisplayName || '—'}</Typography.Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate(`/admin/users/${order.sellerId}`)}
                  >
                    {t('orderDetail.view', 'View')}
                  </Button>
                </Flex>
              </div>
            </Flex>
          </Card>

          {/* Item Summary */}
          {order.item && (
            <Card
              title={t('orderDetail.section.item', 'Item')}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Flex gap={12} align="start">
                {order.item.primaryImageUrl && (
                  <img
                    src={order.item.primaryImageUrl}
                    alt={order.item.itemTitle}
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  />
                )}
                <div>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
                    {order.item.itemTitle}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t('orderDetail.label.final', 'Final')}: {formatCurrency(order.item.finalPrice)} {order.item.currency}
                  </Typography.Text>
                </div>
              </Flex>
            </Card>
          )}

          {/* Escrow Summary */}
          {escrowSummary && (
            <Card
              title={<><SafetyCertificateOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.escrowSummary', 'Escrow Summary')}</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <Statistic
                    title={t('orderDetail.label.held', 'Held')}
                    value={escrowSummary.totalHeld}
                    precision={0}
                    valueStyle={{ fontSize: 16, color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('orderDetail.label.released', 'Released')}
                    value={escrowSummary.totalReleased}
                    precision={0}
                    valueStyle={{ fontSize: 16, color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('orderDetail.label.refunded', 'Refunded')}
                    value={escrowSummary.totalRefunded}
                    precision={0}
                    valueStyle={{ fontSize: 16, color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Monitoring Alerts */}
          {monitoringAlerts.length > 0 && (
            <Card
              title={<><AlertOutlined style={{ marginRight: 8 }} />{t('orderDetail.section.monitoringAlerts', 'Monitoring Alerts')} ({monitoringAlerts.length})</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Flex vertical gap={8}>
                {monitoringAlerts.map((alert: MonitoringAlertDto) => (
                  <Card
                    key={alert.id}
                    size="small"
                    style={{
                      borderRadius: 8,
                      borderLeft: `3px solid ${alert.severity === 'critical' ? '#ff4d4f' : alert.severity === 'high' ? '#ff7a45' : '#faad14'}`,
                    }}
                  >
                    <Flex justify="space-between" align="start">
                      <div>
                        <Tag color={ALERT_SEVERITY_COLOR[alert.severity] ?? 'default'} style={{ fontSize: 11 }}>
                          {alert.severity}
                        </Tag>
                        <Typography.Text style={{ fontSize: 13 }}>{alert.summary || alert.alertType}</Typography.Text>
                      </div>
                      <Tag>{alert.status}</Tag>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </Card>
          )}

        </Col>
      </Row>

      {/* ── Force Cancel Modal ── */}
      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: 'var(--color-error)' }} />
            <span>{t('orderDetail.modal.forceCancelTitle', 'Force Cancel Order')}</span>
          </Space>
        }
        open={cancelModal}
        onCancel={() => { setCancelModal(false); setReason('') }}
        onOk={handleForceCancel}
        okText={t('orderDetail.modal.confirmCancel', 'Confirm Cancel')}
        okButtonProps={{ danger: true, disabled: !reason.trim(), loading: forceCancel.isPending }}
      >
        <Typography.Paragraph strong style={{ color: 'var(--color-error, #cf1322)' }}>
          {t('orderDetail.modal.financialWarning', 'This action will affect financial flow and cannot be undone. Are you sure?')}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {t('orderDetail.modal.forceCancelDescription', 'This will cancel the order from any state and refund all held escrows to the buyer.')}
        </Typography.Paragraph>
        <Input.TextArea
          placeholder={t('orderDetail.placeholder.cancelReason', 'Reason for force cancellation...')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* ── Force Refund Modal ── */}
      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: 'var(--color-error)' }} />
            <span>{t('orderDetail.modal.forceRefundTitle', 'Force Refund Order')}</span>
          </Space>
        }
        open={refundModal}
        onCancel={() => { setRefundModal(false); setReason('') }}
        onOk={handleForceRefund}
        okText={t('orderDetail.modal.confirmRefund', 'Confirm Refund')}
        okButtonProps={{ danger: true, disabled: !reason.trim(), loading: forceRefund.isPending }}
      >
        <Typography.Paragraph strong style={{ color: 'var(--color-error, #cf1322)' }}>
          {t('orderDetail.modal.financialWarning', 'This action will affect financial flow and cannot be undone. Are you sure?')}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {t('orderDetail.modal.forceRefundDescription', 'This will mark the order as refunded and release all escrows back to the buyer.')}
        </Typography.Paragraph>
        <Input.TextArea
          placeholder={t('orderDetail.placeholder.refundReason', 'Reason for force refund...')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* ── Override Status Modal ── */}
      <Modal
        title={
          <Space>
            <AlertOutlined style={{ color: 'var(--color-error)' }} />
            <span>{t('orderDetail.modal.overrideStatusTitle', 'Override Order Status')}</span>
          </Space>
        }
        open={overrideModal}
        onCancel={() => { setOverrideModal(false); setReason(''); setNewStatus(undefined) }}
        onOk={handleOverrideStatus}
        okText={t('orderDetail.modal.confirmOverride', 'Confirm Override')}
        okButtonProps={{ danger: true, disabled: !reason.trim() || !newStatus, loading: overrideStatus.isPending }}
      >
        <Typography.Paragraph strong style={{ color: 'var(--color-error, #cf1322)' }}>
          {t('orderDetail.modal.financialWarning', 'This action will affect financial flow and cannot be undone. Are you sure?')}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {t('orderDetail.modal.overrideStatusDescription', 'This will directly change the order status. Use with extreme caution.')}
        </Typography.Paragraph>
        <Select
          placeholder={t('orderDetail.placeholder.selectNewStatus', 'Select new status')}
          value={newStatus}
          onChange={setNewStatus}
          style={{ width: '100%', marginBottom: 12 }}
          options={orderStatusOptions}
        />
        <Input.TextArea
          placeholder={t('orderDetail.placeholder.overrideReason', 'Reason for status override...')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  )
}
