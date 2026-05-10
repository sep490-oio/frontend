import { useMemo, useState } from 'react'
import {
  Typography,
  Row,
  Col,
  Button,
  Space,
  Select,
  Card,
  Tabs,
  Tooltip,
  Drawer,
  Tag,
  Alert,
  Descriptions,
} from 'antd'
import {
  WalletOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useSellerFinanceOverview,
  useSellerEscrowLedger,
  useWalletTransactions,
  useMyWithdrawals,
} from '@/features/payment/api'
import { WalletTransactionType, WithdrawalStatus } from '@/types/enums'
import type { SellerEscrowLedgerRowDto } from '@/types'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { BalanceCard } from '@/features/payment/components/BalanceCard'
import { TransactionTable } from '@/features/payment/components/TransactionTable'
import { WithdrawalSnapshot } from '@/features/payment/components/WithdrawalSnapshot'
import { SellerDepositsPanel } from '@/features/payment/components/SellerDepositsPanel'
import { MoneyFlowExplainer } from '@/features/payment/components/MoneyFlowExplainer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { ColumnsType } from 'antd/es/table'

// ── Helpers ───────────────────────────────────────────────────────────

// Hold reasons are surfaced verbatim from BE. We map a small set of well-known
// machine codes to translated copy; anything else falls back to the raw string
// so unexpected reasons remain visible (rather than silently swallowed).
function holdReasonLabel(t: ReturnType<typeof useTranslation>['t'], reason: string | null): string {
  if (!reason) return ''
  const known: Record<string, string> = {
    awaiting_delivery: t('sellerFinance.holdReason.awaitingDelivery', 'Awaiting delivery'),
    awaiting_acceptance: t('sellerFinance.holdReason.awaitingAcceptance', 'Awaiting buyer confirmation'),
    frozen_by_dispute: t('sellerFinance.holdReason.frozenByDispute', 'Frozen by dispute'),
    inspection_in_progress: t('sellerFinance.holdReason.inspectionInProgress', 'Inspection in progress'),
  }
  return known[reason] ?? reason
}

// Map BE-cased escrow statuses to the lowercase tokens the StatusBadge map knows.
function escrowStatusToken(status: SellerEscrowLedgerRowDto['escrowStatus']): string {
  switch (status) {
    case 'Holding':
      return 'holding'
    case 'ReleasedToSeller':
      return 'released_to_seller'
    case 'RefundedToBuyer':
      return 'refunded_to_buyer'
    default:
      return String(status).toLowerCase()
  }
}

// ── Page ──────────────────────────────────────────────────────────────

export default function SellerWalletPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [activeTab, setActiveTab] = useState<'escrow' | 'fees' | 'transactions' | 'deposits' | 'flow'>('escrow')

  // Transactions tab paging state — kept identical to the previous wallet page
  // so refactor doesn't change behaviour for that tab.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const TX_TYPE_OPTIONS = [
    { value: '', label: t('txTypeLabel.all') },
    { value: WalletTransactionType.Credit, label: t('txTypeLabel.credit') },
    { value: WalletTransactionType.Debit, label: t('txTypeLabel.debit') },
    { value: WalletTransactionType.Hold, label: t('txTypeLabel.hold') },
    { value: WalletTransactionType.Release, label: t('txTypeLabel.release') },
  ]

  const { data: overview, isLoading: overviewLoading } = useSellerFinanceOverview({
    refetchInterval: 30_000,
  })
  const { data: ledger, isLoading: ledgerLoading } = useSellerEscrowLedger({
    refetchInterval: 30_000,
  })
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(
    {
      pageNumber: page,
      pageSize,
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    { refetchInterval: 30_000 },
  )
  const { data: withdrawals } = useMyWithdrawals({ pageNumber: 1, pageSize: 20 })

  const pendingWithdrawals = (withdrawals?.items ?? []).filter(
    (w) => w.status === WithdrawalStatus.Pending,
  )
  const recentPending = pendingWithdrawals[0]

  const ledgerRows = ledger ?? []
  const currency = overview?.currency

  const pendingFees = useMemo(() => {
    if (!overview) return 0
    return (
      (overview.estimatedPlatformCommission ?? 0) +
      (overview.estimatedInspectionFee ?? 0) +
      (overview.pendingSellerFeeCharges ?? 0)
    )
  }, [overview])

  // Drawer state for the per-row money breakdown.
  const [activeRow, setActiveRow] = useState<SellerEscrowLedgerRowDto | null>(null)

  const escrowColumns: ColumnsType<SellerEscrowLedgerRowDto> = [
    {
      title: t('sellerFinance.col.orderNumber', 'Order #'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (orderNumber: string, record) => (
        <a
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/seller/orders/${record.orderId}`)
          }}
          style={{ fontFamily: MONO_FONT, fontWeight: 600 }}
        >
          #{orderNumber}
        </a>
      ),
    },
    {
      title: t('sellerFinance.col.itemTitle', 'Item'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
      render: (title: string) => (
        <Typography.Text style={{ maxWidth: 280 }} ellipsis={{ tooltip: title }}>
          {title}
        </Typography.Text>
      ),
    },
    {
      title: t('sellerFinance.col.orderStatus', 'Order'),
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 140,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('sellerFinance.col.escrowStatus', 'Escrow'),
      dataIndex: 'escrowStatus',
      key: 'escrowStatus',
      width: 160,
      render: (status: SellerEscrowLedgerRowDto['escrowStatus'], record) => (
        <Space size={6} direction="vertical">
          <StatusBadge status={escrowStatusToken(status)} size="small" />
          {record.disputeId && (
            <Tag color="error" icon={<WarningOutlined />} style={{ margin: 0, fontSize: 10 }}>
              {t('sellerFinance.disputeFrozen', 'Frozen by dispute')}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('sellerFinance.col.holdReason', 'Hold reason'),
      dataIndex: 'holdReason',
      key: 'holdReason',
      width: 180,
      render: (reason: string | null) =>
        reason ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {holdReasonLabel(t, reason)}
          </Typography.Text>
        ) : (
          <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
        ),
    },
    {
      title: t('sellerFinance.col.buyerPaidAt', 'Buyer paid'),
      dataIndex: 'buyerPaidAt',
      key: 'buyerPaidAt',
      width: 160,
      render: (date: string | null) => (
        <span style={{ fontSize: 12 }}>{date ? formatDateTime(date) : '—'}</span>
      ),
    },
    {
      title: t('sellerFinance.col.expectedRelease', 'Expected release'),
      dataIndex: 'expectedReleaseAt',
      key: 'expectedReleaseAt',
      width: 160,
      render: (date: string | null) => (
        <span style={{ fontSize: 12 }}>{date ? formatDateTime(date) : '—'}</span>
      ),
    },
    {
      title: (
        <Space size={4}>
          {t('sellerFinance.col.netPayout', 'Net payout')}
          <Tooltip title={t('sellerFinance.tooltip.estimate', 'This is an estimate. Actual amounts will be shown after the transaction is finalized.')}>
            <InfoCircleOutlined style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'estimatedNetPayout',
      key: 'estimatedNetPayout',
      width: 180,
      align: 'right',
      render: (amount: number, record) => {
        const isReleased = record.escrowStatus === 'ReleasedToSeller'
        const value = isReleased && record.actualReleasedAmount != null ? record.actualReleasedAmount : amount
        return (
          <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
            <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
              {formatCurrency(value, record.currency)}
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              {isReleased
                ? t('sellerFinance.label.released', 'Released')
                : t('sellerFinance.label.estimate', '(estimate)')}
            </Typography.Text>
          </Space>
        )
      },
    },
    {
      title: tc('action.view', 'View'),
      key: 'action',
      width: 110,
      align: 'right',
      render: (_: unknown, record) => (
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            setActiveRow(record)
          }}
        >
          {t('sellerFinance.action.viewBreakdown', 'Breakdown')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          className="oio-serif"
          style={{
            fontWeight: 400,
            fontSize: isMobile ? 24 : 32,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <WalletOutlined style={{ fontSize: isMobile ? 24 : 28 }} />
          {t('sellerFinance.title', 'Seller Finance')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
          {t('sellerFinance.subtitle', 'Track withdrawable balance, escrow holdings, and fees')}
        </p>
        {overview?.updatedAt && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('lastUpdated', 'Last updated')}: {formatDateTime(overview.updatedAt)}
          </Typography.Text>
        )}
      </div>

      {/* 4 summary cards — withdrawable, holding, expected, pending fees */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <BalanceCard
            loading={overviewLoading}
            title={t('sellerFinance.cards.withdrawable', 'Withdrawable')}
            value={overview?.withdrawableBalance ?? 0}
            currency={currency}
            color="var(--color-success)"
            helpText={t('sellerFinance.cards.withdrawableHelp', 'Amount available to withdraw to your bank account.')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <BalanceCard
            loading={overviewLoading}
            title={t('sellerFinance.cards.holding', 'Platform Holding')}
            value={overview?.grossEscrowHolding ?? 0}
            currency={currency}
            color="#d48806"
            helpText={t('sellerFinance.cards.holdingHelp', 'Buyer has paid but funds are not yet released to your wallet.')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <BalanceCard
            loading={overviewLoading}
            title={t('sellerFinance.cards.expected', 'Expected Payout (estimate)')}
            value={overview?.estimatedSellerNetPayout ?? 0}
            currency={currency}
            color="var(--color-text-primary)"
            helpText={t('sellerFinance.cards.expectedHelp', '= gross − 10% platform fee − 3% inspection fee (if applicable).')}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <BalanceCard
            loading={overviewLoading}
            title={t('sellerFinance.cards.pendingFees', 'Pending Fees/Deductions')}
            value={pendingFees}
            currency={currency}
            color="var(--color-danger)"
            helpText={t('sellerFinance.cards.pendingFeesHelp', 'Total platform + inspection + pending seller fees.')}
          />
        </Col>
      </Row>

      {/* Pending withdrawal snapshot + primary withdraw CTA */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <WithdrawalSnapshot
            pendingAmount={overview?.pendingWithdrawalAmount ?? 0}
            currency={currency}
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
        styles={{ body: { padding: isMobile ? 12 : 24 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          items={[
            {
              key: 'escrow',
              label: (
                <span style={{ fontFamily: SERIF_FONT, fontSize: 16 }}>
                  {t('sellerFinance.tabs.escrow', 'Escrow & Pending Payout')}
                </span>
              ),
              children:
                ledgerRows.length === 0 && !ledgerLoading ? (
                  <EmptyState
                    title={t('sellerFinance.empty.noEscrowTitle', 'No escrow transactions yet')}
                    description={t(
                      'sellerFinance.empty.noEscrow',
                      'No escrow transactions yet — when a buyer pays for your first order, funds will appear here.',
                    )}
                  />
                ) : (
                  <ResponsiveTable<SellerEscrowLedgerRowDto>
                    mobileMode="card"
                    rowKey="orderId"
                    columns={escrowColumns}
                    dataSource={ledgerRows}
                    loading={ledgerLoading}
                    onRow={(record) => ({
                      onClick: () => setActiveRow(record),
                      style: { cursor: 'pointer' },
                    })}
                    mobileRender={(record) => {
                      const isReleased = record.escrowStatus === 'ReleasedToSeller'
                      const netValue =
                        isReleased && record.actualReleasedAmount != null
                          ? record.actualReleasedAmount
                          : record.estimatedNetPayout
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <a
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/seller/orders/${record.orderId}`)
                              }}
                              style={{ fontFamily: MONO_FONT, fontWeight: 700 }}
                            >
                              #{record.orderNumber}
                            </a>
                            <StatusBadge status={escrowStatusToken(record.escrowStatus)} size="small" />
                          </div>
                          <Typography.Text style={{ fontWeight: 600 }} ellipsis={{ tooltip: record.itemTitle }}>
                            {record.itemTitle}
                          </Typography.Text>
                          {record.holdReason && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {holdReasonLabel(t, record.holdReason)}
                            </Typography.Text>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                              {isReleased
                                ? t('sellerFinance.label.released', 'Released')
                                : t('sellerFinance.label.estimate', '(estimate)')}
                            </Typography.Text>
                            <span style={{ fontFamily: MONO_FONT, fontWeight: 700 }}>
                              {formatCurrency(netValue, record.currency)}
                            </span>
                          </div>
                          {record.disputeId && (
                            <Tag color="error" icon={<WarningOutlined />} style={{ alignSelf: 'flex-start' }}>
                              {t('sellerFinance.disputeFrozen', 'Frozen by dispute')}
                            </Tag>
                          )}
                          <Button size="small" onClick={() => setActiveRow(record)}>
                            {t('sellerFinance.action.viewBreakdown', 'Breakdown')}
                          </Button>
                        </div>
                      )
                    }}
                  />
                ),
            },
            {
              key: 'fees',
              label: (
                <span style={{ fontFamily: SERIF_FONT, fontSize: 16 }}>
                  {t('sellerFinance.tabs.fees', 'Fees & Deductions')}
                </span>
              ),
              children: overview ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Alert
                    type="info"
                    showIcon
                    message={t('sellerFinance.fees.explainTitle', 'Fee Calculation')}
                    description={t(
                      'sellerFinance.fees.explainBody',
                      'Platform fee of 10% applies to all orders. Inspection fee of 3% only applies to platform-verified items, capped at 625,000 VND/order.',
                    )}
                  />
                  <Descriptions
                    column={1}
                    bordered
                    size="small"
                    styles={{ label: { width: 280 } }}
                  >
                    <Descriptions.Item label={t('sellerFinance.fees.platform', 'Total 10% Platform Fee (pending)')}>
                      <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                        {formatCurrency(overview.estimatedPlatformCommission, overview.currency)}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('sellerFinance.fees.inspection', 'Total 3% Inspection Fee')}>
                      <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                        {formatCurrency(overview.estimatedInspectionFee, overview.currency)}
                      </span>
                      <Typography.Text
                        type="secondary"
                        style={{ display: 'block', fontSize: 11, marginTop: 2 }}
                      >
                        {t(
                          'sellerFinance.fees.inspectionNote',
                          'Only applies to platform-verified items.',
                        )}
                      </Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('sellerFinance.fees.pendingCharges', 'Pending Seller Fees')}>
                      <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                        {formatCurrency(overview.pendingSellerFeeCharges, overview.currency)}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('sellerFinance.fees.disputed', 'In Dispute')}>
                      <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                        {formatCurrency(overview.disputedEscrowAmount, overview.currency)}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('sellerFinance.fees.readyToRelease', 'Ready to Release')}>
                      <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                        {formatCurrency(overview.readyToReleaseAmount, overview.currency)}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ) : (
                <EmptyState description={tc('emptyState.title', 'No data')} />
              ),
            },
            {
              key: 'transactions',
              label: (
                <span style={{ fontFamily: SERIF_FONT, fontSize: 16 }}>
                  {t('sellerFinance.tabs.transactions', 'Transactions')}
                </span>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Select
                      value={typeFilter}
                      onChange={(val) => {
                        setTypeFilter(val)
                        setPage(1)
                      }}
                      style={{ width: 160 }}
                      options={TX_TYPE_OPTIONS}
                    />
                  </Space>
                  <TransactionTable
                    data={transactions?.items ?? []}
                    loading={txLoading}
                    pagination={{
                      current: transactions?.metadata?.currentPage ?? (transactions as any)?.pageNumber ?? page,
                      pageSize: transactions?.metadata?.pageSize ?? (transactions as any)?.pageSize ?? pageSize,
                      total: transactions?.metadata?.totalCount ?? (transactions as any)?.totalCount ?? 0,
                      showSizeChanger: true,
                      showTotal: (total) => tc('pagination.total', { total }),
                      onChange: (p, ps) => {
                        setPage(p)
                        setPageSize(ps)
                      },
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'deposits',
              label: (
                <span style={{ fontFamily: SERIF_FONT, fontSize: 16 }}>
                  <LockOutlined style={{ marginRight: 6 }} />
                  {t('sellerFinance.tabs.deposits', 'Auction Deposits')}
                </span>
              ),
              children: <SellerDepositsPanel />,
            },
            {
              key: 'flow',
              label: (
                <span style={{ fontFamily: SERIF_FONT, fontSize: 16 }}>
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                  {t('moneyFlowTab', 'Money Flow')}
                </span>
              ),
              children: <MoneyFlowExplainer />,
            },
          ]}
        />
      </Card>

      {/* Per-row money breakdown drawer */}
      <Drawer
        title={
          activeRow ? (
            <span style={{ fontFamily: SERIF_FONT, fontSize: 18 }}>
              {t('sellerFinance.drawer.title', 'Money breakdown')} #{activeRow.orderNumber}
            </span>
          ) : null
        }
        open={!!activeRow}
        onClose={() => setActiveRow(null)}
        width={isMobile ? '100%' : 480}
        destroyOnHidden
      >
        {activeRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeRow.disputeId && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message={t('sellerFinance.disputeFrozen', 'Frozen by dispute')}
                description={
                  <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={() => navigate(`/me/disputes/${activeRow.disputeId}`)}
                  >
                    {t('sellerFinance.action.viewDispute', 'Xem dispute')}
                  </Button>
                }
              />
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('sellerFinance.drawer.orderStatus', 'Order status')}>
                <StatusBadge status={activeRow.orderStatus} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label={t('sellerFinance.drawer.escrowStatus', 'Escrow status')}>
                <StatusBadge status={escrowStatusToken(activeRow.escrowStatus)} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label={t('sellerFinance.drawer.grossPaid', 'Buyer paid (gross)')}>
                <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                  {formatCurrency(activeRow.grossPaidAmount, activeRow.currency)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={t('sellerFinance.drawer.platformCommission', 'Platform Fee 10%')}>
                <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                  −{formatCurrency(activeRow.platformCommissionAmount, activeRow.currency)}
                </span>
              </Descriptions.Item>
              {activeRow.isPlatformVerifiedItem && (
                <Descriptions.Item label={t('sellerFinance.drawer.inspectionFee', 'Inspection Fee 3%')}>
                  <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                    −{formatCurrency(activeRow.inspectionFeeAmount, activeRow.currency)}
                  </span>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('sellerFinance.drawer.netPayout', 'Net payout')}>
                <span style={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: 16 }}>
                  {formatCurrency(
                    activeRow.escrowStatus === 'ReleasedToSeller' && activeRow.actualReleasedAmount != null
                      ? activeRow.actualReleasedAmount
                      : activeRow.estimatedNetPayout,
                    activeRow.currency,
                  )}
                </span>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                  {activeRow.escrowStatus === 'ReleasedToSeller'
                    ? t('sellerFinance.label.released', 'Released')
                    : t('sellerFinance.label.estimate', '(estimate)')}
                </Typography.Text>
              </Descriptions.Item>
              {activeRow.holdReason && (
                <Descriptions.Item label={t('sellerFinance.drawer.holdReason', 'Hold reason')}>
                  {holdReasonLabel(t, activeRow.holdReason)}
                </Descriptions.Item>
              )}
              {activeRow.buyerPaidAt && (
                <Descriptions.Item label={t('sellerFinance.drawer.buyerPaidAt', 'Buyer paid at')}>
                  {formatDateTime(activeRow.buyerPaidAt)}
                </Descriptions.Item>
              )}
              {activeRow.expectedReleaseAt && (
                <Descriptions.Item label={t('sellerFinance.drawer.expectedRelease', 'Expected release')}>
                  {formatDateTime(activeRow.expectedReleaseAt)}
                </Descriptions.Item>
              )}
              {activeRow.decisionWindowEndsAt && (
                <Descriptions.Item label={t('sellerFinance.drawer.decisionWindow', 'Decision window ends')}>
                  {formatDateTime(activeRow.decisionWindowEndsAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
            <Button
              block
              type="primary"
              onClick={() => navigate(`/seller/orders/${activeRow.orderId}`)}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {t('sellerFinance.action.openOrder', 'Open Order Details')}
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  )
}
