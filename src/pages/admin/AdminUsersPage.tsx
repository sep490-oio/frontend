import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  Avatar,
  Dropdown,
  App,
  Typography,
  Flex,
  Tooltip,
  Badge,
} from 'antd';
import type { TableProps, MenuProps } from 'antd';
import {
  SearchOutlined,
  MoreOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useAdminUsers,
  useChangeUserStatus,
  useUnlockUser,
  useRemoveUser,
} from '@/hooks/useAdmin';
import type { UserListItemDto, GetUsersParams } from '@/services/adminService';

const { Text } = Typography;
const { Option } = Select;

const USER_STATUS_CONFIG: Record<
  string,
  { label: string; badgeStatus: 'success' | 'error' | 'warning' | 'default' }
> = {
  Active: { label: 'Hoạt động', badgeStatus: 'success' },
  Banned: { label: 'Bị cấm', badgeStatus: 'error' },
  Suspended: { label: 'Tạm khóa', badgeStatus: 'warning' },
  Inactive: { label: 'Không hoạt động', badgeStatus: 'default' },
};

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

  // ✅ DATA LOCAL
  const [filteredData, setFilteredData] = useState<UserListItemDto[]>([]);

  // ─── API (GIỮ NGUYÊN) ──────────────────────────────
  const { data, isFetching, refetch } = useAdminUsers(params);
  const changeStatus = useChangeUserStatus();
  const unlock = useUnlockUser();
  const remove = useRemoveUser();

  // ✅ FILTER FRONTEND
  useEffect(() => {
    let result = data?.items ?? [];

    // search
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

    // status
    if (statusFilter) {
      result = result.filter((user) => user.status === statusFilter);
    }

    // role
    if (roleFilter) {
      result = result.filter((user) =>
        user.roles?.includes(roleFilter)
      );
    }

    setFilteredData(result);
  }, [data, searchInput, statusFilter, roleFilter]);

  // ❌ KHÔNG gọi API nữa
  const handleSearch = useCallback(() => {}, []);

  // ─── ACTIONS (GIỮ NGUYÊN) ──────────────────────────
  const handleStatusChange = (userId: string, status: string) => {
    changeStatus.mutate(
      { userId, data: { status } },
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

  const getRowActions = (record: UserListItemDto): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('common.viewDetail'),
      onClick: () => navigate(`/admin/users/${record.id}`),
    },
    { type: 'divider' },
    ...(record.status !== 'Active'
      ? [{
          key: 'activate',
          icon: <UnlockOutlined />,
          label: t('admin.users.actions.activate'),
          onClick: () => handleStatusChange(record.id, 'Active'),
        }]
      : []),
    ...(record.status !== 'Banned'
      ? [{
          key: 'ban',
          icon: <LockOutlined />,
          label: t('admin.users.actions.ban'),
          onClick: () => handleStatusChange(record.id, 'Banned'),
        }]
      : []),
    ...(record.status !== 'Suspended'
      ? [{
          key: 'suspend',
          icon: <LockOutlined />,
          label: t('admin.users.actions.suspend'),
          onClick: () => handleStatusChange(record.id, 'Suspended'),
        }]
      : []),
    {
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
  ];

  // ─── COLUMNS (GIỮ NGUYÊN, KHÔNG MẤT emailConfirmed) ──────────────
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
      render: (roles: string[]) =>
        roles?.map((r) => <Tag key={r}>{r}</Tag>),
    },
    {
      title: t('admin.users.columns.status'),
      dataIndex: 'status',
      render: (status: string) => {
        const cfg = USER_STATUS_CONFIG[status];
        return <Badge status={cfg?.badgeStatus} text={cfg?.label} />;
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
        {/* ✅ SEARCH FRONTEND */}
        <Input.Search
          placeholder={t('admin.users.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={handleSearch}
          allowClear
          style={{ width: 280 }}
        />

        {/* ✅ STATUS FRONTEND */}
        <Select
          placeholder={t('admin.users.filterStatus')}
          allowClear
          style={{ width: 160 }}
          suffixIcon={<FilterOutlined />}
          onChange={(val) => setStatusFilter(val)}
        >
          {Object.entries(USER_STATUS_CONFIG).map(([val, cfg]) => (
            <Option key={val} value={val}>
              <Badge status={cfg.badgeStatus} text={cfg.label} />
            </Option>
          ))}
        </Select>

        {/* ✅ ROLE FRONTEND */}
        <Select
          placeholder={t('admin.users.filterRole')}
          allowClear
          style={{ width: 160 }}
          onChange={(val) => setRoleFilter(val)}
        >
          <Option value="Admin">Admin</Option>
          <Option value="Moderator">Moderator</Option>
          <Option value="User">User</Option>
        </Select>

        {/* giữ sort */}
        <Select
          style={{ width: 180 }}
          defaultValue="createdAt"
          onChange={(val) => setParams((p) => ({ ...p, sortBy: val }))}
        >
          <Option value="createdAt">{t('admin.users.sortBy.createdAt')}</Option>
          <Option value="email">{t('admin.users.sortBy.email')}</Option>
          <Option value="status">{t('admin.users.sortBy.status')}</Option>
        </Select>
      </Flex>

      <Table<UserListItemDto>
        rowKey="id"
        columns={columns}
        // ✅ DÙNG DATA FILTER
        dataSource={filteredData}
        loading={isFetching}
        scroll={{ x: 900 }}
        pagination={false} // giữ UI nhưng không dùng server paging
      />
    </div>
  );
}