import { useState } from 'react'
import { Typography, Table, Input, Select, Space, Button, Tag, Popconfirm, App } from 'antd'
import { UserOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useAdminDeleteUser, useUnlockUser, useChangeUserStatus } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { UserStatus } from '@/types/enums'
import type { UserListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_OPTIONS = [
  { value: '', label: '' },
  { value: UserStatus.Active, label: 'Active' },
  { value: UserStatus.Inactive, label: 'Inactive' },
  { value: UserStatus.Locked, label: 'Locked' },
  { value: UserStatus.Banned, label: 'Banned' },
  { value: UserStatus.Suspended, label: 'Suspended' },
] as const

export default function AdminUsersPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data, isLoading } = useAdminUsers({
    pageNumber: page,
    pageSize,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  })

  const deleteUser = useAdminDeleteUser()
  const unlockUser = useUnlockUser()
  const changeStatus = useChangeUserStatus()

  const handleDelete = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id)
      message.success(t('users.deleteSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleUnlock = async (id: string) => {
    try {
      await unlockUser.mutateAsync(id)
      message.success(t('users.unlockSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleLock = async (id: string) => {
    try {
      await changeStatus.mutateAsync({ id, status: UserStatus.Locked })
      message.success(t('users.statusChangeSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<UserListItemDto> = [
    {
      title: t('users.userName'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: t('users.email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('users.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('users.roles'),
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles: string[]) => (
        <Space wrap size={4}>
          {roles.map((role) => (
            <Tag key={role} color="blue">{role}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('users.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('users.actions'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => navigate(`/admin/users/${record.id}`)}>
            {t('users.view')}
          </Button>
          {record.status === UserStatus.Locked ? (
            <Button type="link" size="small" onClick={() => handleUnlock(record.id)}>
              {t('users.unlock')}
            </Button>
          ) : (
            <Button type="link" size="small" danger onClick={() => handleLock(record.id)}>
              {t('users.lock')}
            </Button>
          )}
          <Popconfirm title={t('users.deleteConfirm')} onConfirm={() => handleDelete(record.id)} okText={tc('action.confirm')} cancelText={tc('action.cancel')}>
            <Button type="link" size="small" danger>
              {t('users.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          <UserOutlined /> {t('users.title')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/users/create')}>
          {t('users.createUser')}
        </Button>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder={t('users.searchPlaceholder')}
          allowClear
          onSearch={(val) => { setSearch(val); setPage(1) }}
          style={{ width: 280 }}
        />
        <Select
          placeholder={t('users.filterStatus')}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: 180 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('users.allStatuses'),
          }))}
        />
        <Input
          placeholder={t('users.filterRole')}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ width: 160 }}
          allowClear
        />
      </Space>

      <Table<UserListItemDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />
    </div>
  )
}
