import { useState, useEffect } from 'react'
import { Button, Space, Modal, Flex, Tooltip, message, Segmented, Typography, Tag } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  ShoppingOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  RocketOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import {
  useMyItems,
  useSubmitItem,
  useActivateItem,
  useResubmitItem,
} from '@/features/item/api'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ItemStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { ItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_PILL_VALUES = [
  'all',
  ItemStatus.Draft,
  ItemStatus.PendingVerify,
  ItemStatus.PendingReview,
  ItemStatus.PendingConditionConfirmation,
  ItemStatus.Approved,
  ItemStatus.Active,
  ItemStatus.InAuction,
  ItemStatus.Sold,
  ItemStatus.Rejected,
] as const

const pillBase: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 100,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 200ms ease',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-container)',
  backdropFilter: 'var(--oio-blur)',
  WebkitBackdropFilter: 'var(--oio-blur)',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  minHeight: 36,
}

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: 'var(--color-accent, #3b82f6)',
  borderColor: 'var(--color-accent, #3b82f6)',
  color: '#fff',
}

export default function MyItemsPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const [msgApi, contextHolder] = message.useMessage()
  const { isMobile } = useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters are synchronized with the URL so deep-links from the dashboard
  // and browser back/forward keep the view stable.
  const statusFilter = searchParams.get('status') ?? 'all'
  const verifyFilter =
    (searchParams.get('verify') as 'all' | 'platform' | 'no_platform' | null) ?? 'all'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reset to page 1 whenever the filter query changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter, verifyFilter])

  const setStatusFilter = (next: string) => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev)
      if (next === 'all') sp.delete('status')
      else sp.set('status', next)
      return sp
    })
  }

  const setVerifyFilter = (next: 'all' | 'platform' | 'no_platform') => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev)
      if (next === 'all') sp.delete('verify')
      else sp.set('verify', next)
      return sp
    })
  }

  // Submit modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitItemId, setSubmitItemId] = useState<string | null>(null)

  const params = {
    pageNumber: page,
    pageSize,
    sortBy: 'CreatedAt Desc',
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(verifyFilter === 'platform'
      ? { requiresPlatformInspection: true }
      : verifyFilter === 'no_platform'
      ? { requiresPlatformInspection: false }
      : {}),
  }

  const { data, isLoading } = useMyItems(params)
  const submitItem = useSubmitItem()
  const activateItem = useActivateItem()
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

  const handleResubmit = (id: string) => {
    resubmitItem.mutate({ itemId: id }, {
      onSuccess: () => msgApi.success(t('resubmitSuccess', 'Item resubmitted')),
      onError: (err) => {
        const msg = normalizeErrorMessage(err, t('resubmitError', 'Failed to resubmit item'))
        msgApi.error(msg)
      },
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

        {/* Pending Condition Confirmation: deep-link to warehouse detail */}
        {s === ItemStatus.PendingConditionConfirmation && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() =>
              navigate(
                `/seller/warehouse/items?status=pending_condition_confirmation`,
              )
            }
          >
            {t('confirmInWarehouse', 'Confirm in warehouse')}
          </Button>
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
              onClick={() => {
                const auctionId = (record as any).auctionId
                navigate(auctionId ? `/auctions/${auctionId}` : `/items/${record.id}`)
              }}
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

        {/* Rejected: gate by warehouse vs online flow */}
        {s === ItemStatus.Rejected && (() => {
          const isWarehouseBound = record.requiresPlatformInspection || !!record.warehouseItemId
          const canResubmitOnline = !isWarehouseBound
          const canRequestReinspection = isWarehouseBound
          return (
            <>
              {canResubmitOnline && (
                <Tooltip title={t('resubmit', 'Resubmit')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={resubmitItem.isPending}
                    onClick={() => handleResubmit(record.id)}
                  />
                </Tooltip>
              )}
              {canRequestReinspection && record.warehouseItemId && (
                <Tooltip title={t('myItemsActions.openWarehouse', 'Open warehouse item')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<AuditOutlined />}
                    onClick={() => navigate(`/seller/warehouse/items/${record.warehouseItemId}`)}
                  />
                </Tooltip>
              )}
              {canRequestReinspection && !record.warehouseItemId && (
                <Tag style={{ margin: 0 }}>{t('myItemsActions.warehousePending', 'Pending warehouse intake')}</Tag>
              )}
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
          )
        })()}
      </Space>
    )
  }

  const columns: ColumnsType<ItemDto> = [
    {
      title: t('title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record) => {
        const primaryImg = record.images?.find((img) => img.isPrimary) ?? record.images?.[0]
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '100%' }}>
            {primaryImg && (
              <img
                src={primaryImg.thumbnailUrl ?? primaryImg.url}
                alt=""
                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <Button
              type="link"
              onClick={() => navigate(`/items/${record.id}`)}
              style={{ padding: 0, textAlign: 'left', maxWidth: '100%', height: 'auto' }}
            >
              <Typography.Text ellipsis style={{ maxWidth: '100%', color: 'inherit' }}>
                {title}
              </Typography.Text>
            </Button>
          </div>
        )
      },
    },
    {
      title: t('condition', 'Condition'),
      dataIndex: 'condition',
      key: 'condition',
      width: 110,
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
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: tc('action.actions', 'Actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record: ItemDto) => renderActions(record),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
      {contextHolder}

      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
        <h1
          className="oio-serif"
          style={{
            margin: 0,
            fontSize: isMobile ? 24 : 32,
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {t('myItems', 'My Items')}
        </h1>
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

      {/* Verification dimension filter — distinct from item status */}
      <Flex gap={12} align="center" style={{ marginBottom: 16 }} wrap="wrap">
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('verificationFilter', 'Platform verification')}:
        </span>
        <Segmented
          value={verifyFilter}
          onChange={(v) => setVerifyFilter(v as 'all' | 'platform' | 'no_platform')}
          options={[
            { label: t('verifyAll', 'All'), value: 'all' },
            { label: t('verifyNeedsPlatform', 'Needs Platform Verification'), value: 'platform' },
            { label: t('verifyDirectReview', 'Direct Review'), value: 'no_platform' },
          ]}
        />
      </Flex>

      {/* Status pills */}
      <Flex gap={8} wrap="wrap" style={{ marginBottom: 24 }}>
        {STATUS_PILL_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            style={statusFilter === value ? pillActive : pillBase}
            onClick={() => setStatusFilter(value)}
          >
            {t(`statusPill.${value}`)}
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
        title={<span className="oio-serif" style={{ fontSize: 20 }}>{t('submitItem', 'Submit Item')}</span>}
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false)
          setSubmitItemId(null)
        }}
        footer={null}
        centered
        style={{ borderRadius: 24, overflow: 'hidden' }}
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
