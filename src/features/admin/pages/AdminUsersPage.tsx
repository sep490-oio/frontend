import { useState } from 'react'
import { Typography, Input, Select, Space, Button, Tag, Popconfirm, App, Modal, Form, Grid } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { UserOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  useAdminUsers, useAdminDeleteUser, useUnlockUser, useChangeUserStatus,
  useAdminCreateUser, useFlagUser, useRoles,
} from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { UserStatus } from '@/types/enums'
import type { UserListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { useBreakpoint } = Grid

export default function AdminUsersPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const STATUS_OPTIONS = [
    { value: '', label: '' },
    { value: UserStatus.Active, label: tc('statusLabel.active') },
    { value: UserStatus.Inactive, label: tc('statusLabel.inactive') },
    { value: UserStatus.Locked, label: tc('statusLabel.locked') },
    { value: UserStatus.Banned, label: tc('statusLabel.banned') },
    { value: UserStatus.Suspended, label: tc('statusLabel.suspended') },
  ]
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
  const { data: availableRoles, isLoading: rolesLoading } = useRoles()

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
      responsive: ['md'],
    },
    {
      title: t('users.status'),
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('users.roles'),
      dataIndex: 'roles',
      key: 'roles',
      width: 240,
      responsive: ['lg'],
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
      width: 170,
      responsive: ['xl'],
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('users.actions'),
      key: 'actions',
      width: isMobile ? 100 : 280,
      render: (_, record) => (
        <Space size={isMobile ? 2 : 8} direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : undefined }}>
          <Button
            type="link"
            size="small"
            style={{ minHeight: 36, padding: isMobile ? '2px 0' : undefined }}
            onClick={() => navigate(`/admin/users/${record.id}`)}
          >
            {t('users.view')}
          </Button>
          {record.status === UserStatus.Locked ? (
            <Button
              type="link"
              size="small"
              style={{ minHeight: 36, padding: isMobile ? '2px 0' : undefined }}
              onClick={() => handleUnlock(record.id)}
            >
              {t('users.unlock')}
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              danger
              style={{ minHeight: 36, padding: isMobile ? '2px 0' : undefined }}
              onClick={() => handleLock(record.id)}
            >
              {t('users.lock')}
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            style={{ minHeight: 36, padding: isMobile ? '2px 0' : undefined }}
            onClick={() => { setFlagUserId(record.id); flagForm.resetFields(); setFlagModalOpen(true) }}
          >
            {t('admin:users.flag', 'Flag')}
          </Button>
          <Popconfirm
            title={t('users.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={tc('action.confirm')}
            cancelText={tc('action.cancel')}
          >
            <Button
              type="link"
              size="small"
              danger
              style={{ minHeight: 36, padding: isMobile ? '2px 0' : undefined }}
            >
              {t('users.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
        marginBottom: 16,
      }}>
        <Typography.Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          <UserOutlined /> {t('users.title')}
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          style={{ minHeight: 44, width: isMobile ? '100%' : undefined }}
        >
          {t('users.createUser')}
        </Button>
      </div>

      {/* Filters */}
      <Space
        wrap
        style={{ marginBottom: 16, width: '100%' }}
        direction={isMobile ? 'vertical' : 'horizontal'}
        size={isMobile ? 8 : 'small'}
      >
        <Input.Search
          placeholder={t('users.searchPlaceholder')}
          allowClear
          onSearch={(val) => { setSearch(val); setPage(1) }}
          style={{ width: isMobile ? '100%' : 280 }}
        />
        <Select
          placeholder={t('users.filterStatus')}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: isMobile ? '100%' : 180 }}
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
          style={{ width: isMobile ? '100%' : 160 }}
          allowClear
        />
      </Space>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
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
            showSizeChanger: !isMobile,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
            simple: isMobile,
          }}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        title={t('admin:users.createUserTitle', 'Create New User')}
        open={createModalOpen}
        onOk={handleCreateUser}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields() }}
        confirmLoading={createUser.isPending}
        okText={t('admin:users.createButton', 'Create')}
        cancelText={t('admin:users.cancelButton', 'Cancel')}
        okButtonProps={{ style: { minHeight: 44 } }}
        cancelButtonProps={{ style: { minHeight: 44 } }}
        destroyOnClose
        style={isMobile ? { top: 16 } : undefined}
        width={isMobile ? '100%' : 520}
      >
        <Form form={createForm} layout="vertical" initialValues={{ currency: 'VND' }}>
          <Form.Item
            label={t('admin:users.usernameLabel', 'Username')}
            name="userName"
            rules={[{ required: true, message: t('admin:users.usernameRequired', 'Please enter username') }]}
          >
            <Input style={{ fontSize: isMobile ? 16 : undefined }} />
          </Form.Item>
          <Form.Item
            label={t('admin:users.emailLabel', 'Email')}
            name="email"
            rules={[
              { required: true, message: t('admin:users.emailRequired', 'Please enter email') },
              { type: 'email', message: t('admin:users.emailInvalid', 'Invalid email') },
            ]}
          >
            <Input inputMode="email" style={{ fontSize: isMobile ? 16 : undefined }} />
          </Form.Item>
          <Form.Item
            label={t('admin:users.passwordLabel', 'Password')}
            name="password"
            rules={[{ required: true, message: t('admin:users.passwordRequired', 'Please enter password') }]}
          >
            <Input.Password style={{ fontSize: isMobile ? 16 : undefined }} />
          </Form.Item>
          <Form.Item name="currency" hidden initialValue="VND">
            <Input />
          </Form.Item>
          <Form.Item
            label={t('admin:users.firstNameLabel', 'First Name')}
            name="firstName"
            rules={[{ required: true, message: t('admin:users.firstNameRequired', 'Please enter first name') }]}
          >
            <Input style={{ fontSize: isMobile ? 16 : undefined }} />
          </Form.Item>
          <Form.Item
            label={t('admin:users.lastNameLabel', 'Last Name')}
            name="lastName"
            rules={[{ required: true, message: t('admin:users.lastNameRequired', 'Please enter last name') }]}
          >
            <Input style={{ fontSize: isMobile ? 16 : undefined }} />
          </Form.Item>
          <Form.Item
            label={t('admin:users.rolesLabel', 'Roles')}
            name="roles"
          >
            <Select
              mode="multiple"
              placeholder={t('admin:users.rolesPlaceholder', 'Select roles (optional)')}
              options={availableRoles?.map((r) => ({ label: r.name, value: r.name }))}
              loading={rolesLoading}
              allowClear
            />
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
        okButtonProps={{ danger: true, style: { minHeight: 44 } }}
        cancelButtonProps={{ style: { minHeight: 44 } }}
        destroyOnClose
        style={isMobile ? { top: 16 } : undefined}
        width={isMobile ? '100%' : 480}
      >
        <Form form={flagForm} layout="vertical">
          <Form.Item
            label={t('admin:users.flagTypeLabel', 'Flag Type')}
            name="flagType"
            rules={[{ required: true, message: t('admin:users.flagTypeRequired', 'Please select a flag type') }]}
          >
            <Select
              placeholder={t('admin:users.selectFlagType', 'Select flag type')}
              options={[
                { value: 'fraud', label: t('admin:users.flagFraud', 'Fraud') },
                { value: 'suspicious', label: t('admin:users.flagSuspicious', 'Suspicious') },
                { value: 'collusion', label: t('admin:users.flagCollusion', 'Collusion') },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('admin:users.severityLabel', 'Severity')}
            name="severity"
            rules={[{ required: true, message: t('admin:users.severityRequired', 'Please select severity') }]}
          >
            <Select
              placeholder={t('admin:users.selectSeverity', 'Select severity')}
              options={[
                { value: 'low', label: t('admin:users.severityLow', 'Low') },
                { value: 'medium', label: t('admin:users.severityMedium', 'Medium') },
                { value: 'high', label: t('admin:users.severityHigh', 'High') },
                { value: 'critical', label: t('admin:users.severityCritical', 'Critical') },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('admin:users.reasonLabel', 'Reason')}
            name="reason"
            rules={[{ required: true, message: t('admin:users.reasonRequired', 'Please enter a reason') }]}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('admin:users.reasonPlaceholder', 'Enter reason for flagging...')}
              style={{ fontSize: isMobile ? 16 : undefined }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}