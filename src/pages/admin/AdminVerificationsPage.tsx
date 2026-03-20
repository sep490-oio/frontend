/**
 * AdminVerificationsPage — /admin/verifications
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, App, Typography, Flex,
  Tooltip, Modal, Input, Space, Badge, Select, Drawer, Descriptions,
} from 'antd';
import type { TableProps } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPendingVerifications, getVerificationById, approveVerification, rejectVerification } from '@/services/adminService';
import type { VerificationDto, RejectVerificationRequest } from '@/services/adminService';

const { Text, Title } = Typography;
const { Option } = Select;

export default function AdminVerificationsPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectData, setRejectData] = useState<RejectVerificationRequest>({});
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const { data: verifications = [] as VerificationDto[], isFetching, refetch } = useQuery<VerificationDto[]>({
    queryKey: ['admin', 'verifications'],
    queryFn: getPendingVerifications,
  });

  const { data: verificationDetail } = useQuery<VerificationDto>({
    queryKey: ['admin', 'verifications', detailDrawer.id],
    queryFn: () => getVerificationById(detailDrawer.id!),
    enabled: !!detailDrawer.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: () => { message.success(t('admin.verifications.approved')); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectVerificationRequest }) => rejectVerification(id, data),
    onSuccess: () => {
      message.success(t('admin.verifications.rejected'));
      setRejectModal({ open: false, id: null });
      setRejectData({});
      invalidate();
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const columns: TableProps<VerificationDto>['columns'] = [
    {
      title: t('admin.verifications.columns.user'), dataIndex: 'userId', key: 'userId',
      render: (id: string) => <Text code style={{ fontSize: 11 }}>{id?.slice(0, 8)}...</Text>,
    },
    {
      title: t('admin.verifications.columns.type'), dataIndex: 'verificationType', key: 'verificationType', width: 160,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: t('admin.verifications.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
          pending: 'warning', approved: 'success', rejected: 'error',
        };
        return <Badge status={cfg[v] ?? 'default'} text={t(`admin.verifications.status.${v}`, { defaultValue: v })} />;
      },
    },
    {
      title: t('admin.verifications.columns.submittedAt'), dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => (
        <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin.verifications.columns.actions'),
      key: 'actions', width: 160, fixed: 'right',
      render: (_: unknown, record: VerificationDto) => (
        <Space size={4}>
          <Tooltip title={t('admin.verifications.viewDetail')}>
            <Button size="small" icon={<EyeOutlined />}
              onClick={() => setDetailDrawer({ open: true, id: record.id })} />
          </Tooltip>
          <Tooltip title={t('admin.verifications.approve')}>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              loading={approveMutation.isPending}
              disabled={record.status !== 'pending'}
              onClick={() => modal.confirm({
                title: t('admin.verifications.approveConfirm'),
                okText: t('admin.verifications.approve'),
                cancelText: t('common.cancel'),
                onOk: () => approveMutation.mutateAsync(record.id),
              })} />
          </Tooltip>
          <Tooltip title={t('admin.verifications.reject')}>
            <Button size="small" danger icon={<CloseOutlined />}
              disabled={record.status !== 'pending'}
              onClick={() => setRejectModal({ open: true, id: record.id })} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.verifications.title')}</Title>
          <Text type="secondary">{t('admin.verifications.subtitle', { count: verifications.length })}</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>

      <Table
        rowKey="id" columns={columns} dataSource={verifications}
        loading={isFetching} scroll={{ x: 700 }} size="middle"
      />

      <Drawer
        title={t('admin.verifications.detailDrawer.title')}
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, id: null })}
        width={500}
      >
        {verificationDetail && (
          <Descriptions column={1} size="small" bordered>
            {Object.entries(verificationDetail)
              .filter(([k]) => !['id'].includes(k))
              .map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </Descriptions.Item>
              ))}
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title={t('admin.verifications.rejectModal.title')}
        open={rejectModal.open}
        onCancel={() => { setRejectModal({ open: false, id: null }); setRejectData({}); }}
        onOk={() => {
          if (!rejectModal.id) return;
          if (!rejectData.reason?.trim()) { message.warning(t('admin.verifications.rejectModal.reasonRequired')); return; }
          rejectMutation.mutate({ id: rejectModal.id, data: rejectData });
        }}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        okText={t('admin.verifications.rejectModal.confirm')} cancelText={t('common.cancel')}
      >
        <Flex vertical gap={12} style={{ marginTop: 12 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('admin.verifications.rejectModal.codeLabel')}</Text>
            <Select style={{ width: '100%' }} placeholder={t('admin.verifications.rejectModal.codePlaceholder')}
              value={rejectData.rejectionCode}
              onChange={(val) => setRejectData((p: RejectVerificationRequest) => ({ ...p, rejectionCode: val }))}>
              {(['INVALID_ID', 'BLURRY_IMAGE', 'EXPIRED_ID', 'MISMATCH', 'OTHER'] as const).map((code) => (
                <Option key={code} value={code}>{t(`admin.verifications.rejectModal.codes.${code}`)}</Option>
              ))}
            </Select>
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('admin.verifications.rejectModal.reasonLabel')}</Text>
            <Input.TextArea rows={3}
              value={rejectData.reason ?? ''}
              onChange={(e) => setRejectData((p: RejectVerificationRequest) => ({ ...p, reason: e.target.value }))}
              placeholder={t('admin.verifications.rejectModal.reasonPlaceholder')} />
          </div>
        </Flex>
      </Modal>
    </div>
  );
}