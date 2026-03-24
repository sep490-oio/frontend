import { useState } from 'react'
import {
  Typography,
  Table,
  Card,
  Button,
  Modal,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Form,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  useStorageLocations,
  useCreateStorageLocation,
  useDeleteStorageLocation,
} from '@/features/inspector/api'
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
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form] = Form.useForm<CreateLocationForm>()

  const { data: locations, isLoading } = useStorageLocations()
  const createMutation = useCreateStorageLocation()
  const deleteMutation = useDeleteStorageLocation()

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createMutation.mutateAsync(values)
      message.success('Storage location created')
      setCreateModalOpen(false)
      form.resetFields()
    } catch {
      // validation errors are handled by form
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      message.success('Storage location deleted')
    } catch {
      message.error('Failed to delete storage location')
    }
  }

  const columns = [
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => <Typography.Text strong>{label}</Typography.Text>,
    },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
    },
    {
      title: 'Aisle',
      dataIndex: 'aisle',
      key: 'aisle',
    },
    {
      title: 'Shelf',
      dataIndex: 'shelf',
      key: 'shelf',
    },
    {
      title: 'Bin',
      dataIndex: 'bin',
      key: 'bin',
    },
    {
      title: 'Status',
      dataIndex: 'isOccupied',
      key: 'isOccupied',
      render: (occupied: boolean) =>
        occupied ? (
          <Tag color="orange">Occupied</Tag>
        ) : (
          <Tag color="green">Available</Tag>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: StorageLocationDto) => (
        <Popconfirm
          title="Delete this location?"
          description="This action cannot be undone."
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={record.isOccupied}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title
          level={2}
          style={{ margin: 0, fontFamily: SERIF_FONT, color: '#1A1A1A' }}
        >
          Storage Management
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ background: '#8B7355', borderColor: '#8B7355' }}
        >
          Add Location
        </Button>
      </div>

      <Card>
        <Table<StorageLocationDto>
          columns={columns}
          dataSource={locations ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="Add Storage Location"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        okText="Create"
        okButtonProps={{ style: { background: '#8B7355', borderColor: '#8B7355' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }} direction="vertical" size="small">
            <Form.Item name="zone" label="Zone" rules={[{ required: true, message: 'Zone is required' }]}>
              <Input placeholder="e.g. A" />
            </Form.Item>
            <Form.Item name="aisle" label="Aisle" rules={[{ required: true, message: 'Aisle is required' }]}>
              <Input placeholder="e.g. 01" />
            </Form.Item>
            <Form.Item name="shelf" label="Shelf" rules={[{ required: true, message: 'Shelf is required' }]}>
              <Input placeholder="e.g. 03" />
            </Form.Item>
            <Form.Item name="bin" label="Bin" rules={[{ required: true, message: 'Bin is required' }]}>
              <Input placeholder="e.g. B2" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
