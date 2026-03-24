import {
  Typography,
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  Empty,
  Timeline,
  App,
  Row,
  Col,
} from 'antd'
import { ArrowLeftOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useInboundShipmentById,
  useCancelInbound,
} from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ShipmentStatus } from '@/types/enums'
import { formatCurrency, formatDateTime } from '@/utils/format'

export default function InboundDetailPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()

  const { data: shipment, isLoading } = useInboundShipmentById(id ?? '')
  const cancelInbound = useCancelInbound()

  const handleCancel = async () => {
    if (!id) return
    try {
      await cancelInbound.mutateAsync(id)
      message.success(t('cancelSuccess', 'Shipment cancelled'))
    } catch {
      message.error(t('cancelError', 'Failed to cancel shipment'))
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!shipment) {
    return <Empty description={t('shipmentNotFound', 'Shipment not found')} />
  }

  const canCancel = shipment.status === ShipmentStatus.Pending || shipment.status === ShipmentStatus.Confirmed

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/seller/warehouse/inbound')}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('inboundDetail', 'Inbound Shipment Detail')}
        </Typography.Title>
        <StatusBadge status={shipment.status} />
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          {/* Shipment Info */}
          <Card title={t('shipmentInfo', 'Shipment Information')} style={{ marginBottom: 16 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={t('clientOrderCode', 'Order Code')}>
                {shipment.clientOrderCode}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusBadge status={shipment.status} />
              </Descriptions.Item>
              <Descriptions.Item label={t('provider', 'Provider')}>
                {shipment.providerCode}
              </Descriptions.Item>
              <Descriptions.Item label={t('shipmentMode', 'Mode')}>
                {shipment.shipmentMode}
              </Descriptions.Item>
              <Descriptions.Item label={t('shippingFee', 'Shipping Fee')}>
                {formatCurrency(shipment.shippingFee)}
              </Descriptions.Item>
              <Descriptions.Item label={t('insuranceValue', 'Insurance')}>
                {formatCurrency(shipment.insuranceValue)}
              </Descriptions.Item>
              {shipment.carrierTrackingNumber && (
                <Descriptions.Item label={t('trackingNumber', 'Tracking Number')} span={2}>
                  {shipment.carrierTrackingNumber}
                </Descriptions.Item>
              )}
              {shipment.expectedArrivalAt && (
                <Descriptions.Item label={t('expectedArrival', 'Expected Arrival')}>
                  {formatDateTime(shipment.expectedArrivalAt)}
                </Descriptions.Item>
              )}
              {shipment.arrivedAt && (
                <Descriptions.Item label={t('arrivedAt', 'Arrived')}>
                  {formatDateTime(shipment.arrivedAt)}
                </Descriptions.Item>
              )}
              {shipment.notes && (
                <Descriptions.Item label={t('notes', 'Notes')} span={2}>
                  {shipment.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Sender Info */}
          <Card title={t('senderInfo', 'Sender Information')} style={{ marginBottom: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={t('senderName', 'Name')}>
                {shipment.senderName}
              </Descriptions.Item>
              <Descriptions.Item label={t('senderPhone', 'Phone')}>
                {shipment.senderPhone}
              </Descriptions.Item>
              <Descriptions.Item label={t('senderAddress', 'Address')}>
                {shipment.senderAddress}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Dimensions */}
          <Card title={t('dimensions', 'Package Dimensions')} style={{ marginBottom: 16 }}>
            <Descriptions bordered column={{ xs: 2, sm: 4 }} size="small">
              <Descriptions.Item label={t('weight', 'Weight')}>
                {shipment.weightGrams}g
              </Descriptions.Item>
              {shipment.lengthCm != null && (
                <Descriptions.Item label={t('length', 'Length')}>
                  {shipment.lengthCm}cm
                </Descriptions.Item>
              )}
              {shipment.widthCm != null && (
                <Descriptions.Item label={t('width', 'Width')}>
                  {shipment.widthCm}cm
                </Descriptions.Item>
              )}
              {shipment.heightCm != null && (
                <Descriptions.Item label={t('height', 'Height')}>
                  {shipment.heightCm}cm
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Tracking Timeline */}
          <Card title={t('trackingTimeline', 'Tracking Timeline')}>
            {shipment.trackingEvents.length > 0 ? (
              <Timeline
                items={shipment.trackingEvents.map((event) => ({
                  children: (
                    <div>
                      <Typography.Text strong>
                        <StatusBadge status={event.status} size="small" />
                      </Typography.Text>
                      {event.location && (
                        <Typography.Text type="secondary"> - {event.location}</Typography.Text>
                      )}
                      <br />
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(event.timestamp)}
                      </Typography.Text>
                      {event.notes && (
                        <>
                          <br />
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {event.notes}
                          </Typography.Text>
                        </>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <Typography.Text type="secondary">
                {t('noTrackingEvents', 'No tracking events yet')}
              </Typography.Text>
            )}
          </Card>
        </Col>

        {/* Right Column: Actions */}
        <Col xs={24} md={8}>
          <Card title={tc('actions', 'Actions')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {canCancel && (
                <Button block danger icon={<CloseCircleOutlined />} onClick={handleCancel} loading={cancelInbound.isPending}>
                  {t('cancelShipment', 'Cancel Shipment')}
                </Button>
              )}
              {!canCancel && (
                <Typography.Text type="secondary">
                  {t('noActions', 'No actions available for this shipment status')}
                </Typography.Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
