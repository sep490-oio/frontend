import { useState, useEffect } from 'react'
import {
  Alert,
  App,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  Input,
  Modal,
  Radio,
  Space,
  Tag,
  Timeline,
  Tooltip,
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
import {
  shortId,
  type MonitoringEvidenceRef,
} from '@/features/admin/utils/parseAlertPayload'
import { getMonitoringAlertView } from '@/features/admin/utils/monitoringAlertView'
import { useBreakpoint } from '@/hooks/useBreakpoint'
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

type ResolveOutcome = 'valid' | 'false_positive' | 'no_action'

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
  const { isMobile } = useBreakpoint()

  const [ackNotes, setAckNotes] = useState('')
  const [resolveReason, setResolveReason] = useState('')
  const [resolveOutcome, setResolveOutcome] = useState<ResolveOutcome>('valid')
  const [showAckInput, setShowAckInput] = useState(false)
  const [showResolveInput, setShowResolveInput] = useState(false)

  const acknowledgeAlert = useAcknowledgeAlert()
  const resolveAlert = useResolveAlert()

  useEffect(() => {
    setAckNotes('')
    setResolveReason('')
    setResolveOutcome('valid')
    setShowAckInput(false)
    setShowResolveInput(false)
  }, [alert?.id])

  if (!alert) return null

  const severityStyle = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE[AlertSeverity.Low]
  const alertView = getMonitoringAlertView(alert)
  const entityRouteFn = ENTITY_ROUTES[alert.entityType?.toLowerCase()]
  const participantRefs = alertView.evidenceRefs.filter((ref) => ref.group === 'participants')
  const detectionRefs = alertView.evidenceRefs.filter((ref) => ref.group === 'evidence')
  const relatedRefs = alertView.evidenceRefs.filter((ref) => ref.group === 'related' && ref.value !== alert.entityId)
  const hasEvidenceRefs = participantRefs.length > 0 || detectionRefs.length > 0 || relatedRefs.length > 0
  const resolveIgnored = resolveOutcome === 'false_positive'
  const reasonMissing = !resolveReason.trim()
  const isHighRisk = alert.severity === AlertSeverity.Critical || alert.severity === AlertSeverity.High

  const outcomeLabel = (outcome: ResolveOutcome) => {
    if (outcome === 'false_positive') return t('monitoring.outcomeIgnoredFalsePositive')
    if (outcome === 'no_action') return t('monitoring.outcomeNoAction')
    return t('monitoring.outcomeResolvedValid')
  }

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert.mutateAsync({ id: alert.id, notes: ackNotes.trim() || undefined })
      message.success(t('monitoring.acknowledgeSuccess'))
      setAckNotes('')
      setShowAckInput(false)
      onClose()
    } catch {
      message.error(t('monitoring.genericError'))
    }
  }

  const submitResolve = async () => {
    if (reasonMissing) {
      message.warning(t('monitoring.reasonRequiredWarn'))
      return
    }

    const resolutionOutcome = resolveOutcome === 'false_positive'
      ? 'false_positive'
      : resolveOutcome === 'no_action'
        ? 'no_action_needed'
        : 'valid_risk'
    try {
      await resolveAlert.mutateAsync({
        id: alert.id,
        ignored: resolveIgnored,
        resolutionOutcome,
        resolutionReason: resolveReason.trim(),
      })
      message.success(t('monitoring.resolveSuccess'))
      setResolveReason('')
      setResolveOutcome('valid')
      setShowResolveInput(false)
      onClose()
    } catch {
      message.error(t('monitoring.genericError'))
    }
  }

  const handleResolve = () => {
    if (isHighRisk) {
      Modal.confirm({
        title: t('monitoring.confirmResolveTitle'),
        content: (
          <div>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {t('monitoring.confirmResolveBody', { severity: tc(`statusLabel.${alert.severity}`) })}
            </Typography.Paragraph>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('monitoring.confirmResolveOutcomeNote', { outcome: outcomeLabel(resolveOutcome) })}
            </Typography.Text>
          </div>
        ),
        okText: t('monitoring.confirmResolveOk'),
        cancelText: tc('common.cancel'),
        okButtonProps: { danger: true },
        onOk: submitResolve,
      })
      return
    }
    void submitResolve()
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
                  {t('monitoringDrawer.by')} {alert.acknowledgedBy} - {formatDateTime(alert.acknowledgedAt!)}
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
                  {t('monitoringDrawer.by')} {alert.resolvedBy} - {formatDateTime(alert.resolvedAt!)}
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
        <Flex align="center" gap={8} wrap="wrap">
          {severityStyle.icon}
          <span>{alertView.title}</span>
          <Tag color={severityStyle.color} style={{ marginLeft: 4 }}>
            {tc(`statusLabel.${alert.severity}`)}
          </Tag>
        </Flex>
      }
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 640}
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <SectionTitle>{t('monitoringDrawer.overview')}</SectionTitle>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t('monitoringDrawer.status')}>
            <StatusBadge status={alert.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('monitoring.severity')}>
            <Tag icon={severityStyle.icon} color={severityStyle.color} style={{ fontWeight: 600 }}>
              {tc(`statusLabel.${alert.severity}`)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('monitoring.score')}>
            {alertView.score === undefined ? '-' : alertView.score}
          </Descriptions.Item>
          {alertView.windowLabel && (
            <Descriptions.Item label={t('monitoringDrawer.window')}>
              {alertView.windowLabel}
            </Descriptions.Item>
          )}
          {alert.assignedTo && (
            <Descriptions.Item label={t('monitoringDrawer.owner')}>
              <Typography.Text copyable={{ text: alert.assignedTo }} style={{ fontSize: 12 }}>
                {shortId(alert.assignedTo)}
              </Typography.Text>
            </Descriptions.Item>
          )}
          {alert.slaDueAt && (
            <Descriptions.Item label={t('monitoringDrawer.slaDueAt')}>
              <Space>
                <Typography.Text style={{ fontSize: 12 }}>
                  {formatDateTime(alert.slaDueAt)}
                </Typography.Text>
                {alert.isOverdue && <Tag color="error">{t('monitoring.overdue')}</Tag>}
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t('monitoringDrawer.alertId')}>
            <Tooltip title={t('monitoringDrawer.alertIdHelp')}>
              <Typography.Text copyable={{ text: alert.id }} style={{ fontSize: 12 }}>
                {alert.id}
              </Typography.Text>
            </Tooltip>
          </Descriptions.Item>
        </Descriptions>

        <SectionTitle>{t('monitoringDrawer.relatedEntity')}</SectionTitle>
        <Descriptions column={1} size="small" bordered>
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
          <Descriptions.Item label={t('monitoringDrawer.primaryEntityId', { type: alert.entityType })}>
            <Tooltip title={t('monitoringDrawer.entityIdHelp')}>
              <Typography.Text copyable={{ text: alert.entityId }} style={{ fontSize: 12 }}>
                {alert.entityId}
              </Typography.Text>
            </Tooltip>
          </Descriptions.Item>
        </Descriptions>

        <Alert
          type="info"
          showIcon
          message={t('monitoringDrawer.idLegendTitle')}
          description={
            <Space direction="vertical" size={2}>
              <Typography.Text style={{ fontSize: 12 }}>{t('monitoringDrawer.idLegendAlert')}</Typography.Text>
              <Typography.Text style={{ fontSize: 12 }}>{t('monitoringDrawer.idLegendEntity')}</Typography.Text>
              <Typography.Text style={{ fontSize: 12 }}>{t('monitoringDrawer.idLegendEvidence')}</Typography.Text>
            </Space>
          }
        />

        <div>
          <SectionTitle>{t('monitoringDrawer.detectionEvidence')}</SectionTitle>
          <EvidenceGroup title={t('monitoringDrawer.primaryEntityGroup')}>
            <PrimaryEntityChip
              entityType={alert.entityType}
              entityId={alert.entityId}
              onNavigate={navigate}
              viewLabel={t('monitoringDrawer.view')}
              description={t('monitoringDrawer.primaryEntityHelp')}
            />
          </EvidenceGroup>
          {hasEvidenceRefs ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {!!participantRefs.length && (
                <EvidenceGroup title={t('monitoringDrawer.participantsGroup')}>
                  {participantRefs.map((ref) => (
                    <EvidenceChip
                      key={`${ref.type}:${ref.value}`}
                      refItem={ref}
                      onNavigate={navigate}
                      viewLabel={t('monitoringDrawer.view')}
                    />
                  ))}
                </EvidenceGroup>
              )}
              {!!detectionRefs.length && (
                <EvidenceGroup title={t('monitoringDrawer.evidenceRecordsGroup')}>
                  {detectionRefs.map((ref) => (
                    <EvidenceChip
                      key={`${ref.type}:${ref.value}`}
                      refItem={ref}
                      onNavigate={navigate}
                      viewLabel={t('monitoringDrawer.view')}
                    />
                  ))}
                </EvidenceGroup>
              )}
              {!!relatedRefs.length && (
                <EvidenceGroup title={t('monitoringDrawer.relatedRecordsGroup')}>
                  {relatedRefs.map((ref) => (
                    <EvidenceChip
                      key={`${ref.type}:${ref.value}`}
                      refItem={ref}
                      onNavigate={navigate}
                      viewLabel={t('monitoringDrawer.view')}
                    />
                  ))}
                </EvidenceGroup>
              )}
            </Space>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('monitoringDrawer.noEvidence')}
              style={{ padding: '12px 0' }}
            />
          )}
        </div>

        <Alert
          type="info"
          showIcon
          message={t('monitoringDrawer.recommendedNextStep')}
          description={alertView.recommendedNextStep}
        />

        {Object.keys(alertView.details).length > 0 && (
          <div>
            <SectionTitle>{t('monitoringDrawer.details')}</SectionTitle>
            <Descriptions column={1} size="small" bordered>
              {Object.entries(alertView.details).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  <Typography.Text style={{ fontSize: 12 }}>{value}</Typography.Text>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}

        {alert.notes && (
          <div>
            <SectionTitle>{t('monitoringDrawer.notes')}</SectionTitle>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
              {alert.notes}
            </Typography.Paragraph>
          </div>
        )}

        <div>
          <SectionTitle>{t('monitoringDrawer.timeline')}</SectionTitle>
          <Timeline items={timelineItems} />
        </div>

        <Divider style={{ margin: '4px 0' }} />
        <SectionTitle>{t('monitoringDrawer.actions')}</SectionTitle>
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
                    <Button onClick={() => setShowAckInput(false)}>{tc('common.cancel')}</Button>
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
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                      {t('monitoring.resolveOutcome')}
                    </Typography.Text>
                    <Radio.Group
                      value={resolveOutcome}
                      onChange={(e) => setResolveOutcome(e.target.value)}
                    >
                      <Space direction="vertical" size={6}>
                        <Radio value="valid">{t('monitoring.outcomeResolvedValid')}</Radio>
                        <Radio value="false_positive">{t('monitoring.outcomeIgnoredFalsePositive')}</Radio>
                        <Radio value="no_action">{t('monitoring.outcomeNoAction')}</Radio>
                      </Space>
                    </Radio.Group>
                  </div>
                  <Input.TextArea
                    rows={3}
                    value={resolveReason}
                    onChange={(e) => setResolveReason(e.target.value)}
                    placeholder={t('monitoring.resolutionReasonRequired')}
                  />
                  {reasonMissing && (
                    <Alert
                      type="warning"
                      showIcon
                      message={t('monitoring.reasonRequiredWarn')}
                    />
                  )}
                  {isHighRisk && (
                    <Alert
                      type="info"
                      showIcon
                      message={t('monitoring.highRiskConfirmHint', { severity: tc(`statusLabel.${alert.severity}`) })}
                    />
                  )}
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={resolveAlert.isPending}
                      disabled={reasonMissing}
                      onClick={handleResolve}
                      style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                    >
                      {t('monitoring.resolve')}
                    </Button>
                    <Button onClick={() => setShowResolveInput(false)}>{tc('common.cancel')}</Button>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
      {children}
    </Typography.Text>
  )
}

function EvidenceGroup({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <Space direction="vertical" size={6} style={{ width: '100%', marginBottom: 10 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {title}
      </Typography.Text>
      <Flex gap={8} wrap="wrap">
        {children}
      </Flex>
    </Space>
  )
}

function EvidenceChip({
  refItem,
  onNavigate,
  viewLabel,
}: {
  refItem: MonitoringEvidenceRef
  onNavigate: (path: string) => void
  viewLabel: string
}) {
  const route = evidenceRoute(refItem)
  return (
    <Tooltip title={refItem.description}>
      <Tag style={{ padding: '4px 8px', margin: 0 }}>
        <Space size={6}>
          <Typography.Text copyable={{ text: refItem.value }} style={{ fontSize: 12 }}>
            {refItem.label}
          </Typography.Text>
          {route && (
            <Tooltip title={viewLabel}>
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => onNavigate(route)}
                style={{ padding: 0, height: 18 }}
              />
            </Tooltip>
          )}
        </Space>
      </Tag>
    </Tooltip>
  )
}

function PrimaryEntityChip({
  entityType,
  entityId,
  onNavigate,
  viewLabel,
  description,
}: {
  entityType: string
  entityId: string
  onNavigate: (path: string) => void
  viewLabel: string
  description: string
}) {
  const routeFn = ENTITY_ROUTES[entityType?.toLowerCase()]
  const route = routeFn?.(entityId)
  return (
    <Tooltip title={description}>
      <Tag color="blue" style={{ padding: '4px 8px', margin: 0 }}>
        <Space size={6}>
          <Typography.Text copyable={{ text: entityId }} style={{ fontSize: 12 }}>
            {entityType} ID: {shortId(entityId)}
          </Typography.Text>
          {route && (
            <Tooltip title={viewLabel}>
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => onNavigate(route)}
                style={{ padding: 0, height: 18 }}
              />
            </Tooltip>
          )}
        </Space>
      </Tag>
    </Tooltip>
  )
}

function evidenceRoute(ref: MonitoringEvidenceRef): string | undefined {
  if (ref.type === 'user') return `/admin/users/${ref.value}`
  if (ref.type === 'auction') return `/admin/auctions/${ref.value}`
  if (ref.type === 'order') return `/admin/orders/${ref.value}`
  return undefined
}
