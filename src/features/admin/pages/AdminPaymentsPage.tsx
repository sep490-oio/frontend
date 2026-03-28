import { useState } from 'react'
import { Typography, Tabs, Card, Statistic, Row, Col, Select, Space, Button, Modal, Input, App, Popconfirm } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { DollarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
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
import type { WithdrawalRequestDto, PaymentTransactionDto, EscrowDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function AdminPaymentsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

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

  const handleApprove = async (id: string) => {
    try {
      await approveWithdrawal.mutateAsync(id)
      message.success(t('payments.approveSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await completeWithdrawal.mutateAsync(id)
      message.success(t('payments.completeSuccess', 'Withdrawal completed'))
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

  const withdrawalColumns: ColumnsType<WithdrawalRequestDto> = [
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('payments.bankCode'),
      dataIndex: 'bankCode',
      key: 'bankCode',
      width: 100,
    },
    {
      title: t('payments.accountNumber'),
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      width: 160,
    },
    {
      title: t('payments.accountName'),
      dataIndex: 'accountName',
      key: 'accountName',
      ellipsis: true,
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reports.actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => {
        if (record.status === WithdrawalStatus.Pending) {
          return (
            <Space size={4}>
              <Button type="link" size="small" onClick={() => handleApprove(record.id)}>
                {t('payments.approve')}
              </Button>
              <Button type="link" size="small" danger onClick={() => { setRejectId(record.id); setRejectModalOpen(true) }}>
                {t('payments.reject')}
              </Button>
            </Space>
          )
        }
        if (record.status === 'approved') {
          return (
            <Popconfirm
              title={t('payments.completeConfirm', 'Confirm bank transfer completed for this withdrawal?')}
              onConfirm={() => handleComplete(record.id)}
            >
              <Button type="link" size="small" loading={completeWithdrawal.isPending} style={{ color: 'var(--color-success)' }}>
                {t('payments.complete', 'Complete')}
              </Button>
            </Popconfirm>
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
      width: 200,
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
      width: 160,
      render: (amount: number, record) => formatCurrency(amount, record.currency),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('payments.orderId'),
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200,
      ellipsis: true,
      render: (val: string | undefined) => val ?? '-',
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
  ]

  const escrowColumns: ColumnsType<EscrowDto> = [
    {
      title: t('common.id'),
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('payments.orderId'),
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('payments.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: number, record) => formatCurrency(amount, record.currency),
    },
    {
      title: t('payments.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('payments.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
  ]

  const tabItems = [
    {
      key: 'overview',
      label: t('payments.overview'),
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={summaryLoading}>
                <Statistic
                  title={t('payments.totalRevenue')}
                  value={summary?.totalRevenue ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={summaryLoading}>
                <Statistic
                  title={t('payments.totalPayouts')}
                  value={summary?.totalPayouts ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={summaryLoading}>
                <Statistic
                  title={t('payments.pendingWithdrawals')}
                  value={summary?.pendingWithdrawals ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card loading={summaryLoading}>
                <Statistic
                  title={t('payments.platformBalance')}
                  value={summary?.platformBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number)}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Platform wallet */}
          <Card title={t('payments.walletBalance')} loading={walletLoading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('payments.availableBalance')}
                  value={wallet?.availableBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('payments.pendingBalance')}
                  value={wallet?.pendingBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title={t('payments.platformBalance')}
                  value={wallet?.totalBalance ?? 0}
                  formatter={(val) => formatCurrency(val as number, wallet?.currency)}
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
          <Space style={{ marginBottom: 16 }}>
            <Select
              placeholder={t('payments.filterStatus')}
              value={wStatus}
              onChange={(val) => { setWStatus(val); setWPage(1) }}
              style={{ width: 200 }}
              allowClear
              onClear={() => setWStatus('')}
              options={[
                { value: '', label: t('payments.allStatuses') },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </Space>
          <ResponsiveTable<WithdrawalRequestDto>
            rowKey="id"
            columns={withdrawalColumns}
            dataSource={withdrawals?.items ?? []}
            loading={wLoading}
            mobileMode="list"
            pagination={{
              current: withdrawals?.metadata?.currentPage ?? wPage,
              pageSize: withdrawals?.metadata?.pageSize ?? wPageSize,
              total: withdrawals?.metadata?.totalCount ?? 0,
              showSizeChanger: true,
              showTotal: (total) => tc('pagination.total', { total }),
              onChange: (p, ps) => { setWPage(p); setWPageSize(ps) },
            }}
          />
        </>
      ),
    },
    {
      key: 'transactions',
      label: t('payments.transactions'),
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              placeholder={t('payments.filterStatus')}
              value={tStatus}
              onChange={(val) => { setTStatus(val); setTPage(1) }}
              style={{ width: 200 }}
              allowClear
              onClear={() => setTStatus('')}
              options={[
                { value: '', label: t('payments.allStatuses') },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
          </Space>
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
              showSizeChanger: true,
              showTotal: (total) => tc('pagination.total', { total }),
              onChange: (p, ps) => { setTPage(p); setTPageSize(ps) },
            }}
          />
        </>
      ),
    },
    {
      key: 'escrows',
      label: t('payments.escrows'),
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              placeholder={t('payments.filterStatus')}
              value={eStatus}
              onChange={(val) => { setEStatus(val); setEPage(1) }}
              style={{ width: 200 }}
              allowClear
              onClear={() => setEStatus('')}
              options={[
                { value: '', label: t('payments.allStatuses') },
                { value: 'held', label: 'Held' },
                { value: 'released', label: 'Released' },
                { value: 'disputed', label: 'Disputed' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />
          </Space>
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
              showSizeChanger: true,
              showTotal: (total) => tc('pagination.total', { total }),
              onChange: (p, ps) => { setEPage(p); setEPageSize(ps) },
            }}
          />
        </>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <DollarOutlined /> {t('payments.title')}
      </Typography.Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Reject withdrawal modal */}
      <Modal
        title={t('payments.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        confirmLoading={rejectWithdrawal.isPending}
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
    </div>
  )
}
