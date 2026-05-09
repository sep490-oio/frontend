import { useState } from 'react'
import { Select, Tag, Typography, Space } from 'antd'
import {
  DollarOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { usePlatformWalletTransactions } from '@/features/admin/api'
import type { PlatformWalletTransactionDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const CATEGORY_COLORS: Record<string, string> = {
  commission: 'green',
  inspection_fee: 'blue',
  forfeit: 'orange',
  refund: 'red',
  other: 'default',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  commission: <DollarOutlined />,
  inspection_fee: <SafetyCertificateOutlined />,
  forfeit: <WarningOutlined />,
  refund: <RollbackOutlined />,
}

const CATEGORY_LABELS: Record<string, string> = {
  commission: 'Commission',
  inspection_fee: 'Inspection Fee',
  forfeit: 'Forfeit',
  refund: 'Refund',
  other: 'Other',
}

export function PlatformIncomeTable() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)

  const { data, isLoading } = usePlatformWalletTransactions({
    pageNumber: page,
    pageSize,
    ...(typeFilter ? { type: typeFilter } : {}),
  })

  const columns: ColumnsType<PlatformWalletTransactionDto> = [
    {
      title: t('revenue.date', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <Typography.Text style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
          {formatDateTime(date)}
        </Typography.Text>
      ),
    },
    {
      title: t('revenue.category', 'Category'),
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat: string | null) => {
        const category = cat ?? 'other'
        return (
          <Tag
            color={CATEGORY_COLORS[category] ?? 'default'}
            icon={CATEGORY_ICONS[category]}
            style={{ borderRadius: 4, fontWeight: 500 }}
          >
            {CATEGORY_LABELS[category] ?? category}
          </Tag>
        )
      },
    },
    {
      title: t('revenue.type', 'Type'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'credit' ? 'green' : 'red'} style={{ borderRadius: 4, textTransform: 'uppercase', fontSize: 11 }}>
          {type}
        </Tag>
      ),
    },
    {
      title: t('revenue.amount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount: number, record) => (
        <Typography.Text
          strong
          style={{
            color: record.type === 'credit' ? 'var(--color-success, #52c41a)' : 'var(--color-error, #ff4d4f)',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          {record.type === 'credit' ? '+' : '-'}{formatCurrency(amount, data?.currency)}
        </Typography.Text>
      ),
    },
    {
      title: t('revenue.balanceAfter', 'Balance After'),
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 140,
      align: 'right',
      responsive: ['md'],
      render: (val: number) => (
        <Typography.Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatCurrency(val, data?.currency)}
        </Typography.Text>
      ),
    },
    {
      title: t('revenue.description', 'Description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string | null) => (
        <Typography.Text
          style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          ellipsis={{ tooltip: desc ?? '' }}
        >
          {desc ?? '—'}
        </Typography.Text>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder={t('revenue.filterCategory', 'Filter by category')}
          value={typeFilter}
          onChange={(val) => { setTypeFilter(val); setPage(1) }}
          style={{ width: isMobile ? '100%' : 200 }}
          allowClear
          onClear={() => setTypeFilter(undefined)}
          options={[
            { value: 'credit', label: '📈 Credit (Income)' },
            { value: 'debit', label: '📉 Debit (Outflow)' },
          ]}
        />
      </Space>

      <ResponsiveTable<PlatformWalletTransactionDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{
          current: data?.pageNumber ?? page,
          pageSize: data?.pageSize ?? pageSize,
          total: data?.totalCount ?? 0,
          showSizeChanger: !isMobile,
          showTotal: (total) => tc('pagination.total', { total }),
          simple: isMobile,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />
    </div>
  )
}
