import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card, Descriptions, Tag, Button, Space, Avatar, Typography,
  Flex, Divider, Select, Spin, App, Badge, Tooltip,
  Empty, Alert, Popconfirm, Row, Col,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, LockOutlined, UnlockOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SafetyOutlined,
  PlusOutlined, MinusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useAdminUser,
  useRoles,
  usePermissions,
  useAssignRole,
  useRevokeRole,
  useGrantPermission,
  useDenyPermission,
  useRevokePermission,
  useChangeUserStatus,
  useUnlockUser,
} from '@/hooks/useAdmin';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<string | undefined>();

  // ─── Hooks ───────────────────────────────────────────────────────
  const { data: user, isLoading: userLoading } = useAdminUser(userId);
  const { data: allRolesRaw } = useRoles();
  const allRoles = Array.isArray(allRolesRaw) ? allRolesRaw : [];
  const { data: permissionsPage } = usePermissions({ pageSize: 100 });
  const allPermissions = permissionsPage?.items ?? [];

  const assignRole    = useAssignRole();
  const revokeRole    = useRevokeRole();
  const grantPerm     = useGrantPermission();
  const denyPerm      = useDenyPermission();
  const revokePerm    = useRevokePermission();
  const changeStatus  = useChangeUserStatus();
  const unlock        = useUnlockUser();

  // ─── Shared feedback callbacks ────────────────────────────────────
  const onError = () => message.error(t('common.error.generic'));

  if (userLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: 400 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!user) {
    return <div style={{ padding: 24 }}><Empty description={t('admin.userDetail.notFound')} /></div>;
  }

  const isBanned    = user.status === 'Banned';
  const isSuspended = user.status === 'Suspended';

  return (
    <div style={{ padding: 24 }}>
      {/* Back + Header */}
      <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/admin/users')} />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {user.profile?.displayName || user.profile?.fullName || user.userName || t('admin.userDetail.title')}
          </Title>
          <Text type="secondary">{user.email}</Text>
        </div>
      </Flex>

      {(isBanned || isSuspended) && (
        <Alert
          type={isBanned ? 'error' : 'warning'}
          message={isBanned ? t('admin.userDetail.bannedAlert') : t('admin.userDetail.suspendedAlert')}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Button
                size="small"
                loading={unlock.isPending}
                onClick={() =>
                  unlock.mutate(userId!, {
                    onSuccess: () => message.success(t('admin.users.unlocked')),
                    onError,
                  })
                }
              >
                {t('admin.users.actions.unlock')}
              </Button>
              <Button
                size="small"
                loading={changeStatus.isPending}
                onClick={() =>
                  changeStatus.mutate(
                    { userId: userId!, data: { status: 'Active' } },
                    { onSuccess: () => message.success(t('admin.users.statusChanged')), onError }
                  )
                }
              >
                {t('admin.users.actions.activate')}
              </Button>
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {/* ── Left: profile info ── */}
        <Col xs={24} lg={10}>
          <Card>
            <Flex align="center" gap={16} style={{ marginBottom: 20 }}>
              <Avatar src={user.profile?.avatarUrl} icon={<UserOutlined />} size={72} />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {user.profile?.fullName || user.userName || '—'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>@{user.userName}</Text>
                <br />
                <Badge
                  status={user.status === 'Active' ? 'success' : user.status === 'Banned' ? 'error' : 'warning'}
                  text={user.status ?? '—'}
                  style={{ marginTop: 4 }}
                />
              </div>
            </Flex>

            <Descriptions column={1} size="small" labelStyle={{ width: 140 }}>
              <Descriptions.Item label={t('common.email')}>
                <Space>
                  {user.email}
                  <Tooltip title={user.emailConfirmed ? t('common.confirmed') : t('common.unconfirmed')}>
                    {user.emailConfirmed
                      ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  </Tooltip>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.phone')}>
                <Space>
                  {user.phoneNumber ? `+${user.countryCode} ${user.phoneNumber}` : '—'}
                  {user.phoneNumber && (
                    <Tooltip title={user.phoneNumberConfirmed ? t('common.confirmed') : t('common.unconfirmed')}>
                      {user.phoneNumberConfirmed
                        ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                    </Tooltip>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.dateOfBirth')}>
                {user.profile?.dateOfBirth ? dayjs(user.profile.dateOfBirth).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('common.gender')}>
                {user.profile?.gender ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="2FA">
                <Tag color={user.twoFactorEnabled ? 'green' : 'default'}>
                  {user.twoFactorEnabled
                    ? `${t('common.enabled')} (${user.twoFactorProvider})`
                    : t('common.disabled')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('common.createdAt')}>
                {dayjs(user.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <Flex gap={8} wrap>
              {user.status !== 'Active' && (
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={changeStatus.isPending}
                  onClick={() =>
                    changeStatus.mutate(
                      { userId: userId!, data: { status: 'Active' } },
                      { onSuccess: () => message.success(t('admin.users.statusChanged')), onError }
                    )
                  }
                >
                  {t('admin.users.actions.activate')}
                </Button>
              )}
              {user.status !== 'Banned' && (
                <Popconfirm
                  title={t('admin.userDetail.banConfirm')}
                  onConfirm={() =>
                    changeStatus.mutate(
                      { userId: userId!, data: { status: 'Banned' } },
                      { onSuccess: () => message.success(t('admin.users.statusChanged')), onError }
                    )
                  }
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<LockOutlined />}>
                    {t('admin.users.actions.ban')}
                  </Button>
                </Popconfirm>
              )}
              <Button
                size="small"
                icon={<UnlockOutlined />}
                loading={unlock.isPending}
                onClick={() =>
                  unlock.mutate(userId!, {
                    onSuccess: () => message.success(t('admin.users.unlocked')),
                    onError,
                  })
                }
              >
                {t('admin.users.actions.unlock')}
              </Button>
            </Flex>
          </Card>
        </Col>

        {/* ── Right: roles + permissions ── */}
        <Col xs={24} lg={14}>
          {/* Roles card */}
          <Card
            title={<Space><SafetyOutlined />{t('admin.userDetail.roles')}</Space>}
            style={{ marginBottom: 16 }}
          >
            <Flex gap={8} wrap style={{ marginBottom: 12 }}>
              {allRoles.length === 0 && (
                <Text type="secondary">{t('admin.userDetail.noRoles')}</Text>
              )}
              {allRoles.map((r) => (
                <Tag
                  key={r.name}
                  color="blue"
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    revokeRole.mutate(
                      { userId: userId!, role: r.name! },
                      { onSuccess: () => message.success(t('admin.userDetail.roleRevoked')), onError }
                    );
                  }}
                >
                  {r.name}
                </Tag>
              ))}
            </Flex>
            <Flex gap={8}>
              <Select
                placeholder={t('admin.userDetail.selectRole')}
                style={{ flex: 1 }}
                value={selectedRoleToAdd}
                onChange={setSelectedRoleToAdd}
              >
                {allRoles.map((r) => (
                  <Option key={r.name} value={r.name}>{r.name}</Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedRoleToAdd}
                loading={assignRole.isPending}
                onClick={() => {
                  if (!selectedRoleToAdd) return;
                  assignRole.mutate(
                    { userId: userId!, role: selectedRoleToAdd },
                    {
                      onSuccess: () => {
                        message.success(t('admin.userDetail.roleAssigned'));
                        setSelectedRoleToAdd(undefined);
                      },
                      onError,
                    }
                  );
                }}
              >
                {t('admin.userDetail.assignRole')}
              </Button>
            </Flex>
          </Card>

          {/* Permissions card */}
          <Card title={<Space><SafetyOutlined />{t('admin.userDetail.permissions')}</Space>}>
            {allPermissions.length === 0 ? (
              <Spin />
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {allPermissions.map((perm) => (
                  <Flex
                    key={perm}
                    justify="space-between"
                    align="center"
                    style={{
                      padding: '6px 0',
                      borderBottom: '1px solid var(--ant-color-border-secondary)',
                    }}
                  >
                    <Text code style={{ fontSize: 12 }}>{perm}</Text>
                    <Space size={4}>
                      <Tooltip title={t('admin.userDetail.grant')}>
                        <Button
                          size="small" type="text"
                          icon={<CheckCircleOutlined />}
                          style={{ color: '#52c41a' }}
                          loading={grantPerm.isPending}
                          onClick={() =>
                            grantPerm.mutate(
                              { userId: userId!, permission: perm },
                              { onSuccess: () => message.success(t('admin.userDetail.permGranted')), onError }
                            )
                          }
                        />
                      </Tooltip>
                      <Tooltip title={t('admin.userDetail.deny')}>
                        <Button
                          size="small" type="text"
                          icon={<CloseCircleOutlined />}
                          style={{ color: '#ff4d4f' }}
                          loading={denyPerm.isPending}
                          onClick={() =>
                            denyPerm.mutate(
                              { userId: userId!, permission: perm },
                              { onSuccess: () => message.success(t('admin.userDetail.permDenied')), onError }
                            )
                          }
                        />
                      </Tooltip>
                      <Tooltip title={t('admin.userDetail.revoke')}>
                        <Button
                          size="small" type="text"
                          icon={<MinusOutlined />}
                          loading={revokePerm.isPending}
                          onClick={() =>
                            revokePerm.mutate(
                              { userId: userId!, permission: perm },
                              { onSuccess: () => message.success(t('admin.userDetail.permRevoked')), onError }
                            )
                          }
                        />
                      </Tooltip>
                    </Space>
                  </Flex>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}