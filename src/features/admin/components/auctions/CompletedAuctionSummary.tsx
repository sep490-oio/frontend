import {
  Typography, Card, Descriptions, Tag, Space, Spin, Row, Col,
  Flex, Alert, Tabs, Button, Table, Statistic, Empty, Divider
} from 'antd'
import { EyeOutlined, WarningOutlined, AlertOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useAdminCompletedAuctionDetail, useAdminOrderDetail } from '@/features/admin/api'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { ShipmentEvidenceGallery } from '@/features/order/components/ShipmentEvidenceGallery'
import type { MonitoringAlertDto } from '@/types'
import { Link, useNavigate } from 'react-router'

const ALERT_SEVERITY_COLOR: Record<string, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
}

export function CompletedAuctionSummary({ auctionId, bidsData }: { auctionId: string, bidsData?: any }) {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useAdminCompletedAuctionDetail(auctionId!)
  
  // Conditionally fetch order detail to get escrow/commission if order exists
  const { data: orderDetail } = useAdminOrderDetail(data?.summary?.orderId ?? '')

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
  const escrowSummary = orderDetail?.escrowSummary

  const isOverdue =
    summary.fulfillmentStatus === 'shipping_overdue' ||
    summary.fulfillmentStatus === 'escalated' ||
    summary.isShippingOverdue

  // Component parts
  const renderBiddingHistory = () => {
    if (!bidsData || !bidsData.items) return <Typography.Text type="secondary">No bidding history available.</Typography.Text>
    
    return (
      <Table
        dataSource={bidsData.items}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 600 }}
        columns={[
          {
            title: 'BIDDER',
            dataIndex: 'bidderDisplayName',
            key: 'bidder',
            render: (_text: string, record: any) => (
              <Link to={`/admin/users/${record.bidderId}`} style={{ fontWeight: 500 }}>
                {record.bidderDisplayName || 'Unknown Bidder'}
              </Link>
            )
          },
          {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (val: any) => {
              const num = typeof val === 'object' && val !== null ? val.amount : val
              const currency = typeof val === 'object' && val !== null ? val.currency : (summary.currency ?? 'VND')
              return <Typography.Text strong>{formatCurrency(num, currency)}</Typography.Text>
            }
          },
          {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: any) => val ? dayjs(val).format('HH:mm:ss DD/MM/YYYY') : '—'
          },
          {
            title: 'Type',
            dataIndex: 'isAutoBid',
            key: 'isAutoBid',
            render: (isAuto: boolean) => <Tag color={isAuto ? 'blue' : 'default'}>{isAuto ? 'Auto' : 'Manual'}</Tag>
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => <StatusBadge status={val} />
          }
        ]}
      />
    )
  }

  const renderOrderFinancials = () => {
    const finalBidAmount = summary.finalPrice || 0;
    const platformCommission = (escrowSummary as any)?.platformCommission || (finalBidAmount * 0.05); // 5% fallback if no real data
    const sellerPayout = finalBidAmount - platformCommission;

    return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={5} style={{ margin: 0 }}>Financials Summary</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small" bordered={false} style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}>
            <Statistic title="Final Bid Amount" value={formatCurrency(finalBidAmount, summary.currency ?? undefined)} valueStyle={{ color: '#096dd9' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bordered={false} style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e' }}>
            <Statistic title="Platform Commission" value={formatCurrency(platformCommission, summary.currency ?? undefined)} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bordered={false} style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Statistic title="Seller Payout" value={formatCurrency(sellerPayout, summary.currency ?? undefined)} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Typography.Title level={5} style={{ margin: 0 }}>{t('completedAuctions.detail.orderInfo', 'Order Information')}</Typography.Title>
        {order && (
          <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/admin/orders/${summary.orderId}`)}>
            View Order Detail
          </Button>
        )}
      </Flex>
      
      {order && (
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={t('completedAuctions.columns.orderNumber')}>
            <Typography.Text copyable>{order.orderNumber}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('completedAuctions.detail.orderStatus')}>
            <StatusBadge status={order.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('completedAuctions.detail.total')}>
            <Typography.Text strong>{formatCurrency(order.totalAmount ?? 0)}</Typography.Text>
            {' '}{order.currency}
          </Descriptions.Item>
          {order.amountPaid != null && (
            <Descriptions.Item label="Amount Paid (Deposit)">
              {formatCurrency(order.amountPaid)}
            </Descriptions.Item>
          )}
          {order.paidAt && (
            <Descriptions.Item label={t('completedAuctions.detail.paidAt')}>
              {formatDateTime(order.paidAt)}
            </Descriptions.Item>
          )}
          {order.createdAt && (
            <Descriptions.Item label={t('completedAuctions.detail.createdAt')}>
              {formatDateTime(order.createdAt)}
            </Descriptions.Item>
          )}
          {order.shipping && (
            <Descriptions.Item label={t('completedAuctions.detail.shipTo')} span={2}>
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
      )}

      {escrowSummary && (
        <>
          <Typography.Title level={5} style={{ margin: 0, marginTop: 16 }}>Financials & Escrow</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card size="small" bordered={false} style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591' }}>
                <Statistic title="Total Held" value={formatCurrency(escrowSummary.totalHeld ?? 0, escrowSummary.currency)} valueStyle={{ color: '#d46b08' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" bordered={false} style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Statistic title="Total Released" value={formatCurrency(escrowSummary.totalReleased ?? 0, escrowSummary.currency)} valueStyle={{ color: '#389e0d' }} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" bordered={false} style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e' }}>
                <Statistic title="Total Refunded" value={formatCurrency(escrowSummary.totalRefunded ?? 0, escrowSummary.currency)} valueStyle={{ color: '#cf1322' }} />
              </Card>
            </Col>
            {(escrowSummary as any).platformCommission != null && (
              <Col xs={24} sm={8}>
                <Card size="small" bordered={false} style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff' }}>
                  <Statistic title="Platform Commission" value={formatCurrency((escrowSummary as any).platformCommission ?? 0, escrowSummary.currency)} valueStyle={{ color: '#096dd9' }} />
                </Card>
              </Col>
            )}
          </Row>
        </>
      )}
    </Space>
  )
}

  const renderFulfillment = () => {
    const hasFulfillmentData = isOverdue || summary.escalatedAt || summary.escalationReason || outboundShipment || order?.directShipment || (monitoringAlerts && monitoringAlerts.length > 0)
    if (!hasFulfillmentData) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size={4}>
              <Typography.Text type="secondary" strong>{t('completedAuctions.fulfillmentStatus.noShippingData', 'Không có dữ liệu vận chuyển')}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('completedAuctions.fulfillmentStatus.noShippingDataDesc', 'No shipping data available yet.')}</Typography.Text>
            </Space>
          }
        />
      )
    }

    return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {isOverdue && (
        <Alert
          type="error"
          icon={<WarningOutlined />}
          showIcon
          message={t('completedAuctions.fulfillmentStatus.shipping_overdue')}
        />
      )}

      {/* Escalation Details */}
      {(summary.escalatedAt || summary.escalationReason) && (
        <Card
          title={
            <Flex align="center" gap={8}>
              <WarningOutlined style={{ color: 'var(--color-danger, #ff4d4f)' }} />
              {t('completedAuctions.detail.escalationDetails')}
            </Flex>
          }
          size="small"
        >
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            {summary.shipByAt && (
              <Descriptions.Item label={t('completedAuctions.detail.shipBy')}>
                {formatDateTime(summary.shipByAt)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('completedAuctions.detail.shippingOverdue')}>
              {summary.isShippingOverdue ? (
                <Tag color="error">{t('completedAuctions.detail.yes')}</Tag>
              ) : (
                <Tag color="success">{t('completedAuctions.detail.no')}</Tag>
              )}
            </Descriptions.Item>
            {summary.escalatedAt && (
              <Descriptions.Item label={t('completedAuctions.detail.escalatedAt')}>
                {formatDateTime(summary.escalatedAt)}
              </Descriptions.Item>
            )}
            {summary.escalationReason && (
              <Descriptions.Item label={t('completedAuctions.detail.escalationReason')} span={2}>
                {t(`completedAuctions.escalationReason.${summary.escalationReason}`, summary.escalationReason)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Outbound Shipment */}
      {outboundShipment && (
        <Card title={t('completedAuctions.detail.outboundShipment')} size="small">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('common.id')}>{outboundShipment.id}</Descriptions.Item>
            <Descriptions.Item label={t('completedAuctions.detail.status')}>
              <StatusBadge status={outboundShipment.status} />
            </Descriptions.Item>
            {outboundShipment.externalCarrierName && (
              <Descriptions.Item label={t('completedAuctions.detail.carrier')}>
                {outboundShipment.externalCarrierName}
              </Descriptions.Item>
            )}
            {outboundShipment.carrierTrackingNumber && (
              <Descriptions.Item label={t('completedAuctions.detail.trackingNumber')}>
                {outboundShipment.carrierTrackingNumber}
              </Descriptions.Item>
            )}
            {outboundShipment.shippingFee != null && (
              <Descriptions.Item label={t('completedAuctions.detail.shippingFee')}>
                {formatCurrency(outboundShipment.shippingFee ?? 0)}
              </Descriptions.Item>
            )}
            {outboundShipment.estimatedDeliveryAt && (
              <Descriptions.Item label={t('completedAuctions.detail.estDelivery')}>
                {formatDateTime(outboundShipment.estimatedDeliveryAt)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Direct Shipment (seller self-ship) */}
      {order?.directShipment && (() => {
        const ds = order.directShipment
        const decisionEndsAt = order.decisionWindowEndsAt
        const daysLeft = decisionEndsAt
          ? dayjs(decisionEndsAt).diff(dayjs(), 'day')
          : null
        const windowOverdue = daysLeft !== null && daysLeft < 0
        return (
          <Card title={t('completedAuctions.detail.directShipment')} size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('completedAuctions.directShipment.shipmentIdDisplay')}>
                <Typography.Text strong copyable>{ds.shipmentIdDisplay}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('completedAuctions.directShipment.internalTrackingCode')}>
                <Typography.Text copyable>{ds.internalTrackingCode}</Typography.Text>
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
        )
      })()}

      {/* Monitoring Alerts */}
      {monitoringAlerts && monitoringAlerts.length > 0 && (
        <Card
          title={
            <Flex align="center" gap={8}>
              <AlertOutlined />
              {t('completedAuctions.detail.alerts')}
            </Flex>
          }
          size="small"
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
      )}
    </Space>
    )
  }

  const items = [
    { key: 'bids', label: '🔨 Bidding History', children: renderBiddingHistory() },
    { key: 'financials', label: '🧾 Order & Financials', children: renderOrderFinancials() },
    { key: 'fulfillment', label: '📦 Fulfillment & Evidence', children: renderFulfillment() },
  ]

  return (
    <div style={{ width: '100%' }}>
      <Tabs items={items} defaultActiveKey="bids" size="large" />
    </div>
  )
}
