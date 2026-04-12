import { useState } from 'react'
import { Button, Tabs, Card, List, Flex, Tag, Typography, Pagination, Spin, Empty, Alert, App, Modal, Form, Input, InputNumber } from 'antd'
import { EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

import {
  useSellerDirectShipOrders,
  useConfirmSellerOrder,
  useMarkOrderPickedUp,
  useMarkOrderOnDelivering,
  useMarkOrderDelivered,
  useCreateSellerDirectShipment,
} from '@/features/order/api'
import { useSelfShip, useBookOutbound } from '@/features/warehouse/api'
import type { SelfShipRequest, BookOutboundRequest } from '@/features/warehouse/api'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { OrderStatus } from '@/types/enums'
import type { OrderDto } from '@/types'
import { SANS_FONT, SERIF_FONT } from '@/styles/tokens'

/**
 * Seller direct-ship orders page.
 *
 * Dedicated to the seller fulfillment workflow for orders the seller
 * ships themselves (not warehouse-managed). Uses its own endpoint so
 * it never shares cache/filtering with the buyer `MyOrdersPage`.
 *
 * Actions:
 *   paid       → "Confirm Order" (POST /orders/{id}/confirm) → processing
 *   processing → "Create Shipment" (opens self-ship modal)   → shipped (via shipment events)
 *   shipped+   → read-only "View Detail"
 */
export default function SellerOrdersPage() {
  const { t } = useTranslation(['order', 'common'])
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<'paid' | 'processing' | 'picked_up' | 'on_delivering' | 'all'>('paid')
  const [shipModalOrder, setShipModalOrder] = useState<OrderDto | null>(null)
  const [bookModalOrder, setBookModalOrder] = useState<OrderDto | null>(null)
  const [shipForm] = Form.useForm<SelfShipRequest>()
  const [bookForm] = Form.useForm<BookOutboundRequest>()

  const { data, isLoading } = useSellerDirectShipOrders(
    { pageNumber: page, pageSize },
    { refetchInterval: 30000 },
  )

  const confirmMutation = useConfirmSellerOrder()
  const selfShipMutation = useSelfShip()
  const bookOutboundMutation = useBookOutbound()
  const markPickedUp = useMarkOrderPickedUp()
  const markOnDelivering = useMarkOrderOnDelivering()
  const markDelivered = useMarkOrderDelivered()
  const createDirectShipment = useCreateSellerDirectShipment()

  const advance = async (
    order: OrderDto,
    mutation: ReturnType<typeof useMarkOrderPickedUp>,
    successKey: string,
  ) => {
    try {
      await mutation.mutateAsync({ orderId: order.id })
      message.success(t(successKey, successKey))
    } catch (err) {
      message.error((err as Error)?.message ?? t('genericError', 'Something went wrong'))
    }
  }

  // Client-side status filter — BE returns paid+processing; we narrow on the UI.
  const rawOrders = data?.items ?? []
  const orders = statusFilter === 'all'
    ? rawOrders
    : rawOrders.filter((o) => o.status === statusFilter)

  const handleConfirm = (order: OrderDto) => {
    if (!order.shipping?.isStructured) {
      message.warning(t('shippingNotStructuredWarn', 'Buyer has not provided a valid shipping address yet.'))
      return
    }
    confirmMutation.mutate(
      { orderId: order.id },
      {
        onSuccess: () => message.success(t('orderConfirmed', 'Order confirmed')),
        onError: () => message.error(t('orderConfirmFailed', 'Failed to confirm order')),
      },
    )
  }

  const handleBookOutboundSubmit = async () => {
    if (!bookModalOrder) return
    try {
      const values = await bookForm.validateFields()
      await bookOutboundMutation.mutateAsync(values)
      message.success(t('shipmentBooked', 'Outbound shipment booked'))
      setBookModalOrder(null)
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        message.error(detail ?? t('shipmentFailed', 'Failed to create shipment'))
      }
    }
  }

  const handleViewShipment = (order: OrderDto) => {
    // Navigate directly to the seller-safe shipment detail page when we
    // know the shipmentId; otherwise fall back to the list.
    const shipmentId = order.sellerFulfillment?.outboundShipmentId
    if (shipmentId) {
      navigate(`/seller/warehouse/outbound/${shipmentId}`)
    } else {
      navigate('/seller/warehouse/outbound')
    }
  }

  const handleShipSubmit = async () => {
    if (!shipModalOrder) return
    try {
      const values = await shipForm.validateFields()
      // weightGrams is required client + server side; form validation guarantees >0
      // but we also enforce a floor in the request payload so we never send 0/undefined.
      const weightGrams = values.weightGrams && values.weightGrams > 0 ? values.weightGrams : 500
      await selfShipMutation.mutateAsync({
        orderId: shipModalOrder.id,
        externalCarrierName: values.externalCarrierName.trim(),
        carrierTrackingNumber: values.carrierTrackingNumber.trim(),
        weightGrams,
        insuranceValue: values.insuranceValue ?? undefined,
        shippingMethod: values.shippingMethod?.trim() || undefined,
      })
      message.success(t('shipmentCreated', 'Shipment created'))
      setShipModalOrder(null)
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        message.error(detail ?? t('shipmentFailed', 'Failed to create shipment'))
      }
    }
  }

  const renderSlaBadge = (order: OrderDto) => {
    const sf = order.sellerFulfillment
    if (sf?.fulfillmentFlow !== 'seller_self_ship' || !sf.shipByAt) return null
    const isOverdue = sf.isShippingOverdue || dayjs().isAfter(dayjs(sf.shipByAt))
    if (isOverdue) {
      return <Tag color="red">{t('sla.overdue', 'Quá hạn')}</Tag>
    }
    const daysLeft = dayjs(sf.shipByAt).diff(dayjs(), 'day')
    return (
      <Tag color={daysLeft <= 1 ? 'orange' : 'default'}>
        {t('sla.remainingDays', '{{count}} ngày còn lại', { count: daysLeft })}
      </Tag>
    )
  }

  const renderOrderCard = (order: OrderDto) => {
    const shipping = order.shipping
    const hasValidShipping = shipping?.isStructured === true

    return (
      <Card
        key={order.id}
        style={{ borderRadius: 10, marginBottom: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Flex vertical gap={12}>
          {/* Product */}
          {order.item && <OrderItemSummary item={order.item} variant="row" linkToAuction />}

          {/* Recipient */}
          {shipping && hasValidShipping ? (
            <div
              style={{
                background: 'var(--color-bg-surface)',
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: SANS_FONT,
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {shipping.recipientName} · {shipping.phoneNumber}
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>{shipping.composedAddress}</div>
            </div>
          ) : (
            <Alert
              type="warning"
              showIcon
              message={t('shippingNotProvided', 'Buyer has not provided a valid shipping address yet.')}
            />
          )}

          {/* Direct shipment context line */}
          {order.directShipment && (
            <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              {order.directShipment.shipmentIdDisplay}
              {order.directShipment.internalTrackingCode && (
                <> · {order.directShipment.internalTrackingCode}</>
              )}
            </Typography.Text>
          )}

          {/* Meta row + actions */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Flex gap={8} align="center">
              <StatusBadge status={order.status} />
              {renderSlaBadge(order)}
              <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {order.orderNumber}
              </Typography.Text>
            </Flex>
            <Flex gap={8} wrap="wrap">
              {order.status === OrderStatus.Paid && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={confirmMutation.isPending && confirmMutation.variables?.orderId === order.id}
                  disabled={!hasValidShipping}
                  onClick={() => handleConfirm(order)}
                >
                  {t('confirmOrder', 'Confirm Order')}
                </Button>
              )}
              {order.status === OrderStatus.Processing && order.sellerFulfillment?.hasActiveOutboundShipment && (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewShipment(order)}
                >
                  {t('viewShipment', 'View Shipment')}
                </Button>
              )}
              {/* Legacy "Ship to Buyer" CTA is retired for the self-ship flow.
                  Self-ship sellers now use the manual progression buttons
                  (Confirm Picked Up → Confirm On Delivering → Mark Delivered)
                  below; outbound shipments are only used by the warehouse
                  fulfillment path. This block is intentionally left empty
                  to avoid rendering two competing CTAs in Processing. */}
              {order.status === OrderStatus.Processing &&
                !order.sellerFulfillment?.hasActiveOutboundShipment &&
                order.sellerFulfillment?.warehouseStaffMustBookOutbound && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('awaitingWarehouseOutbound', 'Awaiting warehouse outbound')}
                </Typography.Text>
              )}
              {/* Seller self-ship: single "Open Shipment" button when a
                  directShipment exists (all progression lives on the
                  dedicated shipment detail page). When no directShipment
                  exists yet, offer "Create Shipment" which auto-navigates
                  post-create. */}
              {(() => {
                const sf = order.sellerFulfillment
                if (sf?.fulfillmentFlow !== 'seller_self_ship') return null
                const ds = order.directShipment
                const useNewFlow = !!ds || !sf.outboundShipmentId
                if (!useNewFlow) return null

                if (ds) {
                  // Progression now happens on the shipment detail page;
                  // render only a single primary CTA so the list row stays
                  // focused on context + quick navigation.
                  return null
                }

                if (order.status === OrderStatus.Processing) {
                  return (
                    <Button
                      type="primary"
                      disabled={!hasValidShipping}
                      loading={createDirectShipment.isPending && createDirectShipment.variables?.orderId === order.id}
                      onClick={async () => {
                        try {
                          const created = await createDirectShipment.mutateAsync({ orderId: order.id })
                          message.success(t('directShipment.createShipmentSuccess', 'Shipment created'))
                          navigate(`/seller/shipments/${created.id}`)
                        } catch (e) {
                          message.error((e as Error)?.message ?? t('genericError', 'Something went wrong'))
                        }
                      }}
                    >
                      {t('directShipment.createShipment', 'Create Shipment')}
                    </Button>
                  )
                }
                return null
              })()}
              {/* Legacy self-ship progression (outbound-based) — only for
                  orders that already have a legacy outboundShipmentId and no
                  directShipment. New self-ship flow above supersedes this. */}
              {order.sellerFulfillment?.fulfillmentFlow === 'seller_self_ship' &&
                !order.directShipment &&
                !!order.sellerFulfillment?.outboundShipmentId &&
                order.status === OrderStatus.Processing && (
                <Button
                  type="primary"
                  loading={markPickedUp.isPending && markPickedUp.variables?.orderId === order.id}
                  onClick={() => advance(order, markPickedUp, 'sellerActions.confirmPickedUp')}
                >
                  {t('sellerActions.confirmPickedUp', 'Confirm Picked Up')}
                </Button>
              )}
              {order.sellerFulfillment?.fulfillmentFlow === 'seller_self_ship' &&
                !order.directShipment &&
                !!order.sellerFulfillment?.outboundShipmentId &&
                order.status === OrderStatus.PickedUp && (
                <Button
                  type="primary"
                  loading={markOnDelivering.isPending && markOnDelivering.variables?.orderId === order.id}
                  onClick={() => advance(order, markOnDelivering, 'sellerActions.confirmOnDelivering')}
                >
                  {t('sellerActions.confirmOnDelivering', 'Confirm On Delivering')}
                </Button>
              )}
              {order.sellerFulfillment?.fulfillmentFlow === 'seller_self_ship' &&
                !order.directShipment &&
                !!order.sellerFulfillment?.outboundShipmentId &&
                (order.status === OrderStatus.OnDelivering || order.status === OrderStatus.Shipped) && (
                <Button
                  type="primary"
                  loading={markDelivered.isPending && markDelivered.variables?.orderId === order.id}
                  onClick={() => advance(order, markDelivered, 'sellerActions.markDelivered')}
                >
                  {t('sellerActions.markDelivered', 'Mark Delivered')}
                </Button>
              )}
              {order.directShipment && (
                <>
                  <Button
                    icon={<EyeOutlined />}
                    type="primary"
                    onClick={() => navigate(`/seller/shipments/${order.directShipment!.id}`)}
                  >
                    {t('directShipment.openShipment', 'Open Shipment')}
                  </Button>
                  <Button type="link" onClick={() => navigate('/seller/shipments')}>
                    {t('directShipment.viewAllShipments', 'View all shipments')}
                  </Button>
                </>
              )}
              <Button
                icon={<EyeOutlined />}
                onClick={() => navigate(`/seller/orders/${order.id}`)}
              >
                {t('viewDetail', 'View Detail')}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, marginBottom: 16 }}>
        {t('sellerOrders', 'Seller Orders')}
      </h1>

      <Tabs
        activeKey={statusFilter}
        onChange={(k) => { setStatusFilter(k as typeof statusFilter); setPage(1) }}
        items={[
          { key: 'paid', label: <span><Tag color="gold">{t('statusPaid', 'Paid')}</Tag></span> },
          { key: 'processing', label: <span><Tag color="blue">{t('statusProcessing', 'Processing')}</Tag></span> },
          { key: 'picked_up', label: <span><Tag color="cyan">{t('statusPickedUp', 'Picked Up')}</Tag></span> },
          { key: 'on_delivering', label: <span><Tag color="geekblue">{t('statusOnDelivering', 'On Delivering')}</Tag></span> },
          { key: 'all', label: t('all', 'All') },
        ]}
        style={{ marginBottom: 16 }}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>
      ) : orders.length === 0 ? (
        <Empty description={t('noOrders', 'No orders')} />
      ) : (
        <List dataSource={orders} renderItem={renderOrderCard} split={false} />
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <Pagination
          current={data?.metadata?.currentPage ?? page}
          pageSize={data?.metadata?.pageSize ?? pageSize}
          total={data?.metadata?.totalCount ?? 0}
          onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
          showSizeChanger
        />
      </div>

      {/* Self-ship modal */}
      <Modal
        title={t('createShipment', 'Create Shipment')}
        open={shipModalOrder !== null}
        onCancel={() => setShipModalOrder(null)}
        onOk={handleShipSubmit}
        confirmLoading={selfShipMutation.isPending}
        okText={t('createShipment', 'Create Shipment')}
        cancelText={tc('action.cancel', 'Cancel')}
      >
        {shipModalOrder?.item && (
          <div style={{ marginBottom: 16 }}>
            <OrderItemSummary item={shipModalOrder.item} variant="row" />
          </div>
        )}
        <Form form={shipForm} layout="vertical">
          <Form.Item
            name="externalCarrierName"
            label={t('carrierName', 'Carrier Name')}
            rules={[{ required: true, whitespace: true, message: t('carrierRequired', 'Carrier name is required') }]}
          >
            <Input placeholder={t('carrierPlaceholder', 'GHTK / Viettel Post / ...')} />
          </Form.Item>
          <Form.Item
            name="carrierTrackingNumber"
            label={t('trackingNumber', 'Tracking Number')}
            rules={[{ required: true, whitespace: true, message: t('trackingRequired', 'Tracking number is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="weightGrams"
            label={t('weightGrams', 'Weight (grams)')}
            rules={[
              { required: true, message: t('weightRequired', 'Package weight is required') },
              { type: 'number', min: 1, message: t('weightMinInvalid', 'Weight must be greater than 0') },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder={t('weightPlaceholder', '500')} />
          </Form.Item>
          <Form.Item name="shippingMethod" label={t('shippingMethod', 'Shipping Method (optional)')}>
            <Input placeholder={t('shippingMethodPlaceholder', 'standard / express')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Book outbound modal (warehouse-stored items) */}
      <Modal
        title={t('bookOutbound', 'Book Outbound Shipment')}
        open={bookModalOrder !== null}
        onCancel={() => setBookModalOrder(null)}
        onOk={handleBookOutboundSubmit}
        confirmLoading={bookOutboundMutation.isPending}
        okText={t('bookOutbound', 'Book Outbound Shipment')}
        cancelText={tc('action.cancel', 'Cancel')}
        width={640}
      >
        {bookModalOrder?.item && (
          <div style={{ marginBottom: 16 }}>
            <OrderItemSummary item={bookModalOrder.item} variant="row" />
          </div>
        )}
        <Form form={bookForm} layout="vertical">
          {/* Hidden system fields */}
          <Form.Item name="orderId" hidden><Input /></Form.Item>
          <Form.Item name="warehouseItemId" hidden><Input /></Form.Item>
          <Form.Item name="itemName" hidden><Input /></Form.Item>
          <Form.Item name="itemPrice" hidden><InputNumber /></Form.Item>

          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('recipient', 'Recipient')}
          </Typography.Text>
          <Form.Item
            name="recipientName"
            label={t('recipientName', 'Name')}
            rules={[{ required: true, whitespace: true }]}
          ><Input /></Form.Item>
          <Form.Item
            name="recipientPhone"
            label={t('phone', 'Phone')}
            rules={[{ required: true, whitespace: true }]}
          ><Input /></Form.Item>
          <Form.Item
            name="recipientAddress"
            label={t('streetAddress', 'Street')}
            rules={[{ required: true, whitespace: true }]}
          ><Input /></Form.Item>
          <Flex gap={12} wrap="wrap">
            <Form.Item
              name="recipientWard"
              label={t('ward', 'Ward')}
              style={{ flex: '1 1 160px' }}
              rules={[{ required: true, whitespace: true }]}
            ><Input /></Form.Item>
            <Form.Item
              name="recipientDistrict"
              label={t('district', 'District')}
              style={{ flex: '1 1 160px' }}
              rules={[{ required: true, whitespace: true }]}
            ><Input /></Form.Item>
            <Form.Item
              name="recipientProvince"
              label={t('province', 'Province/City')}
              style={{ flex: '1 1 160px' }}
              rules={[{ required: true, whitespace: true }]}
            ><Input /></Form.Item>
          </Flex>

          <Typography.Text strong style={{ display: 'block', margin: '12px 0 8px' }}>
            {t('package', 'Package')}
          </Typography.Text>
          <Flex gap={12} wrap="wrap">
            <Form.Item
              name="weightGrams"
              label={t('weightGrams', 'Weight (g)')}
              style={{ flex: '1 1 140px' }}
              rules={[{ required: true, type: 'number', min: 1 }]}
            ><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
            <Form.Item
              name="insuranceValue"
              label={t('insuranceValue', 'Insurance')}
              style={{ flex: '1 1 140px' }}
              rules={[{ required: true, type: 'number', min: 0 }]}
            ><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item
              name="codAmount"
              label={t('codAmount', 'COD')}
              style={{ flex: '1 1 140px' }}
              rules={[{ required: true, type: 'number', min: 0 }]}
            ><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
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
