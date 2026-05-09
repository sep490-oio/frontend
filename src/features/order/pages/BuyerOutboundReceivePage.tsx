import { useParams, useSearchParams, Navigate } from 'react-router'
import {
  Card,
  Typography,
  Skeleton,
  Alert,
  Button,
  Space,
  Descriptions,
  Row,
  Col,
  App,
  Image,
  Result,
} from 'antd'
import {
  ArrowLeftOutlined,
  PictureOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  useBuyerOutboundShipmentByToken,
  useSubmitReceiptProof,
} from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BuyerReceiptEvidenceSection } from '@/components/ui/BuyerReceiptEvidenceSection'
import { formatDateTime } from '@/utils/format'
import { useAppSelector } from '@/app/store'
import type { EvidencePhotoDto } from '@/types'

dayjs.extend(relativeTime)

function EvidenceGallery({ title, photos }: { title: string; photos: EvidencePhotoDto[] }) {
  const filtered = photos.filter((p) => p.url)
  if (!filtered.length) return null
  return (
    <Card title={title} size="small" style={{ marginBottom: 0 }}>
      <Image.PreviewGroup>
        <Space wrap>
          {filtered.map((p) => (
            <Image
              key={p.id}
              src={p.url}
              alt={title}
              width={80}
              height={80}
              style={{ objectFit: 'cover', borderRadius: 6 }}
            />
          ))}
        </Space>
      </Image.PreviewGroup>
    </Card>
  )
}

export default function BuyerOutboundReceivePage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const { t } = useTranslation(['order', 'common'])
  const { message } = App.useApp()

  const isAuthenticated = useAppSelector((s) => !!s.auth?.accessToken)

  const { data, isLoading, error } = useBuyerOutboundShipmentByToken(token)
  const submitReceiptProof = useSubmitReceiptProof()

  if (!isAuthenticated) {
    const returnTo = `/orders/${orderId}/outbound-shipment/receive?token=${encodeURIComponent(token)}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 12px' }}>
        <Alert
          type="error"
          showIcon
          message={t('order:buyerOutboundReceive.missingToken', 'Missing shipment token.')}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 12px' }}>
        <Card><Skeleton active /></Card>
      </div>
    )
  }

  if (error || !data) {
    const detail = (error as { response?: { data?: { detail?: string; title?: string } } })?.response?.data
    return (
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 12px' }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common:action.back', 'Back')}
          </Button>
        </Space>
        <Alert
          type="error"
          showIcon
          message={
            detail?.detail ??
            detail?.title ??
            t('order:buyerOutboundReceive.invalid', 'This shipment link is invalid or has expired.')
          }
        />
      </div>
    )
  }

  // State B — proof already submitted
  if (data.hasBuyerReceiptProof) {
    return (
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 12px' }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('common:action.back', 'Back')}
          </Button>
        </Space>
        <Card>
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title={t('order:buyerOutboundReceive.proofConfirmed', "You've confirmed receipt of this parcel")}
            extra={
              <Button
                type="primary"
                onClick={() => navigate(`/me/orders/${data.orderId}`)}
              >
                {t('order:buyerOutboundReceive.openDeliveryActions', 'Open Delivery Actions')}
              </Button>
            }
          />
          {data.buyerReceiptPhotos.filter((p) => p.url).length > 0 && (
            <EvidenceGallery
              title={t('order:buyerOutboundReceive.receiptPhotos', 'Your receipt photos')}
              photos={data.buyerReceiptPhotos}
            />
          )}
        </Card>
      </div>
    )
  }

  // State A — before proof
  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 12px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('common:action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        {t('order:buyerOutboundShipment.title', 'Shipment Details')}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {data.orderNumber}
      </Typography.Text>

      <Row gutter={[16, 16]}>
        {/* Shipment context card */}
        <Col xs={24}>
          <Card>
            <Space align="start" size={12} style={{ width: '100%' }}>
              {data.itemPrimaryImageUrl ? (
                <img
                  src={data.itemPrimaryImageUrl}
                  alt={data.itemTitle ?? ''}
                  style={{ width: 96, height: 96, borderRadius: 8, objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 8,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#bbb',
                    fontSize: 32,
                  }}
                >
                  <PictureOutlined />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 16 }}>
                  {data.itemTitle ?? '\u2014'}
                </Typography.Text>
                <div style={{ marginTop: 6 }}>
                  <StatusBadge status={data.status} />
                </div>
              </div>
            </Space>
            <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
              {data.clientOrderCode && (
                <Descriptions.Item
                  label={t('order:buyerOutboundReceive.internalTracking', 'Internal tracking')}
                >
                  <Typography.Text copyable style={{ fontFamily: 'monospace' }}>
                    {data.clientOrderCode}
                  </Typography.Text>
                </Descriptions.Item>
              )}
              {data.carrierTrackingNumber && (
                <Descriptions.Item
                  label={t('order:buyerOutboundReceive.tracking', 'Carrier tracking')}
                >
                  {data.carrierTrackingNumber}
                </Descriptions.Item>
              )}
              {data.externalCarrierName && (
                <Descriptions.Item
                  label={t('order:buyerOutboundReceive.carrier', 'Carrier')}
                >
                  {data.externalCarrierName}
                </Descriptions.Item>
              )}
              {data.dispatchedAt && (
                <Descriptions.Item
                  label={t('order:buyerOutboundReceive.dispatchedAt', 'Dispatched')}
                >
                  {formatDateTime(data.dispatchedAt)}
                </Descriptions.Item>
              )}
              {data.deliveredAt && (
                <Descriptions.Item
                  label={t('order:buyerOutboundReceive.deliveredAt', 'Delivered')}
                >
                  {formatDateTime(data.deliveredAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Staff evidence galleries */}
        {data.packagePhotos.filter((p) => p.url).length > 0 && (
          <Col xs={24}>
            <EvidenceGallery
              title={t('order:buyerOutboundShipment.packagePhotos', 'Package photos')}
              photos={data.packagePhotos}
            />
          </Col>
        )}
        {data.handoverPhotos.filter((p) => p.url).length > 0 && (
          <Col xs={24}>
            <EvidenceGallery
              title={t('order:buyerOutboundShipment.handoverPhotos', 'Handover photos')}
              photos={data.handoverPhotos}
            />
          </Col>
        )}

        {/* Receipt evidence submission */}
        <Col xs={24}>
          <BuyerReceiptEvidenceSection
            existingPhotos={data.buyerReceiptPhotos}
            hasSubmittedProof={false}
            submitting={submitReceiptProof.isPending}
            onSubmit={async (ids) => {
              await submitReceiptProof.mutateAsync({
                shipmentId: data.shipmentId,
                orderId: data.orderId,
                receiptPhotoMediaUploadIds: ids,
              })
              message.success(t('order:buyerOutboundReceive.receiptConfirmed', 'Receipt confirmed'))
              navigate(`/me/orders/${data.orderId}`)
            }}
          />
        </Col>
      </Row>
    </div>
  )
}
