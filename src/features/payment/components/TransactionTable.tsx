import { useTranslation } from 'react-i18next'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WalletTransactionType } from '@/types/enums'
import type { WalletTransactionDto, WalletEventType, WalletLedgerStatus } from '@/types'
import { Tag, Typography, Space, Tooltip, Flex } from 'antd'
import { MONO_FONT } from '@/styles/tokens'
import { useState, useMemo } from 'react'
import { FilterOutlined } from '@ant-design/icons'

const LEDGER_STATUS_CONFIG: Record<WalletLedgerStatus, { color: string; key: string; fallback: string }> = {
  posted: { color: 'success', key: 'ledgerStatus.posted', fallback: 'Đã ghi nhận' },
  pending: { color: 'warning', key: 'ledgerStatus.pending', fallback: 'Đang xử lý' },
  failed: { color: 'error', key: 'ledgerStatus.failed', fallback: 'Thất bại' },
  reversed: { color: 'processing', key: 'ledgerStatus.reversed', fallback: 'Đã đảo giao dịch' },
}

const EVENT_TYPE_CONFIG: Record<WalletEventType, { fallback: string }> = {
  wallet_top_up: { fallback: 'Nạp tiền vào ví' },
  auction_deposit_hold: { fallback: 'Đặt cọc đấu giá' },
  auction_deposit_refund: { fallback: 'Hoàn cọc đấu giá' },
  order_payment: { fallback: 'Thanh toán đơn hàng' },
  order_refund: { fallback: 'Hoàn tiền đơn hàng' },
  withdrawal_hold: { fallback: 'Giữ tiền chờ rút' },
  withdrawal_release: { fallback: 'Rút tiền' },
  seller_payout: { fallback: 'Nhận thanh toán bán hàng' },
  fee: { fallback: 'Phí giao dịch' },
}

export interface TransactionTableProps {
  data: WalletTransactionDto[]
  loading?: boolean
  pagination?: TablePaginationConfig | false
}

export function TransactionTable({ data, loading, pagination }: TransactionTableProps) {
  const { t } = useTranslation('payment')
  const [hoveredRefId, setHoveredRefId] = useState<string | null>(null)

  const processedData = useMemo(() => {
    if (!data) return data;
    
    // Group by referenceId (only for certain types that make sense to group)
    const groups: Record<string, WalletTransactionDto[]> = {};
    const others: WalletTransactionDto[] = [];
    
    data.forEach(item => {
      const canGroup = item.referenceId && (
        item.referenceType === 'deposit' || 
        item.referenceType === 'escrow' || 
        item.referenceType === 'order'
      );

      if (canGroup) {
        if (!groups[item.referenceId!]) groups[item.referenceId!] = [];
        groups[item.referenceId!].push(item);
      } else {
        others.push(item);
      }
    });
    
    const result: WalletTransactionDto[] = [];
    // Sort groups by latest transaction in group
    const sortedGroupIds = Object.keys(groups).sort((a, b) => {
      const latestA = new Date(groups[a][0].createdAt).getTime();
      const latestB = new Date(groups[b][0].createdAt).getTime();
      return latestB - latestA;
    });
    
    sortedGroupIds.forEach(id => {
      result.push(...groups[id]);
    });
    
    result.push(...others);
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
      ellipsis: true,
      render: (description: string | undefined, record) => {
        const isRelatedToAuction = record.referenceType === 'deposit' || record.referenceType === 'escrow' || record.referenceType === 'order';
        const isHighlighted = record.referenceId && record.referenceId === hoveredRefId;

        // Prefer the server-provided eventType i18n key; fall back to the
        // original description string for legacy rows that predate the new
        // enrichment fields.
        let label: string = description ?? '-'
        if (record.eventType) {
          const cfg = EVENT_TYPE_CONFIG[record.eventType]
          label = t(`event.${record.eventType}`, cfg?.fallback ?? description ?? record.eventType)
        }

        return (
          <Space direction="vertical" size={0}>
            <span style={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600 }}>
              {label}
            </span>
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
          </Space>
        )
      },
    },
    {
      title: t('txAmount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
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
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.description || '-'}
                </div>
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
        onMouseEnter: () => record.referenceId && setHoveredRefId(record.referenceId),
        onMouseLeave: () => setHoveredRefId(null),
        style: {
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
  )
}

export default TransactionTable
