import { Row, Col, Card, Statistic, Typography, Grid, Divider, Space } from 'antd'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { 
  useInboundShipments, 
  useWarehouseStaffOutboundQueue,
  useWarehouseItems 
} from '@/features/warehouse/api'
import { useStaffPendingReturns } from '@/features/warehouse-staff/api'
import {
  ClockCircleOutlined,
  CarOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  SendOutlined,
  AppstoreOutlined,
  RollbackOutlined,
  ScanOutlined,
  DownloadOutlined
} from '@ant-design/icons'

const { useBreakpoint } = Grid

export default function WarehouseStaffDashboardPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  // Inbound Metrics
  const { data: awaitingPickup } = useInboundShipments({ status: 'awaiting_pickup', pageSize: 1 })
  const { data: inTransit } = useInboundShipments({ status: 'in_transit', pageSize: 1 })
  const { data: arrived } = useInboundShipments({ status: 'arrived', pageSize: 1 })
  const { data: completed } = useInboundShipments({ status: 'completed', pageSize: 1 })
  
  // Outbound & Storage Metrics
  const { data: outboundQueue } = useWarehouseStaffOutboundQueue({ pageSize: 1 })
  const { data: storedItems } = useWarehouseItems({ status: 'stored', pageSize: 1 })
  const { data: pendingReturns } = useStaffPendingReturns({ status: 'pending' })

  const inboundCards = [
    {
      key: 'awaitingPickup',
      title: t('dashboard.awaitingPickup', 'Awaiting Pickup'),
      value: awaitingPickup?.metadata?.totalCount ?? 0,
      icon: <ClockCircleOutlined style={{ color: '#1677ff' }} />,
      onClick: undefined,
    },
    {
      key: 'inTransit',
      title: t('dashboard.inTransit', 'In Transit'),
      value: inTransit?.metadata?.totalCount ?? 0,
      icon: <CarOutlined style={{ color: '#1677ff' }} />,
      onClick: undefined,
    },
    {
      key: 'arrived',
      title: t('dashboard.arrived', 'Arrived'),
      value: arrived?.metadata?.totalCount ?? 0,
      icon: <InboxOutlined style={{ color: '#fa8c16' }} />, // Warning color to highlight pending processing
      onClick: () => navigate('/warehouse-staff/receiving'),
      hoverable: true,
    },
    {
      key: 'completed',
      title: t('dashboard.completed', 'Completed'),
      value: completed?.metadata?.totalCount ?? 0,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      onClick: undefined,
    },
  ]

  const outboundAndStorageCards = [
    {
      key: 'outbound',
      title: t('dashboard.awaitingOutbound', 'Orders Awaiting Outbound'),
      value: outboundQueue?.metadata?.totalCount ?? 0,
      icon: <SendOutlined style={{ color: '#722ed1' }} />,
      onClick: () => navigate('/warehouse-staff/outbound'),
      hoverable: true,
    },
    {
      key: 'storedItems',
      title: t('dashboard.storedItems', 'Stored Items'),
      value: storedItems?.metadata?.totalCount ?? 0,
      icon: <AppstoreOutlined style={{ color: '#13c2c2' }} />,
      onClick: () => navigate('/warehouse-staff/items'),
      hoverable: true,
    },
    {
      key: 'pendingReturns',
      title: t('dashboard.pendingReturns', 'Pending Returns'),
      value: pendingReturns?.length ?? 0,
      icon: <RollbackOutlined style={{ color: '#eb2f96' }} />,
      onClick: () => navigate('/warehouse-staff/returns'),
      hoverable: true,
    },
  ]

  const quickActions = [
    {
      key: 'receiving',
      title: t('dashboard.receiveNewPackage', 'Receive New Package'),
      icon: <DownloadOutlined style={{ fontSize: 24, marginBottom: 8 }} />,
      path: '/warehouse-staff/receiving',
      color: '#1677ff',
    },
    {
      key: 'scan',
      title: t('dashboard.scanAndCheckIn', 'Scan & Check-in'),
      icon: <ScanOutlined style={{ fontSize: 24, marginBottom: 8 }} />,
      path: '/warehouse-staff/scan',
      color: '#52c41a',
    },
    {
      key: 'outbound',
      title: t('dashboard.processOutbound', 'Process Outbound'),
      icon: <SendOutlined style={{ fontSize: 24, marginBottom: 8 }} />,
      path: '/warehouse-staff/outbound',
      color: '#722ed1',
    },
    {
      key: 'returns',
      title: t('dashboard.handleReturns', 'Handle Returns'),
      icon: <RollbackOutlined style={{ fontSize: 24, marginBottom: 8 }} />,
      path: '/warehouse-staff/returns',
      color: '#eb2f96',
    },
  ]

  return (
    <div style={{ paddingBottom: isMobile ? 32 : 0 }}>
      <Typography.Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>
        {t('dashboard.title', 'Warehouse Dashboard')}
      </Typography.Title>

      <Typography.Title level={5} style={{ marginTop: 0, color: '#8c8c8c' }}>
        {t('dashboard.inboundMetrics', 'Inbound Flow')}
      </Typography.Title>
      
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {inboundCards.map((stat) => (
          <Col key={stat.key} xs={12} sm={12} md={6}>
            <Card
              hoverable={stat.hoverable}
              onClick={stat.onClick}
              style={{
                cursor: stat.onClick ? 'pointer' : 'default',
                height: '100%',
                borderRadius: 10,
              }}
              styles={{ body: { padding: isMobile ? '16px 14px' : '20px 24px' } }}
            >
              <Statistic
                title={
                  <Space style={{ fontSize: isMobile ? 12 : 14, lineHeight: 1.4, alignItems: 'center' }}>
                    {stat.icon}
                    <span>{stat.title}</span>
                  </Space>
                }
                value={stat.value}
                valueStyle={{ fontSize: isMobile ? 26 : 30, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Typography.Title level={5} style={{ marginTop: 32, color: '#8c8c8c' }}>
        {t('dashboard.outboundMetrics', 'Outbound & Storage Flow')}
      </Typography.Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 32 }}>
        {outboundAndStorageCards.map((stat) => (
          <Col key={stat.key} xs={12} sm={12} md={8}>
            <Card
              hoverable={stat.hoverable}
              onClick={stat.onClick}
              style={{
                cursor: 'pointer',
                height: '100%',
                borderRadius: 10,
              }}
              styles={{ body: { padding: isMobile ? '16px 14px' : '20px 24px' } }}
            >
              <Statistic
                title={
                  <Space style={{ fontSize: isMobile ? 12 : 14, lineHeight: 1.4, alignItems: 'center' }}>
                    {stat.icon}
                    <span>{stat.title}</span>
                  </Space>
                }
                value={stat.value}
                valueStyle={{ fontSize: isMobile ? 26 : 30, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        {t('dashboard.quickActions', 'Quick Actions')}
      </Typography.Title>

      <Row gutter={[12, 12]}>
        {quickActions.map((action) => (
          <Col key={action.key} xs={12} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate(action.path)}
              style={{
                height: '100%',
                borderRadius: 10,
                textAlign: 'center',
                borderColor: action.color,
                borderWidth: 1,
              }}
              styles={{ body: { padding: isMobile ? '20px 12px' : '24px 16px' } }}
            >
              <div style={{ color: action.color }}>
                {action.icon}
              </div>
              <Typography.Text strong style={{ fontSize: isMobile ? 13 : 15, color: '#262626' }}>
                {action.title}
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
