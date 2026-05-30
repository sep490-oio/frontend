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

export function AddressManagementPanel() {
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
    <div style={{ 
      background: 'var(--color-bg-card)', 
      borderRadius: 32, 
      border: '1px solid var(--color-border)',
      padding: isMobile ? '32px 24px' : '40px',
      boxShadow: 'var(--shadow-sm)',
      width: '100%'
    }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 32 }}
      >
        <Flex align="center" gap={12}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 12, 
            background: 'var(--color-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)'
          }}>
            <EnvironmentOutlined style={{ fontSize: 20 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {t('addresses.title')}
          </Title>
        </Flex>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          style={{
            background: 'var(--color-accent)',
            fontWeight: 600,
            borderRadius: 10,
          }}
        >
          {t('addresses.addAddress')}
        </Button>
      </Flex>

      {!addresses?.length ? (
        <Empty
          description={t('addresses.empty')}
          style={{ padding: '60px 0', background: 'var(--color-bg-surface)', borderRadius: 24, border: '1px dashed var(--color-border)' }}
        >
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={openAddModal} style={{ borderRadius: 10 }}>
            {t('addresses.addNew', 'Add your first address')}
          </Button>
        </Empty>
      ) : (
        <Flex vertical gap={16}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                padding: '24px',
                border: `1px solid ${addr.isDefault ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 24,
                background: addr.isDefault ? 'var(--color-accent-light)' : 'var(--color-bg-surface)',
                transition: 'all 0.2s',
                boxShadow: addr.isDefault ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Row gutter={[24, 24]} align="middle">
                {/* Left: Name and Phone */}
                <Col xs={24} md={8}>
                  <Flex vertical gap={8}>
                    <Flex gap={8} align="center">
                      <Tag
                        icon={addr.type === 'home' ? <HomeOutlined /> : <BankOutlined />}
                        color={addr.type === 'home' ? 'blue' : 'purple'}
                        style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}
                      >
                        {addr.type === 'home' ? t('addresses.typeHome') : t('addresses.typeWork')}
                      </Tag>
                      {addr.isDefault && <Tag color="gold" style={{ borderRadius: 6, margin: 0, fontWeight: 700 }}>DEFAULT</Tag>}
                    </Flex>
                    <div>
                      <Text strong style={{ fontSize: 16, display: 'block', color: 'var(--color-text-primary)' }}>{addr.recipientName}</Text>
                      <Text type="secondary" style={{ fontFamily: MONO_FONT, fontSize: 14 }}>{addr.phoneNumber}</Text>
                    </div>
                  </Flex>
                </Col>

                {/* Middle: Address Details */}
                <Col xs={24} md={10}>
                  <Text style={{ display: 'block', fontSize: 15, marginBottom: 4, color: 'var(--color-text-primary)' }}>{addr.street}</Text>
                  <Text type="secondary" style={{ display: 'block', fontSize: 14 }}>{`${addr.ward}, ${addr.district}`}</Text>
                  <Text type="secondary" style={{ display: 'block', fontSize: 14 }}>{`${addr.city}${addr.postalCode ? ` (${addr.postalCode})` : ''}`}</Text>
                </Col>

                {/* Right: Actions */}
                <Col xs={24} md={6}>
                  <Flex gap={8} justify={isMobile ? 'flex-start' : 'flex-end'} align="center" wrap="wrap">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(addr)} style={{ fontWeight: 600 }}>
                      {t('addresses.edit')}
                    </Button>
                    <Popconfirm
                      title={t('addresses.deleteConfirm')}
                      onConfirm={() => onDelete(addr.id)}
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} loading={removeAddress.isPending} style={{ fontWeight: 600 }}>
                        {t('addresses.delete')}
                      </Button>
                    </Popconfirm>
                    {!addr.isDefault && (
                      <Button size="small" onClick={() => onSetDefault(addr.id)} loading={setDefault.isPending} style={{ borderRadius: 8, marginTop: isMobile ? 8 : 0 }}>
                        {t('addresses.setDefault')}
                      </Button>
                    )}
                  </Flex>
                </Col>
              </Row>
            </div>
          ))}
        </Flex>
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
