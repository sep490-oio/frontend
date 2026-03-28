import { useState } from 'react'
import { Typography, Input, Select, Space, Button, Tag, Popconfirm, App, Modal, Form } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { UserOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useAdminDeleteUser, useUnlockUser, useChangeUserStatus, useAdminCreateUser, useFlagUser } from '@/features/admin/api'
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

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()

  const deleteUser = useAdminDeleteUser()
  const unlockUser = useUnlockUser()
  const changeStatus = useChangeUserStatus()
  const createUser = useAdminCreateUser()
  const flagUser = useFlagUser()

  // Flag user modal state
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [flagUserId, setFlagUserId] = useState('')
  const [flagForm] = Form.useForm()

  const handleFlagUser = async () => {
    try {
      const values = await flagForm.validateFields()
      await flagUser.mutateAsync({ userId: flagUserId, ...values })
      message.success(t('admin:users.flagSuccess', 'User flagged successfully'))
      setFlagModalOpen(false)
      flagForm.resetFields()
    } catch {
      // validation or API error
    }
  }

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

  const handleCreateUser = async () => {
    try {
      const values = await createForm.validateFields()
      await createUser.mutateAsync(values)
      message.success(t('admin:users.createSuccess', 'User created successfully'))
      setCreateModalOpen(false)
      createForm.resetFields()
    } catch {
      // validation or API error – antd shows field errors automatically
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
          <Button type="link" size="small" danger onClick={() => { setFlagUserId(record.id); flagForm.resetFields(); setFlagModalOpen(true) }}>
            {t('admin:users.flag', 'Flag')}
          </Button>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
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

      <ResponsiveTable<UserListItemDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />

      <Modal
        title={t('admin:users.createUserTitle', 'Create New User')}
        open={createModalOpen}
        onOk={handleCreateUser}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields() }}
        confirmLoading={createUser.isPending}
        okText={t('admin:users.createButton', 'Create')}
        cancelText={t('admin:users.cancelButton', 'Cancel')}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" initialValues={{ currency: 'VND' }}>
          <Form.Item
            label={t('admin:users.usernameLabel', 'Username')}
            name="userName"
            rules={[{ required: true, message: t('admin:users.usernameRequired', 'Please enter username') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('admin:users.emailLabel', 'Email')}
            name="email"
            rules={[
              { required: true, message: t('admin:users.emailRequired', 'Please enter email') },
              { type: 'email', message: t('admin:users.emailInvalid', 'Invalid email') },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('admin:users.passwordLabel', 'Password')}
            name="password"
            rules={[{ required: true, message: t('admin:users.passwordRequired', 'Please enter password') }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('admin:users.currencyLabel', 'Currency')}
            name="currency"
            rules={[{ required: true, message: t('admin:users.currencyRequired', 'Please enter currency') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('admin:users.firstNameLabel', 'First Name')}
            name="firstName"
            rules={[{ required: true, message: t('admin:users.firstNameRequired', 'Please enter first name') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('admin:users.lastNameLabel', 'Last Name')}
            name="lastName"
            rules={[{ required: true, message: t('admin:users.lastNameRequired', 'Please enter last name') }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Flag User Modal */}
      <Modal
        title={t('admin:users.flagUserTitle', 'Flag User')}
        open={flagModalOpen}
        onOk={handleFlagUser}
        onCancel={() => { setFlagModalOpen(false); flagForm.resetFields() }}
        confirmLoading={flagUser.isPending}
        okText={t('admin:users.flagButton', 'Flag')}
        cancelText={t('admin:users.cancelButton', 'Cancel')}
        destroyOnClose
      >
        <Form form={flagForm} layout="vertical">
          <Form.Item
            label={t('admin:users.flagTypeLabel', 'Flag Type')}
            name="flagType"
            rules={[{ required: true, message: t('admin:users.flagTypeRequired', 'Please select a flag type') }]}
          >
            <Select placeholder={t('admin:users.selectFlagType', 'Select flag type')} options={[
              { value: 'fraud', label: t('admin:users.flagFraud', 'Fraud') },
              { value: 'suspicious', label: t('admin:users.flagSuspicious', 'Suspicious') },
              { value: 'collusion', label: t('admin:users.flagCollusion', 'Collusion') },
            ]} />
          </Form.Item>
          <Form.Item
            label={t('admin:users.severityLabel', 'Severity')}
            name="severity"
            rules={[{ required: true, message: t('admin:users.severityRequired', 'Please select severity') }]}
          >
            <Select placeholder={t('admin:users.selectSeverity', 'Select severity')} options={[
              { value: 'low', label: t('admin:users.severityLow', 'Low') },
              { value: 'medium', label: t('admin:users.severityMedium', 'Medium') },
              { value: 'high', label: t('admin:users.severityHigh', 'High') },
              { value: 'critical', label: t('admin:users.severityCritical', 'Critical') },
            ]} />
          </Form.Item>
          <Form.Item
            label={t('admin:users.reasonLabel', 'Reason')}
            name="reason"
            rules={[{ required: true, message: t('admin:users.reasonRequired', 'Please enter a reason') }]}
          >
            <Input.TextArea rows={3} placeholder={t('admin:users.reasonPlaceholder', 'Enter reason for flagging...')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
