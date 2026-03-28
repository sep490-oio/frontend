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

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

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
      message.success(t('inspector:storage.itemStored', 'Item stored successfully'))
      setStoreModalOpen(null)
      setSelectedItemId('')
    } catch {
      message.error(t('inspector:storage.storeItemError', 'Failed to store item'))
    }
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createMutation.mutateAsync(values)
      message.success(t('inspector:storage.locationCreated', 'Storage location created'))
      setCreateModalOpen(false)
      form.resetFields()
    } catch {
      // validation errors are handled by form
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      message.success(t('inspector:storage.locationDeleted', 'Storage location deleted'))
    } catch {
      message.error(t('inspector:storage.deleteLocationError', 'Failed to delete storage location'))
    }
  }

  const columns = [
    {
      title: t('inspector:storage.label', 'Label'),
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Typography.Text strong>{label}</Typography.Text>,
    },
    {
      title: t('inspector:storage.zone', 'Zone'),
      dataIndex: 'zone',
      key: 'zone',
    },
    {
      title: t('inspector:storage.aisle', 'Aisle'),
      dataIndex: 'aisle',
      key: 'aisle',
    },
    {
      title: t('inspector:storage.shelf', 'Shelf'),
      dataIndex: 'shelf',
      key: 'shelf',
    },
    {
      title: t('inspector:storage.bin', 'Bin'),
      dataIndex: 'bin',
      key: 'bin',
    },
    {
      title: t('inspector:storage.status', 'Status'),
      dataIndex: 'isOccupied',
      key: 'isOccupied',
      render: (occupied: boolean) =>
        occupied ? (
          <Tag color="orange">{t('inspector:storage.occupied', 'Occupied')}</Tag>
        ) : (
          <Tag color="green">{t('inspector:storage.available', 'Available')}</Tag>
        ),
    },
    {
      title: t('inspector:storage.created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('inspector:storage.actions', 'Actions'),
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
              {t('inspector:storage.storeItem', 'Store Item')}
            </Button>
          )}
          <Popconfirm
            title={t('inspector:storage.deleteConfirmTitle', 'Delete this location?')}
            description={t('inspector:storage.deleteConfirmDesc', 'This action cannot be undone.')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('inspector:storage.delete', 'Delete')}
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              disabled={record.isOccupied}
            >
              {t('inspector:storage.delete', 'Delete')}
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
          {t('inspector:storage.title', 'Storage Management')}
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('inspector:storage.addLocation', 'Add Location')}
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
        title={t('inspector:storage.addStorageLocation', 'Add Storage Location')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText={t('inspector:storage.create', 'Create')}
        okButtonProps={{ style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }} direction="vertical" size="small">
            <Form.Item name="zone" label={t('inspector:storage.zone', 'Zone')} rules={[{ required: true, message: t('inspector:storage.zoneRequired', 'Zone is required') }]}>
              <Input placeholder="e.g. A" />
            </Form.Item>
            <Form.Item name="aisle" label={t('inspector:storage.aisle', 'Aisle')} rules={[{ required: true, message: t('inspector:storage.aisleRequired', 'Aisle is required') }]}>
              <Input placeholder="e.g. 01" />
            </Form.Item>
            <Form.Item name="shelf" label={t('inspector:storage.shelf', 'Shelf')} rules={[{ required: true, message: t('inspector:storage.shelfRequired', 'Shelf is required') }]}>
              <Input placeholder="e.g. 03" />
            </Form.Item>
            <Form.Item name="bin" label={t('inspector:storage.bin', 'Bin')} rules={[{ required: true, message: t('inspector:storage.binRequired', 'Bin is required') }]}>
              <Input placeholder="e.g. B2" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Store Item Modal */}
      <Modal
        title={t('inspector:storage.storeWarehouseItem', 'Store Warehouse Item')}
        open={!!storeModalOpen}
        onCancel={() => { setStoreModalOpen(null); setSelectedItemId('') }}
        onOk={handleStoreItem}
        confirmLoading={storeMutation.isPending}
        okText={t('inspector:storage.store', 'Store')}
        okButtonProps={{ disabled: !selectedItemId, style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } }}
      >
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('inspector:storage.selectWarehouseItem', 'Select a warehouse item to store:')}
          </Typography.Text>
          <Select
            style={{ width: '100%' }}
            placeholder={t('inspector:storage.searchWarehouseItems', 'Search warehouse items...')}
            showSearch
            optionFilterProp="label"
            value={selectedItemId || undefined}
            onChange={setSelectedItemId}
            options={(warehouseItems?.items ?? [])
              .filter((item) => !item.storageLocationId)
              .map((item) => ({
                label: `${item.itemId.slice(0, 8)}... — ${item.condition}`,
                value: item.id,
              }))}
          />
        </div>
      </Modal>
    </div>
  )
}
