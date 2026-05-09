import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Typography, Tabs, Card, Statistic, Row, Col, Select, Space, Button, Modal, Input, App, Upload, Image, Descriptions, Tooltip } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { DollarOutlined, UploadOutlined, PictureOutlined, RiseOutlined, BankOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { PlatformRevenueChart } from '@/features/admin/components/PlatformRevenueChart'
import { PlatformIncomeTable } from '@/features/admin/components/PlatformIncomeTable'
import {
  usePaymentSummary,
  usePlatformWallet,
  useAdminWithdrawals,
  useAdminTransactions,
  useAdminEscrows,
  useApproveWithdrawal,
  useRejectWithdrawal,
  useCompleteWithdrawal,
} from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WithdrawalStatus } from '@/types/enums'
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
  const { data: wallet, isLoading: walletLoading } = usePlatformWallet()

  // Withdrawals
  const [wPage, setWPage] = useState(1)
  const [wPageSize, setWPageSize] = useState(10)
  const [wStatus, setWStatus] = useState('')
  const { data: withdrawals, isLoading: wLoading } = useAdminWithdrawals({
    pageNumber: wPage,
    pageSize: wPageSize,
    ...(wStatus ? { status: wStatus } : {}),
  })

  // Transactions
  const [tPage, setTPage] = useState(1)
  const [tPageSize, setTPageSize] = useState(10)
  const [tStatus, setTStatus] = useState('')
  const { data: transactions, isLoading: tLoading } = useAdminTransactions({
    pageNumber: tPage,
    pageSize: tPageSize,
    ...(tStatus ? { status: tStatus } : {}),
  })

  // Escrows
  const [ePage, setEPage] = useState(1)
  const [ePageSize, setEPageSize] = useState(10)
  const [eStatus, setEStatus] = useState('')
  const { data: escrows, isLoading: eLoading } = useAdminEscrows({
    pageNumber: ePage,
    pageSize: ePageSize,
    ...(eStatus ? { status: eStatus } : {}),
  })

  const approveWithdrawal = useApproveWithdrawal()
  const rejectWithdrawal = useRejectWithdrawal()
  const completeWithdrawal = useCompleteWithdrawal()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

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

  const withdrawalColumns: ColumnsType<AdminWithdrawalDto> = [
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
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
      width: 180,
      render: (val: string) => (
        <Typography.Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
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
      render: (_, record) => {
        if (!record.transferProofUrl) return null
        return (
          <Image
            src={record.transferProofUrl}
            alt="Transfer proof"
            width={40}
            height={40}
            style={{ borderRadius: 4, objectFit: 'cover', cursor: 'pointer' }}
            preview={{ mask: <PictureOutlined /> }}
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
              <Button
                type="link"
                size="small"
                onClick={() => handleApprove(record.id)}
                style={{ minHeight: isMobile ? 44 : undefined, padding: isMobile ? '0 8px' : undefined }}
              >
                {t('payments.approve')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => { setRejectId(record.id); setRejectModalOpen(true) }}
                style={{ minHeight: isMobile ? 44 : undefined, padding: isMobile ? '0 8px' : undefined }}
              >
                {t('payments.reject')}
              </Button>
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
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('payments.type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number, record) => formatCurrency(amount, record.currency),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('payments.orderId'),
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200,
      render: (val: string | undefined) => val ? (
        <Typography.Text
          copyable={{ text: val, tooltips: ['Copy ID', 'Copied!'] }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        >
          <Tooltip title={t('payments.viewOrderTip', 'View Order Detail')}>
            <a
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${val}`) }}
              style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
            >
              {val.slice(0, 8)}…
            </a>
          </Tooltip>
        </Typography.Text>
      ) : '-',
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
  ]

  const escrowColumns: ColumnsType<EscrowDto> = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('payments.orderId'),
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200,
      render: (val: string) => (
        <Typography.Text
          copyable={{ text: val, tooltips: ['Copy ID', 'Copied!'] }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        >
          <Tooltip title={t('payments.viewOrderTip', 'View Order Detail')}>
            <a
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${val}`) }}
              style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
            >
              {val.slice(0, 8)}…
            </a>
          </Tooltip>
        </Typography.Text>
      ),
    },
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number, record) => formatCurrency(amount, record.currency),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
  ]

  // Shared filter select style
  const filterSelectStyle = { width: isMobile ? '100%' : 200, marginBottom: 16 }

  const tabItems = [
    {
      key: 'overview',
      label: t('payments.overview'),
      children: (
        <>
          {/* Escrow Statistics */}
          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>{t('payments.escrowStats', 'Escrow Statistics')}</Typography.Title>
          <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
            <Col xs={12} sm={12} lg={8}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.releasedEscrow', 'Released Escrow')}</span>}
                  value={summary?.releasedEscrowTotal ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: '#3f8600', fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.refundedEscrow', 'Refunded Escrow')}</span>}
                  value={summary?.refundedEscrowTotal ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={8}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.holdingEscrowCount', 'Holding Escrows')}</span>}
                  value={summary?.holdingEscrowCount ?? 0}
                  valueStyle={{ color: '#1677ff', fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Activity Statistics */}
          <Typography.Title level={5} style={{ marginBottom: 16 }}>{t('payments.activityStats', 'Activity Statistics')}</Typography.Title>
          <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
            <Col xs={12} sm={12} lg={6}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.completedPayments', 'Completed Payments')}</span>}
                  value={summary?.completedPayments ?? 0}
                  valueStyle={{ color: '#3f8600', fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.failedPayments', 'Failed Payments')}</span>}
                  value={summary?.failedPayments ?? 0}
                  valueStyle={{ color: '#cf1322', fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.walletTopUps', 'Wallet Top-ups')}</span>}
                  value={summary?.walletTopUps ?? 0}
                  valueStyle={{ fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card loading={summaryLoading} styles={{ body: { padding: isMobile ? '12px' : '24px' } }}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.pendingWithdrawals', 'Pending Withdrawals')}</span>}
                  value={summary?.withdrawalPendingCount ?? 0}
                  valueStyle={{ color: '#faad14', fontSize: isMobile ? 16 : 24 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Platform wallet */}
          <Card
            title={t('payments.walletBalance')}
            loading={walletLoading}
            style={{ borderRadius: 12 }}
          >
            <Row gutter={[isMobile ? 12 : 16, 12]}>
              <Col xs={8} sm={8}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.availableBalance')}</span>}
                  value={wallet?.availableBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: '#3f8600', fontSize: isMobile ? 14 : 20 }}
                />
              </Col>
              <Col xs={8} sm={8}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.pendingBalance')}</span>}
                  value={wallet?.pendingBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: '#faad14', fontSize: isMobile ? 14 : 20 }}
                />
              </Col>
              <Col xs={8} sm={8}>
                <Statistic
                  title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{t('payments.platformBalance')}</span>}
                  value={wallet?.totalBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ fontSize: isMobile ? 14 : 20 }}
                />
              </Col>
            </Row>
          </Card>
        </>
      ),
    },
    {
      key: 'withdrawals',
      label: t('payments.withdrawals'),
      children: (
        <>
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
          <Select
            placeholder={t('payments.filterStatus')}
            value={eStatus}
            onChange={(val) => { setEStatus(val); setEPage(1) }}
            style={filterSelectStyle}
            allowClear
            onClear={() => setEStatus('')}
            options={[
              { value: '', label: t('payments.allStatuses') },
              { value: 'held', label: tc('statusLabel.held') },
              { value: 'released', label: tc('statusLabel.released') },
              { value: 'disputed', label: tc('statusLabel.disputed') },
              { value: 'refunded', label: tc('statusLabel.refunded') },
            ]}
          />
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
      key: 'revenue',
      label: <span><RiseOutlined /> {t('revenue.tabTitle', 'Revenue')}</span>,
      children: <PlatformRevenueChart />,
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
    </div>
  )
}
