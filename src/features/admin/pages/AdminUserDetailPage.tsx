import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Descriptions, Card, Tag, Button, Space, Spin, Alert, Select, Modal, Input, App, Row, Col } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  useAdminUserDetail,
  useAssignRole,
  useRevokeRole,
  useChangeUserStatus,
  useUnlockUser,
  useFlagUser,
  useRoles,
} from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { UserStatus, AlertSeverity } from '@/types/enums'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const { data: user, isLoading, error } = useAdminUserDetail(id!)
  const { data: roles } = useRoles()

  const assignRole = useAssignRole()
  const revokeRole = useRevokeRole()
  const changeStatus = useChangeUserStatus()
  const unlockUser = useUnlockUser()
  const flagUser = useFlagUser()

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [flagSeverity, setFlagSeverity] = useState<string>(AlertSeverity.Medium)
  const [flagReason, setFlagReason] = useState('')

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !user) return <Alert type="error" message={t('common.error')} showIcon />

  const handleAssignRole = async () => {
    if (!selectedRole) return
    try {
      await assignRole.mutateAsync({ userId: id!, role: selectedRole })
      message.success(t('userDetail.roleAssignSuccess'))
      setRoleModalOpen(false)
      setSelectedRole('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleRevokeRole = async (role: string) => {
    try {
      await revokeRole.mutateAsync({ userId: id!, role })
      message.success(t('userDetail.roleRevokeSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleChangeStatus = async (status: string) => {
    try {
      await changeStatus.mutateAsync({ id: id!, status })
      message.success(t('users.statusChangeSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleUnlock = async () => {
    try {
      await unlockUser.mutateAsync(id!)
      message.success(t('users.unlockSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleAddFlag = async () => {
    if (!flagReason) return
    try {
      await flagUser.mutateAsync({ userId: id!, severity: flagSeverity, reason: flagReason })
      message.success(t('userDetail.flagSuccess'))
      setFlagModalOpen(false)
      setFlagReason('')
    } catch {
      message.error(t('common.error'))
    }
  }

  // Extract roles from the user object (may be present via admin detail endpoint)
  const userRoles: string[] = (user as unknown as { roles?: string[] }).roles ?? []

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/users')}>
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('userDetail.title')}
      </Typography.Title>

      {/* User info */}
      <Card title={t('userDetail.info')} style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label={t('common.id')}>{user.id}</Descriptions.Item>
          <Descriptions.Item label={t('users.userName')}>{user.userName}</Descriptions.Item>
          <Descriptions.Item label={t('users.email')}>{user.email}</Descriptions.Item>
          <Descriptions.Item label={t('users.status')}>
            <StatusBadge status={user.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('userDetail.emailConfirmed')}>
            {user.emailConfirmed ? t('userDetail.yes') : t('userDetail.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('userDetail.phoneConfirmed')}>
            {user.phoneNumberConfirmed ? t('userDetail.yes') : t('userDetail.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('userDetail.twoFactor')}>
            {user.twoFactorEnabled ? t('userDetail.yes') : t('userDetail.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('users.createdAt')}>{formatDateTime(user.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Roles management */}
        <Col xs={24} lg={12}>
          <Card
            title={t('userDetail.rolesManagement')}
            extra={
              <Button icon={<PlusOutlined />} size="small" onClick={() => setRoleModalOpen(true)}>
                {t('userDetail.addRole')}
              </Button>
            }
          >
            {userRoles.length ? (
              <Space wrap>
                {userRoles.map((role) => (
                  <Tag
                    key={role}
                    color="blue"
                    closable
                    onClose={(e) => { e.preventDefault(); handleRevokeRole(role) }}
                  >
                    {role}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
            )}
          </Card>
        </Col>

        {/* Status management */}
        <Col xs={24} lg={12}>
          <Card title={t('userDetail.statusManagement')}>
            <Space wrap>
              <Select
                style={{ width: 180 }}
                value={user.status}
                onChange={handleChangeStatus}
                options={[
                  { value: UserStatus.Active, label: 'Active' },
                  { value: UserStatus.Inactive, label: 'Inactive' },
                  { value: UserStatus.Suspended, label: 'Suspended' },
                  { value: UserStatus.Banned, label: 'Banned' },
                  { value: UserStatus.Locked, label: 'Locked' },
                ]}
              />
              {user.status === UserStatus.Locked && (
                <Button onClick={handleUnlock}>{t('users.unlock')}</Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Risk flags */}
      <Card
        title={t('userDetail.riskFlags')}
        extra={
          <Button icon={<PlusOutlined />} size="small" danger onClick={() => setFlagModalOpen(true)}>
            {t('userDetail.addRiskFlag')}
          </Button>
        }
      >
        <Typography.Text type="secondary">{t('common.noData')}</Typography.Text>
      </Card>

      {/* Add role modal */}
      <Modal
        title={t('userDetail.addRole')}
        open={roleModalOpen}
        onOk={handleAssignRole}
        onCancel={() => { setRoleModalOpen(false); setSelectedRole('') }}
        confirmLoading={assignRole.isPending}
      >
        <Select
          style={{ width: '100%' }}
          placeholder={t('userDetail.addRole')}
          value={selectedRole || undefined}
          onChange={setSelectedRole}
          options={(roles ?? []).map((r) => ({ value: r.name, label: r.name }))}
        />
      </Modal>

      {/* Add risk flag modal */}
      <Modal
        title={t('userDetail.addRiskFlag')}
        open={flagModalOpen}
        onOk={handleAddFlag}
        onCancel={() => { setFlagModalOpen(false); setFlagReason('') }}
        confirmLoading={flagUser.isPending}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text strong>{t('userDetail.severity')}</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={flagSeverity}
              onChange={setFlagSeverity}
              options={[
                { value: AlertSeverity.Low, label: 'Low' },
                { value: AlertSeverity.Medium, label: 'Medium' },
                { value: AlertSeverity.High, label: 'High' },
                { value: AlertSeverity.Critical, label: 'Critical' },
              ]}
            />
          </div>
          <div>
            <Typography.Text strong>{t('userDetail.reason')}</Typography.Text>
            <Input.TextArea
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder={t('common.reasonPlaceholder')}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}
