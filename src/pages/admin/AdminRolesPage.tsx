/**
 * AdminRolesPage — /admin/roles
 * Layout: 2 cột sticky — trái roles list, phải permission detail
 * Scroll độc lập từng cột, không tràn ra ngoài page
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Flex, Switch, Input, Spin,
  Empty, Col, Row, Badge, App, Tooltip, Tag, Progress,
  Divider,
} from 'antd';
import {
  SafetyOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined, LockOutlined, UserOutlined,
  ShoppingOutlined, DollarOutlined, WarningOutlined,
  FileTextOutlined, SettingOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useRoles, usePermissions, useTogglePermissionOnRole } from '@/hooks/useAdmin';
import type { RoleDto } from '@/services/adminService';

const { Title, Text } = Typography;

// ─── Parse & label helpers ────────────────────────────────────────────────────

function parsePermission(perm: string): { group: string; action: string; full: string } {
  const parts = perm.split(':');
  if (parts.length >= 3) return { group: parts.slice(0, -1).join(':'), action: parts[parts.length - 1], full: perm };
  if (parts.length === 2) return { group: parts[0], action: parts[1], full: perm };
  return { group: 'other', action: perm, full: perm };
}

function groupPermissions(
  permissions: string[],
): Record<string, Array<{ group: string; action: string; full: string }>> {
  const groups: Record<string, Array<{ group: string; action: string; full: string }>> = {};
  for (const perm of permissions) {
    const parsed = parsePermission(perm);
    (groups[parsed.group] ??= []).push(parsed);
  }
  for (const g of Object.keys(groups)) {
    groups[g].sort((a, b) => a.action.localeCompare(b.action));
  }
  return groups;
}

const ACTION_LABEL: Record<string, string> = {
  manage: 'Toàn quyền', create: 'Tạo mới', read: 'Xem', view: 'Xem',
  write: 'Chỉnh sửa', update: 'Chỉnh sửa', delete: 'Xóa', remove: 'Xóa',
  approve: 'Duyệt', reject: 'Từ chối', assign: 'Gán', revoke: 'Thu hồi',
  grant: 'Cấp', deny: 'Từ chối', verify: 'Xác minh', resolve: 'Xử lý',
  escalate: 'Leo thang', reveal: 'Tiết lộ', cancel: 'Hủy', publish: 'Xuất bản',
};

const DOMAIN_LABEL: Record<string, string> = {
  items: 'Sản phẩm', payments: 'Thanh toán', permissions: 'Quyền hạn',
  roles: 'Vai trò', users: 'Người dùng', 'seller-profiles': 'Hồ sơ người bán',
  verifications: 'Xác minh KYC', monitoring: 'Cảnh báo', reports: 'Báo cáo',
  disputes: 'Tranh chấp', auctions: 'Đấu giá', settings: 'Cài đặt',
  terms: 'Điều khoản', bids: 'Giá đặt', orders: 'Đơn hàng',
  withdrawals: 'Rút tiền', escrows: 'Ký quỹ', admin: 'Quản trị',
};

const ACTION_COLOR: Record<string, string> = {
  manage: 'purple', create: 'blue', write: 'blue', read: 'cyan', view: 'cyan',
  delete: 'red', remove: 'red', approve: 'green', verify: 'green',
  reject: 'orange', deny: 'orange', assign: 'geekblue', revoke: 'volcano',
  grant: 'lime', update: 'gold',
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  items: <ShoppingOutlined />, payments: <DollarOutlined />, users: <UserOutlined />,
  permissions: <LockOutlined />, roles: <TeamOutlined />, reports: <WarningOutlined />,
  settings: <SettingOutlined />, verifications: <FileTextOutlined />,
  monitoring: <WarningOutlined />, disputes: <WarningOutlined />, auctions: <SafetyOutlined />,
};

function friendlyGroupLabel(group: string): string {
  const last = group.split(':').pop() ?? group;
  return DOMAIN_LABEL[last] ?? (last.charAt(0).toUpperCase() + last.slice(1));
}

function friendlyActionLabel(action: string): string {
  return ACTION_LABEL[action] ?? (action.charAt(0).toUpperCase() + action.slice(1));
}

function friendlyPermLabel(group: string, action: string): string {
  return `${friendlyGroupLabel(group)} — ${friendlyActionLabel(action)}`;
}

function groupIcon(group: string): React.ReactNode {
  const last = group.split(':').pop() ?? '';
  return GROUP_ICONS[last] ?? <SafetyOutlined />;
}

function actionColor(action: string): string {
  return ACTION_COLOR[action] ?? 'default';
}

// ─── Role summary card ────────────────────────────────────────────────────────

function RoleSummaryCard({
  role, totalPerms, isSelected, onSelect,
}: {
  role: RoleDto; totalPerms: number; isSelected: boolean; onSelect: () => void;
}) {
  const activeCount = role.permissions?.length ?? 0;
  const pct = totalPerms > 0 ? Math.round((activeCount / totalPerms) * 100) : 0;
  const color = pct >= 70 ? '#E24B4A' : pct >= 40 ? '#BA7517' : '#1D9E75';

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        border: `1.5px solid ${isSelected ? '#1677ff' : 'var(--ant-color-border-secondary)'}`,
        background: isSelected ? 'var(--ant-color-primary-bg)' : 'var(--ant-color-bg-container)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        marginBottom: 8,
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Flex align="center" gap={8}>
          <SafetyOutlined style={{ color: isSelected ? '#1677ff' : 'var(--ant-color-text-tertiary)', fontSize: 13 }} />
          <Text strong style={{ fontSize: 13, color: isSelected ? '#1677ff' : undefined }}>
            {role.name}
          </Text>
        </Flex>
        <Badge count={activeCount} style={{ backgroundColor: color, fontSize: 10 }} overflowCount={999} />
      </Flex>
      <Flex align="center" gap={8}>
        <Progress
          percent={pct} size="small" showInfo={false}
          strokeColor={color} trailColor="var(--ant-color-border-secondary)"
          style={{ flex: 1, margin: 0 }}
        />
        <Text type="secondary" style={{ fontSize: 11, minWidth: 30, textAlign: 'right' }}>{pct}%</Text>
      </Flex>
    </div>
  );
}

// ─── Permission detail panel ──────────────────────────────────────────────────

function PermDetailPanel({
  role, allPermissions, permSearch, groupFilter,
}: {
  role: RoleDto; allPermissions: string[]; permSearch: string; groupFilter: string | null;
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const togglePerm = useTogglePermissionOnRole();
  const rolePermSet = new Set(role.permissions ?? []);

  const filtered = useMemo(() => {
    if (!permSearch) return allPermissions;
    const q = permSearch.toLowerCase();
    return allPermissions.filter((p) => {
      if (p.toLowerCase().includes(q)) return true;
      const { group, action } = parsePermission(p);
      return friendlyPermLabel(group, action).toLowerCase().includes(q);
    });
  }, [allPermissions, permSearch]);

  const grouped = useMemo(() => groupPermissions(filtered), [filtered]);

  const visible = useMemo(() => {
    if (!groupFilter) return grouped;
    return Object.fromEntries(Object.entries(grouped).filter(([g]) => g === groupFilter));
  }, [grouped, groupFilter]);

  if (Object.keys(visible).length === 0) {
    return (
      <Empty
        description={t('common.noResults')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '32px 0' }}
      />
    );
  }

  return (
    <>
      {Object.entries(visible)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, perms]) => {
          const activeInGroup = perms.filter((p) => rolePermSet.has(p.full)).length;
          return (
            <div key={group} style={{ marginBottom: 16 }}>
              {/* Group header */}
              <Flex align="center" justify="space-between" style={{ marginBottom: 6, padding: '0 2px' }}>
                <Flex align="center" gap={6}>
                  <span style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 13 }}>
                    {groupIcon(group)}
                  </span>
                  <Text strong style={{ fontSize: 12 }}>{friendlyGroupLabel(group)}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {activeInGroup}/{perms.length}
                  </Text>
                </Flex>
              </Flex>

              {/* Permission rows */}
              <div style={{
                border: '1px solid var(--ant-color-border-secondary)',
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {perms.map((perm, idx) => {
                  const isActive = rolePermSet.has(perm.full);
                  const isToggling =
                    togglePerm.isPending &&
                    (togglePerm.variables as any)?.permission === perm.full &&
                    (togglePerm.variables as any)?.role === role.name;

                  return (
                    <Flex
                      key={perm.full}
                      justify="space-between"
                      align="center"
                      style={{
                        padding: '9px 12px',
                        background: isActive
                          ? 'var(--ant-color-success-bg)'
                          : idx % 2 === 0
                            ? 'var(--ant-color-bg-container)'
                            : 'var(--ant-color-bg-layout)',
                        borderBottom: idx < perms.length - 1
                          ? '1px solid var(--ant-color-border-secondary)'
                          : 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
                        {isActive
                          ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 13, flexShrink: 0 }} />
                          : <CloseCircleOutlined style={{ color: 'var(--ant-color-border)', fontSize: 13, flexShrink: 0 }} />}
                        <Tooltip
                          title={<span style={{ fontFamily: 'monospace', fontSize: 11 }}>{perm.full}</span>}
                          mouseEnterDelay={0.6}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isActive ? 500 : 400,
                              color: isActive ? 'var(--ant-color-text)' : 'var(--ant-color-text-secondary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: 'default',
                            }}
                          >
                            {friendlyPermLabel(perm.group, perm.action)}
                          </Text>
                        </Tooltip>
                        <Tag
                          color={isActive ? actionColor(perm.action) : 'default'}
                          style={{
                            margin: 0, fontSize: 10, padding: '0 5px',
                            lineHeight: '18px', opacity: isActive ? 1 : 0.45, flexShrink: 0,
                          }}
                        >
                          {friendlyActionLabel(perm.action)}
                        </Tag>
                      </Flex>

                      <Switch
                        size="small"
                        checked={isActive}
                        loading={isToggling}
                        style={{ flexShrink: 0, marginLeft: 8 }}
                        onChange={(checked) =>
                          togglePerm.mutate(
                            { role: role.name!, permission: perm.full, data: { isActive: checked } },
                            {
                              onSuccess: () =>
                                message.success(
                                  checked
                                    ? t('admin.roles.permEnabled', { perm: friendlyPermLabel(perm.group, perm.action) })
                                    : t('admin.roles.permDisabled', { perm: friendlyPermLabel(perm.group, perm.action) })
                                ),
                              onError: () => message.error(t('common.error.generic')),
                            }
                          )
                        }
                      />
                    </Flex>
                  );
                })}
              </div>
            </div>
          );
        })}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRolesPage() {
  const { t } = useTranslation();
  const [roleSearch, setRoleSearch]     = useState('');
  const [permSearch, setPermSearch]     = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [groupFilter, setGroupFilter]   = useState<string | null>(null);

  const { data: rolesRaw, isLoading: rolesLoading } = useRoles();
  const roles = Array.isArray(rolesRaw) ? rolesRaw : [];
  const { data: permissionsPage, isLoading: permsLoading } = usePermissions({ pageSize: 200 });
  const allPermissions = permissionsPage?.items ?? [];

  const isLoading = rolesLoading || permsLoading;

  const filteredRoles = useMemo(
    () => roleSearch
      ? roles.filter((r) => r.name?.toLowerCase().includes(roleSearch.toLowerCase()))
      : roles,
    [roles, roleSearch],
  );

  const currentRole = useMemo(() => {
    if (selectedRole) return roles.find((r) => r.name === selectedRole) ?? filteredRoles[0];
    return filteredRoles[0];
  }, [selectedRole, filteredRoles, roles]);

  const allGroups = useMemo(
    () => Array.from(new Set(allPermissions.map((p) => parsePermission(p).group))).sort(),
    [allPermissions],
  );

  const groupActiveCount = useMemo(() => {
    if (!currentRole) return {} as Record<string, { active: number; total: number }>;
    const permSet = new Set(currentRole.permissions ?? []);
    const counts: Record<string, { active: number; total: number }> = {};
    for (const p of allPermissions) {
      const { group } = parsePermission(p);
      if (!counts[group]) counts[group] = { active: 0, total: 0 };
      counts[group].total++;
      if (permSet.has(p)) counts[group].active++;
    }
    return counts;
  }, [currentRole, allPermissions]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 400 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <div style={{ padding: 24, minHeight: '100%' }}>
      {/* ── Header ── */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.roles.title')}</Title>
          <Text type="secondary">
            {t('admin.roles.subtitle', { count: roles.length, permCount: allPermissions.length })}
          </Text>
        </div>
      </Flex>

      {/* ── 2-column layout ── */}
      <Row gutter={16} align="stretch">

        {/* ── LEFT: roles list (sticky) ── */}
        <Col xs={24} lg={7} xl={6}>
          <div style={{
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Card
              styles={{ body: { padding: '12px 14px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Input
                placeholder={t('admin.roles.searchRole')}
                prefix={<SearchOutlined />}
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                allowClear
                size="small"
                style={{ marginBottom: 12, flexShrink: 0 }}
              />

              <Flex gap={16} style={{ marginBottom: 12, paddingBottom: 12, flexShrink: 0, borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                <Flex align="center" gap={4}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.roles.legend.active')}</Text>
                </Flex>
                <Flex align="center" gap={4}>
                  <CloseCircleOutlined style={{ color: 'var(--ant-color-border)', fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.roles.legend.inactive')}</Text>
                </Flex>
              </Flex>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
                {filteredRoles.length === 0 ? (
                  <Empty description={t('common.noResults')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  filteredRoles.map((role) => (
                    <RoleSummaryCard
                      key={role.name}
                      role={role}
                      totalPerms={allPermissions.length}
                      isSelected={currentRole?.name === role.name}
                      onSelect={() => { setSelectedRole(role.name ?? null); setGroupFilter(null); }}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>
        </Col>

        {/* ── RIGHT: permission detail ── */}
        <Col xs={24} lg={17} xl={18}>
          {!currentRole ? (
            <Card>
              <Empty description={t('admin.roles.selectRoleHint')} />
            </Card>
          ) : (
            <Card
              styles={{ body: { padding: '14px 16px' } }}
              title={
                <Flex align="center" justify="space-between" wrap gap={8}>
                  <Flex align="center" gap={10}>
                    <SafetyOutlined style={{ color: '#1677ff' }} />
                    <Text strong style={{ fontSize: 15 }}>{currentRole.name}</Text>
                    <Badge
                      count={`${currentRole.permissions?.length ?? 0} / ${allPermissions.length}`}
                      style={{ backgroundColor: '#1677ff', fontWeight: 400, fontSize: 11 }}
                    />
                  </Flex>
                  <Input
                    placeholder={t('admin.roles.searchPerm')}
                    prefix={<SearchOutlined />}
                    value={permSearch}
                    onChange={(e) => { setPermSearch(e.target.value); setGroupFilter(null); }}
                    allowClear
                    size="small"
                    style={{ width: 220 }}
                  />
                </Flex>
              }
            >
              {/* Group filter chips */}
              <Flex wrap gap={6} style={{ marginBottom: 12 }}>
                <Tag
                  style={{ cursor: 'pointer', margin: 0, borderRadius: 20, padding: '2px 10px', userSelect: 'none' }}
                  color={groupFilter === null ? 'blue' : 'default'}
                  onClick={() => setGroupFilter(null)}
                >
                  {t('admin.roles.allGroups')} ({allPermissions.length})
                </Tag>
                {allGroups.map((g) => {
                  const counts = groupActiveCount[g];
                  const isSelected = groupFilter === g;
                  return (
                    <Tag
                      key={g}
                      style={{ cursor: 'pointer', margin: 0, borderRadius: 20, padding: '2px 10px', userSelect: 'none' }}
                      color={isSelected ? 'blue' : 'default'}
                      onClick={() => setGroupFilter(isSelected ? null : g)}
                    >
                      {friendlyGroupLabel(g)}
                      {counts && (
                        <span style={{ marginLeft: 4, opacity: 0.65, fontSize: 10 }}>
                          {counts.active}/{counts.total}
                        </span>
                      )}
                    </Tag>
                  );
                })}
              </Flex>

              <Divider style={{ margin: '0 0 14px' }} />

              {/* Permission list — scrolls with page, no fixed height */}
              <PermDetailPanel
                role={currentRole}
                allPermissions={allPermissions}
                permSearch={permSearch}
                groupFilter={groupFilter}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}