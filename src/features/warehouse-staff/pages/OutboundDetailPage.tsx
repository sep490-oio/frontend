import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Typography,
  Card,
  Descriptions,
  Button,
  Space,
  Spin,
  Alert,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Avatar,
  Tag,
} from 'antd'
import { ArrowLeftOutlined, SendOutlined, PictureOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { useWarehouseStaffOutboundOrder, useBookOutbound } from '@/features/warehouse/api'
import type { BookOutboundRequest } from '@/features/warehouse/api'
import { SANS_FONT, SERIF_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

export default function OutboundDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')

  // Real single-order detail fetch (avoids re-paging the entire queue).
  const { data: item, isLoading } = useWarehouseStaffOutboundOrder(orderId)

  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [bookForm] = Form.useForm<BookOutboundRequest>()
  const bookOutboundMutation = useBookOutbound()

  const openBookModal = () => {
    if (!item) return
    bookForm.resetFields()
    bookForm.setFieldsValue({
      orderId: item.orderId,
      warehouseItemId: item.warehouseItemId,
      itemName: item.itemTitle,
      itemPrice: 0,
      recipientName: item.buyerRecipientName ?? '',
      recipientPhone: '',
      recipientAddress: item.buyerShippingAddress ?? '',
      recipientWard: '',
      recipientDistrict: '',
      recipientProvince: '',
      weightGrams: 500,
      insuranceValue: 0,
      codAmount: 0,
    } as BookOutboundRequest)
    setBookModalOpen(true)
  }

  const handleBookSubmit = async () => {
    try {
      const values = await bookForm.validateFields()
      await bookOutboundMutation.mutateAsync(values)
      message.success(t('bookSuccess', 'Outbound shipment booked'))
      setBookModalOpen(false)
      // No warehouse-staff outbound shipment detail page exists; the
      // /seller/warehouse/outbound/:id route is gated by SellerGuard and is
      // not reachable from this layout. Return to the queue instead.
      navigate('/warehouse-staff/outbound')
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        message.error(detail ?? t('bookError', 'Failed to book shipment'))
      }
    }
  }

  const handleBack = () => {
    navigate('/warehouse-staff/outbound')
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!item) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('staffOutboundQueue.back', 'Back')}
          </Button>
        </Space>
        <Alert
          type="warning"
          showIcon
          message={t('staffOutboundQueue.empty', 'Order not found in outbound queue')}
          description={t('staffOutboundQueue.notFound', 'This order may have already been shipped or is not in the outbound queue.')}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {t('staffOutboundQueue.back', 'Back')}
        </Button>
      </Space>

      <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, marginBottom: 24 }}>
        {t('staffOutboundQueue.title', 'Outbound Queue')}
      </h1>

      {/* Item summary card */}
      <Card style={{ marginBottom: 16 }}>
        <Flex align="center" gap={16}>
          <Avatar
            shape="square"
            size={80}
            src={item.itemPrimaryImageUrl ?? undefined}
            icon={!item.itemPrimaryImageUrl ? <PictureOutlined /> : undefined}
            style={{ borderRadius: 8, flexShrink: 0 }}
          />
          <div>
            <Typography.Title level={4} style={{ margin: 0, fontFamily: SANS_FONT }}>
              {item.itemTitle}
            </Typography.Title>
            {item.sellerDisplayName && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {t('staffOutboundQueue.columns.seller', 'Seller')}: {item.sellerDisplayName}
              </Typography.Text>
            )}
          </div>
        </Flex>
      </Card>

      {/* Order details */}
      <Card title={t('shipmentDetails', 'Order Details')} style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label={t('staffOutboundQueue.columns.orderNumber', 'Order')}>
            <Typography.Text style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {item.orderNumber}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('staffOutboundQueue.columns.status', 'Status')}>
            <Tag>{item.orderStatus}</Tag>
          </Descriptions.Item>
          {item.orderPaidAt && (
            <Descriptions.Item label={t('staffOutboundQueue.columns.paidAt', 'Paid At')}>
              {formatDateTime(item.orderPaidAt)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Buyer shipping info */}
      <Card title={t('recipient', 'Recipient / Buyer')} style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: SANS_FONT, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {item.buyerRecipientName ?? '—'}
          </div>
          {item.buyerShippingAddress && (
            <div style={{ color: 'var(--color-text-secondary)' }}>
              {item.buyerShippingAddress}
            </div>
          )}
        </div>
      </Card>

      {/* CTA */}
      <Flex justify="flex-end">
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={openBookModal}
        >
          {t('staffOutboundQueue.bookOutbound', 'Book Outbound')}
        </Button>
      </Flex>

      {/* Book Outbound Modal */}
      <Modal
        title={t('staffOutboundQueue.bookOutbound', 'Book Outbound Shipment')}
        open={bookModalOpen}
        onCancel={() => setBookModalOpen(false)}
        onOk={handleBookSubmit}
        confirmLoading={bookOutboundMutation.isPending}
        okText={t('staffOutboundQueue.bookOutbound', 'Book Outbound Shipment')}
        width={640}
      >
        <div style={{ marginBottom: 12, fontFamily: SANS_FONT, fontSize: 13 }}>
          <strong>{item.itemTitle}</strong>
        </div>
        <Form form={bookForm} layout="vertical">
          <Form.Item name="orderId" hidden><Input /></Form.Item>
          <Form.Item name="warehouseItemId" hidden><Input /></Form.Item>
          <Form.Item name="itemName" hidden><Input /></Form.Item>
          <Form.Item name="itemPrice" hidden><InputNumber /></Form.Item>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('recipient', 'Recipient')}
          </Typography.Text>
          <Form.Item name="recipientName" label={t('recipientName', 'Name')} rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="recipientPhone" label={t('phone', 'Phone')} rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="recipientAddress" label={t('streetAddress', 'Street')} rules={[{ required: true, whitespace: true }]}>
            <Input />
          </Form.Item>
          <Flex gap={12} wrap="wrap">
            <Form.Item name="recipientWard" label={t('ward', 'Ward')} style={{ flex: '1 1 160px' }} rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="recipientDistrict" label={t('district', 'District')} style={{ flex: '1 1 160px' }} rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="recipientProvince" label={t('province', 'Province/City')} style={{ flex: '1 1 160px' }} rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Flex>

          <Typography.Text strong style={{ display: 'block', margin: '12px 0 8px' }}>
            {t('package', 'Package')}
          </Typography.Text>
          <Flex gap={12} wrap="wrap">
            <Form.Item name="weightGrams" label={t('weightGrams', 'Weight (g)')} style={{ flex: '1 1 140px' }} rules={[{ required: true, type: 'number', min: 1 }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="insuranceValue" label={t('insuranceValue', 'Insurance')} style={{ flex: '1 1 140px' }} rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="codAmount" label={t('codAmount', 'COD')} style={{ flex: '1 1 140px' }} rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Flex>
          <Flex gap={12} wrap="wrap">
            <Form.Item name="lengthCm" label={t('lengthCm', 'Length (cm)')} style={{ flex: '1 1 120px' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="widthCm" label={t('widthCm', 'Width (cm)')} style={{ flex: '1 1 120px' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="heightCm" label={t('heightCm', 'Height (cm)')} style={{ flex: '1 1 120px' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Flex>
        </Form>
      </Modal>
    </div>
  )
}
