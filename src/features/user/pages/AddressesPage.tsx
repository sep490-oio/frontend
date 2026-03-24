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

const addressSchema = z.object({
  recipientName: z.string().min(1, 'Vui long nhap ten nguoi nhan'),
  phoneNumber: z.string().min(1, 'Vui long nhap so dien thoai'),
  street: z.string().min(1, 'Vui long nhap dia chi'),
  ward: z.string().min(1, 'Vui long nhap phuong/xa'),
  district: z.string().min(1, 'Vui long nhap quan/huyen'),
  city: z.string().min(1, 'Vui long nhap tinh/thanh pho'),
  postalCode: z.string().optional().or(z.literal('')),
  type: z.string().min(1, 'Vui long chon loai dia chi'),
})

type AddressFormValues = z.infer<typeof addressSchema>

// -- Component -----------------------------------------------------------------

export default function AddressesPage() {
  const { t: _t } = useTranslation('common')
  const { message } = App.useApp()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddressDto | null>(null)

  const { data: addresses, isLoading } = useAddresses()
  const addAddress = useAddAddress()
  const updateAddress = useUpdateAddress()
  const removeAddress = useRemoveAddress()
  const setDefault = useSetDefaultAddress()

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
        message.success('Cap nhat dia chi thanh cong')
      } else {
        await addAddress.mutateAsync(payload)
        message.success('Them dia chi thanh cong')
      }
      setModalOpen(false)
    } catch {
      message.error('Khong the luu dia chi')
    }
  })

  const onDelete = async (id: string) => {
    try {
      await removeAddress.mutateAsync(id)
      message.success('Xoa dia chi thanh cong')
    } catch {
      message.error('Khong the xoa dia chi')
    }
  }

  const onSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id)
      message.success('Da dat lam dia chi mac dinh')
    } catch {
      message.error('Khong the dat dia chi mac dinh')
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Dia chi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Them dia chi
        </Button>
      </div>

      {!addresses?.length ? (
        <Empty description="Chua co dia chi nao" />
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
                    Sua
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="Xoa dia chi?"
                    description="Ban co chac muon xoa dia chi nay?"
                    onConfirm={() => onDelete(addr.id)}
                    okText="Xoa"
                    cancelText="Huy"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removeAddress.isPending}
                    >
                      Xoa
                    </Button>
                  </Popconfirm>,
                  addr.isDefault ? (
                    <Button key="default" type="text" disabled icon={<StarFilled style={{ color: '#faad14' }} />}>
                      Mac dinh
                    </Button>
                  ) : (
                    <Button
                      key="default"
                      type="text"
                      icon={<StarOutlined />}
                      onClick={() => onSetDefault(addr.id)}
                      loading={setDefault.isPending}
                    >
                      Mac dinh
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
                      {addr.type === 'home' ? 'Nha rieng' : 'Co quan'}
                    </Tag>
                    {addr.isDefault && <Tag color="gold">Mac dinh</Tag>}
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
        title={editingAddress ? 'Sua dia chi' : 'Them dia chi moi'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        confirmLoading={addAddress.isPending || updateAddress.isPending}
        okText={editingAddress ? 'Cap nhat' : 'Them'}
        cancelText="Huy"
      >
        <form>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label>Ten nguoi nhan *</label>
                <Controller
                  name="recipientName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Ten nguoi nhan"
                      status={errors.recipientName ? 'error' : undefined}
                    />
                  )}
                />
                {errors.recipientName && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.recipientName.message}</Text>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label>So dien thoai *</label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="So dien thoai"
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
            <label>Dia chi *</label>
            <Controller
              name="street"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="So nha, ten duong..."
                  status={errors.street ? 'error' : undefined}
                />
              )}
            />
            {errors.street && (
              <Text type="danger" style={{ fontSize: 12 }}>{errors.street.message}</Text>
            )}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label>Phuong/Xa *</label>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Phuong/Xa"
                      status={errors.ward ? 'error' : undefined}
                    />
                  )}
                />
                {errors.ward && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.ward.message}</Text>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label>Quan/Huyen *</label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Quan/Huyen"
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
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label>Tinh/Thanh pho *</label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Tinh/Thanh pho"
                      status={errors.city ? 'error' : undefined}
                    />
                  )}
                />
                {errors.city && (
                  <Text type="danger" style={{ fontSize: 12 }}>{errors.city.message}</Text>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label>Ma buu chinh</label>
                <Controller
                  name="postalCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Ma buu chinh"
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
            <label>Loai dia chi *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'home', label: 'Nha rieng' },
                    { value: 'work', label: 'Co quan' },
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
