import { useState } from 'react'
import { Button, Space, Modal, Flex, Tooltip, Input, message, DatePicker, Switch, Card, List } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import {
  useMyAuctions,
  useSubmitAuction,
  usePublishAuction,
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

interface TimingFormState {
  startTime: dayjs.Dayjs | null
  endTime: dayjs.Dayjs | null
  qualificationStartAt: dayjs.Dayjs | null
  qualificationEndAt: dayjs.Dayjs | null
  autoExtend: boolean
  extensionMinutes: number
}

const INITIAL_TIMING: TimingFormState = {
  startTime: null,
  endTime: null,
  qualificationStartAt: null,
  qualificationEndAt: null,
  autoExtend: false,
  extensionMinutes: 5,
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
  const [timingForm, setTimingForm] = useState<TimingFormState>(INITIAL_TIMING)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useMyAuctions(params, { refetchInterval: 30000 })
  const submitAuction = useSubmitAuction()
  const publishAuction = usePublishAuction()
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
    setTimingForm(INITIAL_TIMING)
    setTimingModalOpen(true)
  }

  const handleTimingConfirm = () => {
    if (!timingAuctionId || !timingForm.startTime || !timingForm.endTime) return
    setAuctionTiming.mutate(
      {
        auctionId: timingAuctionId,
        startTime: timingForm.startTime.toISOString(),
        endTime: timingForm.endTime.toISOString(),
        ...(timingForm.qualificationStartAt
          ? { qualificationStartAt: timingForm.qualificationStartAt.toISOString() }
          : {}),
        ...(timingForm.qualificationEndAt
          ? { qualificationEndAt: timingForm.qualificationEndAt.toISOString() }
          : {}),
      },
      {
        onSuccess: () => {
          msgApi.success(t('timingSuccess', 'Timing configured'))
          setTimingModalOpen(false)
          setTimingAuctionId(null)
        },
      },
    )
  }

  /* ── Simple action handlers ──────────────────────────────────────── */

  const handleSubmit = (id: string) => {
    submitAuction.mutate(id, {
      onSuccess: () => msgApi.success(t('submitSuccess', 'Auction submitted for review')),
    })
  }

  const handlePublish = (id: string) => {
    publishAuction.mutate(id, {
      onSuccess: () => msgApi.success(t('publishSuccess', 'Auction published')),
    })
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
                disabled={!!((record as any)).itemStatus && ((record as any)).itemStatus !== 'approved'}
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

        {/* Scheduled: Publish, Cancel */}
        {s === AuctionStatus.Scheduled && (
          <>
            <Tooltip title={t('publish', 'Publish')}>
              <Button
                type="text"
                size="small"
                icon={<RocketOutlined />}
                loading={publishAuction.isPending}
                onClick={() => handlePublish(record.id)}
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

        {/* Sold: View Order, Offer Runner-up */}
        {s === AuctionStatus.Sold && (
          <>
            <Tooltip title={t('viewOrder', 'View Order')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/auctions/${record.id}`)}
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
        <Button type="link" onClick={() => navigate(`/auctions/${record.id}`)} style={{ padding: 0 }}>
          {title}
        </Button>
      ),
    },
    {
      title: t('type', 'Type'),
      dataIndex: 'auctionType',
      key: 'auctionType',
      width: 100,
      render: (type: string | undefined) =>
        type ? <StatusBadge status={type} size="small" /> : <span style={{ color: 'var(--color-text-secondary)' }}>-</span>,
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('currentPrice', 'Current Price'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 160,
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
      width: 80,
      align: 'center',
    },
    {
      title: t('endTime', 'End Time'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
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
      width: 200,
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`${prefix}/auctions/create`)}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            borderRadius: 8,
            height: 40,
            fontWeight: 500,
          }}
        >
          {t('createAuction', 'Create Auction')}
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

      {/* Table / Cards / Empty */}
      {!isLoading && !data?.items?.length ? (
        <EmptyState
          title={t('noAuctions', 'No auctions found')}
          description={t('noAuctionsDesc', 'Create your first auction to get started.')}
          action={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`${prefix}/auctions/create`)}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                borderRadius: 8,
              }}
            >
              {t('createAuction', 'Create Auction')}
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
        title={t('setTiming', 'Set Auction Timing')}
        open={timingModalOpen}
        onCancel={() => {
          setTimingModalOpen(false)
          setTimingAuctionId(null)
        }}
        onOk={handleTimingConfirm}
        okText={t('saveTiming', 'Save Timing')}
        okButtonProps={{
          loading: setAuctionTiming.isPending,
          disabled: !timingForm.startTime || !timingForm.endTime,
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        centered
        width={480}
      >
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          {/* Start Time */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              {t('startTime', 'Start Time')} *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={timingForm.startTime}
              onChange={(v) => setTimingForm((prev) => ({ ...prev, startTime: v }))}
              placeholder={t('selectStartTime', 'Select start time')}
            />
          </div>

          {/* End Time */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
              {t('endTime', 'End Time')} *
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={timingForm.endTime}
              onChange={(v) => setTimingForm((prev) => ({ ...prev, endTime: v }))}
              placeholder={t('selectEndTime', 'Select end time')}
            />
          </div>

          {/* Qualification Start */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('qualificationStart', 'Qualification Start')}
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={timingForm.qualificationStartAt}
              onChange={(v) => setTimingForm((prev) => ({ ...prev, qualificationStartAt: v }))}
              placeholder={t('optional', 'Optional')}
            />
          </div>

          {/* Qualification End */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('qualificationEnd', 'Qualification End')}
            </label>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              value={timingForm.qualificationEndAt}
              onChange={(v) => setTimingForm((prev) => ({ ...prev, qualificationEndAt: v }))}
              placeholder={t('optional', 'Optional')}
            />
          </div>

          {/* Auto Extend */}
          <Flex justify="space-between" align="center">
            <label style={{ fontWeight: 500, fontSize: 13 }}>
              {t('autoExtend', 'Auto Extend')}
            </label>
            <Switch
              checked={timingForm.autoExtend}
              onChange={(v) => setTimingForm((prev) => ({ ...prev, autoExtend: v }))}
            />
          </Flex>

          {/* Extension Minutes */}
          {timingForm.autoExtend && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                {t('extensionMinutes', 'Extension Minutes')}
              </label>
              <Input
                type="number"
                min={1}
                max={60}
                value={timingForm.extensionMinutes}
                onChange={(e) => setTimingForm((prev) => ({ ...prev, extensionMinutes: Number(e.target.value) || 5 }))}
                style={{ width: 120 }}
              />
            </div>
          )}
        </Flex>
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
