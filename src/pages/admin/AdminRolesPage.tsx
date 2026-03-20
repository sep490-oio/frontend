import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Flex, Switch, Input, Spin, Space,
  Empty, Divider, Col, Row, Badge, App, Tooltip,
} from 'antd';
import {
  SafetyOutlined, SearchOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useRoles, usePermissions, useTogglePermissionOnRole } from '@/hooks/useAdmin';
import type { RoleDto } from '@/services/adminService';

const { Title, Text } = Typography;

function groupPermissions(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const perm of permissions) {
    const dot = perm.indexOf('.');
    const group = dot !== -1 ? perm.slice(0, dot) : 'Other';
    (groups[group] ??= []).push(perm);
  }
  return groups;
}

interface RoleCardProps {
  role: RoleDto;
  allPermissions: string[];
}

function RoleCard({ role, allPermissions }: RoleCardProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [permSearch, setPermSearch] = useState('');

  // ─── Hook ─────────────────────────────────────────────────────────
  const togglePerm = useTogglePermissionOnRole();

  const rolePermSet = new Set(role.permissions ?? []);

  const filtered = useMemo(
    () => permSearch
      ? allPermissions.filter((p) => p.toLowerCase().includes(permSearch.toLowerCase()))
      : allPermissions,
    [allPermissions, permSearch]
  );

  const grouped = useMemo(() => groupPermissions(filtered), [filtered]);

  return (
    <Card
      title={
        <Flex align="center" justify="space-between">
          <Space><SafetyOutlined /><Text strong>{role.name}</Text></Space>
          <Badge count={role.permissions?.length ?? 0} color="#1677ff" overflowCount={999} />
        </Flex>
      }
      style={{ height: '100%' }}
    >
      <Input
        placeholder={t('admin.roles.searchPerm')}
        prefix={<SearchOutlined />}
        size="small"
        value={permSearch}
        onChange={(e) => setPermSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 12 }}
      />

      {Object.keys(grouped).length === 0 ? (
        <Empty description={t('common.noResults')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
          {Object.entries(grouped).map(([group, perms]) => (
            <div key={group} style={{ marginBottom: 12 }}>
              <Text
                type="secondary"
                style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}
              >
                {group}
              </Text>
              <Divider style={{ margin: '4px 0 8px' }} />
              <Flex vertical gap={2}>
                {perms.map((perm) => {
                  const isActive = rolePermSet.has(perm);
                  const isLoading =
                    togglePerm.isPending &&
                    (togglePerm.variables as any)?.permission === perm &&
                    (togglePerm.variables as any)?.role === role.name;

                  return (
                    <Flex
                      key={perm}
                      justify="space-between"
                      align="center"
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        background: isActive ? 'var(--ant-color-success-bg)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Flex align="center" gap={6}>
                        {isActive
                          ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                          : <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 12 }} />}
                        <Text
                          code
                          style={{
                            fontSize: 11,
                            color: isActive
                              ? 'var(--ant-color-success)'
                              : 'var(--ant-color-text-tertiary)',
                          }}
                        >
                          {perm.includes('.') ? perm.split('.').slice(1).join('.') : perm}
                        </Text>
                      </Flex>
                      <Tooltip title={isActive ? t('admin.roles.disable') : t('admin.roles.enable')}>
                        <Switch
                          size="small"
                          checked={isActive}
                          loading={isLoading}
                          onChange={(checked) =>
                            togglePerm.mutate(
                              { role: role.name!, permission: perm, data: { isActive: checked } },
                              {
                                onSuccess: () =>
                                  message.success(
                                    checked
                                      ? t('admin.roles.permEnabled', { perm })
                                      : t('admin.roles.permDisabled', { perm })
                                  ),
                                onError: () => message.error(t('common.error.generic')),
                              }
                            )
                          }
                        />
                      </Tooltip>
                    </Flex>
                  );
                })}
              </Flex>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminRolesPage() {
  const { t } = useTranslation();
  const [roleSearch, setRoleSearch] = useState('');

  // ─── Hooks ───────────────────────────────────────────────────────
  const { data: rolesRaw, isLoading: rolesLoading } = useRoles();
  const roles = Array.isArray(rolesRaw) ? rolesRaw : [];
  const { data: permissionsPage, isLoading: permsLoading } = usePermissions({ pageSize: 200 });
  const allPermissions = permissionsPage?.items ?? [];

  const filteredRoles = useMemo(
    () => roleSearch
      ? roles.filter((r) => r.name?.toLowerCase().includes(roleSearch.toLowerCase()))
      : roles,
    [roles, roleSearch]
  );

  const isLoading = rolesLoading || permsLoading;

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.roles.title')}</Title>
          <Text type="secondary">
            {t('admin.roles.subtitle', { count: roles.length, permCount: allPermissions.length })}
          </Text>
        </div>
        <Input
          placeholder={t('admin.roles.searchRole')}
          prefix={<SearchOutlined />}
          value={roleSearch}
          onChange={(e) => setRoleSearch(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
      </Flex>

      <Flex gap={16} style={{ marginBottom: 16 }}>
        <Space size={4}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.roles.legend.active')}</Text>
        </Space>
        <Space size={4}>
          <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{t('admin.roles.legend.inactive')}</Text>
        </Space>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" style={{ height: 300 }}><Spin size="large" /></Flex>
      ) : filteredRoles.length === 0 ? (
        <Empty description={t('common.noResults')} />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredRoles.map((role) => (
            <Col key={role.name} xs={24} md={12} xl={8}>
              <RoleCard role={role} allPermissions={allPermissions} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}