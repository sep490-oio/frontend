import { useTranslation } from 'react-i18next'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WalletTransactionType } from '@/types/enums'
import type { WalletTransactionDto } from '@/types'
import { Tag, Typography, Space, Tooltip, Flex } from 'antd'
import { MONO_FONT } from '@/styles/tokens'
import { useState, useMemo } from 'react'
import { FilterOutlined } from '@ant-design/icons'

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
        
        return (
          <Space direction="vertical" size={0}>
            <span style={{ color: 'var(--color-text-primary)', fontSize: 14, fontWeight: 600 }}>
              {description ?? '-'}
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
                  {` • ${record.referenceId.split('-')[0].toUpperCase()}`}
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
              {t(`txTypeLabel.${record.type}`, record.type)}
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
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'right',
      render: (status: string) => {
        const s = status?.toLowerCase()
        let color = 'default'
        let label = status || t('statusUnknown', 'Unknown')

        if (s === 'completed' || s === 'success') {
          color = 'success'
          label = t('statusCompleted', 'Completed')
        } else if (s === 'pending' || s === 'processing') {
          color = 'warning'
          label = t('statusPending', 'Pending')
        } else if (s === 'failed' || s === 'cancelled' || s === 'error') {
          color = 'error'
          label = t('statusFailed', 'Failed')
        } else if (s === 'refunded') {
          color = 'processing'
          label = t('statusRefunded', 'Refunded')
        }

        return <Tag color={color} bordered={false}>{label}</Tag>
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
        
        const s = record.status?.toLowerCase()
        let statusColor = 'default'
        if (s === 'completed' || s === 'success') statusColor = 'success'
        else if (s === 'pending' || s === 'processing') statusColor = 'warning'
        else if (s === 'failed' || s === 'cancelled' || s === 'error') statusColor = 'error'
        else if (s === 'refunded') statusColor = 'processing'

        return (
          <Flex vertical gap={12} style={{ padding: '4px 0' }}>
            <Flex justify="space-between" align="flex-start">
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 4 }}>
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
              <Tag color={statusColor} bordered={false} style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>
                {t(`status${record.status?.charAt(0).toUpperCase()}${record.status?.slice(1)}`, record.status)}
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
