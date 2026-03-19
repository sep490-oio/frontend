/**
 * AdminDisputesPage — /admin/disputes
 *
 * Shows all disputes from /api/disputes (admin sees all).
 * Each dispute can be resolved via resolveDispute() with:
 *   - resolutionType (refund_buyer / release_to_seller / partial_refund / dismissed)
 *   - notes
 *   - amount (for partial_refund)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Form, Space, Badge, Drawer,
  Descriptions, InputNumber, Alert, Divider, Avatar,
} from 'antd';
import type { TableProps } from 'antd';
import {
  CheckOutlined, ReloadOutlined, MessageOutlined,
  FilterOutlined, ExclamationCircleOutlined, UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { resolveDispute } from '@/services/adminService';
import type { ResolveDisputeRequest } from '@/services/adminService';
import { api } from '@/services/api';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PAGE_SIZE = 15;

// ─── Local types (dispute list not in admin endpoints — reuse /api/disputes) ──
interface DisputeMessageDto {
  id: string;
  senderId?: string | null;
  content?: string | null;
  createdAt: string;
}

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

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function getDisputes(params: {
  status?: string; PageNumber?: number; PageSize?: number;
} = {}): Promise<{ items: DisputeDto[]; metadata?: { totalCount: number; currentPage: number } }> {
  const res = await api.get('/api/disputes', { params });
  if (Array.isArray(res.data)) return { items: res.data };
  return res.data;
}

async function getDisputeById(id: string): Promise<DisputeDto> {
  const res = await api.get<DisputeDto>(`/api/disputes/${id}`);
  return res.data;
}

async function getDisputeMessages(id: string): Promise<DisputeMessageDto[]> {
  const res = await api.get(`/api/disputes/${id}/messages`);
  if (Array.isArray(res.data)) return res.data;
  return res.data?.items ?? [];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, 'warning' | 'success' | 'error' | 'processing' | 'default'> = {
  open: 'warning',
  under_review: 'processing',
  resolved: 'success',
  closed: 'default',
  escalated: 'error',
};

const RESOLUTION_TYPE_COLOR: Record<string, string> = {
  refund_buyer: 'blue',
  release_to_seller: 'green',
  partial_refund: 'orange',
  dismissed: 'default',
};

// ─── Resolve Modal ────────────────────────────────────────────────────────────
interface ResolveModalProps {
  open: boolean;
  disputeId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ResolveModal({ open, disputeId, onClose, onSuccess }: ResolveModalProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<ResolveDisputeRequest>();
  const [resolutionType, setResolutionType] = useState<string | undefined>();

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveDisputeRequest }) => resolveDispute(id, data),
    onSuccess: () => {
      message.success(t('admin.disputes.resolved'));
      form.resetFields();
      setResolutionType(undefined);
      onSuccess();
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (!disputeId) return;
      resolveMutation.mutate({ id: disputeId, data: values });
    });
  };

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <CheckOutlined style={{ color: '#1D9E75' }} />
          <span>{t('admin.disputes.resolveModal.title')}</span>
        </Flex>
      }
      open={open}
      onCancel={() => { form.resetFields(); setResolutionType(undefined); onClose(); }}
      onOk={handleOk}
      okText={t('admin.disputes.resolveModal.confirm')}
      okButtonProps={{ loading: resolveMutation.isPending }}
      cancelText={t('common.cancel')}
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="resolutionType"
          label={t('admin.disputes.resolveModal.resolutionType')}
          rules={[{ required: true, message: t('admin.disputes.resolveModal.resolutionRequired') }]}
        >
          <Select
            placeholder={t('admin.disputes.resolveModal.resolutionPlaceholder')}
            onChange={(val) => setResolutionType(val as string)}
          >
            <Option value="refund_buyer">
              <Tag color="blue" style={{ margin: 0 }}>{t('admin.disputes.resolution.refund_buyer')}</Tag>
            </Option>
            <Option value="release_to_seller">
              <Tag color="green" style={{ margin: 0 }}>{t('admin.disputes.resolution.release_to_seller')}</Tag>
            </Option>
            <Option value="partial_refund">
              <Tag color="orange" style={{ margin: 0 }}>{t('admin.disputes.resolution.partial_refund')}</Tag>
            </Option>
            <Option value="dismissed">
              <Tag style={{ margin: 0 }}>{t('admin.disputes.resolution.dismissed')}</Tag>
            </Option>
          </Select>
        </Form.Item>

        {resolutionType === 'partial_refund' && (
          <Form.Item
            name="amount"
            label={t('admin.disputes.resolveModal.refundAmount')}
            rules={[{ required: true, message: t('admin.disputes.resolveModal.amountRequired') }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              addonAfter="₫"
              placeholder="0"
            />
          </Form.Item>
        )}

        <Form.Item name="notes" label={t('admin.disputes.resolveModal.notes')}>
          <TextArea rows={4} placeholder={t('admin.disputes.resolveModal.notesPlaceholder')} />
        </Form.Item>

        {resolutionType && (
          <Alert
            type={resolutionType === 'dismissed' ? 'warning' : 'info'}
            showIcon
            message={t(`admin.disputes.resolveModal.hint.${resolutionType}`, {
              defaultValue: t('admin.disputes.resolveModal.hint.default'),
            })}
            style={{ marginTop: 4 }}
          />
        )}
      </Form>
    </Modal>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
interface DetailDrawerProps {
  disputeId: string | null;
  onClose: () => void;
}

function DetailDrawer({ disputeId, onClose }: DetailDrawerProps) {
  const { t } = useTranslation();

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['admin', 'disputes', disputeId],
    queryFn: () => getDisputeById(disputeId!),
    enabled: !!disputeId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['admin', 'disputes', disputeId, 'messages'],
    queryFn: () => getDisputeMessages(disputeId!),
    enabled: !!disputeId,
    refetchInterval: 15_000,
  });

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          <MessageOutlined />
          <span>{t('admin.disputes.detailDrawer.title')}</span>
        </Flex>
      }
      open={!!disputeId}
      onClose={onClose}
      width={520}
      loading={isLoading}
    >
      {dispute && (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={t('admin.disputes.columns.order')}>
              <Text code style={{ fontSize: 11 }}>{dispute.orderId?.slice(0, 8)}…</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.disputes.columns.reason')}>
              {dispute.reason ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.disputes.columns.description')}>
              <Text style={{ fontSize: 12 }}>{dispute.description ?? '—'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.disputes.columns.status')}>
              <Badge status={STATUS_BADGE[dispute.status ?? ''] ?? 'default'} text={dispute.status} />
            </Descriptions.Item>
            {dispute.resolution && (
              <Descriptions.Item label={t('admin.disputes.columns.resolution')}>
                <Tag color={RESOLUTION_TYPE_COLOR[dispute.resolution] ?? 'default'}>{dispute.resolution}</Tag>
              </Descriptions.Item>
            )}
            {dispute.resolutionNotes && (
              <Descriptions.Item label={t('admin.disputes.resolveModal.notes')}>
                <Text style={{ fontSize: 12 }}>{dispute.resolutionNotes}</Text>
              </Descriptions.Item>
            )}
            {dispute.resolutionAmount != null && (
              <Descriptions.Item label={t('admin.disputes.resolveModal.refundAmount')}>
                <Text strong>{dispute.resolutionAmount.toLocaleString()} ₫</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('common.createdAt')}>
              {dayjs(dispute.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>

          <Divider>{t('admin.disputes.detailDrawer.messages', { count: messages.length })}</Divider>

          <Flex vertical gap={10} style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
            {messages.length === 0 ? (
              <Text type="secondary" style={{ textAlign: 'center' }}>{t('admin.disputes.detailDrawer.noMessages')}</Text>
            ) : (
              messages.map((msg) => (
                <Flex key={msg.id} gap={8} align="flex-start">
                  <Avatar icon={<UserOutlined />} size={28} />
                  <div style={{
                    background: 'var(--ant-color-fill-content)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    flex: 1,
                  }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                      <Text code style={{ fontSize: 11 }}>{msg.senderId?.slice(0, 8)}…</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(msg.createdAt).format('DD/MM HH:mm')}</Text>
                    </Flex>
                    <Text style={{ fontSize: 13 }}>{msg.content}</Text>
                  </div>
                </Flex>
              ))
            )}
          </Flex>
        </>
      )}
    </Drawer>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDisputesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<{ status?: string; PageNumber?: number; PageSize?: number }>({
    PageNumber: 1, PageSize: PAGE_SIZE,
  });
  const [resolveModal, setResolveModal] = useState<{ open: boolean; disputeId: string | null }>({
    open: false, disputeId: null,
  });
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: () => getDisputes(params),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });

  const disputes = data?.items ?? [];
  const metadata = data?.metadata;

  const columns: TableProps<DisputeDto>['columns'] = [
    {
      title: t('admin.disputes.columns.order'), dataIndex: 'orderId', key: 'orderId',
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v?.slice(0, 8)}…</Text>,
    },
    {
      title: t('admin.disputes.columns.parties'), key: 'parties', width: 200,
      render: (_, r) => (
        <Flex vertical gap={2}>
          <Text style={{ fontSize: 12 }}>
            <Text type="secondary">{t('admin.disputes.columns.initiator')}: </Text>
            <Text code style={{ fontSize: 11 }}>{r.initiatorId?.slice(0, 8)}…</Text>
          </Text>
          <Text style={{ fontSize: 12 }}>
            <Text type="secondary">{t('admin.disputes.columns.respondent')}: </Text>
            <Text code style={{ fontSize: 11 }}>{r.respondentId?.slice(0, 8)}…</Text>
          </Text>
        </Flex>
      ),
    },
    {
      title: t('admin.disputes.columns.reason'), dataIndex: 'reason', key: 'reason', width: 150,
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.disputes.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => (
        <Badge status={STATUS_BADGE[v] ?? 'default'} text={t(`admin.disputes.status.${v}`, { defaultValue: v })} />
      ),
    },
    {
      title: t('admin.disputes.columns.resolution'), dataIndex: 'resolution', key: 'resolution', width: 160,
      render: (v: string | null) => v
        ? <Tag color={RESOLUTION_TYPE_COLOR[v] ?? 'default'}>{t(`admin.disputes.resolution.${v}`, { defaultValue: v })}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.disputes.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => (
        <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin.disputes.columns.actions'), key: 'actions', width: 130, fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('admin.disputes.viewDetail')}>
            <Button size="small" icon={<MessageOutlined />}
              onClick={() => setDetailDrawerId(record.id)} />
          </Tooltip>
          <Tooltip title={t('admin.disputes.resolve')}>
            <Button
              size="small" type="primary" icon={<CheckOutlined />}
              disabled={record.status === 'resolved' || record.status === 'closed'}
              onClick={() => setResolveModal({ open: true, disputeId: record.id })}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Stats summary
  const openCount    = disputes.filter((d) => d.status === 'open').length;
  const reviewCount  = disputes.filter((d) => d.status === 'under_review').length;
  const escalated    = disputes.filter((d) => d.status === 'escalated').length;

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.disputes.title')}</Title>
          <Text type="secondary">
            {t('admin.disputes.subtitle', { total: metadata?.totalCount ?? disputes.length })}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>

      {/* Quick stats */}
      {(openCount > 0 || escalated > 0) && (
        <Flex gap={8} style={{ marginBottom: 16 }} wrap>
          {openCount > 0 && (
            <Tag color="orange" icon={<ExclamationCircleOutlined />} style={{ padding: '4px 10px', fontSize: 13 }}>
              {t('admin.disputes.statsOpen', { count: openCount })}
            </Tag>
          )}
          {reviewCount > 0 && (
            <Tag color="blue" style={{ padding: '4px 10px', fontSize: 13 }}>
              {t('admin.disputes.statsReview', { count: reviewCount })}
            </Tag>
          )}
          {escalated > 0 && (
            <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ padding: '4px 10px', fontSize: 13 }}>
              {t('admin.disputes.statsEscalated', { count: escalated })}
            </Tag>
          )}
        </Flex>
      )}

      {/* Filters */}
      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('admin.disputes.filterStatus')} allowClear style={{ width: 180 }}
          suffixIcon={<FilterOutlined />}
          onChange={(val) => setParams((p) => ({ ...p, status: val, PageNumber: 1 }))}
        >
          {(['open', 'under_review', 'resolved', 'escalated', 'closed'] as const).map((v) => (
            <Option key={v} value={v}>
              <Badge status={STATUS_BADGE[v] ?? 'default'} text={t(`admin.disputes.status.${v}`, { defaultValue: v })} />
            </Option>
          ))}
        </Select>
      </Flex>

      <Table
        rowKey="id" columns={columns} dataSource={disputes}
        loading={isFetching} scroll={{ x: 900 }} size="middle"
        rowClassName={(r) => r.status === 'escalated' ? 'ant-table-row-danger' : ''}
        pagination={{
          current: metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: metadata?.totalCount ?? 0, showSizeChanger: false,
          showTotal: (total) => t('common.pagination.total', { total }),
          onChange: (page) => setParams((p) => ({ ...p, PageNumber: page })),
        }}
      />

      <ResolveModal
        open={resolveModal.open}
        disputeId={resolveModal.disputeId}
        onClose={() => setResolveModal({ open: false, disputeId: null })}
        onSuccess={() => { setResolveModal({ open: false, disputeId: null }); invalidate(); }}
      />

      <DetailDrawer
        disputeId={detailDrawerId}
        onClose={() => setDetailDrawerId(null)}
      />
    </div>
  );
}
