import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import {
  Typography,
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  Alert,
  Image,
  Tag,
  Flex,
  Modal,
  message,
  Grid,
} from 'antd'
import { ArrowLeftOutlined, SendOutlined, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useWarehouseItemDetail,
  useStorageLocations,
  useStoreWarehouseItem,
} from '@/features/warehouse/api'
import { StorageLocationMap } from '@/features/warehouse-staff/components/StorageLocationMap'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { SANS_FONT, SERIF_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

const { useBreakpoint } = Grid

export default function WarehouseItemDetailPage() {
  const { warehouseItemId = '' } = useParams<{ warehouseItemId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const { data, isLoading } = useWarehouseItemDetail(warehouseItemId)
  const [msgApi, msgCtx] = message.useMessage()
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined)
  const { data: locations, isLoading: locationsLoading } = useStorageLocations({ vacantOnly: true })
  const storeItem = useStoreWarehouseItem()

  const handleOpenLocationModal = () => {
    setSelectedLocationId(data?.storageLocationId ?? undefined)
    setLocationModalOpen(true)
  }

  const handleConfirmLocation = () => {
    if (!selectedLocationId) return
    storeItem.mutate(
      { warehouseItemId, storageLocationId: selectedLocationId },
      {
        onSuccess: () => {
          msgApi.success(t('warehouseItem.locationSaved', 'Storage location saved'))
          setLocationModalOpen(false)
          setSelectedLocationId(undefined)
        },
        onError: () => {
          msgApi.error(t('warehouseItem.locationSaveFailed', 'Could not save location'))
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => { navigate(-1); }} style={{ minHeight: 44 }}>
            {t('back', 'Back')}
          </Button>
        </Space>
        <Alert type="warning" showIcon message={t('warehouseItem.notFound', 'Warehouse item not found')} />
      </div>
    )
  }

  const hasLocation = Boolean(data.storageLocationId)
  const locationButtonLabel = hasLocation
    ? t('warehouseItem.moveLocation', 'Move location')
    : t('warehouseItem.assignLocation', 'Assign location')

  const cardStyle = { marginBottom: 16 }
  const buttonSize = isMobile ? 'large' : 'middle'

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: isMobile ? 32 : 0 }}>
      {msgCtx}

      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => { navigate(-1); }}
          size={buttonSize}
          style={{ minHeight: 44 }}
        >
          {t('back', 'Back')}
        </Button>
      </Space>

      <h1 style={{
        fontFamily: SERIF_FONT, fontWeight: 400,
        fontSize: isMobile ? 22 : 28,
        marginBottom: 20,
      }}>
        {t('warehouseItem.title', 'Warehouse Item')}
      </h1>

      {/* Actions Card */}
      <Card title={t('warehouseItem.actions', 'Actions')} style={cardStyle}>
        <Flex gap={12} vertical={isMobile}>
          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            size={buttonSize}
            block={isMobile}
            disabled={data.canAssignOrMoveLocation === false}
            style={{ minHeight: 44 }}
            onClick={handleOpenLocationModal}
          >
            {locationButtonLabel}
          </Button>
          {data.canBookOutbound && data.outboundBookingOrderId && (
            <Button
              icon={<SendOutlined />}
              size={buttonSize}
              block={isMobile}
              style={{ minHeight: 44 }}
              onClick={() => navigate(`/warehouse-staff/outbound/${data.outboundBookingOrderId}`)}
            >
              {t('warehouseItem.bookOutbound', 'Book Outbound')}
            </Button>
          )}
          {data.canViewOutboundShipment && data.outboundShipmentId && (
            <Button
              icon={<EyeOutlined />}
              size={buttonSize}
              block={isMobile}
              style={{ minHeight: 44 }}
              onClick={() => navigate(`/warehouse-staff/outbound/shipments/${data.outboundShipmentId}`)}
            >
              {t('warehouseItem.viewOutboundShipment', 'View outbound shipment')}
            </Button>
          )}
        </Flex>
      </Card>

      <Modal
        open={locationModalOpen}
        title={t('warehouseItem.pickLocation', 'Pick a storage location')}
        width={isMobile ? '95vw' : 720}
        style={isMobile ? { top: 12 } : undefined}
        onCancel={() => { setLocationModalOpen(false); setSelectedLocationId(undefined) }}
        onOk={handleConfirmLocation}
        okText={t('warehouseItem.saveLocation', 'Save location')}
        okButtonProps={{ disabled: !selectedLocationId, loading: storeItem.isPending }}
      >
        <StorageLocationMap
          locations={locations ?? []}
          selectedId={selectedLocationId}
          onSelect={(id) => setSelectedLocationId(id)}
          loading={locationsLoading}
        />
      </Modal>

      {/* Warehouse Info */}
      <Card title={t('warehouseItem.warehouseInfo', 'Warehouse Info')} style={cardStyle}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('warehouseItem.status', 'Status')}>
            <StatusBadge status={data.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('warehouseItem.receivedAt', 'Received At')}>
            {data.receivedAt ? formatDateTime(data.receivedAt) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('warehouseItem.location', 'Storage Location')}>
            {data.storageLocationLabel ? (
              <Link to={`/warehouse-staff/locations${data.storageLocationId ? `?focus=${data.storageLocationId}` : ''}`}>
                {data.storageLocationLabel}
              </Link>
            ) : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Inbound Shipment */}
      <Card title={t('warehouseItem.inboundShipment', 'Inbound Shipment')} style={cardStyle}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('warehouseItem.inboundCode', 'Code')}>
            <Link to={`/warehouse-staff/shipments/${data.inboundShipmentId}`}>
              <Typography.Text style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 13 : 12 }}>
                {data.inboundShipmentCode ?? data.inboundShipmentId}
              </Typography.Text>
            </Link>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Package Receipt Photos */}
      {(data.receiptPhotos && data.receiptPhotos.length > 0) && (
        <Card title={t('warehouseItem.packageReceiptPhotos', 'Package Receipt Photos')} style={cardStyle}>
          <Image.PreviewGroup>
            <Flex gap={12} wrap="wrap">
              {data.receiptPhotos.map((url, idx) => (
                <div key={idx}>
                  <Image
                    src={url}
                    width={isMobile ? 100 : 140}
                    height={isMobile ? 100 : 140}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                </div>
              ))}
            </Flex>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* Receiving Media */}
      {data.media.length > 0 && (
        <Card title={t('warehouseItem.receivingMedia', 'Receiving Media')} style={cardStyle}>
          <Image.PreviewGroup>
            <Flex gap={12} wrap="wrap">
              {data.media.map((m) => (
                <div key={m.id}>
                  <Image
                    src={m.secureUrl}
                    width={isMobile ? 100 : 140}
                    height={isMobile ? 100 : 140}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                  {m.isPrimary && (
                    <Tag color="green" style={{ marginTop: 4 }}>
                      {t('warehouseItem.primary', 'Primary')}
                    </Tag>
                  )}
                </div>
              ))}
            </Flex>
          </Image.PreviewGroup>
        </Card>
      )}

      {/* Original Item Info */}
      <Card title={t('warehouseItem.originalItem', 'Original Item Info')} style={cardStyle}>
        <Flex gap={16} vertical={isMobile}>
          {data.itemImageUrl && (
            <Image
              src={data.itemImageUrl}
              width={isMobile ? '100%' : 160}
              height={isMobile ? 200 : 160}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Typography.Title level={5} style={{ marginTop: 0, fontFamily: SANS_FONT, fontSize: isMobile ? 15 : 14 }}>
              {data.itemTitle ?? '—'}
            </Typography.Title>
            {data.condition && (
              <Tag style={{ marginBottom: 8 }}>
                {t('warehouseItem.condition', 'Condition')}: {data.condition}
              </Tag>
            )}
            {data.description && (
              <SafeHtmlRenderer html={data.description} style={{ marginTop: 8 }} />
            )}
            <div style={{ marginTop: 12 }}>
              <Link to={`/items/${data.itemId}`}>
                <Button size={buttonSize} style={{ minHeight: 44 }}>
                  {t('warehouseItem.viewItem', 'View item page')}
                </Button>
              </Link>
            </div>
          </div>
        </Flex>
      </Card>

      {/* Seller */}
      <Card title={t('warehouseItem.seller', 'Seller')} style={{ marginBottom: 0 }}>
        <Typography.Text style={{ fontFamily: SANS_FONT, fontSize: isMobile ? 15 : 14 }}>
          {data.sellerName ?? '—'}
        </Typography.Text>
      </Card>
    </div>
  )
}
