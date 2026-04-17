import { useState } from 'react'
import { Typography, Card, Statistic, Row, Col, Button, Space, Select, Modal, InputNumber, App } from 'antd'
import { WalletOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useWallet, useWalletTransactions, useWalletTopup } from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { WalletTransactionType } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { WalletTransactionDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

const TX_TYPE_KEYS = [
  { value: '', key: 'all' },
  { value: WalletTransactionType.Credit, key: 'credit' },
  { value: WalletTransactionType.Debit, key: 'debit' },
  { value: WalletTransactionType.Hold, key: 'hold' },
  { value: WalletTransactionType.Release, key: 'release' },
] as const

const balanceCardStyle: React.CSSProperties = {
  background: 'var(--color-accent-light)',
  borderColor: 'var(--color-border)',
}

export default function WalletPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()

  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [topupModalOpen, setTopupModalOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState<number | null>(null)

  const { data: wallet, isLoading: walletLoading } = useWallet({ refetchInterval: 30000 })
  const topupMutation = useWalletTopup()
  const { data: transactions, isLoading: txLoading } = useWalletTransactions({
    pageNumber: page,
    pageSize,
    ...(typeFilter ? { type: typeFilter } : {}),
  }, { refetchInterval: 30000 })

  const columns: ColumnsType<WalletTransactionDto> = [
    {
      title: t('txType', 'Type'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <StatusBadge status={type} size="small" />,
    },
    {
      title: t('txAmount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: number, record) => (
        <PriceDisplay
          amount={amount}
          currency={record.currency}
          size="small"
          type={record.type === WalletTransactionType.Debit || record.type === WalletTransactionType.Hold ? 'danger' : 'success'}
        />
      ),
    },
    {
      title: t('txStatus', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('txReason', 'Reason'),
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string | undefined) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {reason ?? '-'}
        </span>
      ),
    },
    {
      title: t('txDate', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {formatDateTime(date)}
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Serif heading */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: SERIF_FONT,
            fontWeight: 400,
            fontSize: 28,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <WalletOutlined style={{ fontSize: 24 }} />
          {t('wallet', 'Wallet')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          {t('walletSubtitle', 'Manage your balance and transactions')}
        </p>
      </div>

      {/* Balance summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card loading={walletLoading} style={balanceCardStyle}>
            <Statistic
              title={t('availableBalance', 'Available Balance')}
              value={wallet?.availableBalance ?? 0}
              formatter={(val) => formatCurrency(val as number, wallet?.currency)}
              valueStyle={{
                color: 'var(--color-success)',
                fontFamily: MONO_FONT,
                fontSize: 28,
                fontWeight: 500,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={walletLoading} style={balanceCardStyle}>
            <Statistic
              title={t('reservedFunds', 'Reserved Funds')}
              value={wallet?.pendingBalance ?? 0}
              formatter={(val) => formatCurrency(val as number, wallet?.currency)}
              valueStyle={{
                color: '#d48806',
                fontFamily: MONO_FONT,
                fontSize: 28,
                fontWeight: 500,
              }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              {t('reservedFundsHelp', 'Funds held for active deposits, auto-bid reservations, and pending withdrawals.')}
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={walletLoading} style={balanceCardStyle}>
            <Statistic
              title={t('totalBalance', 'Total Balance')}
              value={wallet?.totalBalance ?? 0}
              formatter={(val) => formatCurrency(val as number, wallet?.currency)}
              valueStyle={{
                color: 'var(--color-text-secondary)',
                fontFamily: MONO_FONT,
                fontSize: 28,
                fontWeight: 500,
              }}
            />
            <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              {t('totalBalanceHelp', 'Available + reserved funds combined.')}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Space style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setTopupModalOpen(true)}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('topup', 'Top Up')}
        </Button>
        <Button
          icon={<ArrowDownOutlined />}
          onClick={() => navigate(`${prefix}/wallet/withdraw`)}
          style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
        >
          {t('withdraw', 'Withdraw')}
        </Button>
      </Space>

      {/* Transaction history */}
      <Card
        title={
          <span style={{
            fontFamily: SERIF_FONT,
            fontWeight: 400,
            fontSize: 18,
          }}>
            {t('transactionHistory', 'Transaction History')}
          </span>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val)
              setPage(1)
            }}
            style={{ width: 160 }}
            options={TX_TYPE_KEYS.map((opt) => ({
              value: opt.value,
              label: t(`txTypeLabel.${opt.key}`, opt.key),
            }))}
          />
        </Space>

        <ResponsiveTable<WalletTransactionDto>
          mobileMode="list"
          rowKey="id"
          columns={columns}
          dataSource={transactions?.items ?? []}
          loading={txLoading}
          pagination={{
            current: transactions?.metadata?.currentPage ?? page,
            pageSize: transactions?.metadata?.pageSize ?? pageSize,
            total: transactions?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      {/* Top-up Modal */}
      <Modal
        title={t('topup', 'Deposit')}
        open={topupModalOpen}
        onCancel={() => {
          setTopupModalOpen(false)
          setTopupAmount(null)
        }}
        onOk={async () => {
          if (!topupAmount || topupAmount <= 0) return
          try {
            const result = await topupMutation.mutateAsync({
              amount: topupAmount,
              currency: wallet?.currency ?? 'VND',
              returnUrl: window.location.href,
              clientReturnPath: '/me/wallet',
            })
            window.location.href = result.paymentUrl
          } catch {
            message.error(t('topupError', 'Deposit failed'))
          }
        }}
        confirmLoading={topupMutation.isPending}
        okButtonProps={{ disabled: !topupAmount || topupAmount <= 0 }}
        okText={t('topupConfirm', 'Deposit')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Typography.Paragraph style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            {t('topupExplain', 'Enter the amount you want to deposit into your wallet. You will be redirected to VnPay for payment.')}
          </Typography.Paragraph>
          <div>
            <span className="oio-label" style={{ display: 'block', marginBottom: 6 }}>
              {t('topupAmount', 'Amount')}
            </span>
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={10000}
              step={50000}
              value={topupAmount}
              onChange={(v) => setTopupAmount(v)}
              addonAfter={wallet?.currency ?? 'VND'}
              placeholder={t('topupAmountPlaceholder', '100,000')}
              formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
              parser={(v) => {
                const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
                return parsed ? Number(parsed) : null as any
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
