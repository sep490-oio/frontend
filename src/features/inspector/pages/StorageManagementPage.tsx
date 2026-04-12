import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Form,
} from 'antd'
import { PlusOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import {
  useStorageLocations,
  useCreateStorageLocation,
  useDeleteStorageLocation,
  useStoreWarehouseItem,
} from '@/features/inspector/api'
import { useWarehouseItems } from '@/features/warehouse/api'
import type { StorageLocationDto } from '@/features/inspector/api'
import { formatDateTime } from '@/utils/format'
import { SERIF_FONT } from '@/styles/tokens'

interface CreateLocationForm {
  zone: string
  aisle: string
  shelf: string
  bin: string
}

export default function StorageManagementPage() {
  const { t } = useTranslation('inspector')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [storeModalOpen, setStoreModalOpen] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [form] = Form.useForm<CreateLocationForm>()

  const { data: locations, isLoading } = useStorageLocations()
  const createMutation = useCreateStorageLocation()
  const deleteMutation = useDeleteStorageLocation()
  const storeMutation = useStoreWarehouseItem()
  const { data: warehouseItems } = useWarehouseItems()

  const handleStoreItem = async () => {
    if (!storeModalOpen || !selectedItemId) return
    try {
      await storeMutation.mutateAsync({ warehouseItemId: selectedItemId, storageLocationId: storeModalOpen })
      message.success(t('storage.itemStored'))
      setStoreModalOpen(null)
      setSelectedItemId('')
    } catch {
      message.error(t('storage.storeItemError'))
    }
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createMutation.mutateAsync(values)
      message.success(t('storage.locationCreated'))
      setCreateModalOpen(false)
      form.resetFields()
    } catch {
      // validation errors are handled by form
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      message.success(t('storage.locationDeleted'))
    } catch {
      message.error(t('storage.deleteLocationError'))
    }
  }

  const columns = [
    {
      title: t('storage.label'),
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Typography.Text strong>{label}</Typography.Text>,
    },
    {
      title: t('storage.zone'),
      dataIndex: 'zone',
      key: 'zone',
    },
    {
      title: t('storage.aisle'),
      dataIndex: 'aisle',
      key: 'aisle',
    },
    {
      title: t('storage.shelf'),
      dataIndex: 'shelf',
      key: 'shelf',
    },
    {
      title: t('storage.bin'),
      dataIndex: 'bin',
      key: 'bin',
    },
    {
      title: t('storage.status'),
      dataIndex: 'isOccupied',
      key: 'isOccupied',
      render: (occupied: boolean) =>
        occupied ? (
          <Tag color="orange">{t('storage.occupied')}</Tag>
        ) : (
          <Tag color="green">{t('storage.available')}</Tag>
        ),
    },
    {
      title: t('storage.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('storage.actions'),
      key: 'actions',
      render: (_: unknown, record: StorageLocationDto) => (
        <Space size={4}>
          {!record.isOccupied && (
            <Button
              type="link"
              icon={<InboxOutlined />}
              size="small"
              onClick={() => setStoreModalOpen(record.id)}
              style={{ color: 'var(--color-accent)' }}
            >
              {t('storage.storeItem')}
            </Button>
          )}
          <Popconfirm
            title={t('storage.deleteConfirmTitle')}
            description={t('storage.deleteConfirmDesc')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('storage.delete')}
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.isOccupied}
            >
              {t('storage.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title
          level={2}
          style={{ margin: 0, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)' }}
        >
          {t('storage.title')}
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('storage.addLocation')}
        </Button>
      </div>

      <Card>
        <ResponsiveTable<StorageLocationDto>
          mobileMode="card"
          columns={columns}
          dataSource={locations ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={t('storage.addStorageLocation')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText={t('storage.create')}
        okButtonProps={{ style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }} direction="vertical" size="small">
            <Form.Item name="zone" label={t('storage.zone')} rules={[{ required: true, message: t('storage.zoneRequired') }]}>
              <Input placeholder="e.g. A" />
            </Form.Item>
            <Form.Item name="aisle" label={t('storage.aisle')} rules={[{ required: true, message: t('storage.aisleRequired') }]}>
              <Input placeholder="e.g. 01" />
            </Form.Item>
            <Form.Item name="shelf" label={t('storage.shelf')} rules={[{ required: true, message: t('storage.shelfRequired') }]}>
              <Input placeholder="e.g. 03" />
            </Form.Item>
            <Form.Item name="bin" label={t('storage.bin')} rules={[{ required: true, message: t('storage.binRequired') }]}>
              <Input placeholder="e.g. B2" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Store Item Modal */}
      <Modal
        title={t('storage.storeWarehouseItem')}
        open={!!storeModalOpen}
        onCancel={() => { setStoreModalOpen(null); setSelectedItemId('') }}
        onOk={handleStoreItem}
        confirmLoading={storeMutation.isPending}
        okText={t('storage.store')}
        okButtonProps={{ disabled: !selectedItemId, style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
      >
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('storage.selectWarehouseItem')}
          </Typography.Text>
          <Select
            style={{ width: '100%' }}
            placeholder={t('storage.searchWarehouseItems')}
            showSearch
            optionFilterProp="label"
            value={selectedItemId || undefined}
            onChange={setSelectedItemId}
            options={(warehouseItems?.items ?? [])
              .filter((item) => !item.storageLocationId)
              .map((item) => ({
                label: `${item.itemId.slice(0, 8)}... — ${item.status}`,
                value: item.id,
              }))}
          />
        </div>
      </Modal>
    </div>
  )
}
