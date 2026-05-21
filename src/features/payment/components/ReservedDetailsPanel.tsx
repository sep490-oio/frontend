import { Card, Typography, Tag, Empty, Flex, Tabs, Button, Spin } from 'antd'
import { WalletOutlined, LockOutlined, ClockCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useActiveDeposits, useMyWithdrawals, type ActiveDepositDto } from '@/features/payment/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { WithdrawalStatus } from '@/types/enums'
import type { WithdrawalRequestDto } from '@/types'
import { useMemo, useState } from 'react'

const { Text, Title } = Typography

export function ReservedDetailsPanel() {
  const { t } = useTranslation('payment')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('all')

  const { data: activeDeposits, isLoading: depositsLoading } = useActiveDeposits()
  const { data: withdrawals, isLoading: withdrawLoading } = useMyWithdrawals({ pageNumber: 1, pageSize: 100 })

  const pendingWithdrawals = withdrawals?.items?.filter(
    (w) => w.status === WithdrawalStatus.Pending || w.status === WithdrawalStatus.Processing
  ) ?? []

  const activeDepositsTotal = useMemo(() => {
    return activeDeposits?.reduce((sum, d) => sum + (d.amount ?? 0), 0) ?? 0
  }, [activeDeposits])

  const pendingWithdrawsTotal = useMemo(() => {
    return pendingWithdrawals.reduce((sum, w) => sum + (w.amount ?? 0), 0) ?? 0
  }, [pendingWithdrawals])

  const totalReserved = activeDepositsTotal + pendingWithdrawsTotal

  const hasDeposits = activeDeposits && activeDeposits.length > 0
  const hasWithdrawals = pendingWithdrawals.length > 0

  if (!depositsLoading && !withdrawLoading && !hasDeposits && !hasWithdrawals) {
    return (
      <Card
        styles={{ body: { padding: isMobile ? 32 : 48, textAlign: 'center' } }}
        style={{
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
        }}
      >
        <Empty
          image={<WalletOutlined style={{ fontSize: 64, color: 'var(--color-text-tertiary)' }} />}
          description={
            <div>
              <Text strong style={{ display: 'block', fontSize: 16, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                {t('reservedDetails.empty', 'No reserved funds.')}
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {t('reservedDetails.emptyDesc', 'Your entire balance is fully available for transactions or withdrawals.')}
              </Text>
            </div>
          }
        />
      </Card>
    )
  }

  const renderDepositCard = (record: ActiveDepositDto) => (
    <Card
      key={`deposit-${record.auctionId}`}
      styles={{ body: { padding: 16 } }}
      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm)',
        borderColor: 'var(--color-border)'
      }}
    >
      <Flex vertical gap={12}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={8}>
            <span style={{ fontSize: 20 }}>🔨</span>
            <Text strong style={{ color: 'var(--color-accent)', fontSize: 16 }}>
              {record.auctionTitle || t('activeDeposits.depositDesc', 'Auction {{auctionId}}', { auctionId: record.auctionId.slice(0, 8) })}
            </Text>
          </Flex>
          <Text strong style={{ color: 'var(--color-warning)', fontSize: 18, fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(record.amount, record.currency)}
          </Text>
        </Flex>

        <Flex justify="space-between" align="center">
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('activeDeposits.cardSubtitle', 'Auction entry deposit')}
          </Text>
          <Button type="link" style={{ padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate(`/auctions/${record.auctionId}`)}>
            <SelectOutlined /> {t('common.viewDetails', 'View Details')}
          </Button>
        </Flex>

        <div style={{ borderLeft: '2px solid var(--color-warning)', paddingLeft: 12, background: 'var(--color-bg-layout)', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('activeDeposits.cardExplanation', 'This amount is held securely and will be fully refunded if you do not win the auction.')}
          </Text>
        </div>

        <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ color: 'var(--color-text-tertiary)' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>{formatDateTime(record.createdAt)}</Text>
          </Flex>
          <Tag color="warning" style={{ margin: 0, border: 'none' }}>DEPOSIT</Tag>
        </Flex>
      </Flex>
    </Card>
  )

  const renderWithdrawalCard = (record: WithdrawalRequestDto) => (
    <Card
      key={`withdraw-${record.id}`}
      styles={{ body: { padding: 16 } }}
      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm)',
        borderColor: 'var(--color-border)'
      }}
    >
      <Flex vertical gap={12}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={8}>
            <span style={{ fontSize: 20 }}>🏦</span>
            <Text strong style={{ color: 'var(--color-accent)', fontSize: 16 }}>
              {t('withdrawal.cardTitle', 'Bank Withdrawal')}
            </Text>
          </Flex>
          <Text strong style={{ color: 'var(--color-warning)', fontSize: 18, fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(record.amount)}
          </Text>
        </Flex>

        <Flex justify="space-between" align="center">
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('withdrawal.cardSubtitle', 'Transfer to your bank account')} - #{record.id.split('-')[0].toUpperCase()}
          </Text>
          <Button type="link" style={{ padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('/me/wallet')}>
            <SelectOutlined /> {t('common.viewDetails', 'View Details')}
          </Button>
        </Flex>

        <div style={{ borderLeft: '2px solid var(--color-warning)', paddingLeft: 12, background: 'var(--color-bg-layout)', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('withdrawal.cardExplanation', 'Pending processing. Funds will be credited to your account within 1-3 business days.')}
          </Text>
        </div>

        <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
          <Flex align="center" gap={6}>
            <ClockCircleOutlined style={{ color: 'var(--color-text-tertiary)' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>{formatDateTime(record.createdAt)}</Text>
          </Flex>
          <Tag color="processing" style={{ margin: 0, border: 'none' }}>WITHDRAWAL</Tag>
        </Flex>
      </Flex>
    </Card>
  )

  const items = [
    {
      key: 'all',
      label: t('reservedDetails.tabs.all', 'All') + ` (${(activeDeposits?.length || 0) + pendingWithdrawals.length})`,
      children: (
        <Spin spinning={depositsLoading || withdrawLoading}>
          {activeDeposits?.map(renderDepositCard)}
          {pendingWithdrawals.map(renderWithdrawalCard)}
        </Spin>
      )
    },
    {
      key: 'deposits',
      label: t('reservedDetails.tabs.deposits', 'Auction Deposits') + ` (${activeDeposits?.length || 0})`,
      children: (
        <Spin spinning={depositsLoading}>
          {activeDeposits?.length ? activeDeposits.map(renderDepositCard) : <Empty description={t('activeDeposits.empty', 'No auction deposits')} />}
        </Spin>
      )
    },
    {
      key: 'withdrawals',
      label: t('reservedDetails.tabs.withdrawals', 'Pending Withdrawals') + ` (${pendingWithdrawals.length})`,
      children: (
        <Spin spinning={withdrawLoading}>
          {pendingWithdrawals.length ? pendingWithdrawals.map(renderWithdrawalCard) : <Empty description={t('withdrawal.empty', 'No pending withdrawals')} />}
        </Spin>
      )
    }
  ]

  return (
    <Flex vertical gap={24}>
      <Card
        styles={{ body: { padding: '16px 24px' } }}
        style={{
          background: 'var(--color-bg-layout)',
          borderRadius: 16,
          border: 'none',
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Flex align="center" gap={12}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LockOutlined style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
            </div>
            <Title level={5} style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              {t('reservedDetails.totalBanner', 'Total Reserved Funds')}
            </Title>
          </Flex>
          <Text strong style={{ fontSize: 24, color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalReserved)}
          </Text>
        </Flex>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={items} 
        size="large"
        tabBarStyle={{ marginBottom: 24 }}
      />
    </Flex>
  )
}
