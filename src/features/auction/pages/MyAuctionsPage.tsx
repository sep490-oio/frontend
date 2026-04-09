import { useState } from 'react'
import { Button, Space, Modal, Flex, Tooltip, Input, message, DatePicker, Form, Card, List } from 'antd'
// Note: DatePicker and Input are still used in the Relist modal below
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import {
  useMyAuctions,
  useSubmitAuction,
  useCancelAuction,
  useSetAuctionTiming,
  useRelistAuction,
  useOfferRunnerUp,
} from '@/features/auction/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuctionStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { AuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { AuctionTimingSection } from '@/features/auction/components/AuctionTimingSection'

const STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: AuctionStatus.Draft, label: 'Draft' },
  { value: AuctionStatus.Approved, label: 'Approved' },
  { value: AuctionStatus.Scheduled, label: 'Scheduled' },
  { value: AuctionStatus.Active, label: 'Active' },
  { value: AuctionStatus.Ended, label: 'Ended' },
  { value: AuctionStatus.Sold, label: 'Sold' },
  { value: AuctionStatus.Failed, label: 'Failed' },
  { value: AuctionStatus.Cancelled, label: 'Cancelled' },
  { value: AuctionStatus.Pending, label: 'Pending' },
  { value: AuctionStatus.Terminated, label: 'Terminated' },
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


export default function MyAuctionsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const [msgApi, contextHolder] = message.useMessage()
  const { isMobile } = useBreakpoint()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelAuctionId, setCancelAuctionId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Timing modal state
  const [timingModalOpen, setTimingModalOpen] = useState(false)
  const [timingAuctionId, setTimingAuctionId] = useState<string | null>(null)
  const [modalForm] = Form.useForm()
  // When true, handleTimingConfirm will submit auction first, then set timing
  const [submitPendingTimingAuctionId, setSubmitPendingTimingAuctionId] = useState<string | null>(null)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useMyAuctions(params, { refetchInterval: 30000 })
  const submitAuction = useSubmitAuction()
  const cancelAuction = useCancelAuction()
  const setAuctionTiming = useSetAuctionTiming()
  const relistAuction = useRelistAuction()
  const offerRunnerUp = useOfferRunnerUp()

  /* ── Cancel handlers ─────────────────────────────────────────────── */

  const openCancelModal = (id: string) => {
    setCancelAuctionId(id)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const handleCancelConfirm = () => {
    if (!cancelAuctionId || !cancelReason.trim()) return
    cancelAuction.mutate(
      { auctionId: cancelAuctionId, reason: cancelReason.trim() },
      {
        onSuccess: () => {
          msgApi.success(t('cancelSuccess', 'Auction cancelled'))
          setCancelModalOpen(false)
          setCancelAuctionId(null)
        },
      },
    )
  }

  /* ── Timing handlers ─────────────────────────────────────────────── */

  const openTimingModal = (id: string) => {
    setTimingAuctionId(id)
    modalForm.resetFields()
    setTimingModalOpen(true)
  }

  const handleTimingConfirm = async () => {
    if (!timingAuctionId) return

    try {
      await modalForm.validateFields()
    } catch {
      return
    }

    const fields = modalForm.getFieldsValue([
      'qualificationStartAt',
      'qualificationEndAt',
      'startTime',
      'endTime',
      'autoExtend',
      'extensionMinutes',
    ])

    if (!fields.startTime || !fields.endTime) return

    const isSubmitFlow = submitPendingTimingAuctionId === timingAuctionId

    const timingPayload = {
      auctionId: timingAuctionId,
      startTime: dayjs(fields.startTime).toISOString(),
      endTime: dayjs(fields.endTime).toISOString(),
      ...(fields.qualificationStartAt
        ? { qualificationStartAt: dayjs(fields.qualificationStartAt).toISOString() }
        : {}),
      ...(fields.qualificationEndAt
        ? { qualificationEndAt: dayjs(fields.qualificationEndAt).toISOString() }
        : {}),
      autoExtend: fields.autoExtend ?? false,
      extensionMinutes: fields.extensionMinutes ?? 5,
    }

    if (isSubmitFlow) {
      // Submit first, then set timing
      try {
        await submitAuction.mutateAsync(timingAuctionId)
        try {
          await setAuctionTiming.mutateAsync(timingPayload)
          msgApi.success(t('submitAndTimingSuccess', 'Auction submitted and timing configured'))
        } catch {
          msgApi.warning(t('submitSuccessTimingFailed', 'Auction submitted successfully, but timing could not be set. Please set timing manually.'))
        }
      } catch {
        msgApi.error(t('submitFailed', 'Failed to submit auction'))
      }
      setSubmitPendingTimingAuctionId(null)
      setTimingModalOpen(false)
      setTimingAuctionId(null)
    } else {
      // Normal timing-only flow
      setAuctionTiming.mutate(timingPayload, {
        onSuccess: () => {
          msgApi.success(t('timingSuccess', 'Timing configured'))
          setTimingModalOpen(false)
          setTimingAuctionId(null)
        },
      })
    }
  }

  /* ── Simple action handlers ──────────────────────────────────────── */

  const handleSubmit = (id: string) => {
    // Check if this auction already has timing set
    const auction = data?.items?.find((a: any) => a.id === id)
    const hasTiming = auction?.startTime && auction?.endTime

    if (hasTiming) {
      // Timing already set — submit directly
      submitAuction.mutate(id, {
        onSuccess: () => msgApi.success(t('submitSuccess', 'Auction submitted for review')),
      })
    } else {
      // No timing — open timing modal, mark as submit-pending
      setSubmitPendingTimingAuctionId(id)
      openTimingModal(id)
    }
  }

// Relist modal state
  const [relistModalOpen, setRelistModalOpen] = useState(false)
  const [relistAuctionId, setRelistAuctionId] = useState<string | null>(null)
  const [relistForm, setRelistForm] = useState<{
    qualificationStartAt: dayjs.Dayjs | null
    qualificationEndAt: dayjs.Dayjs | null
    startAt: dayjs.Dayjs | null
    endAt: dayjs.Dayjs | null
  }>({ qualificationStartAt: null, qualificationEndAt: null, startAt: null, endAt: null })

  const openRelistModal = (id: string) => {
    setRelistAuctionId(id)
    setRelistForm({ qualificationStartAt: null, qualificationEndAt: null, startAt: null, endAt: null })
    setRelistModalOpen(true)
  }

  const handleRelistConfirm = () => {
    if (!relistAuctionId || !relistForm.qualificationStartAt || !relistForm.qualificationEndAt || !relistForm.startAt || !relistForm.endAt) return
    // Validate qualification period is before auction period
    if (relistForm.qualificationEndAt.isAfter(relistForm.startAt)) {
      msgApi.error(t('relistValidation', 'Thời gian đăng ký phải trước thời gian đấu giá'))
      return
    }
    relistAuction.mutate(
      {
        auctionId: relistAuctionId,
        qualificationStartAt: relistForm.qualificationStartAt.toISOString(),
        qualificationEndAt: relistForm.qualificationEndAt.toISOString(),
        startAt: relistForm.startAt.toISOString(),
        endAt: relistForm.endAt.toISOString(),
      },
      {
        onSuccess: () => {
          msgApi.success(t('relistSuccess', 'Auction relisted'))
          setRelistModalOpen(false)
          setRelistAuctionId(null)
        },
      },
    )
  }

  const handleOfferRunnerUp = (id: string) => {
    offerRunnerUp.mutate(id, {
      onSuccess: () => msgApi.success(t('offerRunnerUpSuccess', 'Offer sent to runner-up')),
    })
  }

  /* ── Action buttons per status ───────────────────────────────────── */

  const renderActions = (record: AuctionListItemDto) => {
    const s = record.status
    return (
      <Space size="small" wrap>
        {/* Draft: Edit, Submit, Cancel */}
        {s === AuctionStatus.Draft && (
          <>
            <Tooltip title={tc('action.edit', 'Edit')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`${prefix}/auctions/${record.id}/edit`)}
              />
            </Tooltip>
            <Tooltip title={
              ((record as any)).itemStatus && ((record as any)).itemStatus !== 'approved'
                ? t('itemMustBeApproved', 'Item must be approved before submitting auction')
                : tc('action.submit', 'Submit')
            }>
              <Button
                type="text"
                size="small"
                icon={<SendOutlined />}
                loading={submitAuction.isPending}
                disabled={!!((record as any)).itemStatus && ((record as any)).itemStatus !== 'approved' && ((record as any)).itemStatus !== 'active'}
                onClick={() => handleSubmit(record.id)}
              />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => openCancelModal(record.id)}
              />
            </Tooltip>
          </>
        )}

        {/* Approved: Set Timing, Cancel */}
        {s === AuctionStatus.Approved && (
          <>
            <Tooltip title={t('setTiming', 'Set Timing')}>
              <Button
                type="text"
                size="small"
                icon={<ClockCircleOutlined />}
                onClick={() => openTimingModal(record.id)}
              />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => openCancelModal(record.id)}
              />
            </Tooltip>
          </>
        )}

        {/* Scheduled: View Detail, Cancel */}
        {s === AuctionStatus.Scheduled && (
          <>
            <Tooltip title={t('viewDetail', 'View Detail')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/auctions/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => openCancelModal(record.id)}
              />
            </Tooltip>
          </>
        )}

        {/* Active: View Detail, Cancel */}
        {s === AuctionStatus.Active && (
          <>
            <Tooltip title={t('viewDetail', 'View Detail')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/auctions/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => openCancelModal(record.id)}
              />
            </Tooltip>
          </>
        )}

        {/* Ended: View Detail */}
        {s === AuctionStatus.Ended && (
          <Tooltip title={t('viewDetail', 'View Detail')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/auctions/${record.id}`)}
            />
          </Tooltip>
        )}

        {/* Sold: View Order only — offerRunnerUp is ONLY valid in payment_defaulted (backend enforced) */}
        {s === AuctionStatus.Sold && (
          <Tooltip title={t('viewOrder', 'View Order')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/auctions/${record.id}`)}
            />
          </Tooltip>
        )}

        {/* Payment Defaulted: Relist, Offer Runner-up (BE only supports relist for PaymentDefaulted) */}
        {s === AuctionStatus.PaymentDefaulted && (
          <>
            <Tooltip title={t('relist', 'Relist')}>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                loading={relistAuction.isPending}
                onClick={() => openRelistModal(record.id)}
              />
            </Tooltip>
            <Tooltip title={t('offerRunnerUp', 'Offer Runner-up')}>
              <Button
                type="text"
                size="small"
                icon={<UserSwitchOutlined />}
                loading={offerRunnerUp.isPending}
                onClick={() => handleOfferRunnerUp(record.id)}
              />
            </Tooltip>
          </>
        )}

        {/* Cancelled: no relist (BE does not support relist for Cancelled) */}
      </Space>
    )
  }

  /* ── Table columns ──────────────────────────────────────────────── */

  const columns: ColumnsType<AuctionListItemDto> = [
    {
      title: t('title', 'Title'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
      render: (title: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.primaryImageUrl && (
            <img
              src={record.primaryImageUrl}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <Button type="link" onClick={() => navigate(`/auctions/${record.id}`)} style={{ padding: 0, textAlign: 'left' }}>
            {title}
          </Button>
        </div>
      ),
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('currentPrice', 'Current Price'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 150,
      render: (price: unknown) => {
        if (price && typeof price === 'object' && 'amount' in price) {
          const m = price as { amount: number; currency: string }
          return <PriceDisplay price={{ amount: m.amount, currency: m.currency, symbol: '' }} size="small" />
        }
        return <PriceDisplay price={(price as number) ?? 0} size="small" />
      },
    },
    {
      title: t('bids', 'Bids'),
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 70,
      align: 'center',
    },
    {
      title: t('endTime', 'End Time'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (endTime: string | undefined, record) => {
        if (!endTime) return <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
        if (record.status === AuctionStatus.Active) {
          return <CountdownTimer endTime={endTime} size="small" />
        }
        return formatDateTime(endTime)
      },
    },
    {
      title: tc('action.actions', 'Actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record: AuctionListItemDto) => renderActions(record),
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
          {t('myAuctions', 'My Auctions')}
        </h2>
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

      {/* Table / Cards / Empty */}
      {!isLoading && !data?.items?.length ? (
        <EmptyState
          title={t('noAuctions', 'No auctions found')}
          description={t('noAuctionsDesc', 'Create your first auction to get started.')}
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
      ) : isMobile ? (
        /* Mobile card view */
        <List
          dataSource={data?.items ?? []}
          loading={isLoading}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          renderItem={(record: AuctionListItemDto) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <Card
                size="small"
                style={{ width: '100%', borderRadius: 10 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <Flex vertical gap={8}>
                  <Flex justify="space-between" align="center">
                    <Button
                      type="link"
                      style={{ padding: 0, fontWeight: 600, fontSize: 15 }}
                      onClick={() => navigate(`/auctions/${record.id}`)}
                    >
                      {record.itemTitle}
                    </Button>
                    <StatusBadge status={record.status} />
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {t('currentPrice', 'Current Price')}
                    </span>
                    {record.currentPrice && typeof record.currentPrice === 'object' && 'amount' in record.currentPrice ? (
                      <PriceDisplay price={{ amount: (record.currentPrice as { amount: number; currency: string }).amount, currency: (record.currentPrice as { amount: number; currency: string }).currency, symbol: '' }} size="small" />
                    ) : (
                      <PriceDisplay price={(record.currentPrice as number) ?? 0} size="small" />
                    )}
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {t('bids', 'Bids')}: {record.bidCount ?? 0}
                    </span>
                    {record.endTime ? (
                      record.status === AuctionStatus.Active ? (
                        <CountdownTimer endTime={record.endTime} size="small" />
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{formatDateTime(record.endTime)}</span>
                      )
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
                    )}
                  </Flex>
                  <Flex justify="flex-end" style={{ marginTop: 4 }}>
                    {renderActions(record)}
                  </Flex>
                </Flex>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <ResponsiveTable<AuctionListItemDto>
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

      {/* Cancel modal */}
      <Modal
        title={t('cancelAuction', 'Cancel Auction')}
        open={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false)
          setCancelAuctionId(null)
        }}
        onOk={handleCancelConfirm}
        okText={t('confirmCancel', 'Cancel Auction')}
        okButtonProps={{
          danger: true,
          loading: cancelAuction.isPending,
          disabled: !cancelReason.trim(),
        }}
        centered
      >
        <p style={{ marginBottom: 12, color: 'var(--color-text-secondary)' }}>
          {t('cancelReasonPrompt', 'Please provide a reason for cancellation:')}
        </p>
        <Input.TextArea
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t('cancelReasonPlaceholder', 'Enter cancellation reason...')}
        />
      </Modal>

      {/* Timing modal */}
      <Modal
        title={submitPendingTimingAuctionId ? t('submitAndSetTiming', 'Submit & Set Auction Timing') : t('setTiming', 'Set Auction Timing')}
        open={timingModalOpen}
        onCancel={() => {
          setTimingModalOpen(false)
          setTimingAuctionId(null)
          setSubmitPendingTimingAuctionId(null)
        }}
        onOk={handleTimingConfirm}
        okText={t('saveTiming', 'Save Timing')}
        okButtonProps={{
          loading: setAuctionTiming.isPending,
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        centered
        width={720}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={modalForm} layout="vertical">
          <AuctionTimingSection form={modalForm} itemApproved={true} />
        </Form>
      </Modal>

      {/* Relist modal */}
      <Modal
        title={t('relistAuction', 'Đăng lại phiên đấu giá')}
        open={relistModalOpen}
        onCancel={() => { setRelistModalOpen(false); setRelistAuctionId(null) }}
        onOk={handleRelistConfirm}
        okText={t('confirmRelist', 'Đăng lại')}
        okButtonProps={{
          loading: relistAuction.isPending,
          disabled: !relistForm.qualificationStartAt || !relistForm.qualificationEndAt || !relistForm.startAt || !relistForm.endAt,
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        centered
        width={480}
      >
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              Bắt đầu đăng ký *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.qualificationStartAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, qualificationStartAt: v }))}
              placeholder="Chọn thời gian bắt đầu đăng ký"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              Kết thúc đăng ký *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.qualificationEndAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, qualificationEndAt: v }))}
              placeholder="Chọn thời gian kết thúc đăng ký"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              Bắt đầu đấu giá *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.startAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, startAt: v }))}
              placeholder="Chọn thời gian bắt đầu đấu giá"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              Kết thúc đấu giá *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={relistForm.endAt}
              onChange={(v) => setRelistForm((prev) => ({ ...prev, endAt: v }))}
              placeholder="Chọn thời gian kết thúc đấu giá"
            />
          </div>
        </Flex>
      </Modal>
    </div>
  )
}
