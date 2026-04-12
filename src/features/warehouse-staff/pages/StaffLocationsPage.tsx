import { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Tabs,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useStorageLocations,
  useCreateStorageLocation,
  useDeleteStorageLocation,
  useWarehouseItems,
  type StorageLocationDto,
} from '@/features/warehouse/api'
import type { WarehouseItemDto } from '@/types'
import { OccupancyLocationMap } from '../components/OccupancyLocationMap'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime } from '@/utils/format'
import { SANS_FONT } from '@/styles/tokens'

interface CreateLocationForm {
  zone: string
  aisle: string
  shelf: string
  bin: string
}

export default function StaffLocationsPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focus = searchParams.get('focus') ?? undefined

  const { data: locations, isLoading: loadingLocs } = useStorageLocations({ vacantOnly: false })
  const { data: itemsPage, isLoading: loadingItems } = useWarehouseItems({ pageSize: 500 })

  const createMutation = useCreateStorageLocation()
  const deleteMutation = useDeleteStorageLocation()

  const [createOpen, setCreateOpen] = useState(false)
  const [form] = Form.useForm<CreateLocationForm>()

  const itemsByLocationId = useMemo(() => {
    const map = new Map<string, WarehouseItemDto>()
    ;(itemsPage?.items ?? []).forEach((it) => {
      if (it.storageLocationId) map.set(it.storageLocationId, it)
    })
    return map
  }, [itemsPage])

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createMutation.mutateAsync(values)
      message.success(t('staffLocations.created', 'Storage location created'))
      setCreateOpen(false)
      form.resetFields()
    } catch {
      // form validation handled inline
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      message.success(t('staffLocations.deleted', 'Storage location deleted'))
    } catch {
      message.error(t('staffLocations.deleteError', 'Failed to delete storage location'))
    }
  }

  const columns = [
    {
      title: t('staffLocations.label', 'Label'),
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Typography.Text strong>{label}</Typography.Text>,
    },
    { title: t('staffLocations.zone', 'Zone'), dataIndex: 'zone', key: 'zone' },
    { title: t('staffLocations.aisle', 'Aisle'), dataIndex: 'aisle', key: 'aisle' },
    { title: t('staffLocations.shelf', 'Shelf'), dataIndex: 'shelf', key: 'shelf' },
    { title: t('staffLocations.bin', 'Bin'), dataIndex: 'bin', key: 'bin' },
    {
      title: t('staffLocations.status', 'Status'),
      dataIndex: 'isOccupied',
      key: 'isOccupied',
      render: (occupied: boolean) =>
        occupied ? (
          <Tag color="orange">{t('staffLocations.occupied', 'Occupied')}</Tag>
        ) : (
          <Tag color="green">{t('staffLocations.available', 'Available')}</Tag>
        ),
    },
    {
      title: t('staffLocations.created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('staffLocations.actions', 'Actions'),
      key: 'actions',
      render: (_: unknown, record: StorageLocationDto) => (
        <Popconfirm
          title={t('staffLocations.deleteConfirmTitle', 'Delete this location?')}
          description={t('staffLocations.deleteConfirmDesc', 'This action cannot be undone.')}
          onConfirm={() => handleDelete(record.id)}
          okText={t('staffLocations.delete', 'Delete')}
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={record.isOccupied}
          >
            {t('staffLocations.delete', 'Delete')}
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'map',
      label: t('staffLocations.tabMap', 'Map'),
      children: (
        <Card>
          <OccupancyLocationMap
            locations={locations ?? []}
            itemsByLocationId={itemsByLocationId}
            focusLocationId={focus}
            loading={loadingLocs || loadingItems}
            onOccupiedClick={(id) => navigate(`/warehouse-staff/items/${id}`)}
          />
        </Card>
      ),
    },
    {
      key: 'list',
      label: t('staffLocations.tabList', 'Locations'),
      children: (
        <Card>
          <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              {t('staffLocations.addLocation', 'Add Location')}
            </Button>
          </Space>
          <ResponsiveTable<StorageLocationDto>
            mobileMode="card"
            columns={columns}
            dataSource={locations ?? []}
            rowKey="id"
            loading={loadingLocs}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('staffLocations.title', 'Storage Locations')}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontFamily: SANS_FONT, fontSize: 13 }}>
          {t('staffLocations.subtitle', 'Manage warehouse topology and view occupancy')}
        </Typography.Text>
      </div>

      <Tabs defaultActiveKey="map" items={tabItems} />

      <Modal
        title={t('staffLocations.addStorageLocation', 'Add Storage Location')}
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText={t('staffLocations.create', 'Create')}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="zone"
            label={t('staffLocations.zone', 'Zone')}
            rules={[{ required: true, message: t('staffLocations.zoneRequired', 'Zone is required') }]}
          >
            <Input placeholder="e.g. A" />
          </Form.Item>
          <Form.Item
            name="aisle"
            label={t('staffLocations.aisle', 'Aisle')}
            rules={[{ required: true, message: t('staffLocations.aisleRequired', 'Aisle is required') }]}
          >
            <Input placeholder="e.g. 01" />
          </Form.Item>
          <Form.Item
            name="shelf"
            label={t('staffLocations.shelf', 'Shelf')}
            rules={[{ required: true, message: t('staffLocations.shelfRequired', 'Shelf is required') }]}
          >
            <Input placeholder="e.g. 03" />
          </Form.Item>
          <Form.Item
            name="bin"
            label={t('staffLocations.bin', 'Bin')}
            rules={[{ required: true, message: t('staffLocations.binRequired', 'Bin is required') }]}
          >
            <Input placeholder="e.g. B2" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
