import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Card,
  Button,
  Space,
  Spin,
  Alert,
  Descriptions,
  Radio,
  App,
  Divider,
  Flex,
  Popconfirm,
  Result,
  Typography,
  Checkbox,
} from 'antd'
import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useTermsGate } from '@/features/user/hooks/useTermsGate'
import { useOrderById } from '@/features/order/api'
import { usePaymentMethods, useCheckout, useCreateVnPayUrl, useWallet } from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PaymentMethodType } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { PaymentMethodDto } from '@/types'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const MONO_FONT = "'DM Mono', monospace"

const WALLET_METHOD_ID = '__wallet__'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [PaymentMethodType.CreditCard]: <CreditCardOutlined />,
  [PaymentMethodType.DebitCard]: <CreditCardOutlined />,
  [PaymentMethodType.BankAccount]: <BankOutlined />,
  [PaymentMethodType.EWallet]: <WalletOutlined />,
  [PaymentMethodType.VnPay]: <CreditCardOutlined />,
}

export default function CheckoutPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const { isMobile } = useBreakpoint()
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [selectedMethodId, setSelectedMethodId] = useState<string>(WALLET_METHOD_ID)
  const [saveCard, setSaveCard] = useState(false)
  const bidderTerms = useTermsGate('bidder')

  const { data: order, isLoading: orderLoading } = useOrderById(orderId)
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods()
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const checkout = useCheckout()
  const createVnPayUrl = useCreateVnPayUrl()

  const selectedMethod = methods?.find((m: PaymentMethodDto) => m.id === selectedMethodId)
  const isWalletSelected = selectedMethodId === WALLET_METHOD_ID

  const orderAmount = order?.totalAmount ?? 0
  const walletBalance = wallet?.availableBalance ?? 0
  const walletCoversAll = walletBalance >= orderAmount
  const walletPortion = Math.min(walletBalance, orderAmount)
  const vnpayPortion = orderAmount - walletPortion

  const handlePay = () => {
    if (bidderTerms.hasPending) { bidderTerms.redirect(); return }
    if (!order || order.status !== 'pending_payment') return

    // Wallet payment
    if (isWalletSelected) {
      const paymentMethod = walletCoversAll ? 'wallet' : 'wallet_vnpay'

      checkout.mutate(
        { orderId: order.id, paymentMethod },
        {
          onSuccess: (data) => {
            if (data.paymentUrl) {
              // Hybrid: redirect to VnPay for remainder
              window.location.href = data.paymentUrl
            } else {
              // Full wallet: done
              message.success(t('paymentSuccess', 'Payment successful'))
              navigate(`/me/orders/${order.id}`)
            }
          },
          onError: () => {
            message.error(t('paymentError', 'Failed to process payment'))
          },
        },
      )
      return
    }

    // VnPay flow: redirect to VnPay (saved card or new card)
    if (selectedMethod?.type === PaymentMethodType.VnPay || selectedMethodId === '__vnpay_new__') {
      const isNewVnPay = selectedMethodId === '__vnpay_new__'
      createVnPayUrl.mutate(
        {
          amount: order.totalAmount,
          currency: order.currency,
          purpose: 'order_payment',
          description: `Payment for order ${order.orderNumber}`,
          orderId: order.id,
          paymentMethodId: isNewVnPay ? undefined : selectedMethodId || undefined,
          saveCard: isNewVnPay ? saveCard : undefined,
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

    // Standard checkout for other methods
    checkout.mutate(
      { orderId: order.id, paymentMethod: selectedMethod?.type },
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

  if (orderLoading || methodsLoading || walletLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!order) {
    return <Alert type="error" message={t('orderNotFound', 'Order not found')} showIcon />
  }

  if (order.status !== 'pending_payment') {
    if (order.status === 'paid') {
      return (
        <Result
          status="success"
          title={t('alreadyPaid', 'This order has already been paid')}
          extra={
            <Button type="primary" onClick={() => navigate(`/me/orders/${order.id}`)}>
              {t('viewOrderDetail', 'View Order Detail')}
            </Button>
          }
        />
      )
    }
    if (order.status === 'cancelled') {
      return (
        <Result
          status="error"
          title={t('orderCancelled', 'This order has been cancelled')}
        />
      )
    }
    return (
      <Result
        status="warning"
        title={t('orderUnavailable', 'This order is no longer available for payment')}
      />
    )
  }

  // Determine button text
  let payButtonText = t('payNow', 'Pay Now')
  if (isWalletSelected) {
    payButtonText = walletCoversAll
      ? t('payFromWallet', 'Pay from Wallet')
      : t('payWalletPlusVnpay', 'Pay (Wallet + VnPay)')
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/me/orders/${orderId}`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <h1
        style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: isMobile ? 22 : 28,
          color: 'var(--color-text-primary)',
          marginBottom: isMobile ? 16 : 24,
        }}
      >
        {t('checkout', 'Checkout')}
      </h1>

      {/* Order summary */}
      <Card style={{ marginBottom: 24 }}>
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
            <span style={{ fontFamily: MONO_FONT, fontSize: 18, fontWeight: 600, color: 'var(--color-accent)' }}>
              {formatCurrency(order.totalAmount, order.currency)}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Payment method selection */}
      <Card
        title={
          <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>
            {t('selectPaymentMethod', 'Select Payment Method')}
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        <Radio.Group
          value={selectedMethodId}
          onChange={(e) => setSelectedMethodId(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={0}>
            {/* ── Wallet Option (always first) ── */}
            <Radio
              value={WALLET_METHOD_ID}
              disabled={walletBalance <= 0}
              style={{
                width: '100%',
                padding: '16px 0',
                borderBottom: '1px solid var(--color-border-light)',
              }}
            >
              <Flex align="center" gap={12}>
                <WalletOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {t('walletPayment', 'Platform Wallet')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {t('availableBalance', 'Available')}: {' '}
                    <span style={{ fontFamily: MONO_FONT, color: walletBalance >= orderAmount ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatCurrency(walletBalance, wallet?.currency ?? order.currency)}
                    </span>
                  </div>
                  {walletBalance > 0 && !walletCoversAll && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {t('hybridNote', 'Wallet covers {{wallet}}, VnPay covers remaining {{vnpay}}', {
                        wallet: formatCurrency(walletPortion, order.currency),
                        vnpay: formatCurrency(vnpayPortion, order.currency),
                      })}
                    </div>
                  )}
                  {walletBalance <= 0 && (
                    <div style={{ fontSize: 11, color: 'var(--color-danger)' }}>
                      {t('insufficientBalance', 'Insufficient balance — top up your wallet first')}
                    </div>
                  )}
                </div>
                {walletCoversAll && (
                  <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 16, marginLeft: 'auto' }} />
                )}
              </Flex>
            </Radio>

            <Divider style={{ margin: '8px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {t('otherMethods', 'Other methods')}
            </Divider>

            {/* ── Saved Payment Methods ── */}
            {(!methods || methods.length === 0) ? (
              <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('noSavedMethods', 'No saved payment methods')}.{' '}
                <Button type="link" size="small" onClick={() => navigate('/me/payment-methods')} style={{ padding: 0 }}>
                  {t('addMethod', 'Add one')}
                </Button>
              </div>
            ) : (
              methods.map((method: PaymentMethodDto) => (
                <Radio
                  key={method.id}
                  value={method.id}
                  style={{ width: '100%', padding: '12px 0', borderBottom: '1px solid var(--color-border-light)' }}
                >
                  <Flex align="center" gap={12}>
                    {TYPE_ICONS[method.type] ?? <CreditCardOutlined />}
                    <div>
                      <span style={{ fontWeight: 500 }}>
                        {method.maskedCardNumber ?? method.type.toUpperCase()}
                      </span>
                      {method.holderName && (
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8, fontSize: 13 }}>
                          {method.holderName}
                        </span>
                      )}
                    </div>
                    {method.isDefault && <StatusBadge status="default" size="small" />}
                  </Flex>
                </Radio>
              ))
            )}
            {/* Pay with new VnPay card (always available) */}
            <Divider style={{ margin: '8px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {t('payWithVnPay', 'Pay with VnPay')}
            </Divider>
            <Radio
              value="__vnpay_new__"
              style={{ width: '100%', padding: '12px 0' }}
            >
              <Flex align="center" gap={12}>
                <CreditCardOutlined />
                <span style={{ fontWeight: 500 }}>{t('newVnPayCard', 'Pay with VnPay (new card)')}</span>
              </Flex>
            </Radio>
          </Space>
        </Radio.Group>
      </Card>

      {/* Save card option — only for new VnPay payments */}
      {selectedMethodId === '__vnpay_new__' && (
        <div style={{ marginBottom: 16 }}>
          <Checkbox checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)}>
            {t('saveCardForFuture', 'Save this card for future payments')}
          </Checkbox>
        </div>
      )}

      {/* Payment breakdown */}
      {isWalletSelected && !walletCoversAll && walletBalance > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Flex justify="space-between">
              <Typography.Text>{t('walletPortion', 'Wallet portion')}</Typography.Text>
              <Typography.Text style={{ fontFamily: MONO_FONT }}>
                {formatCurrency(walletPortion, order.currency)}
              </Typography.Text>
            </Flex>
            <Flex justify="space-between">
              <Typography.Text>{t('vnpayPortion', 'VnPay portion')}</Typography.Text>
              <Typography.Text style={{ fontFamily: MONO_FONT }}>
                {formatCurrency(vnpayPortion, order.currency)}
              </Typography.Text>
            </Flex>
          </Space>
        </Card>
      )}

      <Alert
        type="info"
        message={t('escrowNotice', 'Your payment will be held in escrow until delivery is confirmed.')}
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Pay summary + button */}
      <Card style={{ background: 'var(--color-accent-light)' }}>
        <Flex justify="space-between" align={isMobile ? 'stretch' : 'center'} vertical={isMobile} gap={isMobile ? 16 : 0}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              {t('totalToPay', 'Total to pay')}
            </div>
            <span style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 20 : 24, fontWeight: 600, color: 'var(--color-accent)' }}>
              {formatCurrency(orderAmount, order.currency)}
            </span>
          </div>
          <Popconfirm
            title={t('confirmPayment', 'Confirm payment of {{total}} VND?', {
              total: formatCurrency(orderAmount, order.currency),
            })}
            onConfirm={handlePay}
            okText={t('confirm', 'Confirm')}
            cancelText={tc('action.cancel', 'Cancel')}
          >
            <Button
              type="primary"
              size="large"
              loading={checkout.isPending || createVnPayUrl.isPending}
              disabled={!selectedMethodId || (isWalletSelected && walletBalance <= 0)}
              style={{
                height: 48,
                paddingInline: isMobile ? 16 : 32,
                width: isMobile ? '100%' : undefined,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                fontWeight: 500,
              }}
            >
              {payButtonText}
            </Button>
          </Popconfirm>
        </Flex>
      </Card>
    </div>
  )
}
