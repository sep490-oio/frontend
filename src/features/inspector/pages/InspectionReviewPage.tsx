import { useState } from 'react'
import { Typography, Table, Card, Button, Modal, Input, Select, Space, message } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useInspectionQueue, useReviewInspection } from '@/features/inspector/api'
import type { InspectionQueueItem } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { TablePaginationConfig } from 'antd'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function InspectionReviewPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InspectionQueueItem | null>(null)
  const [decision, setDecision] = useState<string>('')
  const [reason, setReason] = useState('')

  const { data, isLoading } = useInspectionQueue({
    pageNumber: page,
    pageSize,
    status: 'inspected',
  })

  const reviewMutation = useReviewInspection()

  const openReviewModal = (item: InspectionQueueItem, initialDecision: string) => {
    setSelectedItem(item)
    setDecision(initialDecision)
    setReason('')
    setReviewModalOpen(true)
  }

  const handleReview = async () => {
    if (!selectedItem || !decision) return

    try {
      await reviewMutation.mutateAsync({
        shipmentId: selectedItem.id,
        decision,
        reason: reason || undefined,
      })
      message.success(`Inspection ${decision === 'approved' ? 'approved' : 'rejected'} successfully`)
      setReviewModalOpen(false)
      setSelectedItem(null)
    } catch {
      message.error('Failed to submit review')
    }
  }

  const columns = [
    {
      title: 'Item',
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
    },
    {
      title: 'Seller',
      dataIndex: 'sellerName',
      key: 'sellerName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Arrived',
      dataIndex: 'arrivedAt',
      key: 'arrivedAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: InspectionQueueItem) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => openReviewModal(record, 'approved')}
            style={{ background: '#4A7C59', borderColor: '#4A7C59' }}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => openReviewModal(record, 'rejected')}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ]

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1)
    setPageSize(pagination.pageSize ?? 12)
  }

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 24, fontFamily: SERIF_FONT, color: '#1A1A1A' }}
      >
        Inspection Reviews
      </Typography.Title>

      <Card>
        <Table<InspectionQueueItem>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: page,
            pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>

      <Modal
        title="Review Inspection"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={handleReview}
        confirmLoading={reviewMutation.isPending}
        okText={decision === 'approved' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: decision === 'rejected',
          style: decision === 'approved' ? { background: '#4A7C59', borderColor: '#4A7C59' } : undefined,
        }}
      >
        {selectedItem && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>Item:</Typography.Text>{' '}
              <Typography.Text>{selectedItem.itemTitle}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Decision
              </Typography.Text>
              <Select
                value={decision}
                onChange={setDecision}
                options={[
                  { value: 'approved', label: 'Approve' },
                  { value: 'rejected', label: 'Reject' },
                ]}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Notes
              </Typography.Text>
              <Input.TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add review notes (required for rejections)"
                rows={3}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}
