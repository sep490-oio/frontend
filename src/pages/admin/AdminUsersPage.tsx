import { useState, useEffect } from 'react';
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
    </div>
  );
}