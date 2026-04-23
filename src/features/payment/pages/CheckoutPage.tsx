import { useEffect, useMemo, useState } from 'react'
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
  Form,
  Input,
  Popconfirm,
  Result,
  Typography,
  Checkbox,
  Select,
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
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'
import { useOrderById, useUpdateOrderShipping } from '@/features/order/api'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { usePaymentMethods, useCheckout, useCreateVnPayUrl, useWallet } from '@/features/payment/api'
import { useAddresses, useCurrentUser, useCurrentUserProfile } from '@/features/user/api'
import type { UpdateOrderShippingRequest } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PaymentMethodType } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { PaymentMethodDto } from '@/types'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'
import GhnAddressSelect from '@/components/ui/GhnAddressSelect'

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
  const [cardType, setCardType] = useState<string>('01') // 01=ATM/domestic, 02=international
  const bidderTerms = useTermsGate('bidder')

  const { data: order, isLoading: orderLoading } = useOrderById(orderId)
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods()
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const { data: addresses } = useAddresses()
  const { data: currentUser } = useCurrentUser()
  const { data: currentProfile } = useCurrentUserProfile()
  const checkout = useCheckout()
  const createVnPayUrl = useCreateVnPayUrl()
  const updateShipping = useUpdateOrderShipping()

  // ── Shipping form state ─────────────────────────────────────────────
  const [shippingForm] = Form.useForm<UpdateOrderShippingRequest>()
  // Tracks whether the currently-entered shipping has been persisted for THIS
  // order. Paying is gated on `shippingSaved === true` so the buyer can't skip
  // the form. Dirty edits after a save flip this back to false.
  const [shippingSaved, setShippingSaved] = useState(false)

  // Autofill cascade (spec-pinned order):
  //   1. order.shipping if it is a real structured snapshot
  //   2. default address from /me/addresses
  //   3. profile fullName + user phoneNumber (street/ward/district/city left empty)
  const autofillValues = useMemo<UpdateOrderShippingRequest | null>(() => {
    if (!order) return null

    if (order.shipping?.isStructured) {
      return {
        recipientName: order.shipping.recipientName ?? '',
        phoneNumber: order.shipping.phoneNumber ?? '',
        street: order.shipping.street ?? '',
        ward: order.shipping.ward ?? '',
        district: order.shipping.district ?? '',
        city: order.shipping.city ?? '',
        postalCode: order.shipping.postalCode ?? '',
        recipientMetadata: order.shipping.recipientMetadata,
      }
    }

    const defaultAddress = (addresses ?? []).find((a) => a.isDefault) ?? (addresses ?? [])[0]
    if (defaultAddress) {
      return {
        recipientName: defaultAddress.recipientName,
        phoneNumber: defaultAddress.phoneNumber,
        street: defaultAddress.street,
        ward: defaultAddress.ward,
        district: defaultAddress.district,
        city: defaultAddress.city,
        postalCode: defaultAddress.postalCode ?? '',
        recipientMetadata: defaultAddress.metadata as any,
      }
    }

    // Fallback: profile name + user phone, empty address lines.
    const fullName =
      currentProfile?.fullName?.trim() ||
      [currentProfile?.firstName, currentProfile?.lastName].filter(Boolean).join(' ').trim() ||
      currentProfile?.displayName ||
      currentUser?.userName ||
      ''

    return {
      recipientName: fullName,
      phoneNumber: currentUser?.phoneNumber ?? '',
      street: '',
      ward: '',
      district: '',
      city: '',
      postalCode: '',
    }
  }, [order, addresses, currentProfile, currentUser])

  // Prefill the form once the autofill values become available, and mark
  // the form as "already saved" when the order carries a real snapshot.
  useEffect(() => {
    if (!autofillValues) return
    shippingForm.setFieldsValue(autofillValues)
    setShippingSaved(order?.shipping?.isStructured === true)
  }, [autofillValues, order?.shipping?.isStructured, shippingForm])

  const checkoutMethods = (methods ?? []).filter((m: any) => m.type === 'vnpay')
  const selectedMethod = methods?.find((m: PaymentMethodDto) => m.id === selectedMethodId)
  const isWalletSelected = selectedMethodId === WALLET_METHOD_ID

  const grossAmount = order?.totalAmount ?? 0
  const depositApplied = order?.depositAppliedAmount ?? 0
  // Amount due after subtracting any buy-now reservation deposit held on the
  // order. BE is authoritative — checkout.mutate doesn't resend the amount; we
  // only use this for display + wallet-portion math.
  const orderAmount = Math.max(0, grossAmount - depositApplied)
  const walletBalance = wallet?.availableBalance ?? 0
  const walletCoversAll = walletBalance >= orderAmount
  const walletPortion = Math.min(walletBalance, orderAmount)
  const vnpayPortion = orderAmount - walletPortion

  const saveShippingIfNeeded = async (): Promise<boolean> => {
    if (!order) return false
    try {
      const values = await shippingForm.validateFields()
      // Always persist on each pay attempt so edits made after a prior save
      // reach the server. `onSuccess` of the mutation refreshes the cached
      // order with the server-authoritative snapshot.
      await updateShipping.mutateAsync({
        orderId: order.id,
        recipientName: values.recipientName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        street: values.street.trim(),
        ward: values.ward.trim(),
        district: values.district.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode?.trim() || undefined,
        recipientMetadata: values.recipientMetadata,
      })
      setShippingSaved(true)
      return true
    } catch (err) {
      // Form validation errors surface inline; mutation errors surface via toast.
      const apiDetail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (apiDetail) {
        message.error(apiDetail)
      } else if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        message.error(t('shippingSaveError', 'Failed to save shipping information'))
      }
      return false
    }
  }

  const handlePay = async () => {
    if (bidderTerms.hasPending) { bidderTerms.openModal(); return }
    if (!order || order.status !== 'pending_payment') return

    // Shipping must be validated + saved before any payment flow runs.
    const ok = await saveShippingIfNeeded()
    if (!ok) return

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
          cardType: isNewVnPay && saveCard ? cardType : undefined,
          // On successful VNPay return, land on the order detail page (not
          // back on checkout). Single canonical destination for buyer
          // post-payment, same for winner and buy-now flows.
          clientReturnPath: `/me/orders/${order.id}`,
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

  // Guard: Only the buyer can access the checkout page for this order.
  if (currentUser && order.buyerId !== currentUser.id) {
    return (
      <Result
        status="error"
        title={t('checkoutForbidden', 'You are not authorized to pay for this order')}
        subTitle={t('checkoutForbiddenSub', 'Only the winning bidder can access the checkout.')}
        extra={
          <Button type="primary" onClick={() => navigate(`/seller/orders/${order.id}`)}>
            {t('viewSellerOrder', 'View as Seller')}
          </Button>
        }
      />
    )
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

      {/* Payment deadline countdown */}
      {(order as any).paymentDueAt && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              {t('paymentDeadline', 'Payment deadline')}: <CountdownTimer endTime={(order as any).paymentDueAt} size="small" />
            </span>
          }
        />
      )}

      {/* Product summary — from OrderDto.item (single source of truth) */}
      {order.item && (
        <Card style={{ marginBottom: 24 }}>
          <OrderItemSummary item={order.item} variant="card" linkToAuction />
        </Card>
      )}

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
        {depositApplied > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border-light)', paddingTop: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              <Flex justify="space-between">
                <Typography.Text type="secondary">
                  {t('grossPrice', 'Buy-now price')}
                </Typography.Text>
                <Typography.Text style={{ fontFamily: MONO_FONT }}>
                  {formatCurrency(grossAmount, order.currency)}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text type="secondary">
                  {t('depositApplied', 'Deposit applied')}
                </Typography.Text>
                <Typography.Text type="success" style={{ fontFamily: MONO_FONT }}>
                  −{formatCurrency(depositApplied, order.currency)}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text strong>
                  {t('amountDue', 'Amount due')}
                </Typography.Text>
                <Typography.Text strong style={{ fontFamily: MONO_FONT, color: 'var(--color-accent)' }}>
                  {formatCurrency(orderAmount, order.currency)}
                </Typography.Text>
              </Flex>
            </Space>
          </div>
        )}
      </Card>

      {/* Shipping Information — must be saved before payment runs */}
      <Card
        title={
          <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>
            {t('shippingInformation', 'Shipping Information')}
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        {order.shipping && !order.shipping.isStructured && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={t('shippingPlaceholderWarning', 'Please complete your delivery address before paying.')}
          />
        )}
        <Form
          form={shippingForm}
          layout="vertical"
          onValuesChange={() => setShippingSaved(false)}
          initialValues={autofillValues ?? undefined}
        >
          <Form.Item
            name="recipientName"
            label={t('recipientName', 'Recipient Name')}
            rules={[{ required: true, whitespace: true, message: t('recipientRequired', 'Recipient name is required') }]}
          >
            <Input placeholder={t('recipientNamePlaceholder', 'Full name')} />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label={t('phoneNumber', 'Phone Number')}
            rules={[{ required: true, whitespace: true, message: t('phoneRequired', 'Phone number is required') }]}
          >
            <Input placeholder={t('phoneNumberPlaceholder', '09xx xxx xxx')} />
          </Form.Item>
          <Form.Item
            name="street"
            label={t('street', 'Street Address')}
            rules={[{ required: true, whitespace: true, message: t('streetRequired', 'Street is required') }]}
          >
            <Input placeholder={t('streetPlaceholder', 'House number, street name')} />
          </Form.Item>
          
          <GhnAddressSelect
            form={shippingForm}
            provinceName="city"
            districtName="district"
            wardName="ward"
            metadataName="recipientMetadata"
          />

          <Form.Item name="postalCode" label={t('postalCode', 'Postal Code (optional)')}>
            <Input />
          </Form.Item>
          {shippingSaved && (
            <Typography.Text type="success" style={{ fontSize: 12 }}>
              <CheckCircleOutlined /> {t('shippingSaved', 'Shipping information saved')}
            </Typography.Text>
          )}
        </Form>
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
            {checkoutMethods.length === 0 ? (
              <div style={{ padding: '12px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('noSavedMethods', 'No saved payment methods')}.{' '}
                <Button type="link" size="small" onClick={() => navigate('/me/payment-methods')} style={{ padding: 0 }}>
                  {t('addMethod', 'Add one')}
                </Button>
              </div>
            ) : (
              checkoutMethods.map((method: PaymentMethodDto) => (
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
          {saveCard && selectedMethodId === '__vnpay_new__' && (
            <Select
              value={cardType}
              onChange={setCardType}
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { value: '01', label: t('domesticCard', 'ATM / Domestic Card') },
                { value: '02', label: t('internationalCard', 'International Card (Visa/Master)') },
              ]}
            />
          )}
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

      <TermsAcceptanceModal
        open={bidderTerms.modalOpen}
        onClose={bidderTerms.closeModal}
        termType="bidder"
        onAccepted={() => {
          message.success(tc('termsAcceptedToast', 'Terms accepted. You can continue your checkout now.'))
        }}
      />
    </div>
  )
}
