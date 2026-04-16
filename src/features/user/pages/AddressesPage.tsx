import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Modal,
  Row,
  Col,
  Empty,
  Popconfirm,
  App,
  Form
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  HomeOutlined,
  BankOutlined,
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
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{t('addresses.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          {t('addresses.addAddress')}
        </Button>
      </div>

      {!addresses?.length ? (
        <Empty description={t('addresses.empty')} />
      ) : (
        <Row gutter={[16, 16]}>
          {addresses.map((addr) => (
            <Col xs={24} sm={12} key={addr.id}>
              <Card
                style={{ height: '100%' }}
                actions={[
                  <Button
                    key="edit"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(addr)}
                  >
                    {t('addresses.edit')}
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title={t('addresses.deleteConfirm')}
                    description={t('addresses.deleteDesc')}
                    onConfirm={() => onDelete(addr.id)}
                    okText={t('addresses.deleteOk')}
                    cancelText={t('addresses.deleteCancel')}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removeAddress.isPending}
                    >
                      {t('addresses.delete')}
                    </Button>
                  </Popconfirm>,
                  addr.isDefault ? (
                    <Button key="default" type="text" disabled icon={<StarFilled style={{ color: '#faad14' }} />}>
                      {t('addresses.isDefault')}
                    </Button>
                  ) : (
                    <Button
                      key="default"
                      type="text"
                      icon={<StarOutlined />}
                      onClick={() => onSetDefault(addr.id)}
                      loading={setDefault.isPending}
                    >
                      {t('addresses.setDefault')}
                    </Button>
                  ),
                ]}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Tag
                      icon={addr.type === 'home' ? <HomeOutlined /> : <BankOutlined />}
                      color={addr.type === 'home' ? 'blue' : 'green'}
                    >
                      {addr.type === 'home' ? t('addresses.typeHome') : t('addresses.typeWork')}
                    </Tag>
                    {addr.isDefault && <Tag color="gold">{t('addresses.isDefault')}</Tag>}
                  </Space>
                  <Text strong>{addr.recipientName} - {addr.phoneNumber}</Text>
                  <Text strong>{addr.street}</Text>
                  <Text>{`${addr.ward}, ${addr.district}`}</Text>
                  <Text>{`${addr.city}${addr.postalCode ? `, ${addr.postalCode}` : ''}`}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingAddress ? t('addresses.editAddress') : t('addresses.addNew')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        confirmLoading={addAddress.isPending || updateAddress.isPending}
        okText={editingAddress ? t('addresses.update') : t('addresses.add')}
        cancelText={t('addresses.cancel')}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
          initialValues={{ type: 'home' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="recipientName"
                label={t('addresses.recipientName')}
                rules={[{ required: true, message: t('addresses.validation.recipientRequired') }]}
              >
                <Input placeholder={t('addresses.recipientNamePlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phoneNumber"
                label={t('addresses.phoneNumber')}
                rules={[{ required: true, message: t('addresses.validation.phoneRequired') }]}
              >
                <Input placeholder={t('addresses.phoneNumberPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="street"
            label={t('addresses.street')}
            rules={[{ required: true, message: t('addresses.validation.streetRequired') }]}
          >
            <Input placeholder={t('addresses.streetPlaceholder')} />
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
                <Input placeholder={t('addresses.postalCodePlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label={t('addresses.addressType')}
                rules={[{ required: true, message: t('addresses.validation.typeRequired') }]}
              >
                <Select
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
