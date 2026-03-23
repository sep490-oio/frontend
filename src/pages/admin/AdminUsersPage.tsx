import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table, Input, Select, Button, Tag, Avatar, Dropdown, App,
  Typography, Flex, Badge, Drawer, Space, Spin,
  Divider, Timeline, Empty,
} from 'antd';
import type { TableProps, MenuProps } from 'antd';
import {
  SearchOutlined, MoreOutlined, UserOutlined, LockOutlined,
  UnlockOutlined, DeleteOutlined, EyeOutlined, FilterOutlined,
  AlertOutlined, FlagOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import {
  useAdminUsers, useChangeUserStatus, useUnlockUser, useRemoveUser, useFlagUser,
} from '@/hooks/useAdmin';
import { getReports, getMonitoringAlerts } from '@/services/adminService';
import type { UserListItemDto, GetUsersParams, ReportDto, MonitoringAlertDto } from '@/services/adminService';

const { Text } = Typography;


const USER_STATUS_MAP = {
  active: {
    apiValue: 'active',
    label: 'Hoạt động',
    badge: 'success' as const,
  },
  inactive: {
    apiValue: 'inactive',
    label: 'Không hoạt động',
    badge: 'default' as const,
  },
  locked: {
    apiValue: 'locked',
    label: 'Bị khóa',
    badge: 'warning' as const,
  },
  banned: {
    apiValue: 'banned',
    label: 'Bị cấm',
    badge: 'error' as const,
  },
  suspended: {
    apiValue: 'suspended',
    label: 'Tạm khóa',
    badge: 'warning' as const,
  },
} as const;

type StatusKey = keyof typeof USER_STATUS_MAP;

// Helper function an toàn
const getStatusConfig = (status?: string) => {
  if (!status) return null;
  const lower = status.toLowerCase() as StatusKey;
  return USER_STATUS_MAP[lower] || null;
};

// ─── Investigation Drawer ─────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#E24B4A', high: '#BA7517', medium: '#378ADD', low: '#888780',
};

interface InvestigationDrawerProps {
  user: UserListItemDto | null;
  onClose: () => void;
  onStatusChange: (userId: string, status: string) => void;
  onFlag: (userId: string) => void;
}

function InvestigationDrawer({ user, onClose, onStatusChange, onFlag }: InvestigationDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const flagUser = useFlagUser();

  const { data: reports = [], isLoading: reportsLoading } = useQuery<ReportDto[]>({
    queryKey: ['admin', 'investigation', 'reports', user?.id],
    queryFn: async () => {
      const res = await getReports({ entityType: 'user', PageSize: 10 });
      const items = Array.isArray(res) ? res : res?.items ?? [];
      return items.filter((r: ReportDto) => r.entityId === user?.id || r.reporterId === user?.id);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<MonitoringAlertDto[]>({
    queryKey: ['admin', 'investigation', 'alerts', user?.id],
    queryFn: () => getMonitoringAlerts({ entityType: 'user', entityId: user?.id }),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const isLoading = reportsLoading || alertsLoading;

  const handleFlag = (flagType: string) => {
    if (!user) return;
    flagUser.mutate(
      { userId: user.id, data: { flagType, reason: 'Flagged via user investigation panel', severity: 'medium' } },
      {
        onSuccess: () => message.success(t('admin.users.flagged')),
        onError: () => message.error(t('common.error.generic')),
      }
    );
    onFlag(user.id);
  };

  if (!user) return null;

  const openReports   = reports.filter((r) => r.status !== 'resolved');
  const openAlerts    = (alerts as MonitoringAlertDto[]).filter((a) => a.status === 'open');
  const riskScore     = openReports.length * 2 + openAlerts.filter((a) => a.severity === 'critical').length * 5 + openAlerts.filter((a) => a.severity === 'high').length * 3;
  const riskLevel     = riskScore === 0 ? 'safe' : riskScore < 5 ? 'low' : riskScore < 10 ? 'medium' : 'high';
  const riskColor     = { safe: '#1D9E75', low: '#378ADD', medium: '#BA7517', high: '#E24B4A' }[riskLevel];

  return (
    <Drawer
      title={
        <Flex align="center" gap={10}>
          <Avatar icon={<UserOutlined />} size={32} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)', fontWeight: 400 }}>{user.email}</div>
          </div>
        </Flex>
      }
      open={!!user}
      onClose={onClose}
      width={480}
      extra={
        <Button type="primary" size="small" onClick={() => navigate(`/admin/users/${user.id}`)}>
          {t('common.viewDetail')}
        </Button>
      }
    >
      {isLoading ? (
        <Flex justify="center" align="center" style={{ height: 200 }}><Spin /></Flex>
      ) : (
        <Flex vertical gap={20}>
          {/* Risk score */}
          <div style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${riskColor}30`, background: `${riskColor}10` }}>
            <Flex justify="space-between" align="center">
              <div>
                <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('admin.users.investigation.riskScore')}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: riskColor }}>{riskScore}</div>
              </div>
              <Tag color={riskLevel === 'safe' ? 'success' : riskLevel === 'low' ? 'blue' : riskLevel === 'medium' ? 'warning' : 'error'} style={{ fontSize: 12 }}>
                {t(`admin.users.investigation.risk.${riskLevel}`)}
              </Tag>
            </Flex>
            <Flex gap={16} style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
                {t('admin.users.investigation.openReports')}: <strong style={{ color: openReports.length > 0 ? '#BA7517' : 'inherit' }}>{openReports.length}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
                {t('admin.users.investigation.openAlerts')}: <strong style={{ color: openAlerts.length > 0 ? '#E24B4A' : 'inherit' }}>{openAlerts.length}</strong>
              </div>
            </Flex>
          </div>

          {/* Quick actions */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--ant-color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('admin.users.investigation.quickActions')}
            </div>
            <Space wrap size={6}>
              {user.status?.toLowerCase() !== 'banned' && (
                <Button size="small" danger icon={<LockOutlined />}
                  onClick={() => { onStatusChange(user.id, 'banned'); onClose(); }}>
                  {t('admin.users.actions.ban')}
                </Button>
              )}
              {user.status?.toLowerCase() !== 'suspended' && (
                <Button size="small" icon={<LockOutlined />}
                  onClick={() => { onStatusChange(user.id, 'suspended'); onClose(); }}>
                  {t('admin.users.actions.suspend')}
                </Button>
              )}
              {user.status?.toLowerCase() !== 'active' && (
                <Button size="small" icon={<UnlockOutlined />}
                  onClick={() => { onStatusChange(user.id, 'active'); onClose(); }}>
                  {t('admin.users.actions.activate')}
                </Button>
              )}
              <Button size="small" icon={<FlagOutlined />} loading={flagUser.isPending}
                onClick={() => handleFlag('suspicious_behavior')}>
                {t('admin.users.investigation.flagSuspicious')}
              </Button>
              <Button size="small" icon={<FlagOutlined />} loading={flagUser.isPending}
                onClick={() => handleFlag('fraud_risk')}>
                {t('admin.users.investigation.flagFraud')}
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          {/* Reports */}
          <div>
            <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
              <ExclamationCircleOutlined style={{ color: '#BA7517' }} />
              <span style={{ fontWeight: 500, fontSize: 13 }}>{t('admin.users.investigation.reportsAbout')} ({reports.length})</span>
            </Flex>
            {reports.length === 0 ? (
              <Empty description={t('admin.users.investigation.noReports')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Flex vertical gap={6}>
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--ant-color-bg-layout)', border: '1px solid var(--ant-color-border-secondary)' }}>
                    <Flex justify="space-between" align="center">
                      <Tag style={{ margin: 0 }}>{r.reasonCode}</Tag>
                      <Badge
                        status={r.status === 'resolved' ? 'success' : r.status === 'escalated' ? 'error' : 'warning'}
                        text={<span style={{ fontSize: 11 }}>{r.status}</span>}
                      />
                    </Flex>
                    {r.description && <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginTop: 4 }}>{r.description.slice(0, 80)}{r.description.length > 80 ? '…' : ''}</div>}
                    <div style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)', marginTop: 4 }}>{dayjs(r.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                  </div>
                ))}
                {reports.length > 5 && (
                  <Button type="link" size="small" onClick={() => navigate(`/admin/reports?entityId=${user.id}`)}>
                    {t('admin.users.investigation.viewAllReports', { count: reports.length })}
                  </Button>
                )}
              </Flex>
            )}
          </div>

          {/* Monitoring Alerts */}
          <div>
            <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
              <AlertOutlined style={{ color: '#E24B4A' }} />
              <span style={{ fontWeight: 500, fontSize: 13 }}>{t('admin.users.investigation.monitoringAlerts')} ({(alerts as MonitoringAlertDto[]).length})</span>
            </Flex>
            {(alerts as MonitoringAlertDto[]).length === 0 ? (
              <Empty description={t('admin.users.investigation.noAlerts')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={(alerts as MonitoringAlertDto[]).slice(0, 5).map((a) => ({
                  color: SEVERITY_COLOR[a.severity ?? ''] ?? '#888780',
                  children: (
                    <div>
                      <Flex gap={6} align="center" style={{ marginBottom: 2 }}>
                        <Tag color={a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'default'} style={{ margin: 0, fontSize: 10 }}>
                          {a.severity?.toUpperCase()}
                        </Tag>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{a.alertType}</span>
                      </Flex>
                      {a.notes && <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>{a.notes}</div>}
                      <div style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)' }}>{dayjs(a.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                    </div>
                  ),
                }))}
              />
            )}
          </div>
        </Flex>
      )}
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const [params, setParams] = useState<GetUsersParams>({
    pageNumber: 1,
    pageSize: PAGE_SIZE,
  });

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [filteredData, setFilteredData] = useState<UserListItemDto[]>([]);
  const [investigatingUser, setInvestigatingUser] = useState<UserListItemDto | null>(null);

  const { data, isFetching } = useAdminUsers(params);
  const changeStatus = useChangeUserStatus();
  const unlock = useUnlockUser();
  const remove = useRemoveUser();

  // Frontend filtering
  useEffect(() => {
    let result = data?.items ?? [];

    if (searchInput) {
      const keyword = searchInput.toLowerCase();
      result = result.filter((user) =>
        (user.email ?? '').toLowerCase().includes(keyword) ||
        (user.userName ?? '').toLowerCase().includes(keyword) ||
        `${user.firstName ?? ''} ${user.lastName ?? ''}`
          .toLowerCase()
          .includes(keyword)
      );
    }

    if (statusFilter) {
      result = result.filter((user) => user.status?.toLowerCase() === statusFilter);
    }

    if (roleFilter) {
      result = result.filter((user) => user.roles?.includes(roleFilter));
    }

    setFilteredData(result);
  }, [data, searchInput, statusFilter, roleFilter]);
const handleStatusChange = (userId: string, apiStatus: string) => {
    changeStatus.mutate(
      { userId, data: { status: apiStatus } },
      {
        onSuccess: () => message.success(t('admin.users.statusChanged')),
        onError: () => message.error(t('common.error.generic')),
      }
    );
  };

  const handleDeleteConfirm = (record: UserListItemDto) => {
    modal.confirm({
      title: t('admin.users.deleteConfirm.title'),
      content: t('admin.users.deleteConfirm.content', { email: record.email }),
      okText: t('common.delete'),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel'),
      onOk: () =>
        remove.mutateAsync(record.id, {
          onSuccess: () => message.success(t('admin.users.deleted')),
          onError: () => message.error(t('common.error.generic')),
        }),
    });
  };

  const getRowActions = (record: UserListItemDto): MenuProps['items'] => {
    const currentStatus = record.status?.toLowerCase() as StatusKey | undefined;

    return [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: t('common.viewDetail'),
        onClick: () => navigate(`/admin/users/${record.id}`),
      },
      {
        key: 'investigate',
        icon: <AlertOutlined />,
        label: t('admin.users.investigation.investigate'),
        onClick: () => setInvestigatingUser(record),
      },
      { type: 'divider' },

      currentStatus !== 'active' && {
        key: 'activate',
        icon: <UnlockOutlined />,
        label: USER_STATUS_MAP.active.label,
        onClick: () => handleStatusChange(record.id, USER_STATUS_MAP.active.apiValue),
      },

      currentStatus !== 'banned' && {
        key: 'ban',
        icon: <LockOutlined />,
        label: USER_STATUS_MAP.banned.label,
        onClick: () => handleStatusChange(record.id, USER_STATUS_MAP.banned.apiValue),
      },

      currentStatus !== 'suspended' && {
        key: 'suspend',
        icon: <LockOutlined />,
        label: USER_STATUS_MAP.suspended.label,
        onClick: () => handleStatusChange(record.id, USER_STATUS_MAP.suspended.apiValue),
      },

      currentStatus === 'locked' && {
        key: 'unlock',
        icon: <UnlockOutlined />,
        label: t('admin.users.actions.unlock'),
        onClick: () =>
          unlock.mutate(record.id, {
            onSuccess: () => message.success(t('admin.users.unlocked')),
            onError: () => message.error(t('common.error.generic')),
          }),
      },

      { type: 'divider' },

      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: t('common.delete'),
        danger: true,
        onClick: () => handleDeleteConfirm(record),
      },
    ].filter(Boolean) as MenuProps['items'];
  };

  const columns: TableProps<UserListItemDto>['columns'] = [
    {
      title: t('admin.users.columns.user'),
      key: 'user',
      render: (_, record) => (
        <Flex align="center" gap={10}>
          <Avatar icon={<UserOutlined />} size={36} />
          <div>
            <Text strong>
              {[record.firstName, record.lastName].filter(Boolean).join(' ') ||
                record.userName ||
'—'}
            </Text>
            <br />
            <Text type="secondary">{record.email}</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: t('admin.users.columns.roles'),
      dataIndex: 'roles',
      render: (roles: string[]) => roles?.map((r) => <Tag key={r}>{r}</Tag>),
    },
    {
      title: t('admin.users.columns.status'),
      dataIndex: 'status',
      render: (status: string) => {
        const config = getStatusConfig(status);
        return config ? (
          <Badge status={config.badge} text={config.label} />
        ) : (
          <Badge status="default" text={status || 'Không xác định'} />
        );
      },
    },
    {
      title: t('admin.users.columns.emailConfirmed'),
      dataIndex: 'emailConfirmed',
      render: (confirmed: boolean) =>
        confirmed ? (
          <Tag color="success">{t('common.confirmed')}</Tag>
        ) : (
          <Tag>{t('common.unconfirmed')}</Tag>
        ),
    },
    {
      title: t('admin.users.columns.createdAt'),
      dataIndex: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      key: 'actions',
      render: (_, record) => (
        <Dropdown menu={{ items: getRowActions(record) }}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex gap={8} style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder={t('admin.users.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />

        <Select
          placeholder={t('admin.users.filterStatus')}
          allowClear
          style={{ width: 160 }}
          suffixIcon={<FilterOutlined />}
          onChange={(val) => setStatusFilter(val as string | undefined)}
        >
          {Object.entries(USER_STATUS_MAP).map(([key, config]) => (
            <Select.Option key={key} value={key}>
              <Badge status={config.badge} text={config.label} />
            </Select.Option>
          ))}
        </Select>

        <Select
          placeholder={t('admin.users.filterRole')}
          allowClear
          style={{ width: 160 }}
          onChange={(val) => setRoleFilter(val as string | undefined)}
        >
          <Select.Option value="Admin">Admin</Select.Option>
          <Select.Option value="Moderator">Moderator</Select.Option>
          <Select.Option value="User">User</Select.Option>
        </Select>

        <Select
          style={{ width: 180 }}
          defaultValue="createdAt"
          onChange={(val) => setParams((p) => ({ ...p, sortBy: val as string }))}
        >
          <Select.Option value="createdAt">{t('admin.users.sortBy.createdAt')}</Select.Option>
          <Select.Option value="email">{t('admin.users.sortBy.email')}</Select.Option>
<Select.Option value="status">{t('admin.users.sortBy.status')}</Select.Option>
        </Select>
      </Flex>

      <Table<UserListItemDto>
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={isFetching}
        scroll={{ x: 900 }}
        pagination={false}
      />

      <InvestigationDrawer
        user={investigatingUser}
        onClose={() => setInvestigatingUser(null)}
        onStatusChange={(userId, status) => handleStatusChange(userId, status)}
        onFlag={() => {}}
      />
    </div>
  );
}