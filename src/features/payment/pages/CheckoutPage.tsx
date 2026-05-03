import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Button,
  Space,
  Spin,
  Alert,
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
  Row,
  Col,
  Tag,
} from 'antd'
import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useTermsGate } from '@/features/user/hooks/useTermsGate'
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'
import { useOrderById, useUpdateOrderShipping } from '@/features/order/api'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { usePaymentMethods, useCheckout, useCreateVnPayUrl, useWallet } from '@/features/payment/api'
import { useAddresses, useCurrentUser, useCurrentUserProfile } from '@/features/user/api'
import { useAuctionDetail } from '@/features/auction/auctionApi'
import type { UpdateOrderShippingRequest, PaymentMethodDto } from '@/types'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PaymentMethodType } from '@/types/enums'
import { formatCurrency } from '@/utils/format'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
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

  const { data: currentUser } = useCurrentUser()
  const { data: currentProfile } = useCurrentUserProfile()
  const { data: order, isLoading: orderLoading, refetch } = useOrderById(orderId)
  const { data: auctionData } = useAuctionDetail(order?.auctionId || '', currentUser?.id, {
    enabled: !!order?.auctionId && !!currentUser?.id,
  })
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods()
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const { data: addresses } = useAddresses()
  const checkout = useCheckout()
  const createVnPayUrl = useCreateVnPayUrl()
  const updateShipping = useUpdateOrderShipping()

  const [shippingForm] = Form.useForm<UpdateOrderShippingRequest>()
  const [shippingSaved, setShippingSaved] = useState(false)

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

  useEffect(() => {
    if (!autofillValues) return
    shippingForm.setFieldsValue(autofillValues)
    setShippingSaved(order?.shipping?.isStructured === true)
  }, [autofillValues, order?.shipping?.isStructured, shippingForm])

  const checkoutMethods = (methods ?? []).filter((m: any) => m.type === 'vnpay')
  const selectedMethod = methods?.find((m: PaymentMethodDto) => m.id === selectedMethodId)
  const isWalletSelected = selectedMethodId === WALLET_METHOD_ID

  const grossAmount = order?.totalAmount ?? 0
  const depositApplied = useMemo(() => {
    if (order?.depositAppliedAmount != null && order.depositAppliedAmount > 0) {
      return order.depositAppliedAmount
    }
    // Fallback: If backend didn't set depositAppliedAmount, use the participant's deposit
    // but only if this is an auction win context (the user is the winner).
    const isWinner = auctionData?.auction?.currentWinnerId === currentUser?.id
    if (isWinner && auctionData?.currentUserParticipant?.depositAmount) {
      return auctionData.currentUserParticipant.depositAmount
    }
    return 0
  }, [order?.depositAppliedAmount, auctionData, currentUser?.id])

  const orderAmount = Math.max(0, grossAmount - depositApplied)
  const walletBalance = wallet?.availableBalance ?? 0
  const walletCoversAll = walletBalance >= orderAmount
  const walletPortion = Math.min(walletBalance, orderAmount)

  const saveShippingIfNeeded = async (): Promise<boolean> => {
    if (!order) return false
    try {
      const values = await shippingForm.validateFields()
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

    const ok = await saveShippingIfNeeded()
    if (!ok) return

    if (isWalletSelected) {
      const paymentMethod = walletCoversAll ? 'wallet' : 'wallet_vnpay'
      checkout.mutate(
        { orderId: order.id, paymentMethod },
        {
          onSuccess: (data) => {
            if (data.paymentUrl) {
              window.location.href = data.paymentUrl
            } else {
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

  let payButtonText = t('payNow', 'Pay Now')
  if (isWalletSelected) {
    payButtonText = walletCoversAll
      ? t('payFromWallet', 'Pay from Wallet')
      : t('payWalletPlusVnpay', 'Pay (Wallet + VnPay)')
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 16px 80px' : '0 24px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/me/orders/${orderId}`)}
          style={{ padding: 0, color: 'var(--color-text-secondary)', marginBottom: 16 }}
        >
          {tc('action.back', 'Back to Order Details')}
        </Button>
        <Typography.Title
          level={2}
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            fontSize: isMobile ? 28 : 36,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <ShoppingOutlined style={{ color: 'var(--color-accent)' }} />
          {t('checkout', 'Complete Checkout')}
        </Typography.Title>
        <Typography.Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
          {t('checkoutSubtitle', 'Finalize your shipment details and payment to complete your order')}
        </Typography.Text>
      </div>

      <Row gutter={[32, 32]}>
        {/* Left Column: Information */}
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* Payment deadline countdown */}
            {(order as any).paymentDueAt && (
              <div style={{
                background: 'rgba(255, 153, 0, 0.1)',
                border: '1px solid rgba(255, 153, 0, 0.2)',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <InfoCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                <Typography.Text style={{ color: '#faad14', fontWeight: 500 }}>
                  {t('paymentDeadline', 'Payment deadline')}: <CountdownTimer endTime={(order as any).paymentDueAt} size="small" onEnd={() => {
                    message.info(t('deadlineExpired', 'Payment deadline expired. Checking status...'))
                    refetch()
                  }} />
                </Typography.Text>
              </div>
            )}

            {/* Step 1: Items */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Typography.Title level={4} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600 }}>
                  1. {t('orderSummary', 'Order Items')}
                </Typography.Title>
                <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>#{order.orderNumber}</Tag>
              </Flex>
              {order.item && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid var(--color-border-light)' }}>
                  <OrderItemSummary item={order.item} variant="card" linkToAuction />
                </div>
              )}
            </div>

            {/* Step 2: Shipping */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                <Typography.Title level={4} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600 }}>
                  2. {t('shippingInformation', 'Shipping Details')}
                </Typography.Title>
                <EnvironmentOutlined style={{ color: 'var(--color-accent)', fontSize: 20 }} />
              </Flex>

              {order.shipping && !order.shipping.isStructured && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 20, borderRadius: 12 }}
                  message={t('shippingPlaceholderWarning', 'Please complete your delivery address before paying.')}
                />
              )}

              <Form
                form={shippingForm}
                layout="vertical"
                onValuesChange={() => setShippingSaved(false)}
                initialValues={autofillValues ?? undefined}
                requiredMark={false}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="recipientName"
                      label={t('recipientName', 'Recipient Name')}
                      rules={[{ required: true, whitespace: true, message: t('recipientRequired', 'Recipient name is required') }]}
                    >
                      <Input 
                        placeholder={t('recipientNamePlaceholder', 'Full name')} 
                        style={{ borderRadius: 10, height: 42, background: 'rgba(255,255,255,0.02)' }} 
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phoneNumber"
                      label={t('phoneNumber', 'Phone Number')}
                      rules={[{ required: true, whitespace: true, message: t('phoneRequired', 'Phone number is required') }]}
                    >
                      <Input 
                        placeholder={t('phoneNumberPlaceholder', '09xx xxx xxx')} 
                        style={{ borderRadius: 10, height: 42, background: 'rgba(255,255,255,0.02)' }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="street"
                  label={t('street', 'Street Address')}
                  rules={[{ required: true, whitespace: true, message: t('streetRequired', 'Street is required') }]}
                >
                  <Input 
                    placeholder={t('streetPlaceholder', 'House number, street name')} 
                    style={{ borderRadius: 10, height: 42, background: 'rgba(255,255,255,0.02)' }} 
                  />
                </Form.Item>
                
                <GhnAddressSelect
                  form={shippingForm}
                  provinceName="city"
                  districtName="district"
                  wardName="ward"
                  metadataName="recipientMetadata"
                  style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}
                />

                <Form.Item name="postalCode" label={t('postalCode', 'Postal Code (optional)')}>
                  <Input style={{ borderRadius: 10, height: 42, background: 'rgba(255,255,255,0.02)' }} />
                </Form.Item>

                {shippingSaved && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '8px 16px', 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    borderRadius: 8, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8 
                  }}>
                    <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
                    <Typography.Text style={{ fontSize: 13, color: 'var(--color-success)', fontWeight: 500 }}>
                      {t('shippingSaved', 'Shipping information verified and saved')}
                    </Typography.Text>
                  </div>
                )}
              </Form>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: 20,
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <SafetyCertificateOutlined style={{ color: 'var(--color-accent)', fontSize: 24 }} />
              <div>
                <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
                  {t('buyerProtectionTitle', 'Buyer Protection Active')}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('escrowNotice', 'Your payment will be held in escrow securely until you confirm successful delivery.')}
                </Typography.Text>
              </div>
            </div>
          </Space>
        </Col>

        {/* Right Column: Checkout Sidebar */}
        <Col xs={24} lg={9}>
          <div style={{ position: 'sticky', top: 'var(--navbar-offset-desktop)' }}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              {/* Payment Step */}
              <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <Typography.Title level={4} style={{ marginBottom: 20, fontFamily: SANS_FONT, fontWeight: 600 }}>
                  3. {t('selectPaymentMethod', 'Payment Method')}
                </Typography.Title>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Wallet Option */}
                  <div 
                    onClick={() => walletBalance > 0 && setSelectedMethodId(WALLET_METHOD_ID)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: `1px solid ${selectedMethodId === WALLET_METHOD_ID ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: selectedMethodId === WALLET_METHOD_ID ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                      cursor: walletBalance > 0 ? 'pointer' : 'not-allowed',
                      opacity: walletBalance > 0 ? 1 : 0.5,
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    <Flex align="center" gap={16}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: selectedMethodId === WALLET_METHOD_ID ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: selectedMethodId === WALLET_METHOD_ID ? '#fff' : 'var(--color-text-secondary)',
                      }}>
                        <WalletOutlined style={{ fontSize: 20 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Typography.Text strong style={{ display: 'block' }}>{t('walletPayment', 'Platform Wallet')}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {t('balance', 'Balance')}: <span style={{ fontFamily: MONO_FONT, color: walletBalance >= orderAmount ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {formatCurrency(walletBalance, wallet?.currency ?? order.currency)}
                          </span>
                        </Typography.Text>
                      </div>
                      <Radio checked={selectedMethodId === WALLET_METHOD_ID} />
                    </Flex>
                    {walletBalance > 0 && !walletCoversAll && selectedMethodId === WALLET_METHOD_ID && (
                      <div style={{ 
                        marginTop: 12, 
                        padding: '8px 12px', 
                        background: 'rgba(250, 173, 20, 0.1)', 
                        borderRadius: 8,
                        fontSize: 11,
                        color: '#d48806'
                      }}>
                        {t('hybridNote', 'Hybrid payment: Wallet covers {{wallet}}, VnPay for remaining.', {
                          wallet: formatCurrency(walletPortion, order.currency)
                        })}
                      </div>
                    )}
                  </div>

                  <Divider style={{ margin: '8px 0' }}>{t('otherMethods', 'Alternative Methods')}</Divider>

                  {/* Saved Cards */}
                  {checkoutMethods.map((method: PaymentMethodDto) => (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        border: `1px solid ${selectedMethodId === method.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selectedMethodId === method.id ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Flex align="center" gap={16}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: selectedMethodId === method.id ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: selectedMethodId === method.id ? '#fff' : 'var(--color-text-secondary)',
                        }}>
                          {TYPE_ICONS[method.type] ?? <CreditCardOutlined />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Typography.Text strong style={{ display: 'block' }}>{method.maskedCardNumber ?? method.type.toUpperCase()}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{method.holderName || 'VNPay Card'}</Typography.Text>
                        </div>
                        <Radio checked={selectedMethodId === method.id} />
                      </Flex>
                    </div>
                  ))}

                  {/* New VNPay Card */}
                  <div 
                    onClick={() => setSelectedMethodId('__vnpay_new__')}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: `1px solid ${selectedMethodId === '__vnpay_new__' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: selectedMethodId === '__vnpay_new__' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Flex align="center" gap={16}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: selectedMethodId === '__vnpay_new__' ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: selectedMethodId === '__vnpay_new__' ? '#fff' : 'var(--color-text-secondary)',
                      }}>
                        <CreditCardOutlined style={{ fontSize: 20 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Typography.Text strong style={{ display: 'block' }}>{t('newVnPayCard', 'New VNPay Card')}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('payWithNewCard', 'Pay with any VNPay-supported card')}</Typography.Text>
                      </div>
                      <Radio checked={selectedMethodId === '__vnpay_new__'} />
                    </Flex>
                    
                    {selectedMethodId === '__vnpay_new__' && (
                      <div style={{ marginTop: 16, padding: '12px 0 0 0', borderTop: '1px solid var(--color-border-light)' }}>
                        <Checkbox checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} style={{ fontSize: 13 }}>
                          {t('saveCardForFuture', 'Securely save this card for later')}
                        </Checkbox>
                        {saveCard && (
                          <Select
                            value={cardType}
                            onChange={setCardType}
                            style={{ width: '100%', marginTop: 12 }}
                            size="middle"
                            options={[
                              { value: '01', label: t('domesticCard', 'ATM / Domestic Card') },
                              { value: '02', label: t('internationalCard', 'Visa/MasterCard/JCB') },
                            ]}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary Sidebar Card */}
              <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: 24,
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                backgroundImage: 'linear-gradient(135deg, var(--color-bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)'
              }}>
                <Typography.Title level={4} style={{ marginBottom: 20, fontFamily: SANS_FONT, fontWeight: 600 }}>
                  {t('paymentSummary', 'Payment Summary')}
                </Typography.Title>

                <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 24 }}>
                  <Flex justify="space-between">
                    <Typography.Text type="secondary">{t('subtotal', 'Order Total')}</Typography.Text>
                    <Typography.Text strong style={{ fontFamily: MONO_FONT }}>{formatCurrency(grossAmount, order.currency)}</Typography.Text>
                  </Flex>
                  
                  {depositApplied > 0 && (
                    <Flex justify="space-between">
                      <Typography.Text type="secondary">{t('depositApplied', 'Deposit Deduction')}</Typography.Text>
                      <Typography.Text type="success" style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                        −{formatCurrency(depositApplied, order.currency)}
                      </Typography.Text>
                    </Flex>
                  )}

                  {isWalletSelected && walletBalance > 0 && (
                    <>
                      <Divider style={{ margin: '8px 0' }} />
                      <Flex justify="space-between">
                        <Typography.Text type="secondary">{t('walletPortion', 'Paid via Wallet')}</Typography.Text>
                        <Typography.Text style={{ fontFamily: MONO_FONT, color: 'var(--color-success)' }}>
                          −{formatCurrency(walletPortion, order.currency)}
                        </Typography.Text>
                      </Flex>
                    </>
                  )}

                  <Divider style={{ margin: '8px 0', borderStyle: 'dashed' }} />
                  
                  <Flex justify="space-between" align="flex-end">
                    <div>
                      <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>{t('totalToPay', 'Amount Due')}</Typography.Text>
                      {isWalletSelected && !walletCoversAll && (
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t('payableViaVnpay', 'Payable via VNPay')}</Typography.Text>
                      )}
                    </div>
                    <Typography.Text style={{ 
                      fontFamily: MONO_FONT, 
                      fontSize: 28, 
                      fontWeight: 700, 
                      color: 'var(--color-accent)',
                      lineHeight: 1
                    }}>
                      {formatCurrency(orderAmount, order.currency)}
                    </Typography.Text>
                  </Flex>
                </Space>

                <Popconfirm
                  title={t('confirmPayment', 'Authorize payment for this order?')}
                  onConfirm={handlePay}
                  okText={t('confirm', 'Pay Now')}
                  cancelText={tc('action.cancel', 'Cancel')}
                  disabled={!selectedMethodId || (isWalletSelected && walletBalance <= 0)}
                >
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={checkout.isPending || createVnPayUrl.isPending}
                    disabled={!selectedMethodId || (isWalletSelected && walletBalance <= 0)}
                    style={{
                      height: 56,
                      borderRadius: 16,
                      fontSize: 16,
                      fontWeight: 700,
                      background: 'var(--color-accent)',
                      border: 'none',
                      boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    {payButtonText.toUpperCase()}
                  </Button>
                </Popconfirm>
                
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
                    {t('secureCheckout', 'Secure encrypted checkout')}
                  </Typography.Text>
                </div>
              </div>
            </Space>
          </div>
        </Col>
      </Row>

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
