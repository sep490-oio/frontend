/**
 * AdminSellerProfilesPage — /admin/seller-profiles
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, App, Typography, Flex, Tooltip, Space, Badge, Avatar,
} from 'antd';
import type { TableProps } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined, ShopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSellerProfiles, verifySellerProfile, rejectSellerProfile } from '@/services/adminService';
import type { SellerProfileDto } from '@/services/adminService';

const { Text, Title } = Typography;

export default function AdminSellerProfilesPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const { data: profiles = [], isFetching, refetch } = useQuery({
    queryKey: ['admin', 'seller-profiles'],
    queryFn: getSellerProfiles,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'seller-profiles'] });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifySellerProfile(id),
    onSuccess: () => { message.success(t('admin.sellerProfiles.verified')); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectSellerProfile(id),
    onSuccess: () => { message.success(t('admin.sellerProfiles.rejected')); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const columns: TableProps<SellerProfileDto>['columns'] = [
    { title: t('admin.sellerProfiles.columns.seller'), key: 'seller',
      render: (_, r) => (
        <Flex align="center" gap={10}>
          <Avatar icon={<ShopOutlined />} size={36} />
          <div>
            <Text strong style={{ display: 'block' }}>{r.storeName ?? '—'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.storeDescription?.slice(0, 50)}</Text>
          </div>
        </Flex>
      ) },
    { title: t('admin.sellerProfiles.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
          pending: 'warning', verified: 'success', rejected: 'error',
        };
        return <Badge status={cfg[v] ?? 'default'} text={t(`admin.sellerProfiles.status.${v}`, { defaultValue: v })} />;
      } },
    { title: t('admin.sellerProfiles.columns.sales'), key: 'sales', width: 150,
      render: (_, r) => (
        <Flex vertical>
          <Text strong>{t('admin.sellerProfiles.orders', { count: r.totalSalesCount ?? 0 })}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.totalSalesAmount?.toLocaleString()} ₫</Text>
        </Flex>
      ) },
    { title: t('admin.sellerProfiles.columns.verifiedAt'), dataIndex: 'verifiedAt', key: 'verifiedAt', width: 130,
      render: (d: string | null) => d
        ? <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        : <Text type="secondary">—</Text> },
    { title: t('admin.sellerProfiles.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text> },
    { title: t('admin.sellerProfiles.columns.actions'), key: 'actions', width: 120, fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('admin.sellerProfiles.verify')}>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              loading={verifyMutation.isPending}
              disabled={record.status === 'verified'}
              onClick={() => modal.confirm({
                title: t('admin.sellerProfiles.verifyConfirm', { name: record.storeName }),
                okText: t('admin.sellerProfiles.verify'), cancelText: t('common.cancel'),
                onOk: () => verifyMutation.mutateAsync(record.id),
              })} />
          </Tooltip>
          <Tooltip title={t('admin.sellerProfiles.reject')}>
            <Button size="small" danger icon={<CloseOutlined />}
              loading={rejectMutation.isPending}
              disabled={record.status === 'rejected'}
              onClick={() => modal.confirm({
                title: t('admin.sellerProfiles.rejectConfirm', { name: record.storeName }),
                okButtonProps: { danger: true },
                okText: t('admin.sellerProfiles.reject'), cancelText: t('common.cancel'),
                onOk: () => rejectMutation.mutateAsync(record.id),
              })} />
          </Tooltip>
        </Space>
      ) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.sellerProfiles.title')}</Title>
          <Text type="secondary">
            {t('admin.sellerProfiles.subtitle', { count: profiles.filter((p) => p.status === 'pending').length })}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>
      <Table rowKey="id" columns={columns} dataSource={profiles} loading={isFetching} scroll={{ x: 800 }} size="middle" />
    </div>
  );
}