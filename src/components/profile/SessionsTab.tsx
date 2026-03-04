/**
 * SessionsTab — active sessions table + login history table.
 *
 * Desktop: Ant Design Table with columns.
 * Mobile: card-based list layout.
 * Both sections use pagination from ApiPaginatedResponse metadata.
 */
import { useState } from 'react';
import {
  Card,
  Divider,
  Flex,
  Pagination,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DesktopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSessions, useLoginHistory } from '@/hooks/useUser';
import type { UserSessionDto, LoginHistoryDto } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

/** Truncate long user agent strings for display */
function truncateUA(ua: string, max = 40): string {
  return ua.length > max ? ua.slice(0, max) + '...' : ua;
}

/** Format ISO date string to locale date+time */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function SessionsTab() {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  const [sessionPage, setSessionPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: sessionsData, isLoading: sessionsLoading } = useSessions(sessionPage, 10);
  const { data: historyData, isLoading: historyLoading } = useLoginHistory(historyPage, 10);

  // ─── Sessions columns (desktop) ──────────────────────────────────────
  const sessionColumns: ColumnsType<UserSessionDto> = [
    {
      title: t('profile.device'),
      dataIndex: 'userAgent',
      key: 'device',
      render: (ua: string, record: UserSessionDto) => (
        <Flex gap={8} align="center">
          <DesktopOutlined />
          <div>
            <Text style={{ fontSize: 13 }}>{truncateUA(ua)}</Text>
            {record.isCurrentDevice && (
              <Tag className="profile-tag profile-tag-confirmed" style={{ marginLeft: 8 }}>
                {t('profile.currentDevice')}
              </Tag>
            )}
          </div>
        </Flex>
      ),
    },
    {
      title: t('profile.lastActive'),
      dataIndex: 'lastRotatedAt',
      key: 'lastActive',
      width: 180,
      render: (val: string) => formatDate(val),
    },
    {
      title: t('profile.status'),
      key: 'status',
      width: 120,
      render: (_: unknown, record: UserSessionDto) => (
        <Flex gap={4} align="center">
          {record.isActive ? (
            <Tag className="profile-tag profile-tag-confirmed">{t('profile.active')}</Tag>
          ) : (
            <Tag className="profile-tag">{t('profile.inactive')}</Tag>
          )}
          {record.isNearingAbsoluteExpiration && (
            <Tag className="profile-tag profile-tag-warning">
              <WarningOutlined /> {t('profile.expiringSoon')}
            </Tag>
          )}
        </Flex>
      ),
    },
  ];

  // ─── Login history columns (desktop) ─────────────────────────────────
  const historyColumns: ColumnsType<LoginHistoryDto> = [
    {
      title: t('profile.date'),
      dataIndex: 'loginAt',
      key: 'date',
      width: 180,
      render: (val: string) => formatDate(val),
    },
    {
      title: t('profile.device'),
      dataIndex: 'userAgent',
      key: 'device',
      render: (ua: string) => <Text style={{ fontSize: 13 }}>{truncateUA(ua)}</Text>,
    },
    {
      title: t('profile.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) =>
        status === 'success' ? (
          <Tag className="profile-tag profile-tag-confirmed">{t('profile.success')}</Tag>
        ) : (
          <Tag className="profile-tag profile-tag-failed">{t('profile.failed')}</Tag>
        ),
    },
  ];

  // ─── Mobile card renderer for sessions ───────────────────────────────
  const renderSessionCard = (session: UserSessionDto) => (
    <Card key={session.sessionId} className="sessions-card" size="small">
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Flex gap={8} align="center">
          <DesktopOutlined />
          <Text strong style={{ fontSize: 13 }}>{truncateUA(session.userAgent, 30)}</Text>
        </Flex>
        {session.isCurrentDevice && (
          <Tag className="profile-tag profile-tag-confirmed">{t('profile.currentDevice')}</Tag>
        )}
      </Flex>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDate(session.lastRotatedAt)}
      </Text>
      {session.isNearingAbsoluteExpiration && (
        <Tag className="profile-tag profile-tag-warning" style={{ marginTop: 8 }}>
          <WarningOutlined /> {t('profile.expiringSoon')}
        </Tag>
      )}
    </Card>
  );

  // ─── Mobile card renderer for login history ──────────────────────────
  const renderHistoryCard = (entry: LoginHistoryDto) => (
    <Card key={entry.id} className="sessions-card" size="small">
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 13 }}>{truncateUA(entry.userAgent, 30)}</Text>
        {entry.status === 'success' ? (
          <Tag className="profile-tag profile-tag-confirmed">{t('profile.success')}</Tag>
        ) : (
          <Tag className="profile-tag profile-tag-failed">{t('profile.failed')}</Tag>
        )}
      </Flex>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDate(entry.loginAt)}
      </Text>
    </Card>
  );

  return (
    <div>
      {/* ─── Active Sessions ──────────────────────────────────────────── */}
      <Text className="profile-field-label">{t('profile.activeSessions')}</Text>

      {sessionsLoading ? (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin />
        </Flex>
      ) : isMobile ? (
        <div className="sessions-card-list">
          {sessionsData?.items.map(renderSessionCard)}
          {sessionsData && sessionsData.metadata.totalPages > 1 && (
            <Pagination
              current={sessionPage}
              total={sessionsData.metadata.totalCount}
              pageSize={10}
              onChange={setSessionPage}
              style={{ marginTop: 16, textAlign: 'center' }}
              size="small"
            />
          )}
        </div>
      ) : (
        <>
          <Table
            dataSource={sessionsData?.items}
            columns={sessionColumns}
            rowKey="sessionId"
            pagination={false}
            size="small"
            className="sessions-table"
          />
          {sessionsData && sessionsData.metadata.totalPages > 1 && (
            <Flex justify="flex-end" style={{ marginTop: 16 }}>
              <Pagination
                current={sessionPage}
                total={sessionsData.metadata.totalCount}
                pageSize={10}
                onChange={setSessionPage}
                size="small"
              />
            </Flex>
          )}
        </>
      )}

      <Divider />

      {/* ─── Login History ────────────────────────────────────────────── */}
      <Text className="profile-field-label">{t('profile.loginHistory')}</Text>

      {historyLoading ? (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin />
        </Flex>
      ) : isMobile ? (
        <div className="sessions-card-list">
          {historyData?.items.map(renderHistoryCard)}
          {historyData && historyData.metadata.totalPages > 1 && (
            <Pagination
              current={historyPage}
              total={historyData.metadata.totalCount}
              pageSize={10}
              onChange={setHistoryPage}
              style={{ marginTop: 16, textAlign: 'center' }}
              size="small"
            />
          )}
        </div>
      ) : (
        <>
          <Table
            dataSource={historyData?.items}
            columns={historyColumns}
            rowKey="id"
            pagination={false}
            size="small"
            className="sessions-table"
          />
          {historyData && historyData.metadata.totalPages > 1 && (
            <Flex justify="flex-end" style={{ marginTop: 16 }}>
              <Pagination
                current={historyPage}
                total={historyData.metadata.totalCount}
                pageSize={10}
                onChange={setHistoryPage}
                size="small"
              />
            </Flex>
          )}
        </>
      )}
    </div>
  );
}
