import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WalletTransactionType } from '@/types/enums'
import type { WalletTransactionDto } from '@/types'

export interface TransactionTableProps {
  data: WalletTransactionDto[]
  loading?: boolean
  pagination?: TablePaginationConfig | false
  walletPrefix: '/me' | '/seller'
}

function resolveDeepLink(
  record: WalletTransactionDto,
  walletPrefix: '/me' | '/seller',
): string | null {
  const refId = record.referenceId
  switch (record.referenceType) {
    case 'order':
      return refId ? `/me/orders/${refId}` : null
    case 'deposit':
      return refId ? `/auctions/${refId}` : null
    case 'withdrawal':
      return `${walletPrefix}/wallet/withdraw`
    default:
      return null
  }
}

export function TransactionTable({ data, loading, pagination, walletPrefix }: TransactionTableProps) {
  const { t } = useTranslation('payment')

  const columns: ColumnsType<WalletTransactionDto> = [
    {
      title: t('txDescription', 'Description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string | undefined) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {description ?? '-'}
        </span>
      ),
    },
    {
      title: t('txBalanceBefore', 'Before'),
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      width: 140,
      render: (value: number, record) => (
        <span style={{ fontSize: 13 }}>{formatCurrency(value, record.currency)}</span>
      ),
    },
    {
      title: t('txBalanceAfter', 'After'),
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 140,
      render: (value: number, record) => (
        <span style={{ fontSize: 13 }}>{formatCurrency(value, record.currency)}</span>
      ),
    },
    {
      title: t('txAmount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      render: (amount: number, record) => (
        <PriceDisplay
          amount={amount}
          currency={record.currency}
          size="small"
          type={
            record.type === WalletTransactionType.Debit || record.type === WalletTransactionType.Hold
              ? 'danger'
              : 'success'
          }
        />
      ),
    },
    {
      title: t('txDate', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {formatDateTime(date)}
        </span>
      ),
    },
    {
      title: t('txLink', 'Link'),
      key: 'link',
      width: 100,
      render: (_: unknown, record) => {
        const href = resolveDeepLink(record, walletPrefix)
        return href ? (
          <Link to={href} style={{ color: 'var(--color-accent)' }}>
            {t('txView', 'View')}
          </Link>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)' }}>-</span>
        )
      },
    },
  ]

  return (
    <ResponsiveTable<WalletTransactionDto>
      mobileMode="list"
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
    />
  )
}

export default TransactionTable
