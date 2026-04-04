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
import { useAcknowledgeAlert, useResolveAlert } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { AlertSeverity, AlertStatus } from '@/types/enums'
import { parseAlertPayload, formatAlertType } from '@/features/admin/utils/parseAlertPayload'
import type { MonitoringAlertDto } from '@/types'

const SEVERITY_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  [AlertSeverity.Low]: { color: '#52c41a', icon: <CheckCircleOutlined />, label: 'Low' },
  [AlertSeverity.Medium]: { color: '#faad14', icon: <ExclamationCircleOutlined />, label: 'Medium' },
  [AlertSeverity.High]: { color: '#ff4d4f', icon: <WarningOutlined />, label: 'High' },
  [AlertSeverity.Critical]: { color: 'var(--color-danger)', icon: <FireOutlined />, label: 'Critical' },
}

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
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

  const severityCfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG[AlertSeverity.Low]
  const parsed = parseAlertPayload(alert.alertType, alert.payload)
  const entityRouteFn = ENTITY_ROUTES[alert.entityType?.toLowerCase()]

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert.mutateAsync({ id: alert.id, notes: ackNotes || undefined })
      message.success('Alert acknowledged')
      setAckNotes('')
      setShowAckInput(false)
      onClose()
    } catch {
      message.error('An error occurred')
    }
  }

  const handleResolve = async () => {
    try {
      await resolveAlert.mutateAsync({ id: alert.id, ignored: resolveIgnored, notes: resolveNotes || undefined })
      message.success('Alert resolved')
      setResolveNotes('')
      setResolveIgnored(false)
      setShowResolveInput(false)
      onClose()
    } catch {
      message.error('An error occurred')
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
          <Typography.Text strong>Created</Typography.Text>
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
                <Typography.Text strong>Acknowledged</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  by {alert.acknowledgedBy} — {formatDateTime(alert.acknowledgedAt!)}
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
                <Typography.Text strong>Resolved</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  by {alert.resolvedBy} — {formatDateTime(alert.resolvedAt!)}
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
          {severityCfg.icon}
          <span>{formatAlertType(alert.alertType)}</span>
          <Tag color={severityCfg.color} style={{ marginLeft: 4 }}>
            {severityCfg.label}
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
          <Descriptions.Item label="Status">
            <StatusBadge status={alert.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Entity">
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
                  View
                </Button>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Entity ID">
            <Typography.Text copyable style={{ fontSize: 12 }}>
              {alert.entityId}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Parsed Payload */}
        {Object.keys(parsed.details).length > 0 && (
          <div>
            <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
              Details
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
              Notes
            </Typography.Text>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
              {alert.notes}
            </Typography.Paragraph>
          </div>
        )}

        {/* Timeline */}
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            Timeline
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
                    placeholder="Notes (optional)"
                  />
                  <Space>
                    <Button
                      type="primary"
                      icon={<BellOutlined />}
                      loading={acknowledgeAlert.isPending}
                      onClick={handleAcknowledge}
                    >
                      Confirm Acknowledge
                    </Button>
                    <Button onClick={() => setShowAckInput(false)}>Cancel</Button>
                  </Space>
                </Space>
              ) : (
                <Button icon={<BellOutlined />} onClick={() => setShowAckInput(true)}>
                  Acknowledge
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
                      Mark as ignored (false positive)
                    </Typography.Text>
                  </Flex>
                  <Input.TextArea
                    rows={2}
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Resolution notes (optional)"
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
                      {resolveIgnored ? 'Ignore' : 'Resolve'}
                    </Button>
                    <Button onClick={() => setShowResolveInput(false)}>Cancel</Button>
                  </Space>
                </Space>
              ) : (
                <Button
                  icon={<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />}
                  onClick={() => setShowResolveInput(true)}
                >
                  Resolve
                </Button>
              )}
            </>
          )}
        </Space>
      </Space>
    </Drawer>
  )
}
