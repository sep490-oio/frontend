/**
 * AdminReportsPage — /admin/reports
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Space, Badge,
} from 'antd';
import type { TableProps } from 'antd';
import { AlertOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getReports, resolveReport, escalateReportEmergency } from '@/services/adminService';
import type { ReportDto, GetReportsParams } from '@/services/adminService';

const { Text, Title } = Typography;
const { Option } = Select;
const PAGE_SIZE = 15;

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
    { title: t('admin.reports.columns.entity'), key: 'entity',
      render: (_, r) => (
        <Flex vertical gap={2}>
          <Tag color="purple" style={{ margin: 0 }}>{r.entityType}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.entityId?.slice(0, 8)}...</Text>
        </Flex>
      ) },
    { title: t('admin.reports.columns.reason'), dataIndex: 'reasonCode', key: 'reasonCode', width: 160,
      render: (v: string) => <Tag>{v}</Tag> },
    { title: t('admin.reports.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'error' | 'processing' | 'default'> = {
          pending: 'warning', resolved: 'success', escalated: 'error', under_review: 'processing',
        };
        return <Badge status={cfg[v] ?? 'default'} text={t(`admin.reports.status.${v}`, { defaultValue: v })} />;
      } },
    { title: t('admin.reports.columns.assignedTo'), dataIndex: 'assignedTo', key: 'assignedTo', width: 120,
      render: (v: string | null) => v
        ? <Text code style={{ fontSize: 11 }}>{v.slice(0, 8)}...</Text>
        : <Text type="secondary">{t('admin.reports.notAssigned')}</Text> },
    { title: t('admin.reports.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text> },
    { title: t('admin.reports.columns.actions'), key: 'actions', width: 130, fixed: 'right',
      render: (_, record) => (
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
      ) },
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
        loading={isFetching} scroll={{ x: 800 }} size="middle"
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