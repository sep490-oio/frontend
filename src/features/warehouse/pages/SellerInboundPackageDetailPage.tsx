import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Typography,
  Card,
  Row,
  Col,
  Space,
  Button,
  Descriptions,
  List,
  Image,
  Tag,
  Spin,
  Alert,
  Popconfirm,
  Modal,
  Form,
  Input,
  App,
  QRCode,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import {
  useInboundPackage,
  useCancelInboundPackage,
  useSetInboundPackageTracking,
  useUpdateInboundPackageExternalStatus,
} from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { formatCurrency, formatDateTime } from '@/utils/format'

const TERMINAL_DISPLAY_STATUSES = new Set(['cancelled', 'stored', 'inspected'])

export default function SellerInboundPackageDetailPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { clientOrderCode = '' } = useParams<{ clientOrderCode: string }>()
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const { data, isLoading, isError } = useInboundPackage(clientOrderCode)
  const cancelPkg = useCancelInboundPackage()
  const setTracking = useSetInboundPackageTracking()
  const advanceStatus = useUpdateInboundPackageExternalStatus()

  const [trackingOpen, setTrackingOpen] = useState(false)
  const [trackingForm] = Form.useForm<{ trackingNumber: string }>()

  if (isLoading) return <Spin style={{ display: 'block', padding: 48 }} />
  if (isError || !data) {
    return (
      <Alert
        type="error"
        showIcon
        message={t('packageNotFound', 'Package not found')}
      />
    )
  }

  const isExternal = data.shipmentMode === 'external_carrier'
  const isTerminal = TERMINAL_DISPLAY_STATUSES.has(data.displayStatus)
  const cancelable =
    data.canCancelPackage &&
    !isTerminal &&
    data.items.every((i) => i.inboundStatus !== 'completed' && i.inboundStatus !== 'cancelled' && i.inboundStatus !== 'failed')
  // External-carrier seller transport actions are driven by package displayStatus:
  //   awaiting_pickup → Mark In Transit   (status: 'in_transit')
  //   in_transit      → Report Arrived at Warehouse   (status: 'seller_claims_arrived')
  //   anything beyond → seller cannot update transport; warehouse staff confirms receipt.
  const canMarkInTransit = isExternal && data.displayStatus === 'awaiting_pickup'
  const canReportArrived = isExternal && data.displayStatus === 'in_transit'

  const onCancel = async () => {
    try {
      await cancelPkg.mutateAsync({ clientOrderCode, reason: 'Seller cancelled package' })
      message.success(t('packageCancelled', 'Package cancelled'))
      navigate(`${prefix}/warehouse/inbound`)
    } catch {
      message.error(t('packageCancelFailed', 'Failed to cancel package'))
    }
  }

  const onSubmitTracking = async () => {
    try {
      const values = await trackingForm.validateFields()
      await setTracking.mutateAsync({ clientOrderCode, trackingNumber: values.trackingNumber })
      message.success(t('trackingUpdated', 'Tracking number saved'))
      setTrackingOpen(false)
      trackingForm.resetFields()
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return
      message.error(t('trackingUpdateFailed', 'Failed to save tracking number'))
    }
  }

  const onMarkInTransit = async () => {
    try {
      await advanceStatus.mutateAsync({ clientOrderCode, status: 'in_transit' })
      message.success(t('packageMarkedInTransit', 'Package is now in transit'))
    } catch {
      message.error(t('statusAdvanceFailed', 'Failed to update status'))
    }
  }

  const onReportArrived = async () => {
    try {
      await advanceStatus.mutateAsync({ clientOrderCode, status: 'seller_claims_arrived' })
      message.success(
        t('packageReportedArrived', 'Arrival reported — warehouse staff will confirm receipt'),
      )
    } catch {
      message.error(t('statusAdvanceFailed', 'Failed to update status'))
    }
  }

  const senderAddressParts = [
    data.senderAddress,
    data.senderWard,
    data.senderDistrict,
    data.senderProvince,
  ].filter(Boolean)

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/warehouse/inbound`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Flex align="center" justify="space-between" wrap="wrap" gap={8} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={0}>
          <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
            {t('inboundPackage', 'Inbound Package')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 12 : 14 }}>{data.clientOrderCode}</Typography.Text>
        </Space>
        <StatusBadge status={data.displayStatus} />
      </Flex>

      {/* Seller Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          {cancelable && (
            <Popconfirm
              title={t('confirmCancelPackage', 'Cancel this whole package?')}
              onConfirm={onCancel}
              okText={tc('action.confirm', 'Confirm')}
              cancelText={tc('action.cancel', 'Cancel')}
            >
              <Button danger loading={cancelPkg.isPending}>
                {t('cancelPackage', 'Cancel Package')}
              </Button>
            </Popconfirm>
          )}
          {canMarkInTransit && (
            <Button onClick={() => setTrackingOpen(true)}>
              {t('setTracking', 'Set Tracking')}
            </Button>
          )}
          {canMarkInTransit && (
            <Button type="primary" onClick={onMarkInTransit} loading={advanceStatus.isPending}>
              {t('markInTransit', 'Mark In Transit')}
            </Button>
          )}
          {canReportArrived && (
            <Button type="primary" onClick={onReportArrived} loading={advanceStatus.isPending}>
              {t('reportArrivedAtWarehouse', 'Report Arrived at Warehouse')}
            </Button>
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* QR Code on top for mobile */}
        {isMobile && (
          <Col span={24}>
            <Card title={t('packageQr', 'Package QR')}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <QRCode value={data.packageQrToken || data.clientOrderCode} size={160} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('scanAtWarehouse', 'Scan at warehouse')}
                </Typography.Text>
              </Space>
            </Card>
          </Col>
        )}
        <Col xs={24} md={16}>
          {/* Summary */}
          <Card title={t('packageSummary', 'Summary')} style={{ marginBottom: 16 }}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={t('clientOrderCode', 'Package Code')}>
                {data.clientOrderCode}
              </Descriptions.Item>
              <Descriptions.Item label={t('tracking', 'Tracking')}>
                {data.carrierTrackingNumber || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('provider', 'Provider')}>
                {getProviderLabel(data.providerCode)}
              </Descriptions.Item>
              <Descriptions.Item label={t('shipmentMode', 'Mode')}>
                {data.shipmentMode}
              </Descriptions.Item>
              {data.externalCarrierName && (
                <Descriptions.Item label={t('externalCarrierName', 'Carrier')}>
                  {data.externalCarrierName}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('expectedArrivalAt', 'Expected Arrival')}>
                {data.expectedArrivalAt ? formatDateTime(data.expectedArrivalAt) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('created', 'Created')}>
                {formatDateTime(data.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('shippingFee', 'Shipping Fee')}>
                {data.shippingFee != null ? formatCurrency(data.shippingFee) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('itemCount', 'Items')}>
                <Tag color="blue">{data.items.length}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Sender */}
          <Card title={t('senderInfo', 'Sender')} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('senderName', 'Name')}>
                {data.senderName || '—'}
              </Descriptions.Item>
              {data.senderPhone && (
                <Descriptions.Item label={t('senderPhone', 'Phone')}>
                  {data.senderPhone}
                </Descriptions.Item>
              )}
              {senderAddressParts.length > 0 && (
                <Descriptions.Item label={t('senderAddress', 'Address')}>
                  {senderAddressParts.join(', ')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Receipt */}
          {(data.receiptMedia.length > 0 || data.receiptNotes) && (
            <Card title={t('packageReceipt', 'Package Receipt')} style={{ marginBottom: 16 }}>
              {data.receiptMedia.length > 0 && (
                <Image.PreviewGroup>
                  <Space wrap>
                    {data.receiptMedia.map((url) => (
                      <Image key={url} src={url} width={96} height={96} style={{ objectFit: 'cover' }} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              )}
              {data.receiptNotes && (
                <Typography.Paragraph style={{ marginTop: 12 }}>
                  {data.receiptNotes}
                </Typography.Paragraph>
              )}
            </Card>
          )}

          {/* Items */}
          <Card title={t('items', 'Items')}>
            <List
              dataSource={data.items}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.itemImageUrl ? (
                        <Image src={item.itemImageUrl} width={64} height={64} style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 64, height: 64, background: '#f0f0f0' }} />
                      )
                    }
                    title={item.itemTitle ?? item.itemId}
                    description={
                      <Space size="small" wrap>
                        <StatusBadge status={item.inboundStatus} />
                        {item.warehouseItemStatus && <Tag>{item.warehouseItemStatus}</Tag>}
                        {item.storageLocationLabel && <Tag color="green">{item.storageLocationLabel}</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {!isMobile && (
          <Col xs={24} md={8}>
            <Card title={t('packageQr', 'Package QR')}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <QRCode value={data.packageQrToken || data.clientOrderCode} size={180} />
                <Typography.Text type="secondary">
                  {t('scanAtWarehouse', 'Scan at warehouse')}
                </Typography.Text>
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title={t('setTracking', 'Set Tracking')}
        open={trackingOpen}
        onCancel={() => setTrackingOpen(false)}
        onOk={onSubmitTracking}
        confirmLoading={setTracking.isPending}
      >
        <Form form={trackingForm} layout="vertical">
          <Form.Item
            name="trackingNumber"
            label={t('trackingNumber', 'Tracking Number')}
            rules={[{ required: true, message: t('trackingNumberRequired', 'Please enter a tracking number') }]}
          >
            <Input placeholder={t('trackingNumberPlaceholder', 'Enter carrier tracking number')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
