import { useState } from 'react'
import { Typography, Row, Col, Button, Space, Select, Card } from 'antd'
import { WalletOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useSellerWalletOverview,
  useWalletTransactions,
  useMyWithdrawals,
} from '@/features/payment/api'
import { WalletTransactionType, WithdrawalStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { BalanceCard } from '@/features/payment/components/BalanceCard'
import { TransactionTable } from '@/features/payment/components/TransactionTable'
import { WithdrawalSnapshot } from '@/features/payment/components/WithdrawalSnapshot'
import { SERIF_FONT } from '@/styles/tokens'

export default function SellerWalletPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')

  const TX_TYPE_OPTIONS = [
    { value: '', label: t('txTypeLabel.all') },
    { value: WalletTransactionType.Credit, label: t('txTypeLabel.credit') },
    { value: WalletTransactionType.Debit, label: t('txTypeLabel.debit') },
    { value: WalletTransactionType.Hold, label: t('txTypeLabel.hold') },
    { value: WalletTransactionType.Release, label: t('txTypeLabel.release') },
  ] as const
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const { data: overview, isLoading: overviewLoading } = useSellerWalletOverview({
    refetchInterval: 30000,
  })
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(
    {
      pageNumber: page,
      pageSize,
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    { refetchInterval: 30000 },
  )
  const { data: withdrawals } = useMyWithdrawals({ pageNumber: 1, pageSize: 20 })

  const pendingWithdrawals = (withdrawals?.items ?? []).filter(
    (w) => w.status === WithdrawalStatus.Pending,
  )
  const recentPending = pendingWithdrawals[0]

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
          {t('sellerWallet', 'Seller Wallet')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          {t('sellerWalletSubtitle', 'Track your earnings, escrow, and withdrawals')}
        </p>
        {overview?.updatedAt && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('lastUpdated', 'Last updated')}: {formatDateTime(overview.updatedAt)}
          </Typography.Text>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <BalanceCard
            loading={overviewLoading}
            title={t('withdrawableBalance', 'Withdrawable Balance')}
            value={overview?.availableBalance ?? 0}
            currency={overview?.currency}
            color="var(--color-success)"
            helpText={t(
              'withdrawableBalanceHelp',
              'Funds available for withdrawal to your bank account.',
            )}
          />
        </Col>
        <Col xs={24} sm={8}>
          <BalanceCard
            loading={overviewLoading}
            title={t('escrowHolding', 'Escrow Holding')}
            value={overview?.escrowHoldingAmount ?? 0}
            currency={overview?.currency}
            color="#d48806"
            helpText={t(
              'escrowHoldingHelp',
              'Funds held in escrow for active orders awaiting completion.',
            )}
          />
        </Col>
        <Col xs={24} sm={8}>
          <BalanceCard
            loading={overviewLoading}
            title={t('settledEarnings', 'Settled Earnings')}
            value={overview?.releasedToWalletAmount ?? 0}
            currency={overview?.currency}
            color="var(--color-text-secondary)"
            helpText={t(
              'settledEarningsHelp',
              'Total earnings released from escrow to your wallet.',
            )}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <WithdrawalSnapshot
            pendingAmount={overview?.pendingWithdrawalAmount ?? 0}
            currency={overview?.currency}
            recentRequest={recentPending}
            onViewAll={() => navigate('/seller/wallet/withdraw')}
          />
        </Col>
      </Row>

      <Space style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<ArrowDownOutlined />}
          onClick={() => navigate('/seller/wallet/withdraw')}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
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
          walletPrefix="/seller"
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
    </div>
  )
}
