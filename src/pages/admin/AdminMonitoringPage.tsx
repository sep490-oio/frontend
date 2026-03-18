/**
 * AdminMonitoringPage — /admin/monitoring
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Space, Badge,
} from 'antd';
import type { TableProps } from 'antd';
import { CheckOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMonitoringAlerts, acknowledgeMonitoringAlert, resolveMonitoringAlert } from '@/services/adminService';
import type { MonitoringAlertDto, GetMonitoringAlertsParams } from '@/services/adminService';

const { Text, Title } = Typography;
const { Option } = Select;

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'red', high: 'orange', medium: 'gold', low: 'blue', info: 'default',
};

export default function AdminMonitoringPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<GetMonitoringAlertsParams>({});
  const [resolveModal, setResolveModal] = useState<{ open: boolean; id: string | null; mode: 'acknowledge' | 'resolve' }>({
    open: false, id: null, mode: 'resolve',
  });
  const [notes, setNotes] = useState('');
  const [ignored, setIgnored] = useState(false);

  const { data: alerts = [], isFetching, refetch } = useQuery({
    queryKey: ['admin', 'monitoring-alerts', params],
    queryFn: () => getMonitoringAlerts(params),
    refetchInterval: 30 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'monitoring-alerts'] });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) => acknowledgeMonitoringAlert(id, { notes: n }),
    onSuccess: () => { message.success(t('admin.monitoring.acknowledged')); closeModal(); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, n, ig }: { id: string; n: string; ig: boolean }) =>
      resolveMonitoringAlert(id, { notes: n, ignored: ig }),
    onSuccess: () => { message.success(t('admin.monitoring.resolved')); closeModal(); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const closeModal = () => { setResolveModal({ open: false, id: null, mode: 'resolve' }); setNotes(''); setIgnored(false); };

  const handleModalOk = () => {
    if (!resolveModal.id) return;
    if (resolveModal.mode === 'acknowledge') acknowledgeMutation.mutate({ id: resolveModal.id, n: notes });
    else resolveMutation.mutate({ id: resolveModal.id, n: notes, ig: ignored });
  };

  const columns: TableProps<MonitoringAlertDto>['columns'] = [
    {
      title: t('admin.monitoring.columns.entity'), key: 'entity',
      render: (_: unknown, r: MonitoringAlertDto) => (
        <Flex vertical gap={2}>
          <Tag style={{ margin: 0 }}>{r.entityType}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.alertType}</Text>
        </Flex>
      ),
    },
    {
      title: t('admin.monitoring.columns.severity'),
      dataIndex: 'severity', key: 'severity', width: 110,
      render: (v: string) => <Tag color={SEVERITY_COLOR[v] ?? 'default'}>{v?.toUpperCase()}</Tag>,
    },
    {
      title: t('admin.monitoring.columns.status'),
      dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'processing' | 'default'> = {
          open: 'warning', acknowledged: 'processing', resolved: 'success',
        };
        return <Badge status={cfg[v] ?? 'default'} text={t(`admin.monitoring.status.${v}`, { defaultValue: v })} />;
      },
    },
    {
      title: t('admin.monitoring.columns.notes'), dataIndex: 'notes', key: 'notes',
      render: (v: string | null) => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.monitoring.columns.createdAt'),
      dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => (
        <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm:ss')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM HH:mm')}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin.monitoring.columns.actions'),
      key: 'actions', width: 120, fixed: 'right',
      render: (_: unknown, record: MonitoringAlertDto) => (
        <Space size={4}>
          {record.status === 'open' && (
            <Tooltip title={t('admin.monitoring.acknowledge')}>
              <Button size="small" icon={<EyeOutlined />}
                onClick={() => setResolveModal({ open: true, id: record.id, mode: 'acknowledge' })} />
            </Tooltip>
          )}
          {record.status !== 'resolved' && (
            <Tooltip title={t('admin.monitoring.resolve')}>
              <Button size="small" type="primary" icon={<CheckOutlined />}
                onClick={() => setResolveModal({ open: true, id: record.id, mode: 'resolve' })} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.monitoring.title')}</Title>
          <Text type="secondary">
            {t('admin.monitoring.subtitle', { count: alerts.filter((a: MonitoringAlertDto) => a.status === 'open').length })}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>

      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Select placeholder={t('admin.monitoring.filterStatus')} allowClear style={{ width: 160 }}
          onChange={(val) => setParams((p: GetMonitoringAlertsParams) => ({ ...p, status: val }))}>
          <Option value="open">{t('admin.monitoring.status.open')}</Option>
          <Option value="acknowledged">{t('admin.monitoring.status.acknowledged')}</Option>
          <Option value="resolved">{t('admin.monitoring.status.resolved')}</Option>
        </Select>
        <Select placeholder={t('admin.monitoring.filterEntityType')} allowClear style={{ width: 160 }}
          onChange={(val) => setParams((p: GetMonitoringAlertsParams) => ({ ...p, entityType: val }))}>
          <Option value="auction">{t('admin.monitoring.entityTypes.auction')}</Option>
          <Option value="user">{t('admin.monitoring.entityTypes.user')}</Option>
          <Option value="payment">{t('admin.monitoring.entityTypes.payment')}</Option>
        </Select>
      </Flex>

      <Table
        rowKey="id" columns={columns} dataSource={alerts}
        loading={isFetching} scroll={{ x: 800 }} size="middle"
        rowClassName={(r: MonitoringAlertDto) => r.severity === 'critical' ? 'ant-table-row-danger' : ''}
      />

      <Modal
        title={resolveModal.mode === 'acknowledge' ? t('admin.monitoring.acknowledgeModal.title') : t('admin.monitoring.resolveModal.title')}
        open={resolveModal.open} onCancel={closeModal} onOk={handleModalOk}
        okButtonProps={{ loading: acknowledgeMutation.isPending || resolveMutation.isPending }}
        okText={t('admin.monitoring.resolveModal.confirm')} cancelText={t('common.cancel')}
      >
        <Flex vertical gap={12} style={{ marginTop: 12 }}>
          {resolveModal.mode === 'resolve' && (
            <div>
              <Text strong>{t('admin.monitoring.resolveModal.actionLabel')}</Text>
              <Select style={{ width: '100%', marginTop: 4 }} defaultValue={false}
                onChange={(val) => setIgnored(val as boolean)}>
                <Option value={false}>{t('admin.monitoring.resolveModal.actionResolve')}</Option>
                <Option value={true}>{t('admin.monitoring.resolveModal.actionIgnore')}</Option>
              </Select>
            </div>
          )}
          <div>
            <Text strong>{t('admin.monitoring.columns.notes')}</Text>
            <Input.TextArea rows={3} style={{ marginTop: 4 }} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={resolveModal.mode === 'acknowledge'
                ? t('admin.monitoring.acknowledgeModal.notesPlaceholder')
                : t('admin.monitoring.resolveModal.notesPlaceholder')}
            />
          </div>
        </Flex>
      </Modal>
    </div>
  );
}