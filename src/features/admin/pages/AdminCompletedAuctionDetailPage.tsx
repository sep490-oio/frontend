import { useParams, useNavigate } from 'react-router'
import {
  Typography, Card, Descriptions, Tag, Button, Space, Spin, Row, Col,
  Flex, Alert, Divider,
} from 'antd'
import {
  ArrowLeftOutlined, TrophyOutlined, WarningOutlined,
  AlertOutlined, LinkOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useAdminCompletedAuctionDetail } from '@/features/admin/api'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { ShipmentEvidenceGallery } from '@/features/order/components/ShipmentEvidenceGallery'
import type { MonitoringAlertDto } from '@/types'

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  pending_payment: 'orange',
  paid: 'green',
  payment_overdue: 'red',
}

const FULFILLMENT_STATUS_COLOR: Record<string, string> = {
  awaiting_seller_ship: 'default',
  warehouse_outbound_pending: 'blue',
  picked_up: 'cyan',
  on_delivering: 'processing',
  delivered: 'success',
  shipping_overdue: 'error',
  escalated: 'error',
}

const ALERT_SEVERITY_COLOR: Record<string, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
}

export default function AdminCompletedAuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>()
  const { t } = useTranslation('admin')
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useAdminCompletedAuctionDetail(auctionId!)

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
        backPath="/admin/auctions/completed"
      />
    )
  }

  const { summary, order, outboundShipment, monitoringAlerts } = data

  const isOverdue =
    summary.fulfillmentStatus === 'shipping_overdue' ||
    summary.fulfillmentStatus === 'escalated' ||
    summary.isShippingOverdue

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/auctions/completed')}>
          {t('completedAuctions.detail.back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        {t('completedAuctions.detail.title')}
      </Typography.Title>

      {isOverdue && (
        <Alert
          type="error"
          icon={<WarningOutlined />}
          showIcon
          message={t('completedAuctions.fulfillmentStatus.shipping_overdue')}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Auction Summary */}
        <Col xs={24} lg={12}>
          <Card title={t('completedAuctions.detail.auctionInfo')} style={{ height: '100%' }}>
            {summary.itemPrimaryImageUrl && (
              <div style={{ marginBottom: 12 }}>
                <img
                  src={summary.itemPrimaryImageUrl}
                  alt={summary.itemTitle}
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4 }}
                />
              </div>
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('common.id')}>{summary.auctionId}</Descriptions.Item>
              <Descriptions.Item label={t('completedAuctions.columns.item')}>
                <Typography.Text strong>{summary.itemTitle}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('completedAuctions.columns.finalPrice')}>
                <Typography.Text strong>{formatCurrency(summary.finalPrice ?? 0)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('completedAuctions.columns.winner')}>
                {summary.winnerDisplayName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('completedAuctions.columns.seller')}>
                {summary.sellerDisplayName ?? '—'}
              </Descriptions.Item>
              {summary.paymentStatus && (
                <Descriptions.Item label={t('completedAuctions.columns.paymentStatus')}>
                  <Tag color={PAYMENT_STATUS_COLOR[summary.paymentStatus] ?? 'default'}>
                    {t(`completedAuctions.paymentStatus.${summary.paymentStatus}`, summary.paymentStatus)}
                  </Tag>
                </Descriptions.Item>
              )}
              {summary.fulfillmentStatus && (
                <Descriptions.Item label={t('completedAuctions.columns.fulfillmentStatus')}>
                  <Tag
                    color={FULFILLMENT_STATUS_COLOR[summary.fulfillmentStatus] ?? 'default'}
                    icon={isOverdue ? <WarningOutlined /> : undefined}
                  >
                    {t(`completedAuctions.fulfillmentStatus.${summary.fulfillmentStatus}`, summary.fulfillmentStatus)}
                  </Tag>
                </Descriptions.Item>
              )}
              {summary.shipByAt && (
                <Descriptions.Item label="Ship by">
                  <Flex align="center" gap={8}>
                    {formatDateTime(summary.shipByAt)}
                    {summary.isShippingOverdue && (
                      <Tag color="error" icon={<WarningOutlined />}>Overdue</Tag>
                    )}
                  </Flex>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Order Card */}
        <Col xs={24} lg={12}>
          <Card
            title={t('completedAuctions.detail.orderInfo')}
            style={{ height: '100%' }}
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('completedAuctions.columns.orderNumber')}>
                {order.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Order Status">
                <StatusBadge status={order.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Typography.Text strong>{formatCurrency(order.totalAmount ?? 0)}</Typography.Text>
                {' '}{order.currency}
              </Descriptions.Item>
              {order.amountPaid != null && (
                <Descriptions.Item label="Amount Paid">
                  {formatCurrency(order.amountPaid)}
                </Descriptions.Item>
              )}
              {order.paidAt && (
                <Descriptions.Item label="Paid at">
                  {formatDateTime(order.paidAt)}
                </Descriptions.Item>
              )}
              {order.createdAt && (
                <Descriptions.Item label="Created at">
                  {formatDateTime(order.createdAt)}
                </Descriptions.Item>
              )}
              {order.shipping && (
                <Descriptions.Item label="Ship to">
                  <div>
                    {order.shipping.recipientName && (
                      <Typography.Text strong style={{ display: 'block' }}>
                        {order.shipping.recipientName}
                      </Typography.Text>
                    )}
                    {order.shipping.phoneNumber && (
                      <Typography.Text type="secondary" style={{ display: 'block' }}>
                        {order.shipping.phoneNumber}
                      </Typography.Text>
                    )}
                    <Typography.Text type="secondary">{order.shipping.composedAddress}</Typography.Text>
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Escalation Details */}
        {(summary.escalatedAt || summary.escalationReason) && (
          <Col xs={24}>
            <Card
              title={
                <Flex align="center" gap={8}>
                  <WarningOutlined style={{ color: 'var(--color-danger, #ff4d4f)' }} />
                  Escalation Details
                </Flex>
              }
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                {summary.shipByAt && (
                  <Descriptions.Item label="Ship by at">
                    {formatDateTime(summary.shipByAt)}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Shipping overdue">
                  {summary.isShippingOverdue ? (
                    <Tag color="error">Yes</Tag>
                  ) : (
                    <Tag color="success">No</Tag>
                  )}
                </Descriptions.Item>
                {summary.escalatedAt && (
                  <Descriptions.Item label="Escalated at">
                    {formatDateTime(summary.escalatedAt)}
                  </Descriptions.Item>
                )}
                {summary.escalationReason && (
                  <Descriptions.Item label="Escalation reason" span={2}>
                    {t(`completedAuctions.escalationReason.${summary.escalationReason}`, summary.escalationReason)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        )}

        {/* Outbound Shipment */}
        {outboundShipment && (
          <Col xs={24} lg={12}>
            <Card title={t('completedAuctions.detail.outboundShipment')}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label={t('common.id')}>{outboundShipment.id}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <StatusBadge status={outboundShipment.status} />
                </Descriptions.Item>
                {outboundShipment.externalCarrierName && (
                  <Descriptions.Item label="Carrier">
                    {outboundShipment.externalCarrierName}
                  </Descriptions.Item>
                )}
                {outboundShipment.carrierTrackingNumber && (
                  <Descriptions.Item label="Tracking number">
                    {outboundShipment.carrierTrackingNumber}
                  </Descriptions.Item>
                )}
                {outboundShipment.shippingFee != null && (
                  <Descriptions.Item label="Shipping fee">
                    {formatCurrency(outboundShipment.shippingFee ?? 0)}
                  </Descriptions.Item>
                )}
                {outboundShipment.estimatedDeliveryAt && (
                  <Descriptions.Item label="Est. delivery">
                    {formatDateTime(outboundShipment.estimatedDeliveryAt)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        )}

        {/* Direct Shipment (seller self-ship) */}
        {order.directShipment && (() => {
          const ds = order.directShipment
          const decisionEndsAt = order.decisionWindowEndsAt
          const daysLeft = decisionEndsAt
            ? dayjs(decisionEndsAt).diff(dayjs(), 'day')
            : null
          const windowOverdue = daysLeft !== null && daysLeft < 0
          return (
            <Col xs={24} lg={12}>
              <Card title={t('completedAuctions.detail.directShipment')}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={t('completedAuctions.directShipment.shipmentIdDisplay')}>
                    <Typography.Text strong copyable>{ds.shipmentIdDisplay}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('completedAuctions.directShipment.internalTrackingCode')}>
                    <Typography.Text copyable>{ds.internalTrackingCode}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('completedAuctions.directShipment.buyerDeepLink')}>
                    <a href={`/me/shipments/${ds.id}`} target="_blank" rel="noopener noreferrer">
                      <LinkOutlined style={{ marginRight: 4 }} />
                      {`/me/shipments/${ds.id}`}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('completedAuctions.directShipment.carrier')}>
                    {ds.externalCarrierName ?? t('completedAuctions.directShipment.noCarrier')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('completedAuctions.directShipment.trackingCode')}>
                    {ds.externalTrackingCode ?? t('completedAuctions.directShipment.noCarrier')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('completedAuctions.directShipment.status')}>
                    <Tag>
                      {t(`completedAuctions.directShipment.statusValues.${ds.status}`, ds.status)}
                    </Tag>
                  </Descriptions.Item>
                  {ds.deliveredAt && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.deliveredAt')}>
                      {formatDateTime(ds.deliveredAt)}
                    </Descriptions.Item>
                  )}
                  {ds.buyerReceivedPackageAt && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.buyerReceivedAt')}>
                      {formatDateTime(ds.buyerReceivedPackageAt)}
                    </Descriptions.Item>
                  )}
                  {ds.buyerAcceptedAt && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.buyerAcceptedAt')}>
                      {formatDateTime(ds.buyerAcceptedAt)}
                    </Descriptions.Item>
                  )}
                  {daysLeft !== null && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.decisionWindow')}>
                      {windowOverdue ? (
                        <Tag color="error" icon={<WarningOutlined />}>
                          {t('completedAuctions.directShipment.windowOverdue')}
                        </Tag>
                      ) : (
                        <Tag color="processing">
                          {t('completedAuctions.directShipment.daysRemaining', { count: daysLeft })}
                        </Tag>
                      )}
                    </Descriptions.Item>
                  )}
                  {ds.sellerDeclaredShippedAt && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.sellerDeclaredShippedAt')}>
                      {formatDateTime(ds.sellerDeclaredShippedAt)}
                    </Descriptions.Item>
                  )}
                </Descriptions>

                {/* Evidence galleries */}
                <Divider style={{ margin: '16px 0' }} />
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <ShipmentEvidenceGallery
                    title={t('completedAuctions.directShipment.sellerPackagePhotos')}
                    photos={ds.sellerPackagePhotos}
                  />
                  <ShipmentEvidenceGallery
                    title={t('completedAuctions.directShipment.sellerHandoverProofs')}
                    photos={ds.sellerHandoverProofs}
                  />
                  <ShipmentEvidenceGallery
                    title={t('completedAuctions.directShipment.buyerDeliveryPhotos')}
                    photos={ds.buyerDeliveryPhotos}
                  />
                </Space>

                {/* Buyer condition */}
                {(ds.buyerPackageCondition || ds.buyerConditionNotes) && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <Descriptions column={1} bordered size="small">
                      {ds.buyerPackageCondition && (
                        <Descriptions.Item label={t('completedAuctions.directShipment.buyerPackageCondition')}>
                          <Tag>
                            {t(`directShipment.conditions.${ds.buyerPackageCondition}`, ds.buyerPackageCondition)}
                          </Tag>
                        </Descriptions.Item>
                      )}
                      {ds.buyerConditionNotes && (
                        <Descriptions.Item label={t('completedAuctions.directShipment.buyerConditionNotes')}>
                          <Typography.Text>{ds.buyerConditionNotes}</Typography.Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </>
                )}

                {/* QR token audit */}
                <Divider style={{ margin: '16px 0' }} />
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={t('completedAuctions.directShipment.qrTokenVersion')}>
                    {ds.qrTokenVersion}
                  </Descriptions.Item>
                  {ds.qrTokenIssuedAt && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.qrTokenIssuedAt')}>
                      {formatDateTime(ds.qrTokenIssuedAt)}
                    </Descriptions.Item>
                  )}
                  {ds.qrTokenRevokedAt && (
                    <Descriptions.Item label={t('completedAuctions.directShipment.qrTokenRevokedAt')}>
                      {formatDateTime(ds.qrTokenRevokedAt)}
                    </Descriptions.Item>
                  )}
                </Descriptions>

                {/* Manual review alert */}
                {ds.manualReviewRequired && (
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    message={t('completedAuctions.directShipment.manualReviewRequired')}
                    description={ds.manualReviewReason ?? undefined}
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </Col>
          )
        })()}

        {/* Monitoring Alerts */}
        {monitoringAlerts && monitoringAlerts.length > 0 && (
          <Col xs={24}>
            <Card
              title={
                <Flex align="center" gap={8}>
                  <AlertOutlined />
                  {t('completedAuctions.detail.alerts')}
                </Flex>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {monitoringAlerts.map((alert: MonitoringAlertDto) => (
                  <Alert
                    key={alert.id}
                    type={ALERT_SEVERITY_COLOR[alert.severity] as 'success' | 'warning' | 'error' | 'info'}
                    showIcon
                    message={
                      <Flex justify="space-between" align="center">
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {alert.alertType}
                        </Typography.Text>
                        <Space size={8}>
                          <StatusBadge status={alert.status} />
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDateTime(alert.createdAt)}
                          </Typography.Text>
                        </Space>
                      </Flex>
                    }
                  />
                ))}
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
