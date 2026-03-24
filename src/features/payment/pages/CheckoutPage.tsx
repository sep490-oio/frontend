import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Typography,
  Card,
  Button,
  Space,
  Spin,
  Alert,
  Descriptions,
  Radio,
  App,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useOrderById } from '@/features/order/api'
import { usePaymentMethods, useCheckout, useCreateVnPayUrl } from '@/features/payment/api'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentMethodType } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { PaymentMethodDto } from '@/types'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [PaymentMethodType.Card]: <CreditCardOutlined />,
  [PaymentMethodType.BankTransfer]: <BankOutlined />,
  [PaymentMethodType.Wallet]: <WalletOutlined />,
  [PaymentMethodType.VnPay]: <CreditCardOutlined />,
}

export default function CheckoutPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [selectedMethodId, setSelectedMethodId] = useState<string>('')

  const { data: order, isLoading: orderLoading } = useOrderById(orderId)
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods()
  const checkout = useCheckout()
  const createVnPayUrl = useCreateVnPayUrl()

  const selectedMethod = methods?.find((m: PaymentMethodDto) => m.id === selectedMethodId)

  const handlePay = () => {
    if (!order) return

    // VnPay flow: redirect to VnPay
    if (selectedMethod?.type === PaymentMethodType.VnPay) {
      createVnPayUrl.mutate(
        {
          amount: order.totalAmount,
          currency: order.currency,
          purpose: 'order_payment',
          description: `Payment for order ${order.orderNumber}`,
          orderId: order.id,
          paymentMethodId: selectedMethodId || undefined,
        },
        {
          onSuccess: (data) => {
            window.location.href = data.paymentUrl
          },
          onError: () => {
            message.error(t('paymentError', 'Failed to create payment'))
          },
        },
      )
      return
    }

    // Standard checkout
    checkout.mutate(
      {
        orderId: order.id,
        paymentMethod: selectedMethod?.type,
      },
      {
        onSuccess: () => {
          message.success(t('paymentSuccess', 'Payment successful'))
          navigate(`/me/orders/${order.id}`)
        },
        onError: () => {
          message.error(t('paymentError', 'Failed to process payment'))
        },
      },
    )
  }

  if (orderLoading || methodsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!order) {
    return <Alert type="error" message={t('orderNotFound', 'Order not found')} showIcon />
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/me/orders/${orderId}`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('checkout', 'Checkout')}
      </Typography.Title>

      {/* Order summary */}
      <Card title={t('orderSummary', 'Order Summary')} style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label={t('orderNumber', 'Order Number')}>
            {order.orderNumber}
          </Descriptions.Item>
          <Descriptions.Item label={t('status', 'Status')}>
            <StatusBadge status={order.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('createdAt', 'Created')}>
            {formatDateTime(order.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('totalAmount', 'Total Amount')}>
            <PriceDisplay amount={order.totalAmount} currency={order.currency} size="large" type="danger" />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Payment method selection */}
      <Card title={t('selectPaymentMethod', 'Select Payment Method')} style={{ marginBottom: 24 }}>
        {(!methods || methods.length === 0) ? (
          <Empty description={t('noMethods', 'No payment methods available')}>
            <Button type="primary" onClick={() => navigate('/me/payment-methods')}>
              {t('addMethod', 'Add Payment Method')}
            </Button>
          </Empty>
        ) : (
          <Radio.Group
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {methods.map((method: PaymentMethodDto) => (
                <Radio key={method.id} value={method.id} style={{ width: '100%' }}>
                  <Space>
                    {TYPE_ICONS[method.type] ?? <CreditCardOutlined />}
                    <span>{method.maskedCardNumber ?? method.type.toUpperCase()}</span>
                    {method.holderName && <span>({method.holderName})</span>}
                    {method.isDefault && <StatusBadge status="default" size="small" />}
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        )}
      </Card>

      {/* Pay button */}
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Typography.Text type="secondary">{t('totalToPay', 'Total to pay')}: </Typography.Text>
            <PriceDisplay amount={order.totalAmount} currency={order.currency} size="large" />
          </div>
          <Button
            type="primary"
            size="large"
            onClick={handlePay}
            loading={checkout.isPending || createVnPayUrl.isPending}
            disabled={!selectedMethodId}
          >
            {t('payNow', 'Pay Now')}
          </Button>
        </Space>
      </Card>
    </div>
  )
}
