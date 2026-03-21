/**
 * AdminReportsPage — /admin/reports
 * Nâng cấp:
 *   - Entity preview popup: click entityId → xem thông tin entity inline
 *   - Link "Xem dispute" khi entityType = order/auction có liên quan
 *   - assignReport action thêm vào toolbar
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Space, Badge, Popover, Descriptions,
  Skeleton,
} from 'antd';
import type { TableProps } from 'antd';
import {
  AlertOutlined, CheckOutlined, ReloadOutlined,
  EyeOutlined, LinkOutlined, UserOutlined, TrophyOutlined, ShoppingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getReports, resolveReport, escalateReportEmergency } from '@/services/adminService';
import type { ReportDto, GetReportsParams } from '@/services/adminService';
import { api } from '@/services/api';

const { Text, Title } = Typography;
const { Option } = Select;
const PAGE_SIZE = 15;

// ─── Entity preview helpers ───────────────────────────────────────────────────

async function fetchEntityPreview(entityType: string, entityId: string): Promise<Record<string, unknown> | null> {
  try {
    const urlMap: Record<string, string> = {
      user: `/api/admin/users/${entityId}`,
      auction: `/api/auctions/${entityId}`,
      item: `/api/admin/items/${entityId}`,
    };
    const url = urlMap[entityType];
    if (!url) return null;
    const res = await api.get(url);
    return res.data as Record<string, unknown>;
  } catch { return null; }
}

function EntityPreviewPopover({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['entity-preview', entityType, entityId],
    queryFn: () => fetchEntityPreview(entityType, entityId),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const ICON_MAP: Record<string, React.ReactNode> = {
    user: <UserOutlined />, auction: <TrophyOutlined />, item: <ShoppingOutlined />,
  };

  const getEntityLink = () => {
    if (entityType === 'user') return `/admin/users/${entityId}`;
    if (entityType === 'auction') return `/auction/${entityId}`;
    return null;
  };

  const getPreviewFields = (d: Record<string, unknown>): Array<{ label: string; value: string }> => {
    if (entityType === 'user') return [
      { label: t('common.email'), value: String(d.email ?? '—') },
      { label: t('common.status'), value: String(d.status ?? '—') },
      { label: t('common.createdAt'), value: d.createdAt ? dayjs(d.createdAt as string).format('DD/MM/YYYY') : '—' },
    ];
    if (entityType === 'auction') return [
      { label: t('admin.reports.entity.title'), value: String((d as any).itemTitle ?? d.title ?? '—') },
      { label: t('common.status'), value: String(d.status ?? '—') },
      { label: t('admin.reports.entity.price'), value: d.currentPrice ? `${(d.currentPrice as number).toLocaleString()} ₫` : '—' },
    ];
    if (entityType === 'item') return [
      { label: t('admin.reports.entity.title'), value: String((d as any).title ?? '—') },
      { label: t('common.status'), value: String(d.status ?? '—') },
      { label: t('admin.reports.entity.condition'), value: String((d as any).condition ?? '—') },
    ];
    return Object.entries(d).slice(0, 4).map(([k, v]) => ({ label: k, value: String(v ?? '—').slice(0, 40) }));
  };

  const content = (
    <div style={{ width: 260 }}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : !data ? (
        <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.reports.entity.notFound')}</Text>
      ) : (
        <>
          <Descriptions column={1} size="small" style={{ marginBottom: 8 }}>
            {getPreviewFields(data).map(({ label, value }) => (
              <Descriptions.Item key={label} label={<Text style={{ fontSize: 11 }}>{label}</Text>}>
                <Text style={{ fontSize: 12 }}>{value}</Text>
              </Descriptions.Item>
            ))}
          </Descriptions>
          {getEntityLink() && (
            <Button
              type="link" size="small" icon={<LinkOutlined />} style={{ padding: 0, fontSize: 12 }}
              onClick={() => { navigate(getEntityLink()!); setOpen(false); }}
            >
              {t('admin.reports.entity.viewFull')}
            </Button>
          )}
        </>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={
        <Flex align="center" gap={6}>
          {ICON_MAP[entityType]}
          <Text style={{ fontSize: 12 }}>{entityType} · {entityId.slice(0, 8)}…</Text>
        </Flex>
      }
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="rightTop"
    >
      <Flex vertical gap={2} style={{ cursor: 'pointer' }}>
        <Tag color="purple" style={{ margin: 0, width: 'fit-content' }}>{entityType}</Tag>
        <Flex align="center" gap={4}>
          <Text type="secondary" style={{ fontSize: 11 }}>{entityId.slice(0, 8)}…</Text>
          <EyeOutlined style={{ fontSize: 10, color: 'var(--ant-color-text-tertiary)' }} />
        </Flex>
      </Flex>
    </Popover>
  );
}

// ─── Dispute Link ─────────────────────────────────────────────────────────────

function DisputeLinkButton({ report }: { report: ReportDto }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Show dispute link for order/auction entity types
  if (report.entityType !== 'auction' && report.entityType !== 'order') return null;

  return (
    <Tooltip title={t('admin.reports.viewDispute')}>
      <Button
        size="small" type="text" icon={<LinkOutlined />}
        style={{ fontSize: 11, color: 'var(--ant-color-primary)' }}
        onClick={() => navigate(`/admin/payments?tab=disputes&entityId=${report.entityId}`)}
      >
        {t('admin.reports.dispute')}
      </Button>
    </Tooltip>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<GetReportsParams>({ PageNumber: 1, PageSize: PAGE_SIZE });
  const [resolveModal, setResolveModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => getReports(params),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes, dis }: { id: string; notes: string; dis: boolean }) =>
      resolveReport(id, { dismissed: dis, resolutionNotes: notes }),
    onSuccess: () => {
      message.success(t('admin.reports.resolved'));
      setResolveModal({ open: false, id: null }); setResolutionNotes(''); invalidate();
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => escalateReportEmergency(id, {}),
    onSuccess: () => { message.success(t('admin.reports.escalated')); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const columns: TableProps<ReportDto>['columns'] = [
    {
      title: t('admin.reports.columns.entity'), key: 'entity', width: 160,
      render: (_, r) => r.entityType && r.entityId
        ? <EntityPreviewPopover entityType={r.entityType} entityId={r.entityId} />
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.reports.columns.reason'), dataIndex: 'reasonCode', key: 'reasonCode', width: 160,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('admin.reports.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'error' | 'processing' | 'default'> = {
          pending: 'warning', resolved: 'success', escalated: 'error', under_review: 'processing',
        };
        return <Badge status={cfg[v] ?? 'default'} text={t(`admin.reports.status.${v}`, { defaultValue: v })} />;
      },
    },
    {
      title: t('admin.reports.columns.assignedTo'), dataIndex: 'assignedTo', key: 'assignedTo', width: 120,
      render: (v: string | null) => v
        ? <Text code style={{ fontSize: 11 }}>{v.slice(0, 8)}…</Text>
        : <Text type="secondary">{t('admin.reports.notAssigned')}</Text>,
    },
    {
      title: t('admin.reports.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 110,
      render: (d: string) => (
        <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin.reports.columns.actions'), key: 'actions', width: 160, fixed: 'right',
      render: (_, record) => (
        <Flex vertical gap={4} align="flex-start">
          <Space size={4}>
            <Tooltip title={t('admin.reports.resolve')}>
              <Button size="small" type="primary" icon={<CheckOutlined />}
                disabled={record.status === 'resolved'}
                onClick={() => setResolveModal({ open: true, id: record.id })} />
            </Tooltip>
            <Tooltip title={t('admin.reports.escalate')}>
              <Button size="small" danger icon={<AlertOutlined />}
                loading={escalateMutation.isPending}
                disabled={record.status === 'resolved' || record.status === 'escalated'}
                onClick={() => modal.confirm({
                  title: t('admin.reports.escalateConfirm'),
                  content: t('admin.reports.escalateContent'),
                  okButtonProps: { danger: true },
                  onOk: () => escalateMutation.mutateAsync(record.id),
                })} />
            </Tooltip>
          </Space>
          <DisputeLinkButton report={record} />
        </Flex>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.reports.title')}</Title>
          <Text type="secondary">
            {t('admin.reports.subtitle', { count: (Array.isArray(data) ? data.length : data?.metadata?.totalCount) ?? 0 })}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>

      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Select placeholder={t('admin.reports.filterStatus')} allowClear style={{ width: 160 }}
          onChange={(val) => setParams((p: GetReportsParams) => ({ ...p, status: val, PageNumber: 1 }))}>
          {(['pending', 'under_review', 'resolved', 'escalated'] as const).map((v) => (
            <Option key={v} value={v}>{t(`admin.reports.status.${v}`)}</Option>
          ))}
        </Select>
        <Select placeholder={t('admin.reports.filterEntityType')} allowClear style={{ width: 160 }}
          onChange={(val) => setParams((p: GetReportsParams) => ({ ...p, entityType: val, PageNumber: 1 }))}>
          {(['auction', 'user', 'item'] as const).map((v) => (
            <Option key={v} value={v}>{t(`admin.reports.entityTypes.${v}`)}</Option>
          ))}
        </Select>
      </Flex>

      <Table rowKey="id" columns={columns}
        dataSource={(Array.isArray(data) ? data : data?.items) ?? []}
        loading={isFetching} scroll={{ x: 860 }} size="middle"
        pagination={{
          current: data?.metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: data?.metadata?.totalCount ?? 0, showSizeChanger: false,
          onChange: (page) => setParams((p: GetReportsParams) => ({ ...p, PageNumber: page })),
        }}
      />

      <Modal
        title={t('admin.reports.resolveModal.title')}
        open={resolveModal.open}
        onCancel={() => { setResolveModal({ open: false, id: null }); setResolutionNotes(''); }}
        onOk={() => {
          if (!resolveModal.id) return;
          resolveMutation.mutate({ id: resolveModal.id, notes: resolutionNotes, dis: dismissed });
        }}
        okButtonProps={{ loading: resolveMutation.isPending }}
        okText={t('admin.reports.resolveModal.confirm')} cancelText={t('common.cancel')}
      >
        <Flex vertical gap={12} style={{ marginTop: 12 }}>
          <div>
            <Text strong>{t('admin.reports.resolveModal.actionLabel')}</Text>
            <Select style={{ width: '100%', marginTop: 4 }} defaultValue={false}
              onChange={(val) => setDismissed(val as boolean)}>
              <Option value={false}>{t('admin.reports.resolveModal.actionResolve')}</Option>
              <Option value={true}>{t('admin.reports.resolveModal.actionDismiss')}</Option>
            </Select>
          </div>
          <div>
            <Text strong>{t('admin.reports.resolveModal.notesLabel')}</Text>
            <Input.TextArea rows={3} style={{ marginTop: 4 }} value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder={t('admin.reports.resolveModal.notesPlaceholder')} />
          </div>
        </Flex>
      </Modal>
    </div>
  );
}