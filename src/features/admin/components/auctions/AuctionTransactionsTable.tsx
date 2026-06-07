import { useState } from 'react'
import { Typography, Tag, Skeleton, Empty, Select, Flex } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useTranslation } from 'react-i18next'
import { useAdminTransactions } from '@/features/admin/api'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { formatLedgerDescription } from '@/features/payment/utils/formatLedgerDescription'

export function AuctionTransactionsTable({ auctionId }: { auctionId: string }) {
  const { t } = useTranslation('admin')
  const [type, setType] = useState<string | undefined>(undefined)
  
  const { data, isLoading } = useAdminTransactions({ auctionId, type, pageSize: 100 })
  
  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f0f0f0' }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} wrap="wrap" gap={16}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {t('auctionDetail.auctionTransactions', 'Auction Transactions (Deposits, Refunds, Fees)')}
        </Typography.Title>
        <Select
          allowClear
          placeholder={t('auctionDetail.filterType', 'Filter Type')}
          style={{ width: 200 }}
          onChange={setType}
          options={[
            { value: 'deposit', label: t('auctionDetail.types.deposit', 'Deposits') },
            { value: 'refund', label: t('auctionDetail.types.refund', 'Refunds') },
            { value: 'fee', label: t('auctionDetail.types.fee', 'Fees') },
            { value: 'payment', label: t('auctionDetail.types.payment', 'Payments') },
          ]}
        />
      </Flex>
      
      {isLoading ? (
        <Skeleton active title={false} paragraph={{ rows: 3 }} />
      ) : !data?.items?.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('auctionDetail.noTransactions', 'No transactions found for this filter')} />
      ) : (
        <ResponsiveTable
          dataSource={data.items}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: t('payments.time', 'Time'), dataIndex: 'createdAt', key: 'createdAt', render: (val) => formatDateTime(val) },
            { title: t('payments.type', 'Type'), dataIndex: 'type', key: 'type', render: (val) => <Tag color={val === 'credit' ? 'green' : 'red'}>{String(val).toUpperCase()}</Tag> },
            { title: t('payments.amount', 'Amount'), dataIndex: 'amount', key: 'amount', render: (val, record: any) => formatCurrency(val, record.currency ?? 'VND') },
            { title: t('payments.description', 'Description'), dataIndex: 'description', key: 'description', render: (v: string | undefined) => formatLedgerDescription(v) || '—' }
          ]}
        />
      )}
    </div>
  )
}
