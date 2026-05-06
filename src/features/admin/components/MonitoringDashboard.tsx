import { useMemo } from 'react'
import { Card, Col, Row, Statistic } from 'antd'
import { FireOutlined, WarningOutlined, BellOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import type { MonitoringAlertDto } from '@/types'

interface MonitoringDashboardProps {
  alerts: MonitoringAlertDto[]
  loading?: boolean
}

export function MonitoringDashboard({ alerts, loading = false }: MonitoringDashboardProps) {
  const { t } = useTranslation('admin')
  const stats = useMemo(() => {
    const open = alerts.filter((a) => a.status === AlertStatus.Open).length
    const critical = alerts.filter(
      (a) => a.severity === AlertSeverity.Critical && a.status === AlertStatus.Open
    ).length
    const unacknowledged = alerts.filter((a) => a.status === AlertStatus.Open && !a.acknowledgedBy).length
    return { open, critical, unacknowledged }
  }, [alerts])

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <Card size="small" loading={loading} style={{ borderLeft: '3px solid #1677ff' }}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>{t('monitoring.stats.openAlerts', 'Open Alerts')}</span>}
            value={stats.open}
            valueStyle={{
              color: stats.open > 0 ? '#1677ff' : 'var(--color-text-primary)',
              fontSize: 28,
              fontWeight: 700,
            }}
            prefix={<WarningOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card size="small" loading={loading} style={{ borderLeft: '3px solid #ff4d4f' }}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>{t('monitoring.stats.critical', 'Critical')}</span>}
            value={stats.critical}
            valueStyle={{
              color: stats.critical > 0 ? '#ff4d4f' : 'var(--color-text-primary)',
              fontSize: 28,
              fontWeight: 700,
            }}
            prefix={<FireOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card size="small" loading={loading} style={{ borderLeft: '3px solid #fa8c16' }}>
          <Statistic
            title={<span style={{ fontSize: 12 }}>{t('monitoring.stats.unacknowledged', 'Unacknowledged')}</span>}
            value={stats.unacknowledged}
            valueStyle={{
              color: stats.unacknowledged > 0 ? '#fa8c16' : 'var(--color-text-primary)',
              fontSize: 28,
              fontWeight: 700,
            }}
            prefix={<BellOutlined />}
          />
        </Card>
      </Col>
    </Row>
  )
}
