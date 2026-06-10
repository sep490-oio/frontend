import { useState } from 'react'
import { Select, Tag, Typography, Flex, DatePicker, Input, Space, Statistic, Card } from 'antd'
import {
  DollarOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  RollbackOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency } from '@/utils/format'
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

function useCategoryLabels(): Record<string, string> {
  const { t } = useTranslation('admin')
  return {
    commission: t('payments.incomeCategory.commission', 'Commission'),
    inspection_fee: t('payments.incomeCategory.inspection_fee', 'Inspection Fee'),
    forfeit: t('payments.incomeCategory.forfeit', 'Forfeit'),
    refund: t('payments.incomeCategory.refund', 'Refund'),
    other: t('payments.incomeCategory.other', 'Other'),
  }
}

export function PlatformIncomeTable() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const categoryLabels = useCategoryLabels()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const { data, isLoading } = usePlatformWalletTransactions({
    pageNumber: page,
    pageSize,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(searchTerm ? { searchTerm } : {}),
    ...(dateRange ? { fromDate: dateRange[0].startOf('day').toISOString(), toDate: dateRange[1].endOf('day').toISOString() } : {}),
  })

  const columns: ColumnsType<PlatformWalletTransactionDto> = [
    {
      title: t('revenue.date', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => {
        const d = dayjs(date)
        return (
          <Flex vertical>
            <Typography.Text strong style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
              {d.format('DD/MM/YYYY')}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {d.format('HH:mm')}
            </Typography.Text>
          </Flex>
        )
      },
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
            {categoryLabels[category] ?? category}
          </Tag>
        )
      },
    },
    {
      title: t('revenue.type', 'Type'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const isCredit = type === 'credit'
        return (
          <Tag 
            color={isCredit ? 'green' : 'red'} 
            icon={isCredit ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            style={{ borderRadius: 4, textTransform: 'uppercase', fontSize: 11 }}
          >
            {type}
          </Tag>
        )
      },
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
      render: (desc: string | null) => {
        if (!desc) return <Typography.Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>—</Typography.Text>
        
        const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi
        const parts = desc.split(uuidRegex)
        
        return (
          <Typography.Paragraph
            style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 0 }}
            ellipsis={{ rows: 2, tooltip: desc }}
          >
            {parts.map((part, i) => {
              if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
                return (
                  <Link key={i} style={{ fontFamily: 'monospace' }} to={`/admin/orders/${part}`}>
                    ORD-{part.slice(0, 4)}...{part.slice(-4)}
                  </Link>
                )
              }
              return <span key={i}>{part}</span>
            })}
          </Typography.Paragraph>
        )
      },
    },
  ]

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 16 }}>
        <Flex gap={16} align="center" wrap="wrap">
          <Input.Search
            placeholder={t('payments.incomeTable.searchPlaceholder', 'Search descriptions...')}
            allowClear
            onSearch={(val) => { setSearchTerm(val); setPage(1) }}
            style={{ width: isMobile ? '100%' : 250 }}
          />
          <DatePicker.RangePicker
            onChange={(dates) => { setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null); setPage(1) }}
            style={{ width: 250 }}
          />
        </Flex>
        
        <Space wrap>
          <Select
            placeholder={t('payments.incomeTable.filterByCategory', 'Filter by Category')}
            value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val); setPage(1) }}
            style={{ width: isMobile ? '100%' : 180 }}
            allowClear
            onClear={() => setCategoryFilter(undefined)}
            options={[
              { value: 'commission', label: categoryLabels.commission },
              { value: 'inspection_fee', label: categoryLabels.inspection_fee },
              { value: 'forfeit', label: categoryLabels.forfeit },
              { value: 'refund', label: categoryLabels.refund },
            ]}
          />
          <Select
            placeholder={t('revenue.filterType', 'Filter by Type')}
            value={typeFilter}
            onChange={(val) => { setTypeFilter(val); setPage(1) }}
            style={{ width: isMobile ? '100%' : 180 }}
            allowClear
            onClear={() => setTypeFilter(undefined)}
            options={[
              { value: 'credit', label: `📈 ${t('payments.incomeTable.creditIncome', 'Credit (Income)')}` },
              { value: 'debit', label: `📉 ${t('payments.incomeTable.debitOutflow', 'Debit (Outflow)')}` },
            ]}
          />
        </Space>
      </Flex>

      {/* Summary Metrics */}
      {!isLoading && (data?.totalCreditAmount !== undefined || data?.totalDebitAmount !== undefined) && (
        <Flex gap={16} style={{ marginBottom: 16 }} wrap="wrap">
          <Card size="small" style={{ minWidth: 200, borderColor: 'var(--color-success, #52c41a)' }}>
            <Statistic
              title={<span style={{ color: 'var(--color-text-secondary)' }}>{t('payments.incomeTable.totalCredit', 'Total Credit')}</span>}
              value={data?.totalCreditAmount ?? 0}
              precision={0}
              valueStyle={{ color: 'var(--color-success, #52c41a)', fontWeight: 'bold' }}
              prefix={<ArrowUpOutlined />}
              suffix={data?.currency ?? '₫'}
            />
          </Card>
        </Flex>
      )}

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
