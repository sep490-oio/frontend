import { useState } from 'react'
import { Button, Space, Modal, Flex, Tooltip, message } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import {
  useMyItems,
  useSubmitItem,
  useActivateItem,
  useConfirmInspectedCondition,
  useResubmitItem,
} from '@/features/item/api'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ItemStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { ItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: ItemStatus.Draft, label: 'Draft' },
  { value: ItemStatus.PendingReview, label: 'Pending Review' },
  { value: ItemStatus.PendingVerify, label: 'Pending Verify' },
  { value: ItemStatus.PendingConditionConfirmation, label: 'Confirm Condition' },
  { value: ItemStatus.Approved, label: 'Approved' },
  { value: ItemStatus.Active, label: 'Active' },
  { value: ItemStatus.InAuction, label: 'In Auction' },
  { value: ItemStatus.Sold, label: 'Sold' },
  { value: ItemStatus.Rejected, label: 'Rejected' },
  { value: ItemStatus.Removed, label: 'Removed' },
] as const

const pillBase: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 100,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: 'var(--color-accent)',
  borderColor: 'var(--color-accent)',
  color: '#fff',
}

export default function MyItemsPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const [msgApi, contextHolder] = message.useMessage()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Submit modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitItemId, setSubmitItemId] = useState<string | null>(null)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useMyItems(params)
  const submitItem = useSubmitItem()
  const activateItem = useActivateItem()
  const confirmCondition = useConfirmInspectedCondition()
  const resubmitItem = useResubmitItem()

  const handleSubmitClick = (id: string) => {
    setSubmitItemId(id)
    setSubmitModalOpen(true)
  }

  const handleSubmitConfirm = (verifyByPlatform: boolean) => {
    if (!submitItemId) return
    submitItem.mutate(
      { id: submitItemId, verifyByPlatform },
      {
        onSuccess: () => {
          msgApi.success(t('submitSuccess', 'Item submitted for review'))
          setSubmitModalOpen(false)
          setSubmitItemId(null)
        },
      },
    )
  }

  const handleActivate = (id: string) => {
    activateItem.mutate(id, {
      onSuccess: () => msgApi.success(t('activateSuccess', 'Item activated')),
    })
  }

  const handleConfirmCondition = (id: string) => {
    confirmCondition.mutate(id, {
      onSuccess: () => msgApi.success(t('confirmConditionSuccess', 'Condition confirmed')),
    })
  }

  const handleResubmit = (id: string) => {
    resubmitItem.mutate({ itemId: id }, {
      onSuccess: () => msgApi.success(t('resubmitSuccess', 'Item resubmitted')),
    })
  }

  const renderActions = (record: ItemDto) => {
    const s = record.status
    return (
      <Space size="small" wrap>
        {/* Draft: Edit, Submit, Delete */}
        {s === ItemStatus.Draft && (
          <>
            <Tooltip title={tc('action.edit', 'Edit')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`${prefix}/items/${record.id}/edit`)}
              />
            </Tooltip>
            <Tooltip title={tc('action.submit', 'Submit')}>
              <Button
                type="text"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitClick(record.id)}
              />
            </Tooltip>
            <Tooltip title={tc('action.delete', 'Delete')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled
              />
            </Tooltip>
          </>
        )}

        {/* Pending Review: waiting */}
        {s === ItemStatus.PendingReview && (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontStyle: 'italic' }}>
            {t('waitingReview', 'Awaiting review...')}
          </span>
        )}

        {/* Pending Verify: waiting */}
        {s === ItemStatus.PendingVerify && (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, fontStyle: 'italic' }}>
            {t('waitingVerify', 'Ship to warehouse')}
          </span>
        )}

        {/* Pending Condition Confirmation: Confirm, Reject */}
        {s === ItemStatus.PendingConditionConfirmation && (
          <>
            <Tooltip title={t('confirmCondition', 'Confirm Condition')}>
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={confirmCondition.isPending}
                onClick={() => handleConfirmCondition(record.id)}
                style={{ color: 'var(--color-success)' }}
              />
            </Tooltip>
            <Tooltip title={tc('action.reject', 'Reject')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                disabled
              />
            </Tooltip>
          </>
        )}

        {/* Approved: Activate, Create Auction */}
        {s === ItemStatus.Approved && (
          <>
            <Tooltip title={t('activate', 'Activate')}>
              <Button
                type="text"
                size="small"
                icon={<RocketOutlined />}
                loading={activateItem.isPending}
                onClick={() => handleActivate(record.id)}
              />
            </Tooltip>
            <Tooltip title={t('createAuction', 'Create Auction')}>
              <Button
                type="text"
                size="small"
                icon={<ShoppingOutlined />}
                onClick={() => navigate(`${prefix}/auctions/create?itemId=${record.id}`)}
              />
            </Tooltip>
          </>
        )}

        {/* Active: Create Auction */}
        {s === ItemStatus.Active && (
          <Tooltip title={t('createAuction', 'Create Auction')}>
            <Button
              type="text"
              size="small"
              icon={<ShoppingOutlined />}
              onClick={() => navigate(`${prefix}/auctions/create?itemId=${record.id}`)}
            />
          </Tooltip>
        )}

        {/* In Auction: View Auction */}
        {s === ItemStatus.InAuction && (
          <Tooltip title={t('viewAuction', 'View Auction')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/items/${record.id}`)}
            />
          </Tooltip>
        )}

        {/* Sold: View Order */}
        {s === ItemStatus.Sold && (
          <Tooltip title={t('viewOrder', 'View Order')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/items/${record.id}`)}
            />
          </Tooltip>
        )}

        {/* Rejected: Resubmit, Delete */}
        {s === ItemStatus.Rejected && (
          <>
            <Tooltip title={t('resubmit', 'Resubmit')}>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                loading={resubmitItem.isPending}
                onClick={() => handleResubmit(record.id)}
              />
            </Tooltip>
            <Tooltip title={tc('action.delete', 'Delete')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled
              />
            </Tooltip>
          </>
        )}
      </Space>
    )
  }

  const columns: ColumnsType<ItemDto> = [
    {
      title: t('title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record) => (
        <Button type="link" onClick={() => navigate(`/items/${record.id}`)} style={{ padding: 0 }}>
          {title}
        </Button>
      ),
    },
    {
      title: t('condition', 'Condition'),
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      render: (condition: string) => <StatusBadge status={condition} size="small" />,
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: tc('action.actions', 'Actions'),
      key: 'actions',
      width: 200,
      render: (_: unknown, record: ItemDto) => renderActions(record),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      {contextHolder}

      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
        <h2
          className="oio-serif"
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {t('myItems', 'My Items')}
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`${prefix}/items/create`)}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            borderRadius: 8,
            height: 40,
            fontWeight: 500,
          }}
        >
          {t('createItem', 'Create Item')}
        </Button>
      </Flex>

      {/* Status pills */}
      <Flex gap={8} wrap="wrap" style={{ marginBottom: 24 }}>
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            style={statusFilter === pill.value ? pillActive : pillBase}
            onClick={() => {
              setStatusFilter(pill.value)
              setPage(1)
            }}
          >
            {pill.label}
          </button>
        ))}
      </Flex>

      {/* Table / Empty */}
      {!isLoading && !data?.items?.length ? (
        <EmptyState
          title={t('noItems', 'No items found')}
          description={t('noItemsDesc', 'Create your first item to get started.')}
          action={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`${prefix}/items/create`)}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                borderRadius: 8,
              }}
            >
              {t('createItem', 'Create Item')}
            </Button>
          }
        />
      ) : (
        <ResponsiveTable<ItemDto>
          mobileMode="card"
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      )}

      {/* Submit modal — ask about platform verification */}
      <Modal
        title={t('submitItem', 'Submit Item')}
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false)
          setSubmitItemId(null)
        }}
        footer={null}
        centered
      >
        <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
          {t(
            'submitVerifyQuestion',
            'Would you like the platform to verify this item? If yes, you will need to ship it to our warehouse for inspection.',
          )}
        </p>
        <Flex gap={12} justify="flex-end">
          <Button
            onClick={() => handleSubmitConfirm(false)}
            loading={submitItem.isPending}
          >
            {t('submitNoVerify', 'No, submit directly')}
          </Button>
          <Button
            type="primary"
            onClick={() => handleSubmitConfirm(true)}
            loading={submitItem.isPending}
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            {t('submitWithVerify', 'Yes, verify by platform')}
          </Button>
        </Flex>
      </Modal>
    </div>
  )
}
