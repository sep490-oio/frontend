import { useState } from 'react'
import { Typography, Row, Col, Button, Space, Select, Card } from 'antd'
import { WalletOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWallet, useWalletTransactions } from '@/features/payment/api'
import { WalletTransactionType } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { BalanceCard } from '@/features/payment/components/BalanceCard'
import { TransactionTable } from '@/features/payment/components/TransactionTable'
import { TopUpWalletModal } from '@/features/payment/components/TopUpWalletModal'
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

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [topupModalOpen, setTopupModalOpen] = useState(false)

  const { data: wallet, isLoading: walletLoading } = useWallet({ refetchInterval: 30000 })
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

      <TopUpWalletModal
        open={topupModalOpen}
        onClose={() => setTopupModalOpen(false)}
        currency={wallet?.currency ?? 'VND'}
      />
    </div>
  )
}
