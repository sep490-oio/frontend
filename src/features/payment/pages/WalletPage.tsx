import { useState } from 'react'
import { Typography, Row, Col, Button, Select, Modal, InputNumber, App, Flex } from 'antd'
const { Text } = Typography
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
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const TX_TYPE_KEYS = [
  { value: '', key: 'all' },
  { value: WalletTransactionType.Credit, key: 'credit' },
  { value: WalletTransactionType.Debit, key: 'debit' },
  { value: WalletTransactionType.Hold, key: 'hold' },
  { value: WalletTransactionType.Release, key: 'release' },
] as const

const balanceCardStyle: React.CSSProperties = {
  background: 'var(--color-bg-container)',
  backdropFilter: 'var(--oio-blur)',
  WebkitBackdropFilter: 'var(--oio-blur)',
  border: '1px solid var(--color-border)',
  borderRadius: 24,
  boxShadow: 'var(--shadow-md)',
  height: '100%'
}

export default function WalletPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { isMobile } = useBreakpoint()

  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [topupModalOpen, setTopupModalOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState<number | null>(null)

  const { data: wallet } = useWallet({ refetchInterval: 30000 })
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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <h1
          className="oio-serif"
          style={{
            fontWeight: 400,
            fontSize: isMobile ? 28 : 36,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <WalletOutlined style={{ fontSize: isMobile ? 24 : 28, color: 'var(--color-accent)' }} />
          {t('wallet', 'Wallet')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, margin: 0 }}>
          {t('walletSubtitle', 'Manage your balance and transactions')}
        </p>
      </div>

      {/* Balance summary */}
      <Row gutter={isMobile ? [12, 12] : [20, 20]} style={{ marginBottom: isMobile ? 32 : 48 }}>
        <Col xs={24} md={8}>
          <div style={balanceCardStyle}>
             <div style={{ padding: 24 }}>
                <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  {t('availableBalance', 'Available Balance')}
                </Text>
                <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: 'var(--color-success)', marginTop: 4 }}>
                   {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--'}
                </div>
             </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={balanceCardStyle}>
             <div style={{ padding: 24 }}>
                <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  {t('reservedFunds', 'Reserved Funds')}
                </Text>
                <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: '#d48806', marginTop: 4 }}>
                   {wallet ? formatCurrency(wallet.pendingBalance, wallet.currency) : '--'}
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block', lineHeight: 1.4 }}>
                  {t('reservedFundsHelp', 'Funds held for active deposits, auto-bid reservations, and pending withdrawals.')}
                </Text>
             </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div style={balanceCardStyle}>
             <div style={{ padding: 24 }}>
                <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  {t('totalBalance', 'Total Balance')}
                </Text>
                <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                   {wallet ? formatCurrency(wallet.totalBalance, wallet.currency) : '--'}
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: 'block', lineHeight: 1.4 }}>
                  {t('totalBalanceHelp', 'Available + reserved funds combined.')}
                </Text>
             </div>
          </div>
        </Col>
      </Row>

      {/* Actions */}
      <Flex gap={12} style={{ marginBottom: 32 }} wrap="wrap">
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setTopupModalOpen(true)}
          style={{ 
            background: 'var(--color-accent)', 
            borderColor: 'var(--color-accent)', 
            borderRadius: 12, 
            fontWeight: 600,
            height: 48,
            padding: '0 24px'
          }}
        >
          {t('topup', 'Top Up')}
        </Button>
        <Button
          size="large"
          icon={<ArrowDownOutlined />}
          onClick={() => navigate(`${prefix}/wallet/withdraw`)}
          style={{ 
            borderColor: 'var(--color-accent)', 
            color: 'var(--color-accent)', 
            borderRadius: 12, 
            fontWeight: 600,
            height: 48,
            padding: '0 24px'
          }}
        >
          {t('withdraw', 'Withdraw')}
        </Button>
      </Flex>

      {/* Transaction history */}
      <div style={{ marginBottom: 20 }}>
        <span style={{
          fontFamily: SANS_FONT,
          fontWeight: 600,
          fontSize: 18,
          color: 'var(--color-text-primary)'
        }}>
          {t('transactionHistory', 'Transaction History')}
        </span>
      </div>
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-sm)',
          padding: isMobile ? '16px' : '24px'
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Select
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val)
              setPage(1)
            }}
            style={{ width: isMobile ? '100%' : 200, height: 40 }}
            className="oio-select"
            options={TX_TYPE_KEYS.map((opt) => ({
              value: opt.value,
              label: t(`txTypeLabel.${opt.key}`, opt.key),
            }))}
          />
        </div>

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
            showTotal: isMobile ? undefined : (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </div>

      {/* Top-up Modal */}
      <Modal
        title={
          <span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>
             {t('topup', 'Deposit')}
          </span>
        }
        open={topupModalOpen}
        onCancel={() => {
          setTopupModalOpen(false)
          setTopupAmount(null)
        }}
        footer={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0' }}>
          <Typography.Paragraph style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 14 }}>
            {t('topupExplain', 'Enter the amount you want to deposit into your wallet. You will be redirected to VnPay for payment.')}
          </Typography.Paragraph>
          <div>
            <span style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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

          <Button
            type="primary"
            size="large"
            block
            loading={topupMutation.isPending}
            disabled={!topupAmount || topupAmount <= 0}
            onClick={async () => {
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
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              borderRadius: 12,
              fontWeight: 700,
              height: 52,
              marginTop: 8
            }}
          >
            {t('topupConfirm', 'Deposit Now')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
