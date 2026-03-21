/**
 * AdminPaymentsPage — /admin/payments
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card, Col, Row, Statistic, Table, Tag, Button, Select, Tabs,
  App, Typography, Flex, Tooltip, Modal, Input, Space, Skeleton,
  Badge, InputNumber, Alert, Form,
} from 'antd';
import type { TableProps } from 'antd';
import {
  CheckOutlined, CloseOutlined,
  DollarOutlined, SwapOutlined, SafetyOutlined, BankOutlined,
  MessageOutlined, AlertOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPaymentSummary, getTransactions, getEscrows,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  getEscrowById, resolveDispute,
} from '@/services/adminService';
import type {
  PaymentTransactionDto, EscrowDto, WithdrawalRequestDto,
  GetTransactionsParams, GetEscrowsParams, GetWithdrawalsParams,
  ResolveDisputeRequest,
} from '@/services/adminService';
import { api } from '@/services/api';

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

// ─── Disputes Tab ─────────────────────────────────────────────────────────────

interface DisputeDto {
  id: string;
  orderId?: string | null;
  initiatorId?: string | null;
  respondentId?: string | null;
  reason?: string | null;
  description?: string | null;
  status?: string | null;
  resolution?: string | null;
  resolutionNotes?: string | null;
  resolutionAmount?: number | null;
  createdAt: string;
  resolvedAt?: string | null;
}

async function getDisputes(params: { status?: string; PageNumber?: number; PageSize?: number } = {}):
  Promise<{ items: DisputeDto[]; metadata?: { totalCount: number; currentPage: number } }> {
  const res = await api.get('/api/disputes', { params });
  if (Array.isArray(res.data)) return { items: res.data };
  return res.data;
}

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'error' | 'processing' | 'default'> = {
  open: 'warning', under_review: 'processing', resolved: 'success', closed: 'default', escalated: 'error',
};

const RESOLUTION_COLOR: Record<string, string> = {
  refund_buyer: 'blue', release_to_seller: 'green', partial_refund: 'orange', dismissed: 'default',
};

function DisputesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<{ status?: string; PageNumber?: number; PageSize?: number }>({
    PageNumber: 1, PageSize: PAGE_SIZE,
  });
  const [resolveModal, setResolveModal] = useState<{ open: boolean; dispute: DisputeDto | null }>({
    open: false, dispute: null,
  });
  const [resolutionType, setResolutionType] = useState<string | undefined>();
  const [resolveForm] = Form.useForm<ResolveDisputeRequest>();

  // Fetch escrow for the selected dispute's orderId
  const { data: escrowData, isLoading: escrowLoading } = useQuery({
    queryKey: ['admin', 'dispute-escrow', resolveModal.dispute?.orderId],
    queryFn: async () => {
      if (!resolveModal.dispute?.orderId) return null;
      try {
        // Find escrow by orderId from the escrows list
        const res = await getEscrows({ OrderId: resolveModal.dispute.orderId, PageSize: 1 });
        const items = Array.isArray(res) ? res : res?.items ?? [];
        if (items.length > 0) return getEscrowById(items[0].id);
        return null;
      } catch { return null; }
    },
    enabled: resolveModal.open && !!resolveModal.dispute?.orderId,
  });

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'payments', 'disputes', params],
    queryFn: () => getDisputes(params),
    placeholderData: (prev) => prev,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: ResolveDisputeRequest }) => resolveDispute(id, d),
    onSuccess: () => {
      message.success(t('admin.disputes.resolved'));
      setResolveModal({ open: false, dispute: null });
      setResolutionType(undefined);
      resolveForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'disputes'] });
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const columns: TableProps<DisputeDto>['columns'] = [
    {
      title: t('admin.disputes.columns.order'), dataIndex: 'orderId', key: 'orderId',
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v?.slice(0, 8)}…</Text>,
    },
    {
      title: t('admin.disputes.columns.parties'), key: 'parties', width: 200,
      render: (_, r) => (
        <Flex vertical gap={2}>
          <Text style={{ fontSize: 12 }}><Text type="secondary">{t('admin.disputes.columns.initiator')}: </Text>
            <Text code style={{ fontSize: 11 }}>{r.initiatorId?.slice(0, 8)}…</Text></Text>
          <Text style={{ fontSize: 12 }}><Text type="secondary">{t('admin.disputes.columns.respondent')}: </Text>
            <Text code style={{ fontSize: 11 }}>{r.respondentId?.slice(0, 8)}…</Text></Text>
        </Flex>
      ),
    },
    {
      title: t('admin.disputes.columns.reason'), dataIndex: 'reason', key: 'reason', width: 130,
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.disputes.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => <Badge status={STATUS_BADGE[v] ?? 'default'} text={v} />,
    },
    {
      title: t('admin.disputes.columns.resolution'), dataIndex: 'resolution', key: 'resolution', width: 160,
      render: (v: string | null) => v
        ? <Tag color={RESOLUTION_COLOR[v] ?? 'default'}>{t(`admin.disputes.resolution.${v}`, { defaultValue: v })}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.disputes.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 110,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>,
    },
    {
      title: t('admin.disputes.columns.actions'), key: 'actions', width: 90, fixed: 'right',
      render: (_, record) => (
        <Tooltip title={t('admin.disputes.resolve')}>
          <Button size="small" type="primary" icon={<CheckOutlined />}
            disabled={record.status === 'resolved' || record.status === 'closed'}
            onClick={() => { setResolveModal({ open: true, dispute: record }); setResolutionType(undefined); resolveForm.resetFields(); }}
          />
        </Tooltip>
      ),
    },
  ];

  const openCount     = (data?.items ?? []).filter((d) => d.status === 'open').length;
  const escalated     = (data?.items ?? []).filter((d) => d.status === 'escalated').length;

  return (
    <div style={{ marginTop: 4 }}>
      {(openCount > 0 || escalated > 0) && (
        <Flex gap={8} style={{ marginBottom: 12 }}>
          {openCount > 0 && <Tag color="warning" icon={<AlertOutlined />}>{t('admin.disputes.statsOpen', { count: openCount })}</Tag>}
          {escalated > 0 && <Tag color="error" icon={<AlertOutlined />}>{t('admin.disputes.statsEscalated', { count: escalated })}</Tag>}
        </Flex>
      )}
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Select placeholder={t('admin.disputes.filterStatus')} allowClear style={{ width: 180 }}
          onChange={(val) => setParams((p) => ({ ...p, status: val, PageNumber: 1 }))}>
          {(['open', 'under_review', 'resolved', 'escalated', 'closed'] as const).map((v) => (
            <Option key={v} value={v}>
              <Badge status={STATUS_BADGE[v] ?? 'default'} text={v} />
            </Option>
          ))}
        </Select>
      </Flex>
      <Table
        rowKey="id" columns={columns} dataSource={data?.items ?? []}
        loading={isFetching} scroll={{ x: 900 }} size="small"
        rowClassName={(r) => r.status === 'escalated' ? 'ant-table-row-danger' : ''}
        pagination={{
          current: data?.metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: data?.metadata?.totalCount ?? 0, showSizeChanger: false,
          onChange: (page) => setParams((p) => ({ ...p, PageNumber: page })),
        }}
      />

      {/* Resolve Modal with Escrow Context */}
      <Modal
        title={<Flex align="center" gap={8}><CheckOutlined style={{ color: '#1D9E75' }} /><span>{t('admin.disputes.resolveModal.title')}</span></Flex>}
        open={resolveModal.open}
        onCancel={() => { setResolveModal({ open: false, dispute: null }); resolveForm.resetFields(); setResolutionType(undefined); }}
        onOk={() => {
          resolveForm.validateFields().then((values) => {
            if (!resolveModal.dispute) return;
            resolveMutation.mutate({ id: resolveModal.dispute.id, data: values });
          });
        }}
        okText={t('admin.disputes.resolveModal.confirm')}
        okButtonProps={{ loading: resolveMutation.isPending }}
        cancelText={t('common.cancel')}
        width={520}
      >
        {/* Escrow context banner */}
        {resolveModal.dispute && (
          <div style={{ marginBottom: 16, marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--ant-color-bg-layout)', border: '1px solid var(--ant-color-border-secondary)' }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              {t('admin.disputes.resolveModal.escrowContext')}
            </Text>
            {escrowLoading ? (
              <Skeleton.Input active size="small" style={{ width: 200 }} />
            ) : escrowData ? (
              <Flex gap={20}>
                <Flex vertical gap={2}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.disputes.resolveModal.escrowAmount')}</Text>
                  <Text strong style={{ fontSize: 16, color: '#7F77DD' }}>{escrowData.amount?.toLocaleString()} {escrowData.currency}</Text>
                </Flex>
                <Flex vertical gap={2}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.disputes.resolveModal.escrowStatus')}</Text>
                  <Tag color={escrowData.status === 'holding' ? 'blue' : escrowData.status === 'released' ? 'green' : 'orange'} style={{ width: 'fit-content' }}>
                    {escrowData.status}
                  </Tag>
                </Flex>
                {escrowData.buyerId && (
                  <Flex vertical gap={2}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Buyer</Text>
                    <Text code style={{ fontSize: 11 }}>{escrowData.buyerId.slice(0, 8)}…</Text>
                  </Flex>
                )}
              </Flex>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.disputes.resolveModal.noEscrow')}</Text>
            )}
          </div>
        )}

        <Form form={resolveForm} layout="vertical">
          <Form.Item name="resolutionType" label={t('admin.disputes.resolveModal.resolutionType')}
            rules={[{ required: true, message: t('admin.disputes.resolveModal.resolutionRequired') }]}>
            <Select placeholder={t('admin.disputes.resolveModal.resolutionPlaceholder')}
              onChange={(val) => setResolutionType(val as string)}>
              <Option value="refund_buyer"><Tag color="blue" style={{ margin: 0 }}>{t('admin.disputes.resolution.refund_buyer')}</Tag></Option>
              <Option value="release_to_seller"><Tag color="green" style={{ margin: 0 }}>{t('admin.disputes.resolution.release_to_seller')}</Tag></Option>
              <Option value="partial_refund"><Tag color="orange" style={{ margin: 0 }}>{t('admin.disputes.resolution.partial_refund')}</Tag></Option>
              <Option value="dismissed"><Tag style={{ margin: 0 }}>{t('admin.disputes.resolution.dismissed')}</Tag></Option>
            </Select>
          </Form.Item>

          {resolutionType === 'partial_refund' && (
            <Form.Item name="amount" label={t('admin.disputes.resolveModal.refundAmount')}
              rules={[{ required: true, message: t('admin.disputes.resolveModal.amountRequired') }]}
              extra={escrowData ? t('admin.disputes.resolveModal.escrowMax', { max: escrowData.amount?.toLocaleString() }) : undefined}>
              <InputNumber style={{ width: '100%' }} min={0} max={escrowData?.amount ?? undefined}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                addonAfter="₫" placeholder="0" />
            </Form.Item>
          )}

          {resolutionType && resolutionType !== 'dismissed' && (
            <Alert type="info" showIcon style={{ marginBottom: 12 }}
              message={t(`admin.disputes.resolveModal.hint.${resolutionType}`, {
                defaultValue: t('admin.disputes.resolveModal.hint.default'),
              })} />
          )}

          <Form.Item name="notes" label={t('admin.disputes.resolveModal.notes')}>
            <Input.TextArea rows={3} placeholder={t('admin.disputes.resolveModal.notesPlaceholder')} />
          </Form.Item>
        </Form>
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
        { key: 'disputes', label: <Flex align="center" gap={6}><MessageOutlined />{t('admin.payments.tabs.disputes')}</Flex>, children: <DisputesTab /> },
      ]} />
    </div>
  );
}