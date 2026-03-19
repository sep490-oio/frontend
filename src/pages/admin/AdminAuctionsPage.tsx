/**
 * AdminAuctionsPage — /admin/auctions
 *
 * Tabs:
 *   1. Curation    — set featured / priority / assign admin reviewer
 *   2. Emergencies — trigger & resolve auction emergencies
 *   3. Bids        — cancel invalid bids (search by auctionId)
 *   4. Sealed bids — reveal sealed bids
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Form, Space, Tabs, Switch,
  Card, Badge, Divider, Row, Col, Statistic,
} from 'antd';
import type { TableProps } from 'antd';
import {
  StarOutlined, ThunderboltOutlined, StopOutlined,
  EyeOutlined, ReloadOutlined,
  FilterOutlined, TrophyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  cancelInvalidBid,
  setAuctionCuration,
  triggerAuctionEmergency,
  resolveAuctionEmergency,
  revealSealedBid,
} from '@/services/adminService';
import type {
  SetAuctionCurationRequest,
  TriggerAuctionEmergencyRequest,
  CancelInvalidBidRequest,
  MonitoringAlertDto,
} from '@/services/adminService';
import { api } from '@/services/api';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PAGE_SIZE = 15;

// ─── Shared types (minimal — auction list endpoint is not in admin spec) ─────
interface AuctionAdminDto {
  id: string;
  title?: string | null;
  status?: string | null;
  sellerId?: string | null;
  startingPrice?: number;
  currentHighestBid?: number;
  isFeatured?: boolean;
  priority?: string | null;
  assignedAdminId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
}

interface BidAdminDto {
  id: string;
  auctionId: string;
  bidderId?: string | null;
  amount?: number;
  status?: string | null;
  createdAt: string;
}

// ─── Helper: fetch auctions via public endpoint (admin reuses it) ─────────────
async function getAdminAuctions(params: Record<string, unknown> = {}): Promise<{ items: AuctionAdminDto[]; metadata?: { totalCount: number; currentPage: number } }> {
  const res = await api.get('/api/auctions', { params: { PageSize: PAGE_SIZE, ...params } });
  if (Array.isArray(res.data)) return { items: res.data };
  return res.data;
}

async function getAuctionBids(auctionId: string): Promise<BidAdminDto[]> {
  const res = await api.get(`/api/auctions/${auctionId}/bids`);
  if (Array.isArray(res.data)) return res.data;
  return res.data?.items ?? [];
}

// ─── STATUS helpers ───────────────────────────────────────────────────────────
const AUCTION_STATUS_COLOR: Record<string, string> = {
  draft: 'default', pending: 'orange', active: 'green',
  ended: 'blue', cancelled: 'red', closed: 'purple',
};

const PRIORITY_COLOR: Record<string, string> = {
  high: 'red', medium: 'orange', low: 'default',
};

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1 — Curation
// ═════════════════════════════════════════════════════════════════════════════
function CurationTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [curationModal, setCurationModal] = useState<{ open: boolean; auction: AuctionAdminDto | null }>({
    open: false, auction: null,
  });
  const [form] = Form.useForm<SetAuctionCurationRequest>();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'auctions', 'curation', { statusFilter }],
    queryFn: () => getAdminAuctions({ Status: statusFilter }),
    placeholderData: (prev) => prev,
  });

  const curationMutation = useMutation({
    mutationFn: ({ auctionId, data: d }: { auctionId: string; data: SetAuctionCurationRequest }) =>
      setAuctionCuration(auctionId, d),
    onSuccess: () => {
      message.success(t('admin.auctions.curation.saved'));
      setCurationModal({ open: false, auction: null });
      queryClient.invalidateQueries({ queryKey: ['admin', 'auctions', 'curation'] });
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const auctions = data?.items ?? [];

  const columns: TableProps<AuctionAdminDto>['columns'] = [
    {
      title: t('admin.auctions.columns.auction'),
      key: 'auction',
      render: (_, r) => (
        <Flex vertical gap={2}>
          <Text strong style={{ maxWidth: 260, display: 'block' }} ellipsis>{r.title ?? '—'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.id.slice(0, 8)}…</Text>
        </Flex>
      ),
    },
    {
      title: t('admin.auctions.columns.status'), dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => <Tag color={AUCTION_STATUS_COLOR[v] ?? 'default'}>{v?.toUpperCase()}</Tag>,
    },
    {
      title: t('admin.auctions.columns.featured'), dataIndex: 'isFeatured', key: 'isFeatured', width: 100,
      render: (v: boolean) => v
        ? <Tag color="gold" icon={<StarOutlined />}>{t('admin.auctions.curation.featured')}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.auctions.columns.priority'), dataIndex: 'priority', key: 'priority', width: 110,
      render: (v: string | null) => v
        ? <Tag color={PRIORITY_COLOR[v] ?? 'default'}>{v.toUpperCase()}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.auctions.columns.reviewer'), dataIndex: 'assignedAdminId', key: 'assignedAdminId', width: 130,
      render: (v: string | null) => v
        ? <Text code style={{ fontSize: 11 }}>{v.slice(0, 8)}…</Text>
        : <Text type="secondary">{t('admin.auctions.curation.unassigned')}</Text>,
    },
    {
      title: t('admin.auctions.columns.endsAt'), dataIndex: 'endsAt', key: 'endsAt', width: 120,
      render: (d: string | null) => d
        ? <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm')}><Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM HH:mm')}</Text></Tooltip>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.auctions.columns.actions'), key: 'actions', width: 100, fixed: 'right',
      render: (_, record) => (
        <Tooltip title={t('admin.auctions.curation.editTooltip')}>
          <Button size="small" icon={<StarOutlined />}
            onClick={() => {
              form.setFieldsValue({
                isFeatured: record.isFeatured,
                priority: record.priority ?? undefined,
                assignedAdminId: record.assignedAdminId ?? undefined,
                clearAssignedAdmin: false,
              });
              setCurationModal({ open: true, auction: record });
            }}
          >
            {t('admin.auctions.curation.edit')}
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 4 }}>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Select placeholder={t('admin.auctions.filterStatus')} allowClear style={{ width: 160 }} suffixIcon={<FilterOutlined />}
          onChange={setStatusFilter}>
          {['draft', 'pending', 'active', 'ended', 'cancelled'].map((v) => (
            <Option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</Option>
          ))}
        </Select>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>

      <Table
        rowKey="id" columns={columns} dataSource={auctions}
        loading={isFetching} scroll={{ x: 800 }} size="middle"
        pagination={{
          pageSize: PAGE_SIZE,
          total: data?.metadata?.totalCount ?? auctions.length,
          showSizeChanger: false,
          showTotal: (total) => t('common.pagination.total', { total }),
        }}
      />

      <Modal
        title={
          <Flex align="center" gap={8}>
            <StarOutlined />
            <span>{t('admin.auctions.curation.modalTitle', { title: curationModal.auction?.title ?? '' })}</span>
          </Flex>
        }
        open={curationModal.open}
        onCancel={() => setCurationModal({ open: false, auction: null })}
        onOk={() => {
          form.validateFields().then((values) => {
            if (!curationModal.auction) return;
            curationMutation.mutate({ auctionId: curationModal.auction.id, data: values });
          });
        }}
        okText={t('common.save')}
        okButtonProps={{ loading: curationMutation.isPending }}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="isFeatured" label={t('admin.auctions.curation.featured')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="priority" label={t('admin.auctions.curation.priority')}>
            <Select allowClear placeholder={t('admin.auctions.curation.priorityPlaceholder')}>
              <Option value="high">{t('admin.auctions.curation.priorityHigh')}</Option>
              <Option value="medium">{t('admin.auctions.curation.priorityMedium')}</Option>
              <Option value="low">{t('admin.auctions.curation.priorityLow')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priorityReason" label={t('admin.auctions.curation.priorityReason')}>
            <TextArea rows={2} placeholder={t('admin.auctions.curation.priorityReasonPlaceholder')} />
          </Form.Item>
          <Divider style={{ margin: '8px 0' }} />
          <Form.Item name="assignedAdminId" label={t('admin.auctions.curation.assignAdmin')}>
            <Input placeholder={t('admin.auctions.curation.assignAdminPlaceholder')} />
          </Form.Item>
          <Form.Item name="clearAssignedAdmin" label={t('admin.auctions.curation.clearAdmin')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2 — Emergencies (Command Center — cascade actions)
// ═════════════════════════════════════════════════════════════════════════════
function EmergenciesTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [auctionId, setAuctionId] = useState('');
  const [triggerModal, setTriggerModal] = useState(false);
  const [commandModal, setCommandModal] = useState<{ open: boolean; alert: MonitoringAlertDto | null }>({
    open: false, alert: null,
  });
  const [triggerForm] = Form.useForm<TriggerAuctionEmergencyRequest>();

  // Cascade action state
  const [cascadeStep, setCascadeStep] = useState<'idle' | 'cancelling' | 'resolving' | 'done'>('idle');
  const [cancelBidId, setCancelBidId]   = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [cascadeLog, setCascadeLog] = useState<Array<{ step: string; ok: boolean; msg: string }>>([]);

  const { data: alerts = [], isFetching, refetch } = useQuery<MonitoringAlertDto[]>({
    queryKey: ['admin', 'monitoring-alerts', { entityType: 'auction' }],
    queryFn: async () => {
      const res = await api.get('/api/admin/monitoring-alerts', { params: { entityType: 'auction' } });
      return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    },
    refetchInterval: 30_000,
  });

  const triggerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TriggerAuctionEmergencyRequest }) =>
      triggerAuctionEmergency(id, data),
    onSuccess: () => {
      message.success(t('admin.auctions.emergencies.triggered'));
      setTriggerModal(false);
      triggerForm.resetFields();
      setAuctionId('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring-alerts'] });
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const cancelBidMutation = useMutation({
    mutationFn: ({ aId, bId, reason }: { aId: string; bId: string; reason: string }) =>
      cancelInvalidBid(aId, bId, { reason }),
  });

  const resolveEmergencyMutation = useMutation({
    mutationFn: ({ aId, eId, status }: { aId: string; eId: string; status: string }) =>
      resolveAuctionEmergency(aId, eId, { status }),
  });

  // Execute cascade: optionally cancel bid → resolve emergency
  const executeCascade = async () => {
    if (!commandModal.alert) return;
    const alertEntityId = commandModal.alert.entityId ?? '';
    const log: Array<{ step: string; ok: boolean; msg: string }> = [];
    setCascadeStep('cancelling');

    // Step 1: Cancel bid if provided
    if (cancelBidId.trim()) {
      try {
        await cancelBidMutation.mutateAsync({ aId: alertEntityId, bId: cancelBidId.trim(), reason: cancelReason || 'Admin cascade action' });
        log.push({ step: t('admin.auctions.emergencies.cascade.stepCancelBid'), ok: true, msg: t('admin.auctions.emergencies.cascade.bidCancelled') });
      } catch {
        log.push({ step: t('admin.auctions.emergencies.cascade.stepCancelBid'), ok: false, msg: t('admin.auctions.emergencies.cascade.bidFailed') });
      }
    }

    // Step 2: Resolve emergency
    setCascadeStep('resolving');
    try {
      await resolveEmergencyMutation.mutateAsync({
        aId: alertEntityId,
        eId: commandModal.alert.id,
        status: resolveStatus,
      });
      log.push({ step: t('admin.auctions.emergencies.cascade.stepResolveEmergency'), ok: true, msg: t('admin.auctions.emergencies.cascade.emergencyResolved') });
    } catch {
      log.push({ step: t('admin.auctions.emergencies.cascade.stepResolveEmergency'), ok: false, msg: t('admin.auctions.emergencies.cascade.resolveFailed') });
    }

    setCascadeLog(log);
    setCascadeStep('done');
    queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring-alerts'] });
  };

  const closeCommandModal = () => {
    setCommandModal({ open: false, alert: null });
    setCancelBidId(''); setCancelReason(''); setResolveStatus('resolved');
    setCascadeStep('idle'); setCascadeLog([]);
  };

  const criticalOpen = (alerts as MonitoringAlertDto[]).filter((a) => a.status === 'open' && (a.severity === 'critical' || a.severity === 'high'));
  const openCount    = (alerts as MonitoringAlertDto[]).filter((a) => a.status === 'open').length;

  const SEVERITY_C: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'blue' };

  const columns: TableProps<MonitoringAlertDto>['columns'] = [
    {
      title: t('admin.auctions.emergencies.columns.auction'), key: 'entity',
      render: (_, r) => (
        <Flex vertical gap={2}>
          <Text code style={{ fontSize: 11 }}>{r.entityId?.slice(0, 8)}…</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.alertType}</Text>
        </Flex>
      ),
    },
    {
      title: t('admin.monitoring.columns.severity'), dataIndex: 'severity', key: 'severity', width: 110,
      render: (v: string) => <Tag color={SEVERITY_C[v] ?? 'default'}>{v?.toUpperCase()}</Tag>,
    },
    {
      title: t('admin.monitoring.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'processing' | 'default'> = {
          open: 'warning', acknowledged: 'processing', resolved: 'success',
        };
        return <Badge status={cfg[v] ?? 'default'} text={v} />;
      },
    },
    {
      title: t('admin.monitoring.columns.notes'), dataIndex: 'notes', key: 'notes',
      render: (v: string | null) => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.monitoring.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM HH:mm')}</Text>,
    },
    {
      title: t('admin.auctions.emergencies.columns.actions'), key: 'actions', width: 140, fixed: 'right',
      render: (_, record) => record.status !== 'resolved' ? (
        <Tooltip title={t('admin.auctions.emergencies.cascade.openCommand')}>
          <Button
            size="small"
            type={record.severity === 'critical' ? 'primary' : 'default'}
            danger={record.severity === 'critical'}
            icon={<ThunderboltOutlined />}
            onClick={() => {
              setCommandModal({ open: true, alert: record });
              setCascadeStep('idle'); setCascadeLog([]);
            }}
          >
            {t('admin.auctions.emergencies.cascade.command')}
          </Button>
        </Tooltip>
      ) : null,
    },
  ];

  return (
    <div style={{ marginTop: 4 }}>
      {/* Critical alerts banner */}
      {criticalOpen.length > 0 && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--ant-color-error-bg)', border: '1px solid var(--ant-color-error-border)' }}>
          <Flex align="center" gap={8}>
            <ThunderboltOutlined style={{ color: '#E24B4A' }} />
            <Text style={{ color: '#E24B4A', fontWeight: 500 }}>
              {t('admin.auctions.emergencies.criticalBanner', { count: criticalOpen.length })}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.auctions.emergencies.criticalHint')}</Text>
          </Flex>
        </div>
      )}

      <Flex gap={8} justify="space-between" style={{ marginBottom: 12 }} wrap>
        <Text type="secondary">{t('admin.auctions.emergencies.subtitle', { count: openCount })}</Text>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>{t('common.refresh')}</Button>
          <Button type="primary" danger icon={<ThunderboltOutlined />} onClick={() => setTriggerModal(true)}>
            {t('admin.auctions.emergencies.trigger')}
          </Button>
        </Space>
      </Flex>

      <Table
        rowKey="id" columns={columns} dataSource={alerts as MonitoringAlertDto[]}
        loading={isFetching} scroll={{ x: 700 }} size="middle"
        rowClassName={(r) => r.severity === 'critical' ? 'ant-table-row-danger' : r.severity === 'high' ? 'ant-table-row-warning' : ''}
      />

      {/* ── Trigger Modal ── */}
      <Modal
        title={<Flex align="center" gap={8}><ThunderboltOutlined style={{ color: '#E24B4A' }} /><span>{t('admin.auctions.emergencies.triggerModal.title')}</span></Flex>}
        open={triggerModal}
        onCancel={() => { setTriggerModal(false); triggerForm.resetFields(); setAuctionId(''); }}
        onOk={() => {
          triggerForm.validateFields().then(({ triggerSource, reason }) => {
            if (!auctionId.trim()) { message.warning(t('admin.auctions.emergencies.triggerModal.auctionRequired')); return; }
            triggerMutation.mutate({ id: auctionId.trim(), data: { triggerSource, reason } });
          });
        }}
        okText={t('admin.auctions.emergencies.trigger')}
        okButtonProps={{ danger: true, loading: triggerMutation.isPending }}
        cancelText={t('common.cancel')}
      >
        <Form form={triggerForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label={t('admin.auctions.emergencies.triggerModal.auctionId')} required>
            <Input value={auctionId} onChange={(e) => setAuctionId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </Form.Item>
          <Form.Item name="triggerSource" label={t('admin.auctions.emergencies.triggerModal.source')}>
            <Select placeholder={t('admin.auctions.emergencies.triggerModal.sourcePlaceholder')} allowClear>
              <Option value="admin_manual">{t('admin.auctions.emergencies.triggerModal.sourceManual')}</Option>
              <Option value="fraud_detection">{t('admin.auctions.emergencies.triggerModal.sourceFraud')}</Option>
              <Option value="system_alert">{t('admin.auctions.emergencies.triggerModal.sourceSystem')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label={t('admin.auctions.emergencies.triggerModal.reason')}
            rules={[{ required: true, message: t('admin.auctions.emergencies.triggerModal.reasonRequired') }]}>
            <TextArea rows={3} placeholder={t('admin.auctions.emergencies.triggerModal.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Command Center Modal (Cascade) ── */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <ThunderboltOutlined style={{ color: commandModal.alert?.severity === 'critical' ? '#E24B4A' : '#BA7517' }} />
            <span>{t('admin.auctions.emergencies.cascade.title')}</span>
            {commandModal.alert && (
              <Tag color={SEVERITY_C[commandModal.alert.severity ?? ''] ?? 'default'} style={{ marginLeft: 4 }}>
                {commandModal.alert.severity?.toUpperCase()}
              </Tag>
            )}
          </Flex>
        }
        open={commandModal.open}
        onCancel={closeCommandModal}
        footer={
          cascadeStep === 'done' ? (
            <Button type="primary" onClick={closeCommandModal}>{t('common.close')}</Button>
          ) : (
            <Space>
              <Button onClick={closeCommandModal}>{t('common.cancel')}</Button>
              <Button
                type="primary"
                danger={commandModal.alert?.severity === 'critical'}
                icon={<ThunderboltOutlined />}
                loading={cascadeStep === 'cancelling' || cascadeStep === 'resolving'}
                onClick={executeCascade}
              >
                {t('admin.auctions.emergencies.cascade.execute')}
              </Button>
            </Space>
          )
        }
        width={540}
      >
        {commandModal.alert && cascadeStep === 'idle' && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            {/* Alert summary */}
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--ant-color-bg-layout)', border: '1px solid var(--ant-color-border-secondary)' }}>
              <Flex gap={16}>
                <Flex vertical gap={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.auctions.emergencies.cascade.auctionId')}</Text>
                  <Text code style={{ fontSize: 12 }}>{commandModal.alert.entityId?.slice(0, 8)}…</Text>
                </Flex>
                <Flex vertical gap={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.auctions.emergencies.cascade.alertType')}</Text>
                  <Text style={{ fontSize: 12 }}>{commandModal.alert.alertType}</Text>
                </Flex>
                <Flex vertical gap={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.monitoring.columns.createdAt')}</Text>
                  <Text style={{ fontSize: 12 }}>{dayjs(commandModal.alert.createdAt).format('DD/MM HH:mm')}</Text>
                </Flex>
              </Flex>
            </div>

            <Divider style={{ margin: '0' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.auctions.emergencies.cascade.step1')}</Text>
            </Divider>

            {/* Step 1: Cancel bid (optional) */}
            <Flex vertical gap={8}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{t('admin.auctions.emergencies.cascade.cancelBidTitle')}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.auctions.emergencies.cascade.cancelBidHint')}</Text>
              <Input
                placeholder={t('admin.auctions.emergencies.cascade.bidIdPlaceholder')}
                value={cancelBidId}
                onChange={(e) => setCancelBidId(e.target.value)}
                allowClear
              />
              {cancelBidId && (
                <Input
                  placeholder={t('admin.auctions.emergencies.cascade.cancelReasonPlaceholder')}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              )}
            </Flex>

            <Divider style={{ margin: '0' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.auctions.emergencies.cascade.step2')}</Text>
            </Divider>

            {/* Step 2: Resolve emergency */}
            <Flex vertical gap={8}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{t('admin.auctions.emergencies.cascade.resolveTitle')}</Text>
              <Select value={resolveStatus} onChange={setResolveStatus} style={{ width: '100%' }}>
                <Option value="resolved">{t('admin.auctions.emergencies.resolveModal.typeResolved')}</Option>
                <Option value="cancelled">{t('admin.auctions.emergencies.resolveModal.typeCancelled')}</Option>
                <Option value="extended">{t('admin.auctions.emergencies.resolveModal.typeExtended')}</Option>
              </Select>
            </Flex>
          </Flex>
        )}

        {/* Cascade in progress */}
        {(cascadeStep === 'cancelling' || cascadeStep === 'resolving') && (
          <Flex justify="center" align="center" style={{ padding: 40 }}>
            <Flex vertical align="center" gap={12}>
              <div style={{ fontSize: 28 }}>⚡</div>
              <Text strong>
                {cascadeStep === 'cancelling'
                  ? t('admin.auctions.emergencies.cascade.cancelling')
                  : t('admin.auctions.emergencies.cascade.resolving')}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.auctions.emergencies.cascade.pleaseWait')}</Text>
            </Flex>
          </Flex>
        )}

        {/* Cascade result */}
        {cascadeStep === 'done' && (
          <Flex vertical gap={12} style={{ marginTop: 12 }}>
            <Text strong>{t('admin.auctions.emergencies.cascade.result')}</Text>
            {cascadeLog.map((entry, i) => (
              <Flex key={i} align="flex-start" gap={8}
                style={{ padding: '8px 12px', borderRadius: 6,
                  background: entry.ok ? 'var(--ant-color-success-bg)' : 'var(--ant-color-error-bg)',
                  border: `1px solid ${entry.ok ? 'var(--ant-color-success-border)' : 'var(--ant-color-error-border)'}`,
                }}>
                <Text style={{ fontSize: 16 }}>{entry.ok ? '✓' : '✗'}</Text>
                <Flex vertical gap={2}>
                  <Text strong style={{ fontSize: 13 }}>{entry.step}</Text>
                  <Text style={{ fontSize: 12 }} type={entry.ok ? undefined : 'danger'}>{entry.msg}</Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
      </Modal>
    </div>
  );
}
// ═════════════════════════════════════════════════════════════════════════════
// TAB 3 — Bids (cancel invalid bid)
// ═════════════════════════════════════════════════════════════════════════════
function BidsTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [auctionId, setAuctionId] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [cancelModal, setCancelModal] = useState<{ open: boolean; bid: BidAdminDto | null }>({ open: false, bid: null });
  const [reason, setReason] = useState('');

  const { data: bids = [], isFetching } = useQuery({
    queryKey: ['admin', 'auctions', 'bids', searchedId],
    queryFn: () => getAuctionBids(searchedId),
    enabled: !!searchedId,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ aId, bId, data }: { aId: string; bId: string; data: CancelInvalidBidRequest }) =>
      cancelInvalidBid(aId, bId, data),
    onSuccess: () => {
      message.success(t('admin.auctions.bids.cancelled'));
      setCancelModal({ open: false, bid: null });
      setReason('');
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const columns: TableProps<BidAdminDto>['columns'] = [
    {
      title: t('admin.auctions.bids.columns.bidder'), dataIndex: 'bidderId', key: 'bidderId',
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v?.slice(0, 8)}…</Text>,
    },
    {
      title: t('admin.auctions.bids.columns.amount'), dataIndex: 'amount', key: 'amount', width: 150,
      render: (v: number) => <Text strong>{v?.toLocaleString()} ₫</Text>,
    },
    {
      title: t('admin.auctions.bids.columns.status'), dataIndex: 'status', key: 'status', width: 120,
      render: (v: string) => {
        const c: Record<string, string> = { active: 'green', cancelled: 'red', outbid: 'default', winning: 'gold' };
        return <Tag color={c[v] ?? 'default'}>{v ?? '—'}</Tag>;
      },
    },
    {
      title: t('admin.auctions.bids.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</Text>,
    },
    {
      title: t('admin.auctions.bids.columns.actions'), key: 'actions', width: 110, fixed: 'right',
      render: (_, record) => record.status !== 'cancelled' ? (
        <Tooltip title={t('admin.auctions.bids.cancelTooltip')}>
          <Button size="small" danger icon={<StopOutlined />}
            onClick={() => setCancelModal({ open: true, bid: record })}>
            {t('admin.auctions.bids.cancel')}
          </Button>
        </Tooltip>
      ) : null,
    },
  ];

  return (
    <div style={{ marginTop: 4 }}>
      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('admin.auctions.bids.searchPlaceholder')}
          value={auctionId}
          onChange={(e) => setAuctionId(e.target.value)}
          style={{ width: 360 }}
          allowClear
        />
        <Button type="primary" icon={<EyeOutlined />}
          onClick={() => setSearchedId(auctionId.trim())}
          disabled={!auctionId.trim()}
          loading={isFetching}
        >
          {t('admin.auctions.bids.search')}
        </Button>
      </Flex>

      {!searchedId ? (
        <Flex justify="center" align="center" style={{ height: 200 }}>
          <Text type="secondary">{t('admin.auctions.bids.enterAuctionId')}</Text>
        </Flex>
      ) : (
        <Table
          rowKey="id" columns={columns} dataSource={bids}
          loading={isFetching} scroll={{ x: 600 }} size="middle"
        />
      )}

      <Modal
        title={<Flex align="center" gap={8}><StopOutlined style={{ color: '#E24B4A' }} /><span>{t('admin.auctions.bids.cancelModal.title')}</span></Flex>}
        open={cancelModal.open}
        onCancel={() => { setCancelModal({ open: false, bid: null }); setReason(''); }}
        onOk={() => {
          if (!cancelModal.bid || !searchedId) return;
          if (!reason.trim()) { message.warning(t('admin.auctions.bids.cancelModal.reasonRequired')); return; }
          cancelMutation.mutate({ aId: searchedId, bId: cancelModal.bid.id, data: { reason } });
        }}
        okText={t('admin.auctions.bids.cancel')}
        okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
        cancelText={t('common.cancel')}
      >
        {cancelModal.bid && (
          <Flex vertical gap={12} style={{ marginTop: 12 }}>
            <Card size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title={t('admin.auctions.bids.columns.amount')} value={cancelModal.bid.amount?.toLocaleString() ?? 0} suffix="₫" />
                </Col>
                <Col span={12}>
                  <Statistic title={t('admin.auctions.bids.columns.bidder')} value={cancelModal.bid.bidderId?.slice(0, 8) ?? '—'} />
                </Col>
              </Row>
            </Card>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>{t('admin.auctions.bids.cancelModal.reasonLabel')}</Text>
              <TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={t('admin.auctions.bids.cancelModal.reasonPlaceholder')} />
            </div>
          </Flex>
        )}
      </Modal>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 4 — Sealed Bids (reveal)
// ═════════════════════════════════════════════════════════════════════════════
function SealedBidsTab() {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [auctionId, setAuctionId] = useState('');
  const [sealedBidId, setSealedBidId] = useState('');

  const revealMutation = useMutation({
    mutationFn: ({ aId, sId }: { aId: string; sId: string }) => revealSealedBid(aId, sId),
    onSuccess: () => {
      message.success(t('admin.auctions.sealedBids.revealed'));
      setAuctionId('');
      setSealedBidId('');
    },
    onError: () => message.error(t('common.error.generic')),
  });

  return (
    <div style={{ marginTop: 4 }}>
      <Card style={{ maxWidth: 560 }}>
        <Flex vertical gap={16}>
          <Flex align="center" gap={8}>
            <TrophyOutlined style={{ fontSize: 20, color: '#BA7517' }} />
            <Text strong style={{ fontSize: 15 }}>{t('admin.auctions.sealedBids.title')}</Text>
          </Flex>
          <Text type="secondary">{t('admin.auctions.sealedBids.description')}</Text>
          <Form layout="vertical">
            <Form.Item label={t('admin.auctions.bids.searchPlaceholder')} required>
              <Input value={auctionId} onChange={(e) => setAuctionId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </Form.Item>
            <Form.Item label={t('admin.auctions.sealedBids.sealedBidId')} required>
              <Input value={sealedBidId} onChange={(e) => setSealedBidId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </Form.Item>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              loading={revealMutation.isPending}
              disabled={!auctionId.trim() || !sealedBidId.trim()}
              onClick={() => revealMutation.mutate({ aId: auctionId.trim(), sId: sealedBidId.trim() })}
            >
              {t('admin.auctions.sealedBids.reveal')}
            </Button>
          </Form>
        </Flex>
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminAuctionsPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.auctions.title')}</Title>
          <Text type="secondary">{t('admin.auctions.subtitle')}</Text>
        </div>
      </Flex>

      <Tabs
        items={[
          { key: 'curation',    label: <Flex align="center" gap={6}><StarOutlined />{t('admin.auctions.tabs.curation')}</Flex>,    children: <CurationTab /> },
          { key: 'emergencies', label: <Flex align="center" gap={6}><ThunderboltOutlined />{t('admin.auctions.tabs.emergencies')}</Flex>, children: <EmergenciesTab /> },
          { key: 'bids',        label: <Flex align="center" gap={6}><StopOutlined />{t('admin.auctions.tabs.bids')}</Flex>,        children: <BidsTab /> },
          { key: 'sealed',      label: <Flex align="center" gap={6}><TrophyOutlined />{t('admin.auctions.tabs.sealedBids')}</Flex>, children: <SealedBidsTab /> },
        ]}
      />
    </div>
  );
}