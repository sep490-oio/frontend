import { useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { Typography, Tabs, Card, Statistic, Row, Col, Select, Space, Button, Modal, Input, App, Upload, Image, Descriptions, Tooltip, Tag, Drawer, Flex, Empty, Dropdown, DatePicker } from 'antd'
const { RangePicker } = DatePicker
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { DollarOutlined, UploadOutlined, PictureOutlined, BankOutlined, UserOutlined, UndoOutlined, SendOutlined, CheckOutlined, CloseOutlined, EllipsisOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { PlatformRevenueChart } from '@/features/admin/components/PlatformRevenueChart'
import { PlatformIncomeTable } from '@/features/admin/components/PlatformIncomeTable'
import { EscrowAuditDrawer } from '@/features/admin/components/payments/EscrowAuditDrawer'
import {
  usePaymentSummary,
  usePlatformWallet,
  useAdminWithdrawals,
  useAdminTransactions,
  useAdminEscrows,
  useApproveWithdrawal,
  useRejectWithdrawal,
  useCompleteWithdrawal,
  useAdminForceReleaseEscrow,
  useAdminForceRefundEscrow,
} from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WithdrawalStatus, EscrowStatus } from '@/types/enums'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import type { AdminWithdrawalDto, PaymentTransactionDto, EscrowDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function AdminPaymentsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')

  // Overview data
  const { data: summary, isLoading: summaryLoading } = usePaymentSummary()
  const { data: wallet } = usePlatformWallet()

  // Withdrawals
  const [wPage, setWPage] = useState(1)
  const [wPageSize, setWPageSize] = useState(10)
  const [wStatus, setWStatus] = useState('')
  const [wSearch, setWSearch] = useState('')
  const [wDateRange, setWDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const { data: withdrawals, isLoading: wLoading } = useAdminWithdrawals({
    pageNumber: wPage,
    pageSize: wPageSize,
    ...(wStatus ? { status: wStatus } : {}),
    ...(wSearch ? { searchTerm: wSearch } : {}),
    ...(wDateRange ? { fromDate: wDateRange[0].startOf('day').toISOString(), toDate: wDateRange[1].endOf('day').toISOString() } : {}),
  })

  // Transactions
  const [tPage, setTPage] = useState(1)
  const [tPageSize, setTPageSize] = useState(10)
  const [tStatus, setTStatus] = useState('')
  const [tType, setTType] = useState('')
  const [tSearch, setTSearch] = useState('')
  const [tDateRange, setTDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const { data: transactions, isLoading: tLoading } = useAdminTransactions({
    pageNumber: tPage,
    pageSize: tPageSize,
    ...(tStatus ? { status: tStatus } : {}),
    ...(tType ? { type: tType } : {}),
    ...(tSearch ? { searchTerm: tSearch } : {}),
    ...(tDateRange ? { fromDate: tDateRange[0].startOf('day').toISOString(), toDate: tDateRange[1].endOf('day').toISOString() } : {}),
  })

  // Escrows
  const [ePage, setEPage] = useState(1)
  const [ePageSize, setEPageSize] = useState(10)
  const [eStatus, setEStatus] = useState('')
  const [eSearch, setESearch] = useState('')
  const [eDateRange, setEDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const { data: escrows, isLoading: eLoading } = useAdminEscrows({
    pageNumber: ePage,
    pageSize: ePageSize,
    ...(eStatus ? { status: eStatus } : {}),
    ...(eSearch ? { searchTerm: eSearch } : {}),
    ...(eDateRange ? { fromDate: eDateRange[0].startOf('day').toISOString(), toDate: eDateRange[1].endOf('day').toISOString() } : {}),
  })

  const approveWithdrawal = useApproveWithdrawal()
  const rejectWithdrawal = useRejectWithdrawal()
  const completeWithdrawal = useCompleteWithdrawal()
  const forceReleaseEscrow = useAdminForceReleaseEscrow()
  const forceRefundEscrow = useAdminForceRefundEscrow()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  // Transaction detail drawer
  const [txnDrawerOpen, setTxnDrawerOpen] = useState(false)
  const [txnDrawerRecord, setTxnDrawerRecord] = useState<PaymentTransactionDto | null>(null)

  // Escrow action modal
  const [escrowActionModal, setEscrowActionModal] = useState<{ open: boolean; type: 'release' | 'refund'; escrow: EscrowDto | null }>({ open: false, type: 'release', escrow: null })
  const [escrowActionReason, setEscrowActionReason] = useState('')

  // Escrow audit drawer
  const [escrowAuditDrawerOpen, setEscrowAuditDrawerOpen] = useState(false)
  const [escrowAuditRecord, setEscrowAuditRecord] = useState<EscrowDto | null>(null)

  // Complete withdrawal modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completeRecord, setCompleteRecord] = useState<AdminWithdrawalDto | null>(null)
  const [transferNote, setTransferNote] = useState('')
  const mediaUpload = useMediaUpload('withdrawal_transfer_proof')

  const handleApprove = async (id: string) => {
    try {
      await approveWithdrawal.mutateAsync(id)
      message.success(t('payments.approveSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const openCompleteModal = (record: AdminWithdrawalDto) => {
    setCompleteRecord(record)
    setTransferNote('')
    mediaUpload.reset()
    setCompleteModalOpen(true)
  }

  const handleComplete = async () => {
    if (!completeRecord) return
    if (!mediaUpload.uploadedFiles.length) {
      message.error(t('payments.transferProofRequired', 'Please upload transfer proof screenshot'))
      return
    }
    try {
      await completeWithdrawal.mutateAsync({
        id: completeRecord.id,
        transferProofUrl: mediaUpload.uploadedFiles[0].secureUrl,
        transferNote: transferNote || undefined,
      })
      message.success(t('payments.completeSuccess', 'Withdrawal completed'))
      setCompleteModalOpen(false)
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason) return
    try {
      await rejectWithdrawal.mutateAsync({ id: rejectId, reason: rejectReason })
      message.success(t('payments.rejectSuccess'))
      setRejectModalOpen(false)
      setRejectReason('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleEscrowAction = async () => {
    const { type, escrow } = escrowActionModal
    if (!escrow || !escrowActionReason.trim()) return
    try {
      if (type === 'release') {
        await forceReleaseEscrow.mutateAsync({ id: escrow.id, reason: escrowActionReason })
        message.success(t('payments.escrowAction.releaseSuccess', 'Escrow released to seller'))
      } else {
        await forceRefundEscrow.mutateAsync({ id: escrow.id, reason: escrowActionReason })
        message.success(t('payments.escrowAction.refundSuccess', 'Escrow refunded to buyer'))
      }
      setEscrowActionModal({ open: false, type: 'release', escrow: null })
      setEscrowActionReason('')
    } catch {
      message.error(t('payments.escrowAction.actionFailed', 'Action failed'))
    }
  }

  // ── Transaction type display helpers ──────────────────────────────
  const txnTypeConfig: Record<string, { color: string; label: string }> = {
    payment: { color: 'green', label: t('payments.txnType.payment', 'Payment') },
    deposit: { color: 'blue', label: t('payments.txnType.deposit', 'Deposit') },
    fee: { color: 'gold', label: t('payments.txnType.fee', 'Fee') },
    refund: { color: 'red', label: t('payments.txnType.refund', 'Refund') },
    payout: { color: 'purple', label: t('payments.txnType.payout', 'Payout') },
    withdrawal: { color: 'default', label: t('payments.txnType.withdrawal', 'Withdrawal') },
  }

  const withdrawalColumns: ColumnsType<AdminWithdrawalDto> = [
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('payments.bankName'),
      dataIndex: 'bankName',
      key: 'bankName',
      width: 120,
    },
    {
      title: t('payments.accountNumber'),
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      width: 220,
      render: (val: string) => (
        <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
          {val}
        </Typography.Text>
      ),
    },
    {
      title: t('payments.accountHolder'),
      dataIndex: 'accountHolder',
      key: 'accountHolder',
      ellipsis: true,
    },
    {
      title: t('payments.transferProof', 'Proof'),
      key: 'transferProof',
      width: 80,
      align: 'center',
      render: (_, record) => {
        if (!record.transferProofUrl) return <Typography.Text type="secondary" style={{ fontSize: 14 }}>-</Typography.Text>
        return (
          <Image
            src={record.transferProofUrl}
            alt="Transfer proof"
            width={40}
            height={40}
            style={{ borderRadius: 4, objectFit: 'cover', cursor: 'pointer' }}
            preview={{ mask: <PictureOutlined /> }}
            fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iMjAiIHk9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm9yPC90ZXh0Pjwvc3ZnPg=="
          />
        )
      },
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reports.actions'),
      key: 'actions',
      width: 160,
      render: (_, record) => {
        if (record.status === WithdrawalStatus.Pending) {
          return (
            <Space size={4}>
              <Tooltip title={t('payments.approve')}>
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleApprove(record.id)}
                  icon={<CheckOutlined />}
                  style={{ color: 'var(--color-success)' }}
                />
              </Tooltip>
              <Tooltip title={t('payments.reject')}>
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={() => { setRejectId(record.id); setRejectModalOpen(true) }}
                  icon={<CloseOutlined />}
                />
              </Tooltip>
            </Space>
          )
        }
        if (record.status === 'approved') {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => openCompleteModal(record)}
              style={{ color: 'var(--color-success)' }}
            >
              {t('payments.complete')}
            </Button>
          )
        }
        return null
      },
    },
  ]

  const transactionColumns: ColumnsType<PaymentTransactionDto> = [
    {
      title: t('payments.txnDetail.label.txnNumber', 'Txn #'),
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      width: 130,
      render: (val: string | undefined, record) => (
        <Typography.Text copyable={{ text: val ?? record.id, tooltips: [t('payments.txnDetail.label.copy', 'Copy'), t('payments.txnDetail.label.copied', 'Copied!')] }} style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {val ?? record.id.slice(0, 8)}
        </Typography.Text>
      ),
    },
    {
      title: t('payments.type'),
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => {
        const cfg = txnTypeConfig[type] ?? { color: 'default', label: type }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: t('payments.txnDetail.label.user', 'User'),
      key: 'user',
      width: 160,
      render: (_, record) => record.userId ? (
        <Tooltip title={record.userId}>
          <a onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${record.userId}`) }} style={{ cursor: 'pointer' }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {record.userDisplayName ?? record.userId?.slice(0, 8) + '…'}
          </a>
        </Tooltip>
      ) : '-',
    },
    {
      title: t('payments.amount'),
      key: 'amount',
      width: 160,
      align: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{formatCurrency(record.amount, record.currency)}</Typography.Text>
          {record.fee != null && record.fee > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {t('payments.txnDetail.label.fee', 'Fee')}: {formatCurrency(record.fee, record.currency)} → {t('payments.revenueChart.label.net', 'Net')}: {formatCurrency(record.netAmount ?? record.amount, record.currency)}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        let color = 'default'
        if (['success', 'completed'].includes(status.toLowerCase())) color = 'success'
        if (['pending', 'processing'].includes(status.toLowerCase())) color = 'warning'
        if (['failed', 'cancelled'].includes(status.toLowerCase())) color = 'error'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: t('payments.txnDetail.label.reference', 'Reference'),
      key: 'reference',
      width: 180,
      render: (_, record) => {
        if (record.orderId) {
          return (
            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${record.orderId}`) }} style={{ padding: 0 }}>
              {t('payments.txnDetail.label.orderPrefix', 'Order')} {record.orderNumber ?? record.orderId?.slice(0, 8)}
            </Button>
          )
        }
        if (record.auctionItemTitle) return <Typography.Text ellipsis style={{ maxWidth: 160 }}>{record.auctionItemTitle}</Typography.Text>
        return <Typography.Text type="secondary">—</Typography.Text>
      },
    },
    {
      title: t('payments.txnDetail.label.paymentMethod', 'Payment Method'),
      dataIndex: 'gatewayProvider',
      key: 'gateway',
      width: 90,
      render: (val: string | undefined) => val ? <Tag>{val}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title={t('payments.txnDetail.label.viewDetails', 'View Details')}>
          <Button size="small" type="text" icon={<EllipsisOutlined />} onClick={() => { setTxnDrawerRecord(record); setTxnDrawerOpen(true) }} />
        </Tooltip>
      ),
    },
  ]

  const escrowColumns: ColumnsType<EscrowDto> = [
    {
      title: t('payments.txnDetail.label.item', 'Item'),
      key: 'item',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ display: 'flex' }}>
          <Space>
            <Typography.Text strong ellipsis style={{ maxWidth: 180 }}>
              {record.auctionItemTitle ?? '—'}
            </Typography.Text>
            {record.isDisputed && <Tag color="red">{t('payments.txnDetail.label.disputed', 'DISPUTED')}</Tag>}
          </Space>
          <Typography.Text
            copyable={{ text: record.orderId, tooltips: [t('payments.txnDetail.label.copyOrderId', 'Copy Order ID'), t('payments.txnDetail.label.copied', 'Copied!')] }}
            style={{ fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}
            ellipsis
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${record.orderId}`) }}
          >
            <a>ORD-{record.orderId.slice(0, 4)}...{record.orderId.slice(-4)}</a>
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('payments.txnDetail.label.buyer', 'Buyer'),
      key: 'buyer',
      width: 150,
      render: (_, record) => record.buyerId ? (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${record.buyerId}`) }} style={{ cursor: 'pointer' }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {record.buyerDisplayName ?? record.buyerId?.slice(0, 8) + '…'}
        </a>
      ) : '-',
    },
    {
      title: t('payments.txnDetail.label.seller', 'Seller'),
      key: 'seller',
      width: 150,
      render: (_, record) => record.sellerId ? (
        <a onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${record.sellerId}`) }} style={{ cursor: 'pointer' }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {record.sellerDisplayName ?? record.sellerId?.slice(0, 8) + '…'}
        </a>
      ) : '-',
    },
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount: number, record) => formatCurrency(amount, record.currency),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        let color = 'default'
        if (['released', 'released_to_seller'].includes(status.toLowerCase())) color = 'success'
        if (['holding'].includes(status.toLowerCase())) color = 'processing'
        if (['refunded', 'refunded_to_buyer'].includes(status.toLowerCase())) color = 'warning'
        if (['forfeited'].includes(status.toLowerCase())) color = 'error'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: t('payments.txnDetail.label.timeline', 'Timeline'),
      key: 'timeline',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text style={{ fontSize: 11 }}>{t('payments.txnDetail.label.held', 'Held')}: {formatDateTime(record.createdAt)}</Typography.Text>
          {record.releasedAt && <Typography.Text style={{ fontSize: 11 }} type="success">{t('payments.txnDetail.label.released', 'Released')}: {formatDateTime(record.releasedAt)}</Typography.Text>}
          {record.refundedAt && <Typography.Text style={{ fontSize: 11 }} type="warning">{t('payments.txnDetail.label.refunded', 'Refunded')}: {formatDateTime(record.refundedAt)}</Typography.Text>}
        </Space>
      ),
    },
    {
      title: t('payments.txnDetail.label.actions', 'Actions'),
      key: 'actions',
      width: 250,
      render: (_, record) => {
        const moreActions = [
          {
            key: 'release',
            label: t('payments.escrowAction.release', 'Release to seller'),
            icon: <SendOutlined />,
            onClick: () => { setEscrowActionModal({ open: true, type: 'release', escrow: record }); setEscrowActionReason('') }
          },
          {
            key: 'refund',
            label: t('payments.escrowAction.refund', 'Refund to buyer'),
            danger: true,
            icon: <UndoOutlined />,
            onClick: () => { setEscrowActionModal({ open: true, type: 'refund', escrow: record }); setEscrowActionReason('') }
          }
        ]

        return (
          <Space size={4}>
            <Button size="small" type="default" onClick={() => { setEscrowAuditRecord(record); setEscrowAuditDrawerOpen(true) }}>
              {t('payments.txnDetail.label.viewDetails', 'View Details')}
            </Button>
            {record.status === EscrowStatus.Holding && (
              <Dropdown menu={{ items: moreActions }} trigger={['click']}>
                <Button size="small" icon={<EllipsisOutlined />} />
              </Dropdown>
            )}
          </Space>
        )
      },
    },
  ]

  // Shared filter select style
  const filterSelectStyle = { width: isMobile ? '100%' : 200 }

  const tabItems = [
    {
      key: 'overview',
      label: t('payments.overview'),
      children: (
        <>
          <Row gutter={[16, 16]}>
            {/* ── ROW 1: METRICS ── */}
            <Col xs={24} lg={8}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '16px' : '24px' } }} style={{ borderRadius: 12, height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600 }}>{t('payments.totalSystemBalance', 'Total System Balance')}</span>}
                  value={summary?.totalSystemBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: 'var(--color-primary, #1677ff)', fontSize: isMobile ? 24 : 32, fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '16px' : '16px' } }} style={{ borderRadius: 12, height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 12 : 13 }}>{t('payments.totalRevenue', 'Total Revenue')}</span>}
                  value={summary?.totalRevenue ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: 'var(--color-success, #3f8600)', fontSize: isMobile ? 18 : 20, fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '16px' : '16px' } }} style={{ borderRadius: 12, height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 12 : 13 }}>{t('payments.escrowHolding', 'Escrow Holding')}</span>}
                  value={wallet?.pendingBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: 'var(--color-warning, #faad14)', fontSize: isMobile ? 18 : 20, fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '16px' : '16px' } }} style={{ borderRadius: 12, height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 12 : 13 }}>{t('payments.pendingWithdrawals', 'Pending Withdrawals')}</span>}
                  value={summary?.withdrawalPendingCount ?? 0}
                  valueStyle={{ color: 'var(--color-error, #cf1322)', fontSize: isMobile ? 18 : 20, fontWeight: 600 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={4}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '16px' : '16px' } }} style={{ borderRadius: 12, height: '100%' }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 12 : 13 }}>{t('payments.refundedAmount', 'Refunded Amount')}</span>}
                  value={summary?.refundedEscrowTotal ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: 'var(--color-error, #cf1322)', fontSize: isMobile ? 18 : 20, fontWeight: 600 }}
                />
              </Card>
            </Col>

            {/* ── ROW 2: DATA & ACTIVITY ── */}
            <Col xs={24} lg={16}>
              <Card title={t('payments.section.revenueChart', 'Revenue Chart')} style={{ borderRadius: 12, height: '100%' }} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: 24 }}>
                  <PlatformRevenueChart />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={t('payments.section.pendingWithdrawals', 'Pending Withdrawals')} style={{ borderRadius: 12, height: '100%' }}>
                {withdrawals?.items && withdrawals.items.length > 0 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {withdrawals.items.filter((w: any) => w.status === WithdrawalStatus.Pending).slice(0, 5).map((w: any) => (
                      <Flex key={w.id} justify="space-between" align="center" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                          <Typography.Text strong style={{ display: 'block' }}>{formatCurrency(w.amount)}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{w.accountHolder} - {w.bankName}</Typography.Text>
                        </div>
                        <Space size={4}>
                          <Tooltip title={t('payments.approve')}>
                            <Button size="small" type="text" icon={<CheckOutlined />} onClick={() => handleApprove(w.id)} style={{ color: 'var(--color-success)' }} />
                          </Tooltip>
                          <Tooltip title={t('payments.reject')}>
                            <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={() => { setRejectId(w.id); setRejectModalOpen(true) }} />
                          </Tooltip>
                        </Space>
                      </Flex>
                    ))}
                    <Button type="link" block onClick={() => setActiveTab('withdrawals')}>{t('payments.section.viewAll', 'View All')}</Button>
                  </Space>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('payments.section.noPendingWithdrawals', 'No pending withdrawals')} />
                )}
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'withdrawals',
      label: t('payments.withdrawals'),
      children: (
        <>
          <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder={t('payments.searchWithdrawal', 'Search withdrawal...')}
              allowClear
              onSearch={(val) => { setWSearch(val); setWPage(1) }}
              style={{ width: isMobile ? '100%' : 250 }}
            />
            <Space wrap>
              <RangePicker
                onChange={(dates) => { setWDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null); setWPage(1) }}
                style={{ width: 250 }}
              />
              <Select
              placeholder={t('payments.filterStatus')}
            value={wStatus}
            onChange={(val) => { setWStatus(val); setWPage(1) }}
            style={filterSelectStyle}
            allowClear
            onClear={() => setWStatus('')}
            options={[
              { value: '', label: t('payments.allStatuses') },
              { value: 'pending', label: tc('statusLabel.pending') },
              { value: 'approved', label: tc('statusLabel.approved') },
              { value: 'rejected', label: tc('statusLabel.rejected') },
              { value: 'completed', label: tc('statusLabel.completed') },
            ]}
              />
            </Space>
          </Flex>
          <div style={{ overflowX: 'auto' }}>
            <ResponsiveTable<AdminWithdrawalDto>
              rowKey="id"
              columns={withdrawalColumns}
              dataSource={(withdrawals?.items ?? []) as AdminWithdrawalDto[]}
              loading={wLoading}
              mobileMode="list"
              pagination={{
                current: withdrawals?.metadata?.currentPage ?? wPage,
                pageSize: withdrawals?.metadata?.pageSize ?? wPageSize,
                total: withdrawals?.metadata?.totalCount ?? 0,
                showSizeChanger: !isMobile,
                showTotal: (total) => tc('pagination.total', { total }),
                simple: isMobile,
                onChange: (p, ps) => { setWPage(p); setWPageSize(ps) },
              }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'transactions',
      label: t('payments.transactions'),
      children: (
        <>
          <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder={t('payments.searchTransaction', 'Search transaction...')}
              allowClear
              onSearch={(val) => { setTSearch(val); setTPage(1) }}
              style={{ width: isMobile ? '100%' : 250 }}
            />
            <Space wrap>
              <RangePicker
                onChange={(dates) => { setTDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null); setTPage(1) }}
                style={{ width: 250 }}
              />
              <Select
                placeholder={t('payments.filterType', 'Filter Type')}
                value={tType}
                onChange={(val) => { setTType(val); setTPage(1) }}
                style={filterSelectStyle}
                allowClear
                onClear={() => setTType('')}
                options={[
                  { value: '', label: t('payments.allTypes', 'All Types') },
                  { value: 'payment', label: txnTypeConfig.payment.label },
                  { value: 'refund', label: txnTypeConfig.refund.label },
                  { value: 'deposit', label: txnTypeConfig.deposit.label },
                  { value: 'withdrawal', label: txnTypeConfig.withdrawal.label },
                  { value: 'fee', label: txnTypeConfig.fee.label },
                  { value: 'payout', label: txnTypeConfig.payout.label },
                ]}
              />
              <Select
              placeholder={t('payments.filterStatus')}
            value={tStatus}
            onChange={(val) => { setTStatus(val); setTPage(1) }}
            style={filterSelectStyle}
            allowClear
            onClear={() => setTStatus('')}
            options={[
              { value: '', label: t('payments.allStatuses') },
              { value: 'pending', label: tc('statusLabel.pending') },
              { value: 'completed', label: tc('statusLabel.completed') },
              { value: 'failed', label: tc('statusLabel.failed') },
            ]}
              />
            </Space>
          </Flex>
          <div style={{ overflowX: 'auto' }}>
            <ResponsiveTable<PaymentTransactionDto>
              rowKey="id"
              columns={transactionColumns}
              dataSource={transactions?.items ?? []}
              loading={tLoading}
              mobileMode="list"
              pagination={{
                current: transactions?.metadata?.currentPage ?? tPage,
                pageSize: transactions?.metadata?.pageSize ?? tPageSize,
                total: transactions?.metadata?.totalCount ?? 0,
                showSizeChanger: !isMobile,
                showTotal: (total) => tc('pagination.total', { total }),
                simple: isMobile,
                onChange: (p, ps) => { setTPage(p); setTPageSize(ps) },
              }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'escrows',
      label: t('payments.escrows'),
      children: (
        <>
          <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder={t('payments.searchEscrow', 'Search escrow...')}
              allowClear
              onSearch={(val) => { setESearch(val); setEPage(1) }}
              style={{ width: isMobile ? '100%' : 250 }}
            />
            <Space wrap>
              <RangePicker
                onChange={(dates) => { setEDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null); setEPage(1) }}
                style={{ width: 250 }}
              />
              <Select
              placeholder={t('payments.filterStatus')}
            value={eStatus}
            onChange={(val) => { setEStatus(val); setEPage(1) }}
            style={filterSelectStyle}
            allowClear
            onClear={() => setEStatus('')}
            options={[
              { value: '', label: t('payments.allStatuses') },
              { value: 'holding', label: tc('statusLabel.held') },
              { value: 'released_to_seller', label: tc('statusLabel.released') },
              { value: 'disputed', label: tc('statusLabel.disputed') },
              { value: 'refunded_to_buyer', label: tc('statusLabel.refunded') },
            ]}
              />
            </Space>
          </Flex>
          <div style={{ overflowX: 'auto' }}>
            <ResponsiveTable<EscrowDto>
              rowKey="id"
              columns={escrowColumns}
              dataSource={escrows?.items ?? []}
              loading={eLoading}
              mobileMode="list"
              pagination={{
                current: escrows?.metadata?.currentPage ?? ePage,
                pageSize: escrows?.metadata?.pageSize ?? ePageSize,
                total: escrows?.metadata?.totalCount ?? 0,
                showSizeChanger: !isMobile,
                showTotal: (total) => tc('pagination.total', { total }),
                simple: isMobile,
                onChange: (p, ps) => { setEPage(p); setEPageSize(ps) },
              }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'platformIncome',
      label: <span><BankOutlined /> {t('revenue.incomeTabTitle', 'Platform Income')}</span>,
      children: <PlatformIncomeTable />,
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <DollarOutlined /> {t('payments.title')}
      </Typography.Title>

      {/* Tabs — allow horizontal scroll on very small screens */}
      <div style={{ overflowX: 'auto' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      {/* Reject withdrawal modal */}
      <Modal
        title={t('payments.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        confirmLoading={rejectWithdrawal.isPending}
        centered={isMobile}
      >
        <Typography.Text strong>{t('payments.rejectReason')}</Typography.Text>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('payments.rejectReasonPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Complete withdrawal modal — requires transfer proof upload */}
      <Modal
        title={t('payments.completeWithdrawal', 'Complete Withdrawal')}
        open={completeModalOpen}
        onOk={handleComplete}
        onCancel={() => { setCompleteModalOpen(false); mediaUpload.reset() }}
        confirmLoading={completeWithdrawal.isPending}
        okButtonProps={{ disabled: !mediaUpload.uploadedFiles.length }}
        okText={t('payments.confirmComplete', 'Confirm Transfer')}
        centered={isMobile}
        width={520}
      >
        {completeRecord && (
          <div style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={t('payments.bankName')}>
                {completeRecord.bankName}
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.accountNumber')}>
                <Typography.Text copyable style={{ fontFamily: 'monospace' }}>
                  {completeRecord.accountNumber}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.accountHolder')}>
                {completeRecord.accountHolder}
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.amount')}>
                <Typography.Text strong style={{ color: 'var(--color-success)' }}>
                  {formatCurrency(completeRecord.netAmount)}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('payments.transferProofLabel', 'Upload transfer proof screenshot')} *
        </Typography.Text>

        {mediaUpload.uploadedFiles.length > 0 ? (
          <div style={{ marginBottom: 12 }}>
            <Image
              src={mediaUpload.uploadedFiles[0].secureUrl}
              alt="Transfer proof"
              width={200}
              style={{ borderRadius: 8 }}
            />
            <div style={{ marginTop: 4 }}>
              <Button size="small" danger onClick={() => mediaUpload.reset()}>
                {t('common:action.remove', 'Remove')}
              </Button>
            </div>
          </div>
        ) : (
          <Upload
            accept="image/*"
            maxCount={1}
            showUploadList={false}
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                await mediaUpload.upload(file as File)
                onSuccess?.(null)
              } catch (err) {
                onError?.(err as Error)
              }
            }}
          >
            <Button
              icon={<UploadOutlined />}
              loading={mediaUpload.uploading}
              style={{ width: '100%', height: 80 }}
            >
              {t('payments.uploadProof', 'Click to upload screenshot')}
            </Button>
          </Upload>
        )}

        <Input.TextArea
          rows={2}
          value={transferNote}
          onChange={(e) => setTransferNote(e.target.value)}
          placeholder={t('payments.transferNotePlaceholder', 'Optional: transfer reference number or note')}
          style={{ marginTop: 12 }}
        />
      </Modal>

      {/* ── Transaction Detail Drawer ────────────────────────────────── */}
      <Drawer
        title={t('payments.txnDetail.title', 'Transaction Detail')}
        open={txnDrawerOpen}
        onClose={() => { setTxnDrawerOpen(false); setTxnDrawerRecord(null) }}
        width={480}
      >
        {txnDrawerRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('payments.txnDetail.label.txnNumber', 'Txn #')}>{txnDrawerRecord.transactionNumber ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.id', 'ID')}>
              <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 11 }}>{txnDrawerRecord.id}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.type', 'Type')}>
              <Tag color={txnTypeConfig[txnDrawerRecord.type]?.color ?? 'default'}>{txnTypeConfig[txnDrawerRecord.type]?.label ?? txnDrawerRecord.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.status', 'Status')}><StatusBadge status={txnDrawerRecord.status} /></Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.user', 'User')}>
              {txnDrawerRecord.userId ? (
                <a onClick={() => navigate(`/admin/users/${txnDrawerRecord.userId}`)} style={{ cursor: 'pointer' }}>
                  {txnDrawerRecord.userDisplayName ?? txnDrawerRecord.userId}
                </a>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.grossAmount', 'Gross Amount')}>{formatCurrency(txnDrawerRecord.amount, txnDrawerRecord.currency)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.fee', 'Fee')}>{formatCurrency(txnDrawerRecord.fee ?? 0, txnDrawerRecord.currency)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.netAmount', 'Net Amount')}>{formatCurrency(txnDrawerRecord.netAmount ?? txnDrawerRecord.amount, txnDrawerRecord.currency)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.gateway', 'Gateway')}>{txnDrawerRecord.gatewayProvider ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.description', 'Description')}>{txnDrawerRecord.description ?? '—'}</Descriptions.Item>
            {txnDrawerRecord.orderId && (
              <Descriptions.Item label={t('payments.txnDetail.label.order', 'Order')}>
                <a onClick={() => navigate(`/admin/orders/${txnDrawerRecord.orderId}`)} style={{ cursor: 'pointer' }}>
                  {txnDrawerRecord.orderNumber ?? txnDrawerRecord.orderId}
                </a>
              </Descriptions.Item>
            )}
            {txnDrawerRecord.auctionItemTitle && (
              <Descriptions.Item label={t('payments.txnDetail.label.auctionItem', 'Auction Item')}>{txnDrawerRecord.auctionItemTitle}</Descriptions.Item>
            )}
            <Descriptions.Item label={t('payments.txnDetail.label.created', 'Created')}>{formatDateTime(txnDrawerRecord.createdAt)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.processed', 'Processed')}>{txnDrawerRecord.processedAt ? formatDateTime(txnDrawerRecord.processedAt) : '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* ── Escrow Action Modal ──────────────────────────────────────── */}
      <Modal
        title={escrowActionModal.type === 'release'
          ? t('payments.escrowForceAction.releaseTitle', 'Force Release Escrow to Seller')
          : t('payments.escrowForceAction.refundTitle', 'Force Refund Escrow to Buyer')}
        open={escrowActionModal.open}
        onOk={handleEscrowAction}
        onCancel={() => { setEscrowActionModal({ open: false, type: 'release', escrow: null }); setEscrowActionReason('') }}
        okText={escrowActionModal.type === 'release'
          ? t('payments.escrowForceAction.releaseOk', 'Release')
          : t('payments.escrowForceAction.refundOk', 'Refund')}
        okButtonProps={{ danger: escrowActionModal.type === 'refund', disabled: !escrowActionReason.trim(), loading: forceReleaseEscrow.isPending || forceRefundEscrow.isPending }}
      >
        {escrowActionModal.escrow && (
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('payments.txnDetail.label.escrowId', 'Escrow ID')}>{escrowActionModal.escrow.id.slice(0, 12)}…</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.amount', 'Amount')}>{formatCurrency(escrowActionModal.escrow.amount, escrowActionModal.escrow.currency)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.txnDetail.label.item', 'Item')}>{escrowActionModal.escrow.auctionItemTitle ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>{t('payments.txnDetail.label.reasonRequired', 'Reason *')}</Typography.Text>
        <Input.TextArea
          rows={3}
          value={escrowActionReason}
          onChange={(e) => setEscrowActionReason(e.target.value)}
          placeholder={t('payments.escrowActionReasonPlaceholder', 'Provide a reason for this action...')}
        />
      </Modal>
      {/* Escrow Audit Drawer */}
      <EscrowAuditDrawer
        open={escrowAuditDrawerOpen}
        onClose={() => setEscrowAuditDrawerOpen(false)}
        escrow={escrowAuditRecord}
      />
    </div>
  )
}
