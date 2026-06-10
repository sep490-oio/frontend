import { Card, Typography, Tag, Empty, Flex, Tabs, Button, Spin } from 'antd'
import { WalletOutlined, LockOutlined, ClockCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useMyReservations, useMyWithdrawals, useWallet, type ReservationItemDto } from '@/features/payment/api'
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

  const { data: wallet } = useWallet()
  const { data: reservations, isLoading: reservationsLoading } = useMyReservations()
  const { data: withdrawals, isLoading: withdrawLoading } = useMyWithdrawals({ pageNumber: 1, pageSize: 100 })

  // Itemised reserved holds from the backend (auction deposits + auto-bid reservations).
  const reservationItems = useMemo(() => reservations ?? [], [reservations])
  const deposits = useMemo(() => reservationItems.filter((r) => r.type === 'auction_deposit'), [reservationItems])
  const autoBids = useMemo(() => reservationItems.filter((r) => r.type === 'auto_bid'), [reservationItems])

  const pendingWithdrawals = withdrawals?.items?.filter(
    (w) => w.status === WithdrawalStatus.Pending || w.status === WithdrawalStatus.Processing
  ) ?? []

  const reservationsTotal = useMemo(() => {
    return reservationItems.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  }, [reservationItems])

  const pendingWithdrawsTotal = useMemo(() => {
    return pendingWithdrawals.reduce((sum, w) => sum + (w.amount ?? 0), 0) ?? 0
  }, [pendingWithdrawals])

  // The wallet's pendingBalance is the AUTHORITATIVE reserved total: it includes auto-bid
  // reservations, buy-now / hybrid order holds, and escrow funding holds. The backend itemises
  // deposits + auto-bid reservations; any remaining unclassified holds (e.g. in-flight hybrid
  // order payments) are surfaced as a single "in-progress / escrow holds" line so the listed
  // items always sum to the real total shown on the "Reserved Funds" card.
  const currency = wallet?.currency
  const reservedTotal = wallet?.pendingBalance ?? (reservationsTotal + pendingWithdrawsTotal)
  const otherHolds = Math.max(0, reservedTotal - reservationsTotal - pendingWithdrawsTotal)

  const hasReservations = reservationItems.length > 0
  const hasWithdrawals = pendingWithdrawals.length > 0
  const hasOtherHolds = otherHolds > 0

  if (!reservationsLoading && !withdrawLoading && !hasReservations && !hasWithdrawals && !hasOtherHolds) {
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

  const renderReservationCard = (record: ReservationItemDto) => {
    const isAutoBid = record.type === 'auto_bid'
    const emoji = isAutoBid ? '🤖' : '🔨'
    const title = record.title || t('activeDeposits.depositDesc', 'Auction {{auctionId}}', { auctionId: record.referenceId.slice(0, 8) })
    const subtitle = isAutoBid
      ? t('reservedDetails.autoBidSubtitle', 'Auto-bid reservation (max amount held)')
      : t('activeDeposits.cardSubtitle', 'Auction entry deposit')
    const explanation = isAutoBid
      ? t('reservedDetails.autoBidExplanation', 'Held while your auto-bid is active. Released when the auction ends, or applied toward your payment if you win.')
      : t('activeDeposits.cardExplanation', 'This amount is held securely and will be fully refunded if you do not win the auction.')
    const tagColor = isAutoBid ? 'purple' : 'warning'
    const tagLabel = isAutoBid ? 'AUTO-BID' : 'DEPOSIT'

    return (
      <Card
        key={`${record.type}-${record.referenceId}`}
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
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <Text strong style={{ color: 'var(--color-accent)', fontSize: 16 }}>
                {title}
              </Text>
            </Flex>
            <Text strong style={{ color: 'var(--color-warning)', fontSize: 18, fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(record.amount, record.currency)}
            </Text>
          </Flex>

          <Flex justify="space-between" align="center">
            <Text type="secondary" style={{ fontSize: 13 }}>
              {subtitle}
            </Text>
            <Button type="link" style={{ padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate(`/auctions/${record.referenceId}`)}>
              <SelectOutlined /> {t('common.viewDetails', 'View Details')}
            </Button>
          </Flex>

          <div style={{ borderLeft: '2px solid var(--color-warning)', paddingLeft: 12, background: 'var(--color-bg-layout)', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {explanation}
            </Text>
          </div>

          <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
            <Flex align="center" gap={6}>
              <ClockCircleOutlined style={{ color: 'var(--color-text-tertiary)' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>{formatDateTime(record.createdAt)}</Text>
            </Flex>
            <Tag color={tagColor} style={{ margin: 0, border: 'none' }}>{tagLabel}</Tag>
          </Flex>
        </Flex>
      </Card>
    )
  }

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

  const renderOtherHoldsCard = (amount: number) => (
    <Card
      key="other-holds"
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
            <span style={{ fontSize: 20 }}>⏳</span>
            <Text strong style={{ color: 'var(--color-accent)', fontSize: 16 }}>
              {t('reservedDetails.otherHoldsTitle', 'In-progress / Escrow holds')}
            </Text>
          </Flex>
          <Text strong style={{ color: 'var(--color-warning)', fontSize: 18, fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(amount, currency)}
          </Text>
        </Flex>

        <div style={{ borderLeft: '2px solid var(--color-warning)', paddingLeft: 12, background: 'var(--color-bg-layout)', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('reservedDetails.otherHoldsExplanation', 'Funds held for buy-now reservations or order payments in progress. These are released or settled automatically when each transaction completes.')}
          </Text>
        </div>

        <Flex justify="flex-end">
          <Tag color="processing" style={{ margin: 0, border: 'none' }}>IN-PROGRESS</Tag>
        </Flex>
      </Flex>
    </Card>
  )

  const allCount = reservationItems.length + pendingWithdrawals.length + (hasOtherHolds ? 1 : 0)

  const items = [
    {
      key: 'all',
      label: t('reservedDetails.tabs.all', 'All') + ` (${allCount})`,
      children: (
        <Spin spinning={reservationsLoading || withdrawLoading}>
          {reservationItems.map(renderReservationCard)}
          {pendingWithdrawals.map(renderWithdrawalCard)}
          {hasOtherHolds && renderOtherHoldsCard(otherHolds)}
        </Spin>
      )
    },
    {
      key: 'deposits',
      label: t('reservedDetails.tabs.deposits', 'Auction Deposits') + ` (${deposits.length})`,
      children: (
        <Spin spinning={reservationsLoading}>
          {deposits.length ? deposits.map(renderReservationCard) : <Empty description={t('activeDeposits.empty', 'No auction deposits')} />}
        </Spin>
      )
    },
    ...(autoBids.length ? [{
      key: 'autoBids',
      label: t('reservedDetails.tabs.autoBids', 'Auto-bid Reservations') + ` (${autoBids.length})`,
      children: (
        <Spin spinning={reservationsLoading}>
          {autoBids.map(renderReservationCard)}
        </Spin>
      )
    }] : []),
    {
      key: 'withdrawals',
      label: t('reservedDetails.tabs.withdrawals', 'Pending Withdrawals') + ` (${pendingWithdrawals.length})`,
      children: (
        <Spin spinning={withdrawLoading}>
          {pendingWithdrawals.length ? pendingWithdrawals.map(renderWithdrawalCard) : <Empty description={t('withdrawal.empty', 'No pending withdrawals')} />}
        </Spin>
      )
    },
    ...(hasOtherHolds ? [{
      key: 'inProgress',
      label: t('reservedDetails.tabs.inProgress', 'In-progress') + ' (1)',
      children: renderOtherHoldsCard(otherHolds),
    }] : []),
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
            {formatCurrency(reservedTotal, currency)}
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
