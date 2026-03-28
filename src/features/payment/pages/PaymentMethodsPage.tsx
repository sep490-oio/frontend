import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Tag,
  Popconfirm,
  Row,
  Col,
  App,
  Empty,
  Spin,
  Input,
  InputNumber,
  Checkbox,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  CreditCardOutlined,
  BankOutlined,
  WalletOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  LinkOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
  useLinkCardVnPay,
} from '@/features/payment/api'
import { PaymentMethodType } from '@/types/enums'
import type { PaymentMethodDto } from '@/types'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  [PaymentMethodType.CreditCard]: <CreditCardOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.DebitCard]: <CreditCardOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.BankAccount]: <BankOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.EWallet]: <WalletOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.VnPay]: <CreditCardOutlined style={{ fontSize: 24 }} />,
}

export default function PaymentMethodsPage() {
  const { t } = useTranslation('payment')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addType, setAddType] = useState<string>(PaymentMethodType.BankAccount)
  const [addProvider, setAddProvider] = useState('')
  const [addAccountNumber, setAddAccountNumber] = useState('')
  const [addHolderName, setAddHolderName] = useState('')
  const [addLastFour, setAddLastFour] = useState('')
  const [addExpiryMonth, setAddExpiryMonth] = useState<number | undefined>()
  const [addExpiryYear, setAddExpiryYear] = useState<number | undefined>()
  const [addIsDefault, setAddIsDefault] = useState(false)

  const { data: methods, isLoading } = usePaymentMethods()
  const addMethod = useAddPaymentMethod()
  const deleteMethod = useDeletePaymentMethod()
  const setDefault = useSetDefaultPaymentMethod()
  const linkVnPay = useLinkCardVnPay()

  const resetAddForm = () => {
    setAddType(PaymentMethodType.BankAccount)
    setAddProvider('')
    setAddAccountNumber('')
    setAddHolderName('')
    setAddLastFour('')
    setAddExpiryMonth(undefined)
    setAddExpiryYear(undefined)
    setAddIsDefault(false)
  }

  const handleAdd = () => {
    const lastFour = addType === PaymentMethodType.BankAccount && addAccountNumber
      ? addAccountNumber.slice(-4)
      : addLastFour || undefined

    addMethod.mutate(
      {
        type: addType,
        provider: addProvider || undefined,
        lastFour,
        holderName: addHolderName || undefined,
        expiryMonth: addExpiryMonth,
        expiryYear: addExpiryYear,
        isDefault: addIsDefault,
      },
      {
        onSuccess: () => {
          message.success(t('methodAdded', 'Payment method added'))
          setAddModalOpen(false)
          resetAddForm()
        },
        onError: () => {
          message.error(t('methodAddError', 'Failed to add payment method'))
        },
      },
    )
  }

  const handleDelete = (id: string) => {
    deleteMethod.mutate(id, {
      onSuccess: () => message.success(t('methodDeleted', 'Payment method removed')),
      onError: () => message.error(t('methodDeleteError', 'Failed to remove payment method')),
    })
  }

  const handleSetDefault = (id: string) => {
    setDefault.mutate(id, {
      onSuccess: () => message.success(t('methodDefaultSet', 'Default payment method updated')),
      onError: () => message.error(t('methodDefaultError', 'Failed to set default payment method')),
    })
  }

  const handleLinkVnPay = () => {
    linkVnPay.mutate(
      { cardType: 'vnpay' },
      {
        onSuccess: (data) => {
          window.location.href = data.redirectUrl
        },
        onError: () => {
          message.error(t('linkVnPayError', 'Failed to link card via VnPay'))
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

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('paymentMethods', 'Payment Methods')}
        </Typography.Title>
        <Space style={{ flexWrap: 'wrap' }}>
          <Button icon={<LinkOutlined />} onClick={handleLinkVnPay} loading={linkVnPay.isPending}>
            {t('linkVnPay', 'Link Card via VnPay')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            {t('addMethod', 'Add Method')}
          </Button>
        </Space>
      </div>

      {(!methods || methods.length === 0) ? (
        <Empty description={t('noMethods', 'No payment methods yet')} />
      ) : (
        <Row gutter={[16, 16]}>
          {methods.map((method: PaymentMethodDto) => (
            <Col xs={24} sm={12} lg={8} key={method.id}>
              <Card
                hoverable
                actions={[
                  method.isDefault ? (
                    <StarFilled key="default" style={{ color: '#faad14' }} />
                  ) : (
                    <Button
                      key="setDefault"
                      type="text"
                      size="small"
                      icon={<StarOutlined />}
                      onClick={() => handleSetDefault(method.id)}
                    >
                      {t('setDefault', 'Set Default')}
                    </Button>
                  ),
                  <Popconfirm
                    key="delete"
                    title={t('confirmDelete', 'Remove this payment method?')}
                    onConfirm={() => handleDelete(method.id)}
                    okText={t('yes', 'Yes')}
                    cancelText={t('no', 'No')}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                      {t('remove', 'Remove')}
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={TYPE_ICONS[method.type] ?? <CreditCardOutlined style={{ fontSize: 24 }} />}
                  title={
                    <Space>
                      <span>{method.maskedCardNumber ?? method.type.toUpperCase()}</span>
                      {method.isDefault && <Tag color="gold">{t('default', 'Default')}</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      {method.holderName && <span>{method.holderName}</span>}
                      {method.expiryMonth && method.expiryYear && (
                        <span>
                          {t('expires', 'Expires')}: {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                        </span>
                      )}
                      {method.bankCode && <span>{method.bankCode}</span>}
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add payment method modal */}
      <Modal
        title={t('addMethod', 'Add Payment Method')}
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => { setAddModalOpen(false); resetAddForm() }}
        confirmLoading={addMethod.isPending}
      >
        <Form layout="vertical">
          <Form.Item label={t('methodType', 'Type')}>
            <Select
              value={addType}
              onChange={(v) => { setAddType(v); setAddProvider(''); setAddAccountNumber(''); setAddHolderName(''); setAddLastFour('') }}
              options={[
                { value: PaymentMethodType.BankAccount, label: t('typeBankAccount', 'Bank Account') },
                { value: PaymentMethodType.CreditCard, label: t('typeCreditCard', 'Credit Card') },
                { value: PaymentMethodType.DebitCard, label: t('typeDebitCard', 'Debit Card') },
                { value: PaymentMethodType.EWallet, label: t('typeEWallet', 'E-Wallet') },
              ]}
            />
          </Form.Item>

          {/* Bank Account fields */}
          {addType === PaymentMethodType.BankAccount && (
            <>
              <Form.Item label={t('bankName', 'Bank Name')}>
                <Input value={addProvider} onChange={(e) => setAddProvider(e.target.value)} placeholder={t('bankNamePlaceholder', 'e.g. Vietcombank')} />
              </Form.Item>
              <Form.Item label={t('accountNumber', 'Account Number')}>
                <Input value={addAccountNumber} onChange={(e) => setAddAccountNumber(e.target.value)} placeholder={t('accountNumberPlaceholder', 'e.g. 1234567890')} />
              </Form.Item>
              <Form.Item label={t('holderName', 'Account Holder Name')}>
                <Input value={addHolderName} onChange={(e) => setAddHolderName(e.target.value)} placeholder={t('holderNamePlaceholder', 'Full name as on account')} />
              </Form.Item>
            </>
          )}

          {/* Card fields */}
          {(addType === PaymentMethodType.CreditCard || addType === PaymentMethodType.DebitCard) && (
            <>
              <Alert type="info" showIcon message={t('cardVnPayHint', 'For cards, we recommend linking via VNPay for secure tokenization.')} style={{ marginBottom: 16 }} />
              <Form.Item label={t('cardBrand', 'Card Brand')}>
                <Input value={addProvider} onChange={(e) => setAddProvider(e.target.value)} placeholder={t('cardBrandPlaceholder', 'e.g. Visa, Mastercard')} />
              </Form.Item>
              <Form.Item label={t('lastFourDigits', 'Last 4 Digits')}>
                <Input value={addLastFour} onChange={(e) => setAddLastFour(e.target.value)} maxLength={4} placeholder="1234" />
              </Form.Item>
              <Space>
                <Form.Item label={t('expiryMonth', 'Expiry Month')}>
                  <InputNumber min={1} max={12} value={addExpiryMonth} onChange={(v) => setAddExpiryMonth(v ?? undefined)} />
                </Form.Item>
                <Form.Item label={t('expiryYear', 'Expiry Year')}>
                  <InputNumber min={2024} max={2040} value={addExpiryYear} onChange={(v) => setAddExpiryYear(v ?? undefined)} />
                </Form.Item>
              </Space>
              <Form.Item label={t('holderName', 'Cardholder Name')}>
                <Input value={addHolderName} onChange={(e) => setAddHolderName(e.target.value)} placeholder={t('holderNamePlaceholder', 'Full name as on card')} />
              </Form.Item>
            </>
          )}

          {/* E-Wallet fields */}
          {addType === PaymentMethodType.EWallet && (
            <>
              <Form.Item label={t('walletProvider', 'Wallet Provider')}>
                <Input value={addProvider} onChange={(e) => setAddProvider(e.target.value)} placeholder={t('walletProviderPlaceholder', 'e.g. MoMo, ZaloPay')} />
              </Form.Item>
              <Form.Item label={t('holderName', 'Account Name')}>
                <Input value={addHolderName} onChange={(e) => setAddHolderName(e.target.value)} placeholder={t('holderNamePlaceholder', 'Full name')} />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Checkbox checked={addIsDefault} onChange={(e) => setAddIsDefault(e.target.checked)}>
              {t('setAsDefault', 'Set as default payment method')}
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
