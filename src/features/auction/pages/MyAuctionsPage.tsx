import { useState } from 'react'
import { Button, Space, Modal, Flex, Tooltip, Input, message, DatePicker, Form, Card, List } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  DashboardOutlined,
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

export default function MyAuctionsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')

  const STATUS_PILLS = [
    { value: 'all', label: t('statusTab.all') },
    { value: AuctionStatus.Draft, label: tc('statusLabel.draft') },
    { value: AuctionStatus.Approved, label: tc('statusLabel.approved') },
    { value: AuctionStatus.Scheduled, label: tc('statusLabel.scheduled') },
    { value: AuctionStatus.Active, label: tc('statusLabel.active') },
    { value: AuctionStatus.Ended, label: tc('statusLabel.ended') },
    { value: AuctionStatus.Sold, label: tc('statusLabel.sold') },
    { value: AuctionStatus.Failed, label: tc('statusLabel.failed') },
    { value: AuctionStatus.Cancelled, label: tc('statusLabel.cancelled') },
    { value: AuctionStatus.Pending, label: tc('statusLabel.pending') },
    { value: AuctionStatus.Terminated, label: tc('statusLabel.terminated') },
  ]
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const [msgApi, contextHolder] = message.useMessage()
  const { isMobile, isTablet } = useBreakpoint()

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
  const [submitPendingTimingAuctionId, setSubmitPendingTimingAuctionId] = useState<string | null>(null)

  const params = {
    pageNumber: page,
    pageSize,
    sortBy: 'CreatedAt Desc',
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useMyAuctions(params, { refetchInterval: 30000 })
  const submitAuction = useSubmitAuction()
  const cancelAuction = useCancelAuction()
  const setAuctionTiming = useSetAuctionTiming()
  const relistAuction = useRelistAuction()
  const offerRunnerUp = useOfferRunnerUp()

  /* ── Cancel handlers ── */
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

  /* ── Timing handlers ── */
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
      setAuctionTiming.mutate(timingPayload, {
        onSuccess: () => {
          msgApi.success(t('timingSuccess', 'Timing configured'))
          setTimingModalOpen(false)
          setTimingAuctionId(null)
        },
      })
    }
  }

  /* ── Submit handler ── */
  const handleSubmit = (id: string) => {
    const auction = data?.items?.find((a: any) => a.id === id)
    const hasTiming = auction?.startTime && auction?.endTime
    if (hasTiming) {
      submitAuction.mutate(id, {
        onSuccess: () => msgApi.success(t('submitSuccess', 'Auction submitted for review')),
      })
    } else {
      setSubmitPendingTimingAuctionId(id)
      openTimingModal(id)
    }
  }

  /* ── Relist modal state ── */
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

  /* ── Action buttons per status ── */
  const renderActions = (record: AuctionListItemDto) => {
    const s = record.status
    return (
      <Space size="small" wrap>
        {s === AuctionStatus.Draft && (
          <>
            <Tooltip title={tc('action.edit', 'Edit')}>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`${prefix}/auctions/${record.id}/edit`)} />
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
              <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => openCancelModal(record.id)} />
            </Tooltip>
          </>
        )}
        {s === AuctionStatus.Approved && (
          <>
            <Tooltip title={t('setTiming', 'Set Timing')}>
              <Button type="text" size="small" icon={<ClockCircleOutlined />} onClick={() => openTimingModal(record.id)} />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => openCancelModal(record.id)} />
            </Tooltip>
          </>
        )}
        {s === AuctionStatus.Scheduled && (
          <>
            <Tooltip title={t('dashboard', 'Dashboard')}>
              <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate(`/seller/auctions/${record.id}/dashboard`)} />
            </Tooltip>
            <Tooltip title={t('viewDetail', 'View Detail')}>
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/auctions/${record.id}`)} />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => openCancelModal(record.id)} />
            </Tooltip>
          </>
        )}
        {s === AuctionStatus.Active && (
          <>
            <Tooltip title={t('dashboard', 'Dashboard')}>
              <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate(`/seller/auctions/${record.id}/dashboard`)} />
            </Tooltip>
            <Tooltip title={t('viewDetail', 'View Detail')}>
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/auctions/${record.id}`)} />
            </Tooltip>
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => openCancelModal(record.id)} />
            </Tooltip>
          </>
        )}
        {s === AuctionStatus.Ended && (
          <Space size="small">
            <Tooltip title={t('dashboard', 'Dashboard')}>
              <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate(`/seller/auctions/${record.id}/dashboard`)} />
            </Tooltip>
            <Tooltip title={t('viewDetail', 'View Detail')}>
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/auctions/${record.id}`)} />
            </Tooltip>
          </Space>
        )}
        {s === AuctionStatus.Sold && (
          <Space size="small">
            <Tooltip title={t('dashboard', 'Dashboard')}>
              <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate(`/seller/auctions/${record.id}/dashboard`)} />
            </Tooltip>
            <Tooltip title={t('viewOrder', 'View Order')}>
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/auctions/${record.id}`)} />
            </Tooltip>
          </Space>
        )}
        {s === AuctionStatus.PaymentDefaulted && (
          <>
            <Tooltip title={t('dashboard', 'Dashboard')}>
              <Button type="text" size="small" icon={<DashboardOutlined />} onClick={() => navigate(`/seller/auctions/${record.id}/dashboard`)} />
            </Tooltip>
            <Tooltip title={t('relist', 'Relist')}>
              <Button type="text" size="small" icon={<ReloadOutlined />} loading={relistAuction.isPending} onClick={() => openRelistModal(record.id)} />
            </Tooltip>
            <Tooltip title={t('offerRunnerUp', 'Offer Runner-up')}>
              <Button type="text" size="small" icon={<UserSwitchOutlined />} loading={offerRunnerUp.isPending} onClick={() => handleOfferRunnerUp(record.id)} />
            </Tooltip>
          </>
        )}
      </Space>
    )
  }

  /* ── Table columns ── */
  const columns: ColumnsType<AuctionListItemDto> = [
    {
      title: t('title', 'Title'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
      render: (title: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {record.primaryImageUrl && (
            <img src={record.primaryImageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
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
        if (record.status === AuctionStatus.Active) return <CountdownTimer endTime={endTime} size="small" />
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

  const isNarrow = isMobile || isTablet

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '20px 0 80px' : isTablet ? '28px 0 64px' : '40px 24px 80px',
      }}
    >
      {contextHolder}

      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: isMobile ? 20 : 28, paddingInline: isMobile ? 16 : 0 }}
      >
        <h2
          className="oio-serif"
          style={{
            margin: 0,
            fontSize: isMobile ? 20 : 28,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {t('myAuctions', 'My Auctions')}
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`${prefix}/items/create`)}
          size={isMobile ? 'middle' : 'middle'}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            borderRadius: 8,
            height: isMobile ? 40 : 36,
          }}
        >
          {!isMobile && t('createItem', 'Create Item')}
        </Button>
      </Flex>

      {/* Status pills — scrollable on mobile */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: isNarrow ? undefined : 'wrap',
          overflowX: isNarrow ? 'auto' : undefined,
          scrollbarWidth: 'none',
          paddingInline: isMobile ? 16 : 0,
          paddingBottom: isMobile ? 4 : 0,
          marginBottom: isMobile ? 16 : 24,
        }}
      >
        {STATUS_PILLS.map((pill) => (
          <button
            key={pill.value}
            type="button"
            style={{
              padding: isMobile ? '6px 14px' : '8px 20px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minHeight: 34,
              border: `1px solid ${statusFilter === pill.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: statusFilter === pill.value ? 'var(--color-accent)' : 'transparent',
              color: statusFilter === pill.value ? '#fff' : 'var(--color-text-secondary)',
            }}
            onClick={() => { setStatusFilter(pill.value); setPage(1) }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!isLoading && !data?.items?.length ? (
        <div style={{ paddingInline: isMobile ? 16 : 0 }}>
          <EmptyState
            title={t('noAuctions', 'No auctions found')}
            description={t('noAuctionsDesc', 'Create your first auction to get started.')}
            action={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate(`${prefix}/items/create`)}
                style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', borderRadius: 8 }}
              >
                {t('createItem', 'Create Item')}
              </Button>
            }
          />
        </div>
      ) : isMobile ? (
        /* Mobile card view */
        <div style={{ paddingInline: 16 }}>
          <List
            dataSource={data?.items ?? []}
            loading={isLoading}
            pagination={{
              current: data?.metadata?.currentPage ?? page,
              pageSize: data?.metadata?.pageSize ?? pageSize,
              total: data?.metadata?.totalCount ?? 0,
              size: 'small',
              onChange: (p, ps) => { setPage(p); setPageSize(ps) },
            }}
            renderItem={(record: AuctionListItemDto) => (
              <List.Item style={{ padding: '6px 0', border: 'none' }}>
                <Card
                  size="small"
                  style={{ width: '100%', borderRadius: 10 }}
                  styles={{ body: { padding: '12px 14px' } }}
                >
                  <Flex vertical gap={8}>
                    <Flex justify="space-between" align="flex-start" gap={8}>
                      <Button
                        type="link"
                        style={{ padding: 0, fontWeight: 600, fontSize: 14, textAlign: 'left', height: 'auto', lineHeight: 1.3 }}
                        onClick={() => navigate(`/auctions/${record.id}`)}
                      >
                        {record.itemTitle}
                      </Button>
                      <StatusBadge status={record.status} />
                    </Flex>
                    <Flex justify="space-between" align="center">
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                        {t('currentPrice', 'Current Price')}
                      </span>
                      {record.currentPrice && typeof record.currentPrice === 'object' && 'amount' in record.currentPrice ? (
                        <PriceDisplay price={{ amount: (record.currentPrice as { amount: number; currency: string }).amount, currency: (record.currentPrice as { amount: number; currency: string }).currency, symbol: '' }} size="small" />
                      ) : (
                        <PriceDisplay price={(record.currentPrice as number) ?? 0} size="small" />
                      )}
                    </Flex>
                    <Flex justify="space-between" align="center">
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
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
                    <Flex justify="flex-end" style={{ marginTop: 2 }}>
                      {renderActions(record)}
                    </Flex>
                  </Flex>
                </Card>
              </List.Item>
            )}
          />
        </div>
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
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      )}

      {/* Cancel modal */}
      <Modal
        title={t('cancelAuction', 'Cancel Auction')}
        open={cancelModalOpen}
        onCancel={() => { setCancelModalOpen(false); setCancelAuctionId(null) }}
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
        onCancel={() => { setTimingModalOpen(false); setTimingAuctionId(null); setSubmitPendingTimingAuctionId(null) }}
        onOk={handleTimingConfirm}
        okText={t('saveTiming', 'Save Timing')}
        okButtonProps={{
          loading: setAuctionTiming.isPending,
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        centered
        width={isMobile ? '100%' : 720}
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
        width={isMobile ? '100%' : 480}
      >
        <Flex vertical gap={16} style={{ marginTop: 16 }}>
          {[
            { label: t('relist.qualificationStart'), key: 'qualificationStartAt' as const, placeholder: t('relist.qualificationStartPlaceholder') },
            { label: t('relist.qualificationEnd'), key: 'qualificationEndAt' as const, placeholder: t('relist.qualificationEndPlaceholder') },
            { label: t('relist.auctionStart'), key: 'startAt' as const, placeholder: t('relist.auctionStartPlaceholder') },
            { label: t('relist.auctionEnd'), key: 'endAt' as const, placeholder: t('relist.auctionEndPlaceholder') },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>{label}</label>
              <DatePicker
                showTime
                style={{ width: '100%' }}
                value={relistForm[key]}
                onChange={(v) => setRelistForm((prev) => ({ ...prev, [key]: v }))}
                placeholder={placeholder}
              />
            </div>
          ))}
        </Flex>
      </Modal>
    </div>
  )
}