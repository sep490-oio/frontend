import { Table, Tag, Typography, Select, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useAdminAuctionFinancials, type AdminAuctionFinancial } from '../../api';
import { formatCurrency } from '@/utils/format';

const { Text } = Typography;

interface Props {
  auctionId: string;
}

export function AdminAuctionFinancialsTable({ auctionId }: Props) {
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAdminAuctionFinancials(auctionId, { type: filterType });

  const columns: ColumnsType<AdminAuctionFinancial> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => {
        let color = 'default';
        if (t === 'deposit') color = 'blue';
        if (t === 'refund') color = 'orange';
        if (t === 'fee') color = 'red';
        if (t === 'payment') color = 'green';
        return <Tag color={color}>{t.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number, record) => (
        <Text strong type={record.type === 'fee' || record.type === 'refund' ? 'danger' : 'success'}>
          {record.type === 'fee' || record.type === 'refund' ? '-' : '+'}
          {formatCurrency(amount, record.currency)}
        </Text>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (s: string) => <Tag color={s === 'Wallet' ? 'purple' : 'cyan'}>{s}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s.toLowerCase() === 'completed' ? 'success' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space>
        <Select
          allowClear
          placeholder="Filter by Type"
          style={{ width: 150 }}
          onChange={setFilterType}
          options={[
            { value: 'deposit', label: 'Deposit' },
            { value: 'refund', label: 'Refund' },
            { value: 'fee', label: 'Fee' },
            { value: 'payment', label: 'Payment' },
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data || []}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        size="middle"
      />
    </Space>
  );
}
