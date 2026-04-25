import { useState } from 'react'
import {
  Typography,
  Button,
  Input,
  Select,
  Spin,
  Tag,
  Modal,
  Row,
  Col,
  Empty,
  Popconfirm,
  App,
  Form,
  Flex
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  HomeOutlined,
  BankOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useRemoveAddress,
  useSetDefaultAddress,
} from '../api'
import type { UserAddressDto, GhnMetadata } from '@/types'
import type { AddressType } from '@/types/enums'
import GhnAddressSelect from '@/components/ui/GhnAddressSelect'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

type AddressFormValues = {
  recipientName: string
  phoneNumber: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  type: string
  metadata?: GhnMetadata
}

export default function AddressesPage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddressDto | null>(null)
  
  const [form] = Form.useForm<AddressFormValues>()

  const { data: addresses, isLoading } = useAddresses()
  const addAddress = useAddAddress()
  const updateAddress = useUpdateAddress()
  const removeAddress = useRemoveAddress()
  const setDefault = useSetDefaultAddress()

  const openAddModal = () => {
    setEditingAddress(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (addr: UserAddressDto) => {
    setEditingAddress(addr)
    form.setFieldsValue({
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      street: addr.street,
      ward: addr.ward,
      district: addr.district,
      city: addr.city,
      postalCode: addr.postalCode ?? '',
      type: addr.type,
      metadata: addr.metadata,
    })
    setModalOpen(true)
  }

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        postalCode: values.postalCode || undefined,
        type: values.type as AddressType,
      }
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          ...payload,
        })
        message.success(t('addresses.updateSuccess'))
      } else {
        await addAddress.mutateAsync(payload)
        message.success(t('addresses.addSuccess'))
      }
      setModalOpen(false)
    } catch {
      // Validate error or submission error
    }
  }

  const onDelete = async (id: string) => {
    try {
      await removeAddress.mutateAsync(id)
      message.success(t('addresses.deleteSuccess'))
    } catch {
      message.error(t('addresses.deleteError'))
    }
  }

  const onSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id)
      message.success(t('addresses.setDefaultSuccess'))
    } catch {
      message.error(t('addresses.setDefaultError'))
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '48px 24px 80px' }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align={isMobile ? 'stretch' : 'flex-end'}
        vertical={isMobile}
        gap={isMobile ? 20 : 0}
        style={{ marginBottom: 32 }}
      >
        <div>
          <Title
            level={2}
            style={{
              fontFamily: SANS_FONT,
              fontWeight: 600,
              fontSize: isMobile ? 24 : 32,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            <EnvironmentOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
            {t('addresses.title')}
          </Title>
          <Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
            {t('addresses.subtitle', 'Manage your shipping and billing locations')}
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={openAddModal}
          block={isMobile}
          style={{
            background: 'var(--color-accent)',
            fontWeight: 600,
            height: 48,
            borderRadius: 12,
            padding: '0 32px'
          }}
        >
          {t('addresses.addAddress')}
        </Button>
      </Flex>

      {!addresses?.length ? (
        <Empty
          description={t('addresses.empty')}
          style={{ padding: '80px 0', background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }}
        >
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={openAddModal} style={{ borderRadius: 12 }}>
            {t('addresses.addNew', 'Add your first address')}
          </Button>
        </Empty>
      ) : (
        <Row gutter={[24, 24]}>
          {addresses.map((addr) => (
            <Col xs={24} md={12} xl={8} key={addr.id}>
              <div
                style={{
                  height: '100%',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 24,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{ padding: isMobile ? '20px' : '24px', flex: 1 }}>
                <Flex vertical gap={20}>
                  <Flex justify="space-between" align="center">
                    <Tag
                      icon={addr.type === 'home' ? <HomeOutlined /> : <BankOutlined />}
                      color={addr.type === 'home' ? 'blue' : 'purple'}
                      style={{ borderRadius: 8, padding: '4px 12px', textTransform: 'uppercase', fontWeight: 700, fontSize: 11 }}
                    >
                      {addr.type === 'home' ? t('addresses.typeHome') : t('addresses.typeWork')}
                    </Tag>
                    {addr.isDefault && <Tag color="gold" style={{ borderRadius: 8, fontWeight: 700, fontSize: 11, padding: '4px 12px' }}>DEFAULT</Tag>}
                  </Flex>
                  
                  <div>
                    <Title level={5} style={{ margin: '0 0 4px 0', fontFamily: SANS_FONT, fontWeight: 600 }}>{addr.recipientName}</Title>
                    <Text type="secondary" style={{ fontFamily: MONO_FONT, fontSize: 14 }}>{addr.phoneNumber}</Text>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--color-bg-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                    <Text strong style={{ display: 'block', fontSize: 14, marginBottom: 4, color: 'var(--color-text-primary)' }}>{addr.street}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>{`${addr.ward}, ${addr.district}`}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>{`${addr.city}${addr.postalCode ? ` (${addr.postalCode})` : ''}`}</Text>
                  </div>
                </Flex>
                </div>
                {/* Actions Bar */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(addr)}
                    style={{ flex: 1, borderRadius: 0, height: 48, fontWeight: 600, color: 'var(--color-text-primary)', borderRight: '1px solid var(--color-border)' }}
                  >
                    {t('addresses.edit')}
                  </Button>
                  <Popconfirm
                    title={t('addresses.deleteConfirm')}
                    onConfirm={() => onDelete(addr.id)}
                    okText={t('addresses.deleteOk')}
                    cancelText={t('addresses.deleteCancel')}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removeAddress.isPending}
                      style={{ flex: 1, borderRadius: 0, height: 48, fontWeight: 600, borderRight: '1px solid var(--color-border)' }}
                    >
                      {t('addresses.delete')}
                    </Button>
                  </Popconfirm>
                  {addr.isDefault ? (
                    <div style={{ flex: 1, color: '#faad14', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48 }}>
                      <StarFilled /> {t('addresses.isDefault').toUpperCase()}
                    </div>
                  ) : (
                    <Button
                      type="text"
                      icon={<StarOutlined />}
                      onClick={() => onSetDefault(addr.id)}
                      loading={setDefault.isPending}
                      style={{ flex: 1, borderRadius: 0, height: 48, fontWeight: 600 }}
                    >
                      {t('addresses.setDefault')}
                    </Button>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={
          <span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>
            {editingAddress ? t('addresses.editAddress') : t('addresses.addNew')}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        confirmLoading={addAddress.isPending || updateAddress.isPending}
        okText={editingAddress ? t('addresses.update') : t('addresses.add')}
        cancelText={t('addresses.cancel')}
        width={isMobile ? '95%' : 720}
        centered
        styles={{ body: { padding: '8px 0' } }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
          initialValues={{ type: 'home' }}
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="recipientName"
                label={t('addresses.recipientName')}
                rules={[{ required: true, message: t('addresses.validation.recipientRequired') }]}
              >
                <Input placeholder={t('addresses.recipientNamePlaceholder')} style={{ height: 48, borderRadius: 12 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phoneNumber"
                label={t('addresses.phoneNumber')}
                rules={[{ required: true, message: t('addresses.validation.phoneRequired') }]}
              >
                <Input placeholder={t('addresses.phoneNumberPlaceholder')} style={{ height: 48, borderRadius: 12 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="street"
            label={t('addresses.street')}
            rules={[{ required: true, message: t('addresses.validation.streetRequired') }]}
          >
            <Input placeholder={t('addresses.streetPlaceholder')} style={{ height: 48, borderRadius: 12 }} />
          </Form.Item>

          <GhnAddressSelect
            form={form}
            provinceName="city"
            districtName="district"
            wardName="ward"
            metadataName="metadata"
          />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="postalCode"
                label={t('addresses.postalCode')}
              >
                <Input placeholder={t('addresses.postalCodePlaceholder')} style={{ height: 48, borderRadius: 12 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label={t('addresses.addressType')}
                rules={[{ required: true, message: t('addresses.validation.typeRequired') }]}
              >
                <Select
                  style={{ height: 48 }}
                  className="oio-select"
                  options={[
                    { value: 'home', label: t('addresses.typeHome') },
                    { value: 'work', label: t('addresses.typeWork') },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
