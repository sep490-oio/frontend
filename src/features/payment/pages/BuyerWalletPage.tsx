import { useState } from 'react'
import { Typography, Row, Col, Button, Space, Select, Modal, InputNumber, App, Card } from 'antd'
import { WalletOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWallet, useWalletTransactions, useWalletTopup } from '@/features/payment/api'
import { WalletTransactionType } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { BalanceCard } from '@/features/payment/components/BalanceCard'
import { TransactionTable } from '@/features/payment/components/TransactionTable'
import { SERIF_FONT } from '@/styles/tokens'

const TX_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: WalletTransactionType.Credit, label: 'Credit' },
  { value: WalletTransactionType.Debit, label: 'Debit' },
  { value: WalletTransactionType.Hold, label: 'Hold' },
  { value: WalletTransactionType.Release, label: 'Release' },
] as const

export default function BuyerWalletPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [topupModalOpen, setTopupModalOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState<number | null>(null)

  const { data: wallet, isLoading: walletLoading } = useWallet({ refetchInterval: 30000 })
  const topupMutation = useWalletTopup()
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(
    {
      pageNumber: page,
      pageSize,
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    { refetchInterval: 30000 },
  )

  return (
    <div>
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
        {wallet?.updatedAt && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('lastUpdated', 'Last updated')}: {formatDateTime(wallet.updatedAt)}
          </Typography.Text>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <BalanceCard
            loading={walletLoading}
            title={t('availableBalance', 'Available Balance')}
            value={wallet?.availableBalance ?? 0}
            currency={wallet?.currency}
            color="var(--color-success)"
          />
        </Col>
        <Col xs={24} sm={8}>
          <BalanceCard
            loading={walletLoading}
            title={t('reservedFunds', 'Reserved Funds')}
            value={wallet?.pendingBalance ?? 0}
            currency={wallet?.currency}
            color="#d48806"
            helpText={t(
              'reservedFundsHelp',
              'Funds held for active deposits, auto-bid reservations, and pending withdrawals.',
            )}
          />
        </Col>
        <Col xs={24} sm={8}>
          <BalanceCard
            loading={walletLoading}
            title={t('totalBalance', 'Total Balance')}
            value={wallet?.totalBalance ?? 0}
            currency={wallet?.currency}
            color="var(--color-text-secondary)"
            helpText={t('totalBalanceHelp', 'Available + reserved funds combined.')}
          />
        </Col>
      </Row>

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
          onClick={() => navigate('/me/wallet/withdraw')}
          style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
        >
          {t('withdraw', 'Withdraw')}
        </Button>
      </Space>

      <Card
        title={
          <span style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 18 }}>
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
            options={TX_TYPE_OPTIONS.map((opt) => ({
              value: opt.value,
              label: t(`txTypeLabel.${opt.label.toLowerCase()}`, opt.label),
            }))}
          />
        </Space>

        <TransactionTable
          walletPrefix="/me"
          data={transactions?.items ?? []}
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
            {t(
              'topupExplain',
              'Enter the amount you want to deposit into your wallet. You will be redirected to VnPay for payment.',
            )}
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
              placeholder="100,000"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
