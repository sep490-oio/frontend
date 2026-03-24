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
  [PaymentMethodType.Card]: <CreditCardOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.BankTransfer]: <BankOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.Wallet]: <WalletOutlined style={{ fontSize: 24 }} />,
  [PaymentMethodType.VnPay]: <CreditCardOutlined style={{ fontSize: 24 }} />,
}

export default function PaymentMethodsPage() {
  const { t } = useTranslation('payment')
  const { message } = App.useApp()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addType, setAddType] = useState<string>(PaymentMethodType.Card)

  const { data: methods, isLoading } = usePaymentMethods()
  const addMethod = useAddPaymentMethod()
  const deleteMethod = useDeletePaymentMethod()
  const setDefault = useSetDefaultPaymentMethod()
  const linkVnPay = useLinkCardVnPay()

  const handleAdd = () => {
    addMethod.mutate(
      { type: addType },
      {
        onSuccess: () => {
          message.success(t('methodAdded', 'Payment method added'))
          setAddModalOpen(false)
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
      { returnUrl: `${window.location.origin}/me/payment-methods` },
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
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('paymentMethods', 'Payment Methods')}
        </Typography.Title>
        <Space>
          <Button icon={<LinkOutlined />} onClick={handleLinkVnPay} loading={linkVnPay.isPending}>
            {t('linkVnPay', 'Link Card via VnPay')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            {t('addMethod', 'Add Method')}
          </Button>
        </Space>
      </Space>

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
        onCancel={() => setAddModalOpen(false)}
        confirmLoading={addMethod.isPending}
      >
        <Form layout="vertical">
          <Form.Item label={t('methodType', 'Type')}>
            <Select
              value={addType}
              onChange={setAddType}
              options={[
                { value: PaymentMethodType.Card, label: t('typeCard', 'Card') },
                { value: PaymentMethodType.BankTransfer, label: t('typeBankTransfer', 'Bank Transfer') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
