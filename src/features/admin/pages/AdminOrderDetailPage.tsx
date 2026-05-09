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

const ORDER_STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'on_delivering', label: 'On Delivering' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'disputed', label: 'Disputed' },
]

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { t } = useTranslation('admin')
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
      message.success('Order force-cancelled')
      setCancelModal(false)
      setReason('')
      refetch()
    } catch {
      message.error('Failed to force-cancel order')
    }
  }

  const handleForceRefund = async () => {
    if (!reason.trim()) return
    try {
      await forceRefund.mutateAsync({ orderId: orderId!, reason })
      message.success('Order force-refunded')
      setRefundModal(false)
      setReason('')
      refetch()
    } catch {
      message.error('Failed to force-refund order')
    }
  }

  const handleOverrideStatus = async () => {
    if (!reason.trim() || !newStatus) return
    try {
      await overrideStatus.mutateAsync({ orderId: orderId!, newStatus, reason })
      message.success('Order status overridden')
      setOverrideModal(false)
      setReason('')
      setNewStatus(undefined)
      refetch()
    } catch {
      message.error('Failed to override order status')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('Copied!')
  }

  const isTerminal = order.status === 'cancelled' || order.status === 'refunded' || order.status === 'completed'

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </Button>
      </Space>

      {/* Header */}
      <Flex justify="space-between" align="start" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
        <div>
          <Typography.Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Order #{order.orderNumber}
          </Typography.Title>
          <Flex gap={8} align="center" style={{ marginTop: 8 }}>
            <Tag color={STATUS_COLOR[order.status] ?? 'default'} style={{ fontWeight: 600, fontSize: 13, padding: '2px 12px' }}>
              {order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Tag>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, cursor: 'pointer' }}
              onClick={() => copyToClipboard(order.id)}
            >
              {order.id.slice(0, 8)}... <CopyOutlined style={{ fontSize: 11 }} />
            </Typography.Text>
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
              Force Cancel
            </Button>
            <Button
              icon={<DollarOutlined />}
              onClick={() => setRefundModal(true)}
              loading={forceRefund.isPending}
              style={{ borderColor: '#faad14', color: '#d48806' }}
            >
              Force Refund
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() => setOverrideModal(true)}
              loading={overrideStatus.isPending}
            >
              Override Status
            </Button>
          </Space>
        )}
      </Flex>

      <Row gutter={[16, 16]}>
        {/* Order Info */}
        <Col xs={24} lg={14}>
          <Card
            title={<><ShoppingCartOutlined style={{ marginRight: 8 }} />Order Information</>}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered>
              <Descriptions.Item label="Order Number">{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[order.status] ?? 'default'}>{order.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Typography.Text strong>{formatCurrency(order.totalAmount)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Currency">{order.currency}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateTime(order.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Payment Due">{order.paymentDueAt ? formatDateTime(order.paymentDueAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Paid At">{order.paidAt ? formatDateTime(order.paidAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Shipped At">{order.shippedAt ? formatDateTime(order.shippedAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Delivered At">{order.deliveredAt ? formatDateTime(order.deliveredAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Completed At">{order.completedAt ? formatDateTime(order.completedAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Cancelled At">{order.cancelledAt ? formatDateTime(order.cancelledAt) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Escrow Status">
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
            title={<><DollarOutlined style={{ marginRight: 8 }} />Payment Breakdown</>}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Deposit Applied" value={order.depositAppliedAmount ?? 0} precision={0} suffix={order.currency} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={8}>
                <Statistic title="Wallet Applied" value={order.walletAppliedAmount ?? 0} precision={0} suffix={order.currency} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={8}>
                <Statistic title="Gateway Paid" value={order.gatewayPaidAmount ?? 0} precision={0} suffix={order.currency} valueStyle={{ fontSize: 16 }} />
              </Col>
            </Row>
          </Card>

          {/* Shipping */}
          {order.shipping && (
            <Card
              title={<><EnvironmentOutlined style={{ marginRight: 8 }} />Shipping Address</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Recipient">{order.shipping.recipientName}</Descriptions.Item>
                <Descriptions.Item label="Phone">{order.shipping.phoneNumber}</Descriptions.Item>
                <Descriptions.Item label="Address">
                  {order.shipping.composedAddress || [order.shipping.street, order.shipping.ward, order.shipping.district, order.shipping.city].filter(Boolean).join(', ')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Direct Shipment */}
          {order.directShipment && (
            <Card
              title={<><TruckOutlined style={{ marginRight: 8 }} />Direct Shipment</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions column={isMobile ? 1 : 2} size="small">
                <Descriptions.Item label="Shipment ID">{order.directShipment.shipmentIdDisplay}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag>{order.directShipment.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Carrier">{order.directShipment.externalCarrierName || '—'}</Descriptions.Item>
                <Descriptions.Item label="Tracking">{order.directShipment.externalTrackingCode || '—'}</Descriptions.Item>
              </Descriptions>
              {order.directShipment.sellerPackagePhotos?.length > 0 && (
                <>
                  <Divider />
                  <ShipmentEvidenceGallery title="Seller Package Photos" photos={order.directShipment.sellerPackagePhotos} />
                </>
              )}
              {order.directShipment.buyerDeliveryPhotos?.length > 0 && (
                <>
                  <Divider />
                  <ShipmentEvidenceGallery title="Buyer Delivery Photos" photos={order.directShipment.buyerDeliveryPhotos} />
                </>
              )}
            </Card>
          )}

          {/* Outbound Shipment */}
          {outboundShipment && (
            <Card
              title={<><TruckOutlined style={{ marginRight: 8 }} />Outbound Shipment</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions column={isMobile ? 1 : 2} size="small">
                <Descriptions.Item label="Status">
                  <Tag>{outboundShipment.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Carrier">{outboundShipment.externalCarrierName || '—'}</Descriptions.Item>
                <Descriptions.Item label="Tracking">{outboundShipment.carrierTrackingNumber || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Return */}
          {order.return && (
            <Card
              title="Return Request"
              style={{ borderRadius: 12, marginBottom: 16, borderLeft: '3px solid #faad14' }}
            >
              <Descriptions column={isMobile ? 1 : 2} size="small">
                <Descriptions.Item label="Status">
                  <Tag color={order.return.status === 'approved' ? 'green' : order.return.status === 'rejected' ? 'red' : 'orange'}>
                    {order.return.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Reason">{order.return.reasonCode}</Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>{order.return.description || '—'}</Descriptions.Item>
                <Descriptions.Item label="Requested">{order.return.requestedAt ? formatDateTime(order.return.requestedAt) : '—'}</Descriptions.Item>
              </Descriptions>
              {order.return.evidence && order.return.evidence.length > 0 && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Evidence</Typography.Text>
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
            title={<><UserOutlined style={{ marginRight: 8 }} />Parties</>}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Flex vertical gap={12}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Buyer</Typography.Text>
                <Flex align="center" gap={8}>
                  <Typography.Text strong>{order.buyerDisplayName || '—'}</Typography.Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate(`/admin/users/${order.buyerId}`)}
                  >
                    View
                  </Button>
                </Flex>
              </div>
              <Divider style={{ margin: 0 }} />
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Seller</Typography.Text>
                <Flex align="center" gap={8}>
                  <Typography.Text strong>{order.sellerDisplayName || '—'}</Typography.Text>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate(`/admin/users/${order.sellerId}`)}
                  >
                    View
                  </Button>
                </Flex>
              </div>
            </Flex>
          </Card>

          {/* Item Summary */}
          {order.item && (
            <Card
              title="Item"
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
                    Final: {formatCurrency(order.item.finalPrice)} {order.item.currency}
                  </Typography.Text>
                </div>
              </Flex>
            </Card>
          )}

          {/* Escrow Summary */}
          {escrowSummary && (
            <Card
              title={<><SafetyCertificateOutlined style={{ marginRight: 8 }} />Escrow Summary</>}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <Statistic
                    title="Held"
                    value={escrowSummary.totalHeld}
                    precision={0}
                    valueStyle={{ fontSize: 16, color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Released"
                    value={escrowSummary.totalReleased}
                    precision={0}
                    valueStyle={{ fontSize: 16, color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Refunded"
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
              title={<><AlertOutlined style={{ marginRight: 8 }} />Monitoring Alerts ({monitoringAlerts.length})</>}
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
        title="Force Cancel Order"
        open={cancelModal}
        onCancel={() => { setCancelModal(false); setReason('') }}
        onOk={handleForceCancel}
        okText="Force Cancel"
        okButtonProps={{ danger: true, disabled: !reason.trim(), loading: forceCancel.isPending }}
      >
        <Typography.Paragraph type="secondary">
          This will cancel the order from any state and refund all held escrows to the buyer.
        </Typography.Paragraph>
        <Input.TextArea
          placeholder="Reason for force cancellation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* ── Force Refund Modal ── */}
      <Modal
        title="Force Refund Order"
        open={refundModal}
        onCancel={() => { setRefundModal(false); setReason('') }}
        onOk={handleForceRefund}
        okText="Force Refund"
        okButtonProps={{ disabled: !reason.trim(), loading: forceRefund.isPending }}
      >
        <Typography.Paragraph type="secondary">
          This will mark the order as refunded and release all escrows back to the buyer.
        </Typography.Paragraph>
        <Input.TextArea
          placeholder="Reason for force refund..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* ── Override Status Modal ── */}
      <Modal
        title="Override Order Status"
        open={overrideModal}
        onCancel={() => { setOverrideModal(false); setReason(''); setNewStatus(undefined) }}
        onOk={handleOverrideStatus}
        okText="Override Status"
        okButtonProps={{ disabled: !reason.trim() || !newStatus, loading: overrideStatus.isPending }}
      >
        <Typography.Paragraph type="secondary">
          This will directly change the order status. Use with extreme caution.
        </Typography.Paragraph>
        <Select
          placeholder="Select new status"
          value={newStatus}
          onChange={setNewStatus}
          style={{ width: '100%', marginBottom: 12 }}
          options={ORDER_STATUS_OPTIONS}
        />
        <Input.TextArea
          placeholder="Reason for status override..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  )
}
