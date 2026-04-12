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

export default function WarehouseItemDetailPage() {
  const { warehouseItemId = '' } = useParams<{ warehouseItemId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t('back', 'Back')}
          </Button>
        </Space>
        <Alert
          type="warning"
          showIcon
          message={t('warehouseItem.notFound', 'Warehouse item not found')}
        />
      </div>
    )
  }

  const hasLocation = Boolean(data.storageLocationId)
  const locationButtonLabel = hasLocation
    ? t('warehouseItem.moveLocation', 'Move location')
    : t('warehouseItem.assignLocation', 'Assign location')

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {msgCtx}
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t('back', 'Back')}
        </Button>
      </Space>

      <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, marginBottom: 24 }}>
        {t('warehouseItem.title', 'Warehouse Item')}
      </h1>

      <Card
        title={t('warehouseItem.actions', 'Actions')}
        style={{ marginBottom: 16 }}
      >
        <Space wrap>
          <Button
            type="primary"
            icon={<EnvironmentOutlined />}
            disabled={data.canAssignOrMoveLocation === false}
            onClick={handleOpenLocationModal}
          >
            {locationButtonLabel}
          </Button>
          {data.canBookOutbound && data.outboundBookingOrderId && (
            <Button
              icon={<SendOutlined />}
              onClick={() =>
                navigate(`/warehouse-staff/outbound/${data.outboundBookingOrderId}`)
              }
            >
              {t('warehouseItem.bookOutbound', 'Book Outbound')}
            </Button>
          )}
          {data.canViewOutboundShipment && data.outboundShipmentId && (
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`/warehouse-staff/outbound/shipments/${data.outboundShipmentId}`)
              }
            >
              {t('warehouseItem.viewOutboundShipment', 'View outbound shipment')}
            </Button>
          )}
        </Space>
      </Card>

      <Modal
        open={locationModalOpen}
        title={t('warehouseItem.pickLocation', 'Pick a storage location')}
        width={720}
        onCancel={() => {
          setLocationModalOpen(false)
          setSelectedLocationId(undefined)
        }}
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

      {/* Card 1: Warehouse Info */}
      <Card title={t('warehouseItem.warehouseInfo', 'Warehouse Info')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={t('warehouseItem.status', 'Status')}>
            <StatusBadge status={data.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('warehouseItem.receivedAt', 'Received At')}>
            {data.receivedAt ? formatDateTime(data.receivedAt) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('warehouseItem.location', 'Storage Location')} span={2}>
            {data.storageLocationLabel ? (
              <Link
                to={`/warehouse-staff/locations${
                  data.storageLocationId ? `?focus=${data.storageLocationId}` : ''
                }`}
              >
                {data.storageLocationLabel}
              </Link>
            ) : (
              '—'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Card 2: Inbound Shipment */}
      <Card title={t('warehouseItem.inboundShipment', 'Inbound Shipment')} style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('warehouseItem.inboundCode', 'Code')}>
            <Link to={`/warehouse-staff/shipments/${data.inboundShipmentId}`}>
              <Typography.Text style={{ fontFamily: 'var(--font-mono)' }}>
                {data.inboundShipmentCode ?? data.inboundShipmentId}
              </Typography.Text>
            </Link>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Card 3: Receiving Media */}
      {data.media.length > 0 && (
        <Card title={t('warehouseItem.receivingMedia', 'Receiving Media')} style={{ marginBottom: 16 }}>
          <Image.PreviewGroup>
            <Flex gap={12} wrap="wrap">
              {data.media.map((m) => (
                <div key={m.id}>
                  <Image
                    src={m.secureUrl}
                    width={140}
                    height={140}
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

      {/* Card 4: Original Item Info */}
      <Card title={t('warehouseItem.originalItem', 'Original Item Info')} style={{ marginBottom: 16 }}>
        <Flex gap={16} wrap="wrap">
          {data.itemImageUrl && (
            <Image
              src={data.itemImageUrl}
              width={160}
              height={160}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 240 }}>
            <Typography.Title level={5} style={{ marginTop: 0, fontFamily: SANS_FONT }}>
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
            <Link to={`/items/${data.itemId}`}>
              <Button size="small">
                {t('warehouseItem.viewItem', 'View item page')}
              </Button>
            </Link>
          </div>
        </Flex>
      </Card>

      {/* Card 5: Seller */}
      <Card title={t('warehouseItem.seller', 'Seller')}>
        <Typography.Text style={{ fontFamily: SANS_FONT, fontSize: 14 }}>
          {data.sellerName ?? '—'}
        </Typography.Text>
      </Card>
    </div>
  )
}
