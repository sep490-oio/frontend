import { useState } from 'react'
import { Typography, Row, Col, Button, Card, Flex } from 'antd'
import {
  WalletOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWallet, useWalletTransactions } from '@/features/payment/api'
import { WalletTransactionType } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { BalanceCard } from '@/features/payment/components/BalanceCard'
import { TransactionTable } from '@/features/payment/components/TransactionTable'
import { TopUpWalletModal } from '@/features/payment/components/TopUpWalletModal'
import { SANS_FONT } from '@/styles/tokens'

import { useBreakpoint } from '@/hooks/useBreakpoint'

const { Title, Text } = Typography

const TX_TYPE_KEYS = [
  { value: '', key: 'all' },
  { value: WalletTransactionType.Credit, key: 'credit' },
  { value: WalletTransactionType.Debit, key: 'debit' },
  { value: WalletTransactionType.Hold, key: 'hold' },
  { value: WalletTransactionType.Release, key: 'release' },
] as const

export default function BuyerWalletPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '12px 16px 80px' : '0 24px 80px' }}>
      {/* Header Section */}
      <Flex 
        justify="space-between" 
        align={isMobile ? 'flex-start' : 'flex-end'} 
        vertical={isMobile}
        gap={isMobile ? 16 : 0}
        style={{ marginBottom: 32 }}
      >
        <div>
          <Title
            level={2}
            style={{
              fontFamily: SANS_FONT,
              fontWeight: 600,
              fontSize: isMobile ? 24 : 32,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <WalletOutlined style={{ color: 'var(--color-accent)' }} />
            {t('wallet', 'Wallet Dashboard')}
          </Title>
          <Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
            {t('walletSubtitle', 'Manage your balance and track all financial movements')}
          </Text>
        </div>
        {wallet?.updatedAt && (
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            <HistoryOutlined style={{ marginRight: 6 }} /> {t('lastUpdated', 'Last updated')}: {formatDateTime(wallet.updatedAt)}
          </Text>
        )}
      </Flex>

      {/* Symmetrical Stats Row */}
      <Row gutter={isMobile ? [12, 12] : [20, 20]} style={{ marginBottom: isMobile ? 32 : 40 }}>
        <Col xs={24} sm={12} lg={6}>
          <BalanceCard
            loading={walletLoading}
            title={t('availableBalance', 'Available Balance')}
            value={wallet?.availableBalance ?? 0}
            currency={wallet?.currency}
            color="var(--color-success)"
            icon={<CheckCircleOutlined />}
            style={{ height: '100%' }}
            helpText={t('availableBalanceHelp', 'Funds available for immediate use.')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <BalanceCard
            loading={walletLoading}
            title={t('reservedFunds', 'Reserved Funds')}
            value={wallet?.pendingBalance ?? 0}
            currency={wallet?.currency}
            color="var(--color-warning)"
            icon={<LockOutlined />}
            style={{ height: '100%' }}
            helpText={t('reservedFundsHelpShort', 'Funds held for active deposits.')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <BalanceCard
            loading={walletLoading}
            title={t('totalBalance', 'Total Balance')}
            value={wallet?.totalBalance ?? 0}
            currency={wallet?.currency}
            color="var(--color-text-primary)"
            icon={<SafetyCertificateOutlined />}
            style={{ height: '100%' }}
            helpText={t('totalBalanceHelpShort', 'Your combined wallet balance.')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            styles={{ body: { padding: isMobile ? '20px' : '24px' } }}
            style={{
              height: '100%',
              borderRadius: 24,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Flex vertical gap={12}>
              <Text strong style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                 {t('quickActions', 'Actions')}
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setTopupModalOpen(true)}
                size="large"
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  fontWeight: 600,
                  height: 44,
                  borderRadius: 12
                }}
                block
              >
                {t('topup', 'Top Up')}
              </Button>
              <Button
                icon={<ArrowDownOutlined />}
                onClick={() => navigate('/me/wallet/withdraw')}
                size="large"
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  height: 44,
                  borderRadius: 12
                }}
                block
              >
                {t('withdraw', 'Withdraw')}
              </Button>
              <Button
                type="link"
                icon={<CreditCardOutlined />}
                onClick={() => navigate('/me/payment-methods')}
                style={{ padding: 0, height: 'auto', fontSize: 13, color: 'var(--color-accent)', textAlign: 'left', fontWeight: 600, marginTop: 4 }}
              >
                {t('paymentMethods', 'Manage Cards')}
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* Transaction History Section */}
      <div style={{ marginBottom: 24 }}>
        <Flex 
          justify="space-between" 
          align={isMobile ? 'stretch' : 'center'} 
          vertical={isMobile}
          gap={isMobile ? 16 : 20}
          style={{ marginBottom: 20 }}
        >
          <Title level={3} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600, fontSize: isMobile ? 20 : 24 }}>
            {t('transactionHistory', 'Transaction History')}
          </Title>

          {/* Pill Filters */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            paddingBottom: isMobile ? 4 : 0,
            msOverflowStyle: 'none'
          }}>
            {TX_TYPE_KEYS.map((opt) => {
              const isActive = typeFilter === opt.value
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(opt.value)
                    setPage(1)
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: isActive ? 'var(--color-accent)' : 'var(--color-bg-card)',
                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {t(`txTypeLabel.${opt.key}`, opt.key)}
                </button>
              )
            })}
          </div>
        </Flex>

        {isMobile ? (
          <div style={{ marginBottom: 32 }}>
            <TransactionTable
              data={transactions?.items ?? []}
              loading={txLoading}
              pagination={{
                current: transactions?.metadata?.currentPage ?? page,
                pageSize: transactions?.metadata?.pageSize ?? pageSize,
                total: transactions?.metadata?.totalCount ?? 0,
                showSizeChanger: false,
                size: 'small',
                onChange: (p, ps) => {
                  setPage(p)
                  setPageSize(ps)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                },
              }}
            />
          </div>
        ) : (
          <Card
            styles={{ body: { padding: 0 } }}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <TransactionTable
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
        )}
      </div>

      <TopUpWalletModal
        open={topupModalOpen}
        onClose={() => setTopupModalOpen(false)}
        currency={wallet?.currency ?? 'VND'}
      />
    </div>
  )
}
