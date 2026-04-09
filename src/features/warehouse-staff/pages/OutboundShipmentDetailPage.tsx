import { useParams, useNavigate, Link } from 'react-router'
import {
  Typography,
  Card,
  Button,
  Space,
  Alert,
  Skeleton,
  Row,
  Col,
  Tag,
  Descriptions,
  Timeline,
  Modal,
  App,
  QRCode,
} from 'antd'
import { ArrowLeftOutlined, PictureOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import {
  useStaffOutboundShipment,
  useUpdateExternalOutboundStatus,
} from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const statusButtonType = (status: string): 'primary' | 'default' | 'dashed' => {
  if (status === 'delivered') return 'primary'
  return 'default'
}

const statusButtonDanger = (status: string): boolean => status === 'failed'

export default function OutboundShipmentDetailPage() {
  const { shipmentId = '' } = useParams<{ shipmentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const { data: detail, isLoading, isError } = useStaffOutboundShipment(shipmentId)
  const updateStatus = useUpdateExternalOutboundStatus()

  const handleBack = () => navigate('/warehouse-staff/outbound')

  const handleAction = (status: string) => {
    Modal.confirm({
      title: t(`staffOutboundShipments.confirm.${status}.title`, `Mark as ${status}?`),
      content: t(
        `staffOutboundShipments.confirm.${status}.content`,
        `This will update the shipment status to "${status}". This cannot be undone.`,
      ),
      okText: t('action.confirm', 'Confirm'),
      cancelText: tc('action.cancel', 'Cancel'),
      okButtonProps: { danger: statusButtonDanger(status) },
      onOk: async () => {
        try {
          await updateStatus.mutateAsync({ shipmentId, status })
          message.success(t('staffOutboundShipments.updateSuccess', 'Shipment updated'))
        } catch (err) {
          const detailMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          message.error(detailMsg ?? t('staffOutboundShipments.updateError', 'Failed to update shipment'))
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
        <Card>
          <Skeleton active />
        </Card>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {tc('action.back', 'Back')}
          </Button>
        </Space>
        <Alert
          type="error"
          showIcon
          message={t('staffOutboundShipments.notFound', 'Shipment not found.')}
        />
      </div>
    )
  }

  const isExternal = detail.shipmentMode === 'external_carrier'

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        {t('staffOutboundShipments.detailTitle', 'Outbound Shipment')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {detail.orderNumber}
      </Typography.Text>

      <Row gutter={[16, 16]}>
        {isExternal &&
          detail.status !== 'failed' &&
          detail.status !== 'returned' &&
          detail.status !== 'cancelled' && (
            <Col xs={24}>
              <Card title={t('staffOutboundShipments.qrCard', 'Shipment QR')}>
                {detail.qrPayload && !detail.qrTokenRevokedAt ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <QRCode value={detail.qrPayload} size={200} />
                    </div>
                    <Typography.Paragraph
                      copyable={{ text: detail.qrPayload }}
                      style={{ wordBreak: 'break-all', fontSize: 12, margin: 0 }}
                    >
                      {detail.qrPayload}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t(
                        'staffOutboundShipments.qrCaption',
                        'Have the buyer scan this QR to confirm receipt.',
                      )}
                    </Typography.Text>
                  </Space>
                ) : detail.qrTokenRevokedAt ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={t(
                      'staffOutboundShipments.qrRevoked',
                      `QR revoked at ${formatDateTime(detail.qrTokenRevokedAt)}`,
                    )}
                  />
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    message={t(
                      'staffOutboundShipments.qrLegacyMissing',
                      'QR unavailable for this legacy shipment. It will be regenerated automatically on the next server restart.',
                    )}
                  />
                )}
              </Card>
            </Col>
          )}
        <Col xs={24} md={12}>
          <Card
            title={t('staffOutboundShipments.itemCard', 'Item Summary')}
            styles={{ body: { paddingTop: 12 } }}
          >
            <Space align="start" size={12}>
              {detail.itemPrimaryImageUrl ? (
                <img
                  src={detail.itemPrimaryImageUrl}
                  alt={detail.itemTitle ?? ''}
                  style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 6,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#bbb',
                    fontSize: 28,
                  }}
                >
                  <PictureOutlined />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 15 }}>
                  {detail.itemTitle ?? '—'}
                </Typography.Text>
                {detail.storageLocationLabel && (
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    {t('staffOutboundShipments.storage', 'Storage')}: {detail.storageLocationLabel}
                  </Typography.Text>
                )}
                {detail.warehouseItemId && (
                  <Link
                    to={`/warehouse-staff/items/${detail.warehouseItemId}`}
                    style={{ fontSize: 12 }}
                  >
                    {t('staffOutboundShipments.viewWarehouseItem', 'View warehouse item')}
                  </Link>
                )}
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('staffOutboundShipments.orderCard', 'Order Info')}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('staffOutboundShipments.orderNumber', 'Order')}>
                {detail.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label={t('staffOutboundShipments.status', 'Status')}>
                <StatusBadge status={detail.status} />
              </Descriptions.Item>
              <Descriptions.Item label={t('staffOutboundShipments.shipmentMode', 'Shipment mode')}>
                <Tag color={isExternal ? 'orange' : 'blue'}>
                  {isExternal
                    ? t('staffOutboundShipments.modeExternal', 'External')
                    : t('staffOutboundShipments.modePlatform', 'Platform')}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('staffOutboundShipments.recipientCard', 'Recipient')}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('staffOutboundShipments.recipientName', 'Name')}>
                {detail.recipientName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('staffOutboundShipments.recipientPhone', 'Phone')}>
                {detail.recipientPhone ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('staffOutboundShipments.address', 'Address')}>
                {detail.composedAddress ?? '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('staffOutboundShipments.metadataCard', 'Shipment Details')}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('staffOutboundShipments.provider', 'Provider')}>
                {detail.providerCode}
              </Descriptions.Item>
              {isExternal && (
                <Descriptions.Item label={t('staffOutboundShipments.externalCarrier', 'Carrier')}>
                  {detail.externalCarrierName ?? '—'}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('staffOutboundShipments.tracking', 'Tracking #')}>
                {detail.carrierTrackingNumber ?? '—'}
              </Descriptions.Item>
              {!isExternal && detail.shippingLabelUrl && (
                <Descriptions.Item label={t('staffOutboundShipments.label', 'Shipping label')}>
                  <a href={detail.shippingLabelUrl} target="_blank" rel="noreferrer">
                    {t('staffOutboundShipments.openLabel', 'Open label')}
                  </a>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('staffOutboundShipments.createdAt', 'Created')}>
                {formatDateTime(detail.createdAt)}
              </Descriptions.Item>
              {detail.packedAt && (
                <Descriptions.Item label={t('staffOutboundShipments.packedAt', 'Packed')}>
                  {formatDateTime(detail.packedAt)}
                </Descriptions.Item>
              )}
              {detail.dispatchedAt && (
                <Descriptions.Item label={t('staffOutboundShipments.dispatchedAt', 'Dispatched')}>
                  {formatDateTime(detail.dispatchedAt)}
                </Descriptions.Item>
              )}
              {detail.deliveredAt && (
                <Descriptions.Item label={t('staffOutboundShipments.deliveredAt', 'Delivered')}>
                  {formatDateTime(detail.deliveredAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title={t('staffOutboundShipments.timelineCard', 'Timeline')}>
            {detail.events.length === 0 ? (
              <Typography.Text type="secondary">
                {t('staffOutboundShipments.noEvents', 'No events recorded yet.')}
              </Typography.Text>
            ) : (
              <Timeline
                items={detail.events.map((e) => ({
                  color:
                    e.source === 'carrier'
                      ? 'blue'
                      : e.source === 'manual'
                      ? 'orange'
                      : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{e.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {formatDateTime(e.occurredAt)}
                        {' · '}
                        {e.source}
                      </div>
                      {e.note && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {e.note}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>

        {detail.allowedManualStatuses.length > 0 && (
          <Col xs={24}>
            <Card title={t('staffOutboundShipments.actionsCard', 'Manual Status Actions')}>
              <Typography.Text
                type="secondary"
                style={{ display: 'block', marginBottom: 12, fontSize: 12 }}
              >
                {t(
                  'staffOutboundShipments.actionsHint',
                  'External-carrier shipments are updated manually. Choose the next status.',
                )}
              </Typography.Text>
              <Space wrap>
                {detail.allowedManualStatuses.map((s) => (
                  <Button
                    key={s}
                    type={statusButtonType(s)}
                    danger={statusButtonDanger(s)}
                    loading={updateStatus.isPending}
                    onClick={() => handleAction(s)}
                  >
                    {t(`staffOutboundShipments.actions.${s}`, s)}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
