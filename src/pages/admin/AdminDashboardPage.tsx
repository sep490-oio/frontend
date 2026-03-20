/**
 * AdminDashboardPage — /admin
 */
import { useMemo, useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card, Col, Row, Typography, Flex, Tag,
  Avatar, Tooltip, Switch, Empty, App, Skeleton,
} from 'antd';
import {
  UserOutlined, FireOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  TeamOutlined, TrophyOutlined, EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getUsers, getRoles, getPermissions, togglePermissionOnRole } from '@/services/adminService';
import { getAuctions } from '@/services/auctionService';
import type { UserListItemDto } from '@/services/adminService';
import type { AuctionListItem, AuctionFilters } from '@/types';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const USER_STATUS_COLORS: Record<string, string> = {
  active: '#1D9E75', banned: '#E24B4A', suspended: '#BA7517', inactive: '#888780',
};

const AUCTION_STATUS_ICON: Record<string, React.ReactNode> = {
  active: <FireOutlined />, pending: <ClockCircleOutlined />,
  ended: <CheckCircleOutlined />, cancelled: <CloseCircleOutlined />,
};

const AUCTION_STATUS_COLOR: Record<string, string> = {
  active: '#1D9E75', pending: '#378ADD', ended: '#888780', cancelled: '#E24B4A',
};

// ─── Widget 1 — User Status Donut ────────────────────────────────────────────

function UserStatusWidget() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { pageSize: 200 }],
    queryFn: () => getUsers({ pageSize: 200 }),
    staleTime: 2 * 60 * 1000,
  });

  const allUsers = data?.items ?? [];
  const total = data?.metadata?.totalCount ?? 0;
  const STATUSES = ['active', 'banned', 'suspended', 'inactive'] as const;

  const counts = STATUSES.map((s) => ({
    status: s,
    count: allUsers.filter((u) => (u.status ?? '').toLowerCase() === s).length,
    color: USER_STATUS_COLORS[s],
  }));

  const segments = useMemo(() => {
    let acc = 0;
    return counts.map(({ color, count }) => {
      const pct = total > 0 ? (count / total) * 100 : 0;
      const seg = { color, from: acc, to: acc + pct };
      acc += pct;
      return seg;
    });
  }, [counts, total]);

  const conicGradient = segments.map((s) => `${s.color} ${s.from.toFixed(1)}% ${s.to.toFixed(1)}%`).join(', ');

  return (
    <Card title={<Flex align="center" gap={8}><TeamOutlined /><span>{t('admin.dashboard.userStatus.title')}</span></Flex>} style={{ height: '100%' }}>
      {isLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : (
        <Flex gap={24} align="center" wrap>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: total > 0 ? `conic-gradient(${conicGradient})` : 'var(--ant-color-border-secondary)',
            }} />
            <div style={{
              position: 'absolute', inset: 20, borderRadius: '50%',
              background: 'var(--ant-color-bg-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <Text strong style={{ fontSize: 18, lineHeight: 1.2 }}>{total.toLocaleString()}</Text>
              <Text type="secondary" style={{ fontSize: 10 }}>{t('admin.dashboard.userStatus.usersLabel')}</Text>
            </div>
          </div>
          <Flex vertical gap={8} style={{ flex: 1 }}>
            {counts.map(({ status, count, color }) => (
              <Flex key={status} justify="space-between" align="center">
                <Flex align="center" gap={8}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <Text style={{ fontSize: 13 }}>{t(`admin.users.status.${status}`)}</Text>
                </Flex>
                <Flex align="center" gap={6}>
                  <Text strong style={{ fontSize: 13 }}>{count.toLocaleString()}</Text>
                  {total > 0 && (
                    <Text type="secondary" style={{ fontSize: 11, minWidth: 32, textAlign: 'right' }}>
                      {((count / total) * 100).toFixed(0)}%
                    </Text>
                  )}
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Flex>
      )}
    </Card>
  );
}

// ─── Widget 2 — Role Distribution ────────────────────────────────────────────

function RoleDistributionWidget() {
  const { t } = useTranslation();

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin', 'roles'], queryFn: getRoles, staleTime: 5 * 60 * 1000,
  });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', { pageSize: 200 }],
    queryFn: () => getUsers({ pageSize: 200 }), staleTime: 2 * 60 * 1000,
  });

  const isLoading = rolesLoading || usersLoading;
  const allUsers = usersData?.items ?? [];
  const roleNames = (Array.isArray(rolesData) ? rolesData : []).map((r) => r.name).filter(Boolean) as string[];
  const bars = roleNames.map((role) => ({ role, count: allUsers.filter((u) => u.roles?.includes(role)).length }));
  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const BAR_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#378ADD', '#BA7517', '#D4537E'];

  return (
    <Card title={<Flex align="center" gap={8}><TeamOutlined /><span>{t('admin.dashboard.roleDistribution.title')}</span></Flex>} style={{ height: '100%' }}>
      {isLoading ? <Skeleton active paragraph={{ rows: 4 }} />
        : bars.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        : (
          <Flex vertical gap={10}>
            {bars.map(({ role, count }, idx) => (
              <div key={role}>
                <Flex justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 12 }}>{role}</Text>
                  <Text strong style={{ fontSize: 12 }}>{count.toLocaleString()}</Text>
                </Flex>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--ant-color-border-secondary)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(count / maxCount) * 100}%`,
                    background: BAR_COLORS[idx % BAR_COLORS.length],
                    borderRadius: 4, transition: 'width 0.6s ease', minWidth: count > 0 ? 6 : 0,
                  }} />
                </div>
              </div>
            ))}
          </Flex>
        )}
    </Card>
  );
}

// ─── Widget 3 — Auction Status ────────────────────────────────────────────────

function AuctionStatusWidget() {
  const { t } = useTranslation();
  const statuses = ['active', 'pending', 'ended', 'cancelled'];

  const { data, isLoading } = useQuery({
    queryKey: ['auctions', { pageSize: 200 }],
    queryFn: () => getAuctions({ pageSize: 200 }),
    staleTime: 60 * 1000, refetchInterval: 60 * 1000,
  });

  const allAuctions = data?.items ?? [];

  return (
    <Card title={<Flex align="center" gap={8}><TrophyOutlined /><span>{t('admin.dashboard.auctionStatus.title')}</span></Flex>}>
      <Row gutter={[12, 12]}>
        {statuses.map((status) => {
          const count = allAuctions.filter((a) => a.status === status).length;
          const color = AUCTION_STATUS_COLOR[status];
          return (
            <Col xs={12} sm={6} key={status}>
              <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ant-color-border-secondary)', background: 'var(--ant-color-bg-container)' }}>
                {isLoading ? <Skeleton.Button active size="small" style={{ width: '100%' }} /> : (
                  <>
                    <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
                      <span style={{ color, fontSize: 14 }}>{AUCTION_STATUS_ICON[status]}</span>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t(`admin.dashboard.auctionStatus.${status}`)}</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 22, color }}>{count.toLocaleString()}</Text>
                  </>
                )}
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}

// ─── Widget 4 — Ending Soon ───────────────────────────────────────────────────

function CountdownCell({ endTime }: { endTime: string }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = dayjs(endTime).diff(dayjs());
      if (diff <= 0) { setRemaining(t('admin.dashboard.countdown.ended')); return; }
      const d = dayjs.duration(diff);
      const mm = String(d.minutes()).padStart(2, '0');
      const ss = String(d.seconds()).padStart(2, '0');
      setRemaining(
        d.hours() > 0
          ? t('admin.dashboard.countdown.hours', { h: d.hours(), mm })
          : t('admin.dashboard.countdown.minutes', { mm, ss })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime, t]);

  const isUrgent = dayjs(endTime).diff(dayjs(), 'minute') < 10;
  return (
    <Text strong style={{ fontSize: 12, color: isUrgent ? '#E24B4A' : '#BA7517', fontVariantNumeric: 'tabular-nums' }}>
      {remaining}
    </Text>
  );
}

function EndingSoonWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['auctions', { status: 'active', isEndingSoon: true, pageSize: 8 }],
    queryFn: () => getAuctions({ status: 'active' as AuctionFilters['status'], pageSize: 8, sortBy: 'endTime', sortOrder: 'asc' }),
    refetchInterval: 30 * 1000,
  });

  const auctions = data?.items ?? [];

  return (
    <Card
      title={<Flex align="center" gap={8}><ClockCircleOutlined style={{ color: '#BA7517' }} /><span>{t('admin.dashboard.endingSoon.title')}</span></Flex>}
      extra={<Text type="secondary" style={{ fontSize: 11 }}>{dataUpdatedAt ? t('admin.dashboard.endingSoon.updated', { time: dayjs(dataUpdatedAt).format('HH:mm:ss') }) : '—'}</Text>}
      style={{ height: '100%' }}
    >
      {isLoading ? <Skeleton active paragraph={{ rows: 5 }} />
        : auctions.length === 0 ? <Empty description={t('admin.dashboard.endingSoon.noAuctions')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        : (
          <Flex vertical gap={0}>
            {auctions.map((a: AuctionListItem, idx: number) => (
              <Flex key={a.id} align="center" gap={10}
                style={{ padding: '8px 0', borderBottom: idx < auctions.length - 1 ? '1px solid var(--ant-color-border-secondary)' : 'none', cursor: 'pointer' }}
                onClick={() => navigate(`/auction/${a.id}`)}
              >
                <Avatar src={a.primaryImageUrl} size={36} shape="square" style={{ borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.itemTitle ?? ''}>{a.itemTitle}</Text>
                  <Flex align="center" gap={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{a.currency} {a.currentPrice?.toLocaleString()}</Text>
                    <Flex align="center" gap={3}><EyeOutlined style={{ fontSize: 10, color: 'var(--ant-color-text-tertiary)' }} /><Text type="secondary" style={{ fontSize: 11 }}>{a.watchCount}</Text></Flex>
                    <Flex align="center" gap={3}><TrophyOutlined style={{ fontSize: 10, color: 'var(--ant-color-text-tertiary)' }} /><Text type="secondary" style={{ fontSize: 11 }}>{a.bidCount}</Text></Flex>
                  </Flex>
                </div>
                <CountdownCell endTime={a.endTime} />
              </Flex>
            ))}
          </Flex>
        )}
    </Card>
  );
}

// ─── Widget 5 — Permission Heatmap ───────────────────────────────────────────

function PermissionHeatmapWidget() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: rolesRaw, isLoading: rolesLoading } = useQuery({ queryKey: ['admin', 'roles'], queryFn: getRoles, staleTime: 5 * 60 * 1000 });
  const roles = Array.isArray(rolesRaw) ? rolesRaw : [];

  const { data: permsPage, isLoading: permsLoading } = useQuery({ queryKey: ['admin', 'permissions', { pageSize: 50 }], queryFn: () => getPermissions({ pageSize: 50 }), staleTime: 10 * 60 * 1000 });
  const allPerms = permsPage?.items ?? [];

  const groups = useMemo(() => {
    const g: Record<string, string[]> = {};
    for (const p of allPerms) { const dot = p.indexOf('.'); const grp = dot > 0 ? p.slice(0, dot) : 'Other'; (g[grp] ??= []).push(p); }
    return g;
  }, [allPerms]);

  const toggleMutation = useMutation({
    mutationFn: ({ role, permission, isActive }: { role: string; permission: string; isActive: boolean }) => togglePermissionOnRole(role, permission, { isActive }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] }); },
    onError: () => message.error(t('common.error.generic')),
  });

  const cardTitle = t('admin.dashboard.permissionHeatmap.title');
  if (rolesLoading || permsLoading) return <Card title={cardTitle}><Skeleton active paragraph={{ rows: 6 }} /></Card>;
  if (roles.length === 0 || allPerms.length === 0) return <Card title={cardTitle}><Empty /></Card>;

  const ROLE_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#378ADD', '#BA7517'];

  return (
    <Card title={<Flex align="center" gap={8}><CheckCircleOutlined /><span>{cardTitle}</span></Flex>} styles={{ body: { padding: 0, overflowX: 'auto' } }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, borderBottom: '1px solid var(--ant-color-border-secondary)', background: 'var(--ant-color-bg-layout)', position: 'sticky', left: 0, zIndex: 1, minWidth: 160 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{t('admin.dashboard.permissionHeatmap.permissionCol')}</Text>
            </th>
            {roles.map((r, idx) => (
              <th key={r.name} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500, borderBottom: '1px solid var(--ant-color-border-secondary)', background: 'var(--ant-color-bg-layout)', minWidth: 90 }}>
                <Text style={{ fontSize: 12, color: ROLE_COLORS[idx % ROLE_COLORS.length] }}>{r.name}</Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([group, perms]) => (
            <Fragment key={group}>
              <tr><td colSpan={roles.length + 1} style={{ padding: '6px 16px', background: 'var(--ant-color-bg-layout)', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                <Text type="secondary" style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{group}</Text>
              </td></tr>
              {perms.map((perm, permIdx) => (
                <tr key={perm} style={{ background: permIdx % 2 === 0 ? 'transparent' : 'var(--ant-color-bg-layout)' }}>
                  <td style={{ padding: '6px 16px', borderBottom: '1px solid var(--ant-color-border-secondary)', background: permIdx % 2 === 0 ? 'var(--ant-color-bg-container)' : 'var(--ant-color-bg-layout)', position: 'sticky', left: 0 }}>
                    <Text code style={{ fontSize: 11 }}>{perm.includes('.') ? perm.split('.').slice(1).join('.') : perm}</Text>
                  </td>
                  {roles.map((role) => {
                    const isActive = role.permissions?.includes(perm) ?? false;
                    const vars = toggleMutation.variables as { role: string; permission: string } | undefined;
                    const isToggling = toggleMutation.isPending && vars?.role === role.name && vars?.permission === perm;
                    return (
                      <td key={role.name} style={{ padding: '6px 12px', textAlign: 'center', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                        <Tooltip title={isActive ? t('admin.dashboard.permissionHeatmap.toggleDisable', { perm, role: role.name }) : t('admin.dashboard.permissionHeatmap.toggleEnable', { perm, role: role.name })}>
                          <Switch size="small" checked={isActive} loading={isToggling}
                            onChange={(checked) => toggleMutation.mutate({ role: role.name!, permission: perm, isActive: checked })} />
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─── Widget 6 — Recent Users ──────────────────────────────────────────────────

function RecentUsersWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'users', { pageSize: 8, pageNumber: 1 }],
    queryFn: () => getUsers({ pageSize: 8, pageNumber: 1 }),
    refetchInterval: 60 * 1000,
  });

  const users = (data?.items ?? []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <Card
      title={<Flex align="center" gap={8}><UserOutlined /><span>{t('admin.dashboard.recentUsers.title')}</span></Flex>}
      extra={<Text type="secondary" style={{ fontSize: 11 }}>{dataUpdatedAt ? t('admin.dashboard.recentUsers.updated', { time: dayjs(dataUpdatedAt).format('HH:mm:ss') }) : '—'}</Text>}
      style={{ height: '100%' }}
    >
      {isLoading ? <Skeleton active avatar paragraph={{ rows: 4 }} />
        : users.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        : (
          <Flex vertical gap={0}>
            {users.map((u: UserListItemDto, idx: number) => (
              <Flex key={u.id} align="center" gap={10}
                style={{ padding: '8px 0', borderBottom: idx < users.length - 1 ? '1px solid var(--ant-color-border-secondary)' : 'none', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${u.id}`)}
              >
                <Avatar icon={<UserOutlined />} size={32} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{u.email}</Text>
                </div>
                <Flex align="center" gap={6} style={{ flexShrink: 0 }}>
                  {u.roles?.map((r) => <Tag key={r} style={{ margin: 0, fontSize: 10 }}>{r}</Tag>)}
                  <Tooltip title={dayjs(u.createdAt).format('DD/MM/YYYY HH:mm')}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(u.createdAt).fromNow()}</Text>
                  </Tooltip>
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.dashboard.title')}</Title>
          <Text type="secondary">{dayjs().format('dddd, DD/MM/YYYY')}</Text>
        </div>
      </Flex>
      <Flex vertical gap={16}>
        <AuctionStatusWidget />
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}><UserStatusWidget /></Col>
          <Col xs={24} lg={12}><RoleDistributionWidget /></Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}><EndingSoonWidget /></Col>
          <Col xs={24} lg={12}><RecentUsersWidget /></Col>
        </Row>
        <PermissionHeatmapWidget />
      </Flex>
    </div>
  );
}