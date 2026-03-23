/**
 * AdminSellerProfilesPage — /admin/seller-profiles
 * Nâng cấp: cột KYC status bên cạnh seller, block verify nếu KYC chưa approved
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, App, Typography, Flex, Tooltip, Space, Badge, Avatar, Tag,
} from 'antd';
import type { TableProps } from 'antd';
import {
  CheckOutlined, CloseOutlined, ReloadOutlined, ShopOutlined,
  SafetyCertificateOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSellerProfiles, verifySellerProfile, rejectSellerProfile, getPendingVerifications } from '@/services/adminService';
import type { SellerProfileDto, VerificationDto } from '@/services/adminService';

const { Text, Title } = Typography;

export default function AdminSellerProfilesPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const { data: profiles = [], isFetching, refetch } = useQuery({
    queryKey: ['admin', 'seller-profiles'],
    queryFn: getSellerProfiles,
  });

  // Fetch KYC verifications to join with seller profiles
  const { data: verifications = [] } = useQuery<VerificationDto[]>({
    queryKey: ['admin', 'verifications'],
    queryFn: getPendingVerifications,
    staleTime: 2 * 60 * 1000,
  });

  // Build a userId → KYC status map
  const kycMap = new Map<string, string>();
  (Array.isArray(verifications) ? verifications : []).forEach((v) => {
    if (v.userId) kycMap.set(v.userId as string, v.status as string ?? 'unknown');
  });

  // Helper to get KYC status for a seller profile
  // SellerProfileDto doesn't have userId directly — we match by id as a fallback
  const getKycStatus = (profile: SellerProfileDto): string | null => {
    // Try matching by profile.id (seller profile id = userId in many implementations)
    return kycMap.get(profile.id) ?? null;
  };

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

  const pendingCount = profiles.filter((p) => p.status === 'pending').length;
  const kycBlockedCount = profiles.filter((p) => {
    const kycStatus = getKycStatus(p);
    return p.status === 'pending' && kycStatus !== 'approved';
  }).length;

  const columns: TableProps<SellerProfileDto>['columns'] = [
    {
      title: t('admin.sellerProfiles.columns.seller'), key: 'seller',
      render: (_, r) => (
        <Flex align="center" gap={10}>
          <Avatar icon={<ShopOutlined />} size={36} />
          <div>
            <Text strong style={{ display: 'block' }}>{r.storeName ?? '—'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.storeDescription?.slice(0, 50)}</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: t('admin.sellerProfiles.columns.status'), dataIndex: 'status', key: 'status', width: 130,
      render: (v: string) => {
        const cfg: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
          pending: 'warning', verified: 'success', rejected: 'error',
        };
        return <Badge status={cfg[v] ?? 'default'} text={t(`admin.sellerProfiles.status.${v}`, { defaultValue: v })} />;
      },
    },
    {
      title: (
        <Flex align="center" gap={6}>
          <SafetyCertificateOutlined />
          {t('admin.sellerProfiles.columns.kyc')}
        </Flex>
      ),
      key: 'kyc', width: 140,
      render: (_, r) => {
        const kycStatus = getKycStatus(r);
        if (!kycStatus) {
          return (
            <Tooltip title={t('admin.sellerProfiles.kyc.notFound')}>
              <Tag color="default">{t('admin.sellerProfiles.kyc.noData')}</Tag>
            </Tooltip>
          );
        }
        const colorMap: Record<string, string> = { approved: 'success', pending: 'warning', rejected: 'error' };
        const isBlocker = kycStatus !== 'approved';
        return (
          <Flex align="center" gap={4}>
            <Tag color={colorMap[kycStatus] ?? 'default'}>
              {t(`admin.sellerProfiles.kyc.${kycStatus}`, { defaultValue: kycStatus })}
            </Tag>
            {isBlocker && (
              <Tooltip title={t('admin.sellerProfiles.kyc.blocksVerify')}>
                <ExclamationCircleOutlined style={{ color: '#BA7517', fontSize: 13 }} />
              </Tooltip>
            )}
          </Flex>
        );
      },
    },
    {
      title: t('admin.sellerProfiles.columns.sales'), key: 'sales', width: 150,
      render: (_, r) => (
        <Flex vertical>
          <Text strong>{t('admin.sellerProfiles.orders', { count: r.totalSalesCount ?? 0 })}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.totalSalesAmount?.toLocaleString()} ₫</Text>
        </Flex>
      ),
    },
    {
      title: t('admin.sellerProfiles.columns.verifiedAt'), dataIndex: 'verifiedAt', key: 'verifiedAt', width: 130,
      render: (d: string | null) => d
        ? <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.sellerProfiles.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>,
    },
    {
      title: t('admin.sellerProfiles.columns.actions'), key: 'actions', width: 120, fixed: 'right',
      render: (_, record) => {
        const kycStatus   = getKycStatus(record);
        const kycApproved = kycStatus === 'approved';
        const kycBlocked  = !kycApproved && record.status === 'pending';

        return (
          <Space size={4}>
            <Tooltip title={
              record.status === 'verified'
                ? t('admin.sellerProfiles.alreadyVerified')
                : kycBlocked
                  ? t('admin.sellerProfiles.kyc.mustApproveFirst', { status: kycStatus ?? t('admin.sellerProfiles.kyc.noData') })
                  : t('admin.sellerProfiles.verify')
            }>
              <Button size="small" type="primary" icon={<CheckOutlined />}
                loading={verifyMutation.isPending}
                disabled={record.status === 'verified' || kycBlocked}
                onClick={() => modal.confirm({
                  title: t('admin.sellerProfiles.verifyConfirm', { name: record.storeName }),
                  okText: t('admin.sellerProfiles.verify'), cancelText: t('common.cancel'),
                  onOk: () => verifyMutation.mutateAsync(record.id),
                })}
              />
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
                })}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.sellerProfiles.title')}</Title>
          <Flex gap={12} style={{ marginTop: 4 }}>
            <Text type="secondary">
              {t('admin.sellerProfiles.subtitle', { count: pendingCount })}
            </Text>
            {kycBlockedCount > 0 && (
              <Flex align="center" gap={4}>
                <ExclamationCircleOutlined style={{ color: '#BA7517', fontSize: 12 }} />
                <Text style={{ fontSize: 12, color: '#BA7517' }}>
                  {t('admin.sellerProfiles.kycBlockedWarning', { count: kycBlockedCount })}
                </Text>
              </Flex>
            )}
          </Flex>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>
      <Table
        rowKey="id" columns={columns} dataSource={profiles}
        loading={isFetching} scroll={{ x: 900 }} size="middle"
        rowClassName={(r) => {
          const ks = getKycStatus(r);
          return r.status === 'pending' && ks !== 'approved' && ks !== null ? 'ant-table-row-warning' : '';
        }}
      />
    </div>
  );
}