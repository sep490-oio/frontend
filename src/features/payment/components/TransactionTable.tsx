import { useTranslation } from 'react-i18next'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WalletTransactionType } from '@/types/enums'
import type { WalletTransactionDto, WalletEventType, WalletLedgerStatus } from '@/types'
import { Tag, Typography, Space, Tooltip, Flex, Drawer, Descriptions } from 'antd'
import { MONO_FONT } from '@/styles/tokens'
import { useState, useMemo } from 'react'
import { ReferenceTitle } from './ReferenceTitle'
import { FilterOutlined } from '@ant-design/icons'
import { formatLedgerDescription } from '../utils/formatLedgerDescription'

const LEDGER_STATUS_CONFIG: Record<WalletLedgerStatus, { color: string; key: string; fallback: string }> = {
  posted: { color: 'success', key: 'ledgerStatus.posted', fallback: 'Posted' },
  pending: { color: 'warning', key: 'ledgerStatus.pending', fallback: 'Pending' },
  failed: { color: 'error', key: 'ledgerStatus.failed', fallback: 'Failed' },
  reversed: { color: 'processing', key: 'ledgerStatus.reversed', fallback: 'Reversed' },
}

const EVENT_TYPE_CONFIG: Record<WalletEventType, { fallback: string }> = {
  wallet_top_up: { fallback: 'Wallet Top-up' },
  auction_deposit_hold: { fallback: 'Auction Deposit' },
  auction_deposit_refund: { fallback: 'Deposit Refund' },
  order_payment: { fallback: 'Order Payment' },
  order_refund: { fallback: 'Order Refund' },
  withdrawal_hold: { fallback: 'Withdrawal Hold' },
  withdrawal_release: { fallback: 'Withdrawal' },
  seller_payout: { fallback: 'Seller Payout' },
  fee: { fallback: 'Transaction Fee' },
}

export interface TransactionTableProps {
  data: WalletTransactionDto[]
  loading?: boolean
  pagination?: TablePaginationConfig | false
}

export function TransactionTable({ data, loading, pagination }: TransactionTableProps) {
  const { t } = useTranslation('payment')
  const [hoveredRefId, setHoveredRefId] = useState<string | null>(null)
  const [selectedTx, setSelectedTx] = useState<WalletTransactionDto | null>(null)

  const processedData = useMemo(() => {
    if (!data) return data;

    // Filter out withdrawal_hold if there's a withdrawal_release with the same reference
    const releaseRefIds = new Set(data.filter(item => item.eventType === 'withdrawal_release').map(item => item.referenceId));
    const filteredData = data.filter(item => {
      if (item.eventType === 'withdrawal_hold' && item.referenceId && releaseRefIds.has(item.referenceId)) {
        return false; // hide hold if release exists
      }
      return true;
    });

    // Sort newest-first, but break exact-timestamp ties deterministically. An atomic
    // "fund-then-hold" auction deposit produces a Credit (wallet top-up) and a Hold
    // (auction deposit) with the SAME createdAt; without a tie-break their order is
    // non-deterministic and the deposit can render above the top-up. balanceBefore
    // follows the ledger build-up (the funding credit starts from the lower running
    // balance), so it surfaces the top-up above the deposit hold — mirroring the backend.
    const result = filteredData.sort((a, b) => {
      const byTime = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (byTime !== 0) return byTime;
      return a.balanceBefore - b.balanceBefore;
    });

    return result;
  }, [data]);

  // Helper to generate a consistent color from string
  const getReferenceColor = (refId: string | null | undefined) => {
    if (!refId) return 'transparent';
    let hash = 0;
    for (let i = 0; i < refId.length; i++) {
      hash = refId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsla(${h}, 70%, 45%, 0.12)`;
  };

  const getReferenceBorderColor = (refId: string | null | undefined) => {
    if (!refId) return 'transparent';
    let hash = 0;
    for (let i = 0; i < refId.length; i++) {
      hash = refId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 50%)`;
  };

  const columns: ColumnsType<WalletTransactionDto> = [
    {
      title: t('txDate', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {formatDateTime(date)}
          </span>
          <Typography.Text type="secondary" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            #{record.id.split('-')[0].toUpperCase()}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('txDescription', 'Description'),
      dataIndex: 'description',
      key: 'description',
      width: 350,
      ellipsis: true,
      render: (description: string | undefined, record) => {
        const isRelatedToAuction = record.referenceType === 'deposit' || record.referenceType === 'escrow' || record.referenceType === 'order';
        const isHighlighted = record.referenceId && record.referenceId === hoveredRefId;
        // Prefer the server-provided eventType i18n key; fall back to the
        // original description string for legacy rows that predate the new
        // enrichment fields.
        let label: string = description ?? '-'
        if (record.eventType === 'seller_payout') {
          label = `Tiền bán đơn hàng ${record.referenceNumber ?? record.referenceId?.split('-')[0].toUpperCase() ?? ''}`
        } else if (record.eventType === 'auction_deposit_hold') {
          label = 'Đặt cọc phiên đấu giá'
        } else if (record.eventType === 'withdrawal_hold' || record.eventType === 'withdrawal_release') {
          label = 'Rút tiền về ngân hàng'
        } else if (record.eventType) {
          const cfg = EVENT_TYPE_CONFIG[record.eventType]
          label = t(`event.${record.eventType}`, cfg?.fallback ?? description ?? record.eventType)
        }

        const displayDescription = label.length > 80 ? `${label.slice(0, 80)}...` : label;

        return (
          <div style={{ maxWidth: 350, minWidth: 0 }}>
            <ReferenceTitle referenceId={record.referenceId} referenceType={record.referenceType} />
            <Typography.Text
              style={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600, display: 'block' }}
              ellipsis={{ tooltip: label }}
            >
              {displayDescription}
            </Typography.Text>
            {(() => {
              const formattedDescription = formatLedgerDescription(description)
              return formattedDescription && record.eventType && formattedDescription !== label ? (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginTop: 2 }}
                  ellipsis={{ tooltip: formattedDescription }}
                >
                  {formattedDescription}
                </Typography.Text>
              ) : null
            })()}
              {record.referenceId && (
                <Tooltip title={t('filterByThis', 'Filter by this reference')}>
                  <Tag
                    color={isRelatedToAuction ? 'processing' : 'default'}
                    onMouseEnter={() => setHoveredRefId(record.referenceId!)}
                    onMouseLeave={() => setHoveredRefId(null)}
                    style={{
                      marginTop: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      borderRadius: 4,
                      border: isHighlighted ? `1px solid ${getReferenceBorderColor(record.referenceId)}` : undefined,
                      background: isHighlighted ? getReferenceColor(record.referenceId) : undefined,
                      transition: 'all 0.2s'
                    }}
                  >
                    <FilterOutlined style={{ marginRight: 4, fontSize: 10 }} />
                    {record.referenceType ? t(`refType.${record.referenceType}`, record.referenceType) : ''}
                    {` • ${(record.referenceNumber ?? record.referenceId.split('-')[0]).toUpperCase()}`}
                  </Tag>
                </Tooltip>
              )}
          </div>
        )
      },
    },
    {
      title: t('txAmount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      align: 'right',
      render: (amount: number, record) => {
        const isDeduction = record.type === WalletTransactionType.Debit || record.type === WalletTransactionType.Hold;
        const color = isDeduction ? 'var(--color-danger)' : 'var(--color-success)';
        const sign = isDeduction ? '-' : '+';

        let typeLabel = t(`txTypeLabel.${record.type}`, record.type);
        if (record.type === WalletTransactionType.Release) {
          if (record.referenceType === 'deposit') typeLabel = t('refType.depositRefund', 'Hoàn tiền cọc');
          else if (record.referenceType === 'order') typeLabel = t('refType.orderRefund', 'Hoàn tiền đơn hàng');
        }

        return (
          <Space direction="vertical" size={0}>
            <span
              style={{
                color,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {sign}{formatCurrency(amount, record.currency)}
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {typeLabel}
            </Typography.Text>
          </Space>
        )
      },
    },
    {
      title: t('txBalanceAfter', 'Balance'),
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 140,
      align: 'right',
      render: (value: number, record) => (
        <span style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(value, record.currency)}</span>
      ),
    },
    {
      title: t('txStatus', 'Status'),
      key: 'status',
      width: 140,
      align: 'right',
      render: (_v, record) => {
        // Prefer the never-null ledgerStatus the new mapper emits. Fall back to
        // the legacy `status` string only if the server hasn't been redeployed yet.
        const ledger: WalletLedgerStatus = record.ledgerStatus ?? (() => {
          const s = (record.status as string | undefined)?.toLowerCase()
          if (s === 'completed' || s === 'success' || s === 'released') return 'posted'
          if (s === 'pending' || s === 'processing' || s === 'initiated') return 'pending'
          if (s === 'failed' || s === 'cancelled' || s === 'error' || s === 'rejected' || s === 'expired') return 'failed'
          if (s === 'refunded' || s === 'reversed') return 'reversed'
          // Wallet ledger entries that exist in the table are by definition posted.
          return 'posted'
        })()
        const cfg = LEDGER_STATUS_CONFIG[ledger]
        return <Tag color={cfg.color} bordered={false}>{t(cfg.key, cfg.fallback)}</Tag>
      },
    },
  ]

  return (
    <>
    <ResponsiveTable<WalletTransactionDto>
      mobileMode="card"
      rowKey="id"
      columns={columns}
      dataSource={processedData}
      loading={loading}
      pagination={pagination}
      mobileRender={(record) => {
        const isDeduction = record.type === WalletTransactionType.Debit || record.type === WalletTransactionType.Hold;
        const color = isDeduction ? 'var(--color-danger)' : 'var(--color-success)';
        const sign = isDeduction ? '-' : '+';

        const ledger: WalletLedgerStatus = record.ledgerStatus ?? (() => {
          const s = (record.status as string | undefined)?.toLowerCase()
          if (s === 'completed' || s === 'success' || s === 'released') return 'posted'
          if (s === 'pending' || s === 'processing' || s === 'initiated') return 'pending'
          if (s === 'failed' || s === 'cancelled' || s === 'error' || s === 'rejected' || s === 'expired') return 'failed'
          if (s === 'refunded' || s === 'reversed') return 'reversed'
          return 'posted'
        })()
        const ledgerCfg = LEDGER_STATUS_CONFIG[ledger]

        return (
          <Flex vertical gap={12} style={{ padding: '4px 0' }}>
            <Flex justify="space-between" align="flex-start">
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.eventType ? t(`event.${record.eventType}`, EVENT_TYPE_CONFIG[record.eventType]?.fallback ?? record.description ?? record.eventType) : (record.description || '-')}
                </div>
                {formatLedgerDescription(record.description) && record.eventType && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatLedgerDescription(record.description)}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: MONO_FONT }}>
                  {formatDateTime(record.createdAt)} • #{record.id.split('-')[0].toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color, fontFamily: MONO_FONT, fontWeight: 700, fontSize: 16 }}>
                  {sign}{formatCurrency(record.amount, record.currency)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {t(`txTypeLabel.${record.type}`, record.type)}
                </div>
              </div>
            </Flex>

            <Flex justify="space-between" align="center" style={{ paddingTop: 8, borderTop: '1px solid var(--color-border-light)' }}>
              <Tag color={ledgerCfg.color} bordered={false} style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                {t(ledgerCfg.key, ledgerCfg.fallback)}
              </Tag>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginRight: 4 }}>Balance:</span>
                <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>{formatCurrency(record.balanceAfter, record.currency)}</span>
              </div>
            </Flex>
          </Flex>
        )
      }}
      onRow={(record) => ({
        onClick: () => setSelectedTx(record),
        onMouseEnter: () => record.referenceId && setHoveredRefId(record.referenceId),
        onMouseLeave: () => setHoveredRefId(null),
        style: {
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: record.referenceId && record.referenceId === hoveredRefId
            ? getReferenceColor(record.referenceId)
            : undefined,
          borderLeft: record.referenceId
            ? `4px solid ${getReferenceBorderColor(record.referenceId)}`
            : '4px solid transparent',
          opacity: hoveredRefId && record.referenceId !== hoveredRefId ? 0.6 : 1
        }
      })}
    />

    <Drawer
      title={t('receiptDetails', 'Detailed Receipt')}
      placement="right"
      width={400}
      onClose={() => setSelectedTx(null)}
      open={!!selectedTx}
    >
      {selectedTx && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Flex justify="center" align="center" style={{ marginBottom: 8, padding: '24px 0', background: 'var(--color-bg-surface)', borderRadius: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
                {t('txAmount', 'Amount')}
              </Typography.Text>
              <Typography.Title level={2} style={{ margin: 0, color: selectedTx.type === WalletTransactionType.Debit || selectedTx.type === WalletTransactionType.Hold ? 'var(--color-danger)' : 'var(--color-success)', fontFamily: MONO_FONT }}>
                {selectedTx.type === WalletTransactionType.Debit || selectedTx.type === WalletTransactionType.Hold ? '-' : '+'}
                {formatCurrency(selectedTx.amount, selectedTx.currency)}
              </Typography.Title>
            </div>
          </Flex>

          <Descriptions column={1} bordered size="small" labelStyle={{ width: 140, color: 'var(--color-text-secondary)' }}>
            <Descriptions.Item label={t('txId', 'Transaction ID')}>
              <Typography.Text copyable style={{ fontFamily: MONO_FONT }}>{selectedTx.id}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('txDate', 'Date & Time')}>
              {formatDateTime(selectedTx.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('txType', 'Transaction Type')}>
              {selectedTx.eventType ? t(`event.${selectedTx.eventType}`, EVENT_TYPE_CONFIG[selectedTx.eventType]?.fallback ?? selectedTx.eventType) : t(`txTypeLabel.${selectedTx.type}`, selectedTx.type)}
            </Descriptions.Item>
            <Descriptions.Item label={t('txStatus', 'Status')}>
              <Tag color={LEDGER_STATUS_CONFIG[selectedTx.ledgerStatus ?? 'posted'].color}>
                {t(LEDGER_STATUS_CONFIG[selectedTx.ledgerStatus ?? 'posted'].key, LEDGER_STATUS_CONFIG[selectedTx.ledgerStatus ?? 'posted'].fallback)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('txBalanceAfter', 'Balance After')}>
              <Typography.Text strong style={{ fontFamily: MONO_FONT }}>
                {formatCurrency(selectedTx.balanceAfter, selectedTx.currency)}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>

          {formatLedgerDescription(selectedTx.description) && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('txDescription', 'Description')}</Typography.Text>
              <div style={{ marginTop: 4, padding: 12, background: 'var(--color-bg-surface)', borderRadius: 8, fontSize: 14 }}>
                {formatLedgerDescription(selectedTx.description)}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
    </>
  )
}

export default TransactionTable
