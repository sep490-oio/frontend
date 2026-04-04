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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useRemoveAddress,
  useSetDefaultAddress,
} from '../api'
import type { UserAddressDto } from '@/types'
import type { AddressType } from '@/types/enums'

const { Title, Text } = Typography

// -- Schema --------------------------------------------------------------------

function useAddressSchema() {
  const { t } = useTranslation('user')
  return z.object({
    recipientName: z.string().min(1, t('addresses.validation.recipientRequired')),
    phoneNumber: z.string().min(1, t('addresses.validation.phoneRequired')),
    street: z.string().min(1, t('addresses.validation.streetRequired')),
    ward: z.string().min(1, t('addresses.validation.wardRequired')),
    district: z.string().min(1, t('addresses.validation.districtRequired')),
    city: z.string().min(1, t('addresses.validation.cityRequired')),
    postalCode: z.string().optional().or(z.literal('')),
    type: z.string().min(1, t('addresses.validation.typeRequired')),
  })
}

type AddressFormValues = {
  recipientName: string
  phoneNumber: string
  street: string
  ward: string
  district: string
  city: string
  postalCode?: string
  type: string
}

// -- Component -----------------------------------------------------------------

export default function AddressesPage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddressDto | null>(null)

  const { data: addresses, isLoading } = useAddresses()
  const addAddress = useAddAddress()
  const updateAddress = useUpdateAddress()
  const removeAddress = useRemoveAddress()
  const setDefault = useSetDefaultAddress()

  const addressSchema = useAddressSchema()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      recipientName: '',
      phoneNumber: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      postalCode: '',
      type: 'home',
    },
  })

  const openAddModal = () => {
    setEditingAddress(null)
    reset({
      recipientName: '',
      phoneNumber: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      postalCode: '',
      type: 'home',
    })
    setModalOpen(true)
  }

  const openEditModal = (addr: UserAddressDto) => {
    setEditingAddress(addr)
    reset({
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      street: addr.street,
      ward: addr.ward,
      district: addr.district,
      city: addr.city,
      postalCode: addr.postalCode ?? '',
      type: addr.type,
    })
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
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
      message.error(t('addresses.saveError'))
    }
  })

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
      >
        <form>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('addresses.recipientName')} *</label>
                <Controller
                  name="recipientName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('addresses.recipientNamePlaceholder')}
                      status={errors.recipientName ? 'error' : undefined}
                    />
                  )}
                />
                {errors.recipientName && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.recipientName.message}</Text>
                )}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('addresses.phoneNumber')} *</label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('addresses.phoneNumberPlaceholder')}
                      status={errors.phoneNumber ? 'error' : undefined}
                    />
                  )}
                />
                {errors.phoneNumber && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.phoneNumber.message}</Text>
                )}
              </div>
            </Col>
          </Row>

          <div style={{ marginBottom: 16 }}>
            <label>{t('addresses.street')} *</label>
            <Controller
              name="street"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t('addresses.streetPlaceholder')}
                  status={errors.street ? 'error' : undefined}
                />
              )}
            />
            {errors.street && (
              <Text type="danger" style={{ fontSize: 12 }}>{errors.street.message}</Text>
            )}
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('addresses.ward')} *</label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('addresses.wardPlaceholder')}
                      status={errors.ward ? 'error' : undefined}
                    />
                  )}
                />
                {errors.ward && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.ward.message}</Text>
                )}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('addresses.district')} *</label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('addresses.districtPlaceholder')}
                      status={errors.district ? 'error' : undefined}
                    />
                  )}
                />
                {errors.district && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.district.message}</Text>
                )}
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('addresses.city')} *</label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('addresses.cityPlaceholder')}
                      status={errors.city ? 'error' : undefined}
                    />
                  )}
                />
                {errors.city && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.city.message}</Text>
                )}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 16 }}>
                <label>{t('addresses.postalCode')}</label>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('addresses.postalCodePlaceholder')}
                      status={errors.postalCode ? 'error' : undefined}
                    />
                  )}
                />
                {errors.postalCode && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.postalCode.message}</Text>
                )}
              </div>
            </Col>
          </Row>

          <div style={{ marginBottom: 16 }}>
            <label>{t('addresses.addressType')} *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'home', label: t('addresses.typeHome') },
                    { value: 'work', label: t('addresses.typeWork') },
                  ]}
                />
              )}
            />
            {errors.type && (
              <Text type="danger" style={{ fontSize: 12 }}>{errors.type.message}</Text>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}
