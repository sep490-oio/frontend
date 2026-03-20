/**
 * AdminPaymentsPage — /admin/payments
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card, Col, Row, Statistic, Table, Tag, Button, Select, Tabs,
  App, Typography, Flex, Tooltip, Modal, Input, Space, Skeleton,
} from 'antd';
import type { TableProps } from 'antd';
import {
  CheckOutlined, CloseOutlined, ReloadOutlined,
  DollarOutlined, SwapOutlined, SafetyOutlined, BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPaymentSummary, getTransactions, getEscrows,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
} from '@/services/adminService';
import type {
  PaymentTransactionDto, EscrowDto, WithdrawalRequestDto,
  GetTransactionsParams, GetEscrowsParams, GetWithdrawalsParams,
} from '@/services/adminService';

const { Text, Title } = Typography;
const { Option } = Select;
const PAGE_SIZE = 15;

function SummaryTab() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', 'summary'],
    queryFn: () => getPaymentSummary(),
    staleTime: 2 * 60 * 1000,
  });

  const stats = [
    { key: 'completed', value: data?.completedPayments, icon: <CheckOutlined />, color: '#1D9E75' },
    { key: 'failed', value: data?.failedPayments, icon: <CloseOutlined />, color: '#E24B4A' },
    { key: 'topUps', value: data?.walletTopUps, icon: <DollarOutlined />, color: '#378ADD' },
    { key: 'withdrawalPending', value: data?.withdrawalPendingCount, icon: <BankOutlined />, color: '#BA7517' },
    { key: 'escrowHolding', value: data?.holdingEscrowCount, icon: <SafetyOutlined />, color: '#7F77DD' },
    { key: 'escrowReleased', value: data?.releasedEscrowTotal, icon: <SwapOutlined />, color: '#1D9E75', prefix: '₫' },
    { key: 'escrowRefunded', value: data?.refundedEscrowTotal, icon: <SwapOutlined />, color: '#D85A30', prefix: '₫' },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
      {stats.map(({ key, value, color, prefix }) => (
        <Col xs={24} sm={12} lg={6} key={key}>
          <Card>
            {isLoading ? <Skeleton.Input active style={{ width: '100%' }} /> : (
              <Statistic title={t(`admin.payments.summary.${key}`)} value={value ?? 0} prefix={prefix} styles={{ content: { color } }} />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function TransactionsTab() {
  const { t } = useTranslation();
  const [params, setParams] = useState<GetTransactionsParams>({ PageNumber: 1, PageSize: PAGE_SIZE });

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'payments', 'transactions', params],
    queryFn: () => getTransactions(params),
    placeholderData: (prev) => prev,
  });

  const columns: TableProps<PaymentTransactionDto>['columns'] = [
    { title: t('admin.payments.transactions.columns.txNumber'), dataIndex: 'transactionNumber', key: 'transactionNumber',
      render: (val: string) => <Text code style={{ fontSize: 11 }}>{val ?? '—'}</Text> },
    { title: t('admin.payments.transactions.columns.type'), dataIndex: 'type', key: 'type', width: 120,
      render: (v: string) => <Tag>{t(`admin.payments.transactions.types.${v}`, { defaultValue: v })}</Tag> },
    { title: t('admin.payments.transactions.columns.amount'), key: 'amount', width: 140,
      render: (_, r) => (
        <Flex vertical>
          <Text strong>{r.amount?.toLocaleString()} {r.currency}</Text>
          {r.fee ? <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.payments.transactions.fee', { amount: r.fee.toLocaleString() })}</Text> : null}
        </Flex>
      ) },
    { title: t('admin.payments.transactions.columns.status'), dataIndex: 'status', key: 'status', width: 120,
      render: (v: string) => {
        const color = v === 'completed' ? 'success' : v === 'failed' ? 'error' : 'processing';
        return <Tag color={color}>{t(`admin.payments.transactions.status.${v}`, { defaultValue: v })}</Tag>;
      } },
    { title: t('admin.payments.transactions.columns.gateway'), dataIndex: 'gatewayProvider', key: 'gatewayProvider', width: 120 },
    { title: t('admin.payments.transactions.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</Text> },
  ];

  return (
    <div style={{ marginTop: 4 }}>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Select placeholder={t('admin.payments.transactions.filterType')} allowClear style={{ width: 140 }}
          onChange={(val) => setParams((p) => ({ ...p, Type: val, PageNumber: 1 }))}>
          {(['payment', 'refund', 'deposit', 'withdrawal'] as const).map((v) => (
            <Option key={v} value={v}>{t(`admin.payments.transactions.types.${v}`)}</Option>
          ))}
        </Select>
        <Select placeholder={t('admin.payments.transactions.filterStatus')} allowClear style={{ width: 150 }}
          onChange={(val) => setParams((p) => ({ ...p, Status: val, PageNumber: 1 }))}>
          {(['completed', 'pending', 'failed'] as const).map((v) => (
            <Option key={v} value={v}>{t(`admin.payments.transactions.status.${v}`)}</Option>
          ))}
        </Select>
      </Flex>
      <Table rowKey="id" columns={columns}
        dataSource={(Array.isArray(data) ? data : data?.items) ?? []}
        loading={isFetching} size="small" scroll={{ x: 800 }}
        pagination={{
          current: data?.metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: data?.metadata?.totalCount ?? 0, showSizeChanger: false,
          onChange: (page) => setParams((p) => ({ ...p, PageNumber: page })),
        }}
      />
    </div>
  );
}

function EscrowsTab() {
  const { t } = useTranslation();
  const [params, setParams] = useState<GetEscrowsParams>({ PageNumber: 1, PageSize: PAGE_SIZE });

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'payments', 'escrows', params],
    queryFn: () => getEscrows(params),
    placeholderData: (prev) => prev,
  });

  const columns: TableProps<EscrowDto>['columns'] = [
    { title: t('admin.payments.escrows.columns.orderId'), dataIndex: 'orderId', key: 'orderId',
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v?.slice(0, 8)}...</Text> },
    { title: t('admin.payments.escrows.columns.amount'), dataIndex: 'amount', key: 'amount', width: 130,
      render: (v: number, r) => <Text strong>{v?.toLocaleString()} {r.currency}</Text> },
    { title: t('admin.payments.escrows.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const color = v === 'holding' ? 'blue' : v === 'released' ? 'green' : v === 'refunded' ? 'orange' : 'default';
        return <Tag color={color}>{t(`admin.payments.escrows.status.${v}`, { defaultValue: v })}</Tag>;
      } },
    { title: t('admin.payments.escrows.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text> },
    { title: t('admin.payments.escrows.columns.releasedAt'), dataIndex: 'releasedAt', key: 'releasedAt', width: 130,
      render: (d: string | null) => d
        ? <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        : <Text type="secondary">—</Text> },
  ];

  return (
    <div style={{ marginTop: 4 }}>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Select placeholder={t('admin.payments.escrows.filterStatus')} allowClear style={{ width: 160 }}
          onChange={(val) => setParams((p) => ({ ...p, Status: val, PageNumber: 1 }))}>
          {(['holding', 'released', 'refunded'] as const).map((v) => (
            <Option key={v} value={v}>{t(`admin.payments.escrows.status.${v}`)}</Option>
          ))}
        </Select>
      </Flex>
      <Table rowKey="id" columns={columns}
        dataSource={(Array.isArray(data) ? data : data?.items) ?? []}
        loading={isFetching} size="small"
        pagination={{
          current: data?.metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: data?.metadata?.totalCount ?? 0, showSizeChanger: false,
          onChange: (page) => setParams((p) => ({ ...p, PageNumber: page })),
        }}
      />
    </div>
  );
}

function WithdrawalsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [params, setParams] = useState<GetWithdrawalsParams>({ PageNumber: 1, PageSize: PAGE_SIZE });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'payments', 'withdrawals', params],
    queryFn: () => getWithdrawals(params),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'withdrawals'] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveWithdrawal(id),
    onSuccess: () => { message.success(t('admin.payments.withdrawals.approved')); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectWithdrawal(id, { reason }),
    onSuccess: () => {
      message.success(t('admin.payments.withdrawals.rejected'));
      setRejectModal({ open: false, id: null }); setRejectReason(''); invalidate();
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const columns: TableProps<WithdrawalRequestDto>['columns'] = [
    { title: t('admin.payments.withdrawals.columns.bank'), dataIndex: 'bankName', key: 'bankName' },
    { title: t('admin.payments.withdrawals.columns.account'), dataIndex: 'accountNumber', key: 'accountNumber',
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: t('admin.payments.withdrawals.columns.amount'), key: 'amount', width: 150,
      render: (_, r) => (
        <Flex vertical>
          <Text strong>{r.amount?.toLocaleString()} ₫</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.payments.withdrawals.net', { amount: r.netAmount?.toLocaleString() })}</Text>
        </Flex>
      ) },
    { title: t('admin.payments.withdrawals.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const color = v === 'pending' ? 'orange' : v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'default';
        return <Tag color={color}>{t(`admin.payments.withdrawals.status.${v}`, { defaultValue: v })}</Tag>;
      } },
    { title: t('admin.payments.withdrawals.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text> },
    { title: t('admin.payments.withdrawals.columns.actions'), key: 'actions', width: 120, fixed: 'right',
      render: (_, record) => record.status === 'pending' ? (
        <Space size={4}>
          <Tooltip title={t('admin.payments.withdrawals.approve')}>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              loading={approveMutation.isPending}
              onClick={() => modal.confirm({
                title: t('admin.payments.withdrawals.approveConfirm'),
                onOk: () => approveMutation.mutateAsync(record.id),
              })} />
          </Tooltip>
          <Tooltip title={t('admin.payments.withdrawals.reject')}>
            <Button size="small" danger icon={<CloseOutlined />}
              onClick={() => setRejectModal({ open: true, id: record.id })} />
          </Tooltip>
        </Space>
      ) : null },
  ];

  return (
    <div style={{ marginTop: 4 }}>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Select placeholder={t('admin.payments.withdrawals.filterStatus')} allowClear style={{ width: 160 }}
          onChange={(val) => setParams((p) => ({ ...p, Status: val, PageNumber: 1 }))}>
          {(['pending', 'approved', 'rejected'] as const).map((v) => (
            <Option key={v} value={v}>{t(`admin.payments.withdrawals.status.${v}`)}</Option>
          ))}
        </Select>
      </Flex>
      <Table rowKey="id" columns={columns}
        dataSource={(Array.isArray(data) ? data : data?.items) ?? []}
        loading={isFetching} size="small" scroll={{ x: 700 }}
        pagination={{
          current: data?.metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: data?.metadata?.totalCount ?? 0, showSizeChanger: false,
          onChange: (page) => setParams((p) => ({ ...p, PageNumber: page })),
        }}
      />
      <Modal
        title={t('admin.payments.withdrawals.rejectModal.title')}
        open={rejectModal.open}
        onCancel={() => { setRejectModal({ open: false, id: null }); setRejectReason(''); }}
        onOk={() => {
          if (!rejectModal.id) return;
          if (!rejectReason.trim()) { message.warning(t('admin.payments.withdrawals.rejectModal.reasonRequired')); return; }
          rejectMutation.mutate({ id: rejectModal.id, reason: rejectReason });
        }}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        okText={t('admin.payments.withdrawals.rejectModal.confirm')} cancelText={t('common.cancel')}
      >
        <Input.TextArea rows={3} value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('admin.payments.withdrawals.rejectModal.reasonPlaceholder')}
          style={{ marginTop: 12 }} />
      </Modal>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.payments.title')}</Title>
          <Typography.Text type="secondary">{t('admin.payments.subtitle')}</Typography.Text>
        </div>
      </Flex>
      <Tabs items={[
        { key: 'summary', label: t('admin.payments.tabs.summary'), children: <SummaryTab /> },
        { key: 'transactions', label: t('admin.payments.tabs.transactions'), children: <TransactionsTab /> },
        { key: 'escrows', label: t('admin.payments.tabs.escrows'), children: <EscrowsTab /> },
        { key: 'withdrawals', label: t('admin.payments.tabs.withdrawals'), children: <WithdrawalsTab /> },
      ]} />
    </div>
  );
}