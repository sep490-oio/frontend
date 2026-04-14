import { Row, Col, Card, Statistic, Button, Typography, Grid } from 'antd'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInboundShipments, useWarehouseStaffOutboundQueue } from '@/features/warehouse/api'

const { useBreakpoint } = Grid

export default function WarehouseStaffDashboardPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const { data: awaitingPickup } = useInboundShipments({ status: 'awaiting_pickup', pageSize: 1 })
  const { data: inTransit } = useInboundShipments({ status: 'in_transit', pageSize: 1 })
  const { data: arrived } = useInboundShipments({ status: 'arrived', pageSize: 1 })
  const { data: completed } = useInboundShipments({ status: 'completed', pageSize: 1 })
  const { data: outboundQueue } = useWarehouseStaffOutboundQueue({ pageSize: 1 })

  const statCards = [
    {
      key: 'awaitingPickup',
      title: t('dashboard.awaitingPickup', 'Awaiting Pickup'),
      value: awaitingPickup?.metadata?.totalCount ?? 0,
      onClick: undefined,
    },
    {
      key: 'inTransit',
      title: t('dashboard.inTransit', 'In Transit'),
      value: inTransit?.metadata?.totalCount ?? 0,
      onClick: undefined,
    },
    {
      key: 'arrived',
      title: t('dashboard.arrived', 'Arrived'),
      value: arrived?.metadata?.totalCount ?? 0,
      onClick: undefined,
    },
    {
      key: 'completed',
      title: t('dashboard.completed', 'Completed'),
      value: completed?.metadata?.totalCount ?? 0,
      onClick: undefined,
    },
    {
      key: 'outbound',
      title: t('dashboard.awaitingOutbound', 'Orders Awaiting Outbound'),
      value: outboundQueue?.metadata?.totalCount ?? 0,
      onClick: () => navigate('/warehouse-staff/outbound'),
      hoverable: true,
    },
  ]

  return (
    <div style={{ paddingBottom: isMobile ? 32 : 0 }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>
        {t('dashboard.title', 'Warehouse Dashboard')}
      </Typography.Title>

      {/* Stat cards: 2-col grid on mobile, 4-col on desktop */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {statCards.map((stat) => (
          <Col key={stat.key} xs={12} sm={12} md={6}>
            <Card
              hoverable={stat.hoverable}
              onClick={stat.onClick}
              style={{
                cursor: stat.onClick ? 'pointer' : 'default',
                height: '100%',
                borderRadius: 10,
              }}
              bodyStyle={{ padding: isMobile ? '16px 14px' : '20px 24px' }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: isMobile ? 12 : 14, lineHeight: 1.4 }}>
                    {stat.title}
                  </span>
                }
                value={stat.value}
                valueStyle={{ fontSize: isMobile ? 26 : 30, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Button
        type="primary"
        size={isMobile ? 'large' : 'middle'}
        block={isMobile}
        style={{ minHeight: 44 }}
        onClick={() => navigate('/warehouse-staff/receiving')}
      >
        {t('dashboard.goToReceiving', 'Go to Receiving')}
      </Button>
    </div>
  )
}