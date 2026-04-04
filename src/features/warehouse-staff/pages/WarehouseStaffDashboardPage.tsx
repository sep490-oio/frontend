import { Row, Col, Card, Statistic, Button, Typography } from 'antd'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInboundShipments } from '@/features/warehouse/api'

export default function WarehouseStaffDashboardPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()

  const { data: awaitingPickup } = useInboundShipments({ status: 'awaiting_pickup', pageSize: 1 })
  const { data: inTransit } = useInboundShipments({ status: 'in_transit', pageSize: 1 })
  const { data: arrived } = useInboundShipments({ status: 'arrived', pageSize: 1 })
  const { data: completed } = useInboundShipments({ status: 'completed', pageSize: 1 })

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {t('dashboard.title', 'Warehouse Dashboard')}
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.awaitingPickup', 'Awaiting Pickup')}
              value={awaitingPickup?.metadata?.totalCount ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.inTransit', 'In Transit')}
              value={inTransit?.metadata?.totalCount ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.arrived', 'Arrived')}
              value={arrived?.metadata?.totalCount ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.completed', 'Completed')}
              value={completed?.metadata?.totalCount ?? 0}
            />
          </Card>
        </Col>
      </Row>

      <Button type="primary" onClick={() => navigate('/warehouse-staff/receiving')}>
        {t('dashboard.goToReceiving', 'Go to Receiving')}
      </Button>
    </div>
  )
}
