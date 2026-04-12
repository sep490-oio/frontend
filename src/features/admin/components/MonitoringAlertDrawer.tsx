import { useState, useEffect } from 'react'
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Flex,
  Input,
  Space,
  Switch,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAcknowledgeAlert, useResolveAlert } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import { parseAlertPayload, formatAlertType } from '@/features/admin/utils/parseAlertPayload'
import type { MonitoringAlertDto } from '@/types'

const SEVERITY_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  [AlertSeverity.Low]: { color: '#52c41a', icon: <CheckCircleOutlined /> },
  [AlertSeverity.Medium]: { color: '#faad14', icon: <ExclamationCircleOutlined /> },
  [AlertSeverity.High]: { color: '#ff4d4f', icon: <WarningOutlined /> },
  [AlertSeverity.Critical]: { color: 'var(--color-danger)', icon: <FireOutlined /> },
}

const ENTITY_ROUTES: Partial<Record<string, (id: string) => string>> = {
  user: (id) => `/admin/users/${id}`,
  auction: (id) => `/admin/auctions/${id}`,
  order: (id) => `/admin/orders/${id}`,
  inbound_shipment: (id) => `/admin/warehouse/inbound/${id}`,
}

interface MonitoringAlertDrawerProps {
  alert: MonitoringAlertDto | null
  open: boolean
  onClose: () => void
}

export function MonitoringAlertDrawer({ alert, open, onClose }: MonitoringAlertDrawerProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [ackNotes, setAckNotes] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveIgnored, setResolveIgnored] = useState(false)
  const [showAckInput, setShowAckInput] = useState(false)
  const [showResolveInput, setShowResolveInput] = useState(false)

  const acknowledgeAlert = useAcknowledgeAlert()
  const resolveAlert = useResolveAlert()

  useEffect(() => {
    setAckNotes('')
    setResolveNotes('')
    setResolveIgnored(false)
    setShowAckInput(false)
    setShowResolveInput(false)
  }, [alert?.id])

  if (!alert) return null

  const severityStyle = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE[AlertSeverity.Low]
  const parsed = parseAlertPayload(alert.alertType, alert.payload)
  const entityRouteFn = ENTITY_ROUTES[alert.entityType?.toLowerCase()]

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert.mutateAsync({ id: alert.id, notes: ackNotes || undefined })
      message.success(t('monitoring.acknowledgeSuccess'))
      setAckNotes('')
      setShowAckInput(false)
      onClose()
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleResolve = async () => {
    try {
      await resolveAlert.mutateAsync({ id: alert.id, ignored: resolveIgnored, notes: resolveNotes || undefined })
      message.success(t('monitoring.resolveSuccess'))
      setResolveNotes('')
      setResolveIgnored(false)
      setShowResolveInput(false)
      onClose()
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleNavigateToEntity = () => {
    if (entityRouteFn) {
      navigate(entityRouteFn(alert.entityId))
      onClose()
    }
  }

  const timelineItems = [
    {
      color: '#1677ff',
      children: (
        <div>
          <Typography.Text strong>{t('monitoringDrawer.created')}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatDateTime(alert.createdAt)}
          </Typography.Text>
        </div>
      ),
    },
    ...(alert.acknowledgedBy
      ? [
          {
            color: '#faad14',
            children: (
              <div>
                <Typography.Text strong>{t('monitoringDrawer.acknowledged')}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('monitoringDrawer.by')} {alert.acknowledgedBy} — {formatDateTime(alert.acknowledgedAt!)}
                </Typography.Text>
              </div>
            ),
          },
        ]
      : []),
    ...(alert.resolvedBy
      ? [
          {
            color: '#52c41a',
            children: (
              <div>
                <Typography.Text strong>{t('monitoringDrawer.resolved')}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('monitoringDrawer.by')} {alert.resolvedBy} — {formatDateTime(alert.resolvedAt!)}
                </Typography.Text>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          {severityStyle.icon}
          <span>{formatAlertType(alert.alertType)}</span>
          <Tag color={severityStyle.color} style={{ marginLeft: 4 }}>
            {tc(`statusLabel.${alert.severity}`)}
          </Tag>
        </Flex>
      }
      open={open}
      onClose={onClose}
      width={480}
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        {/* Status */}
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t('monitoringDrawer.status')}>
            <StatusBadge status={alert.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('monitoringDrawer.entity')}>
            <Space>
              <Typography.Text>{alert.entityType}</Typography.Text>
              {entityRouteFn && (
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={handleNavigateToEntity}
                  style={{ padding: 0 }}
                >
                  {t('monitoringDrawer.view')}
                </Button>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('monitoringDrawer.entityId')}>
            <Typography.Text copyable style={{ fontSize: 12 }}>
              {alert.entityId}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Parsed Payload */}
        {Object.keys(parsed.details).length > 0 && (
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('monitoringDrawer.details')}
            </Typography.Text>
            <Descriptions column={1} size="small" bordered>
              {Object.entries(parsed.details).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  <Typography.Text style={{ fontSize: 12 }}>{value}</Typography.Text>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}

        {/* Notes */}
        {alert.notes && (
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
              {t('monitoringDrawer.notes')}
            </Typography.Text>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
              {alert.notes}
            </Typography.Paragraph>
          </div>
        )}

        {/* Timeline */}
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('monitoringDrawer.timeline')}
          </Typography.Text>
          <Timeline items={timelineItems} />
        </div>

        {/* Actions */}
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {alert.status === AlertStatus.Open && (
            <>
              {showAckInput ? (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Input.TextArea
                    rows={2}
                    value={ackNotes}
                    onChange={(e) => setAckNotes(e.target.value)}
                    placeholder={t('monitoring.notesOptional')}
                  />
                  <Space>
                    <Button
                      type="primary"
                      icon={<BellOutlined />}
                      loading={acknowledgeAlert.isPending}
                      onClick={handleAcknowledge}
                    >
                      {t('monitoring.confirmAcknowledge')}
                    </Button>
                    <Button onClick={() => setShowAckInput(false)}>{t('common.cancel')}</Button>
                  </Space>
                </Space>
              ) : (
                <Button icon={<BellOutlined />} onClick={() => setShowAckInput(true)}>
                  {t('monitoring.acknowledge')}
                </Button>
              )}
            </>
          )}

          {(alert.status === AlertStatus.Open || alert.status === AlertStatus.Acknowledged) && (
            <>
              {showResolveInput ? (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Flex align="center" gap={8}>
                    <Switch
                      checked={resolveIgnored}
                      onChange={(v) => setResolveIgnored(v)}
                      size="small"
                    />
                    <Typography.Text style={{ fontSize: 13 }}>
                      {t('monitoring.markAsIgnored')}
                    </Typography.Text>
                  </Flex>
                  <Input.TextArea
                    rows={2}
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder={t('monitoring.resolutionNotesOptional')}
                  />
                  <Space>
                    <Button
                      type="primary"
                      danger={resolveIgnored}
                      icon={<CheckCircleOutlined />}
                      loading={resolveAlert.isPending}
                      onClick={handleResolve}
                      style={
                        resolveIgnored
                          ? undefined
                          : { background: 'var(--color-success)', borderColor: 'var(--color-success)' }
                      }
                    >
                      {resolveIgnored ? t('monitoring.ignore') : t('monitoring.resolve')}
                    </Button>
                    <Button onClick={() => setShowResolveInput(false)}>{t('common.cancel')}</Button>
                  </Space>
                </Space>
              ) : (
                <Button
                  icon={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
                  onClick={() => setShowResolveInput(true)}
                >
                  {t('monitoring.resolve')}
                </Button>
              )}
            </>
          )}
        </Space>
      </Space>
    </Drawer>
  )
}
