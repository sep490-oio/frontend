import { Typography, Card, Row, Col, Statistic, List, Button, Space, Spin, Alert } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  WalletOutlined,
  FileSearchOutlined,
  AuditOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useAdminReports, useAdminWithdrawals, usePendingVerifications, usePlatformWallet } from '@/features/admin/api'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ReportDto } from '@/types'

export default function AdminDashboardPage() {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()

  const { data: users, isLoading: usersLoading } = useAdminUsers({ pageNumber: 1, pageSize: 1 })
  const { data: verifications, isLoading: verificationsLoading } = usePendingVerifications({ pageNumber: 1, pageSize: 5, status: 'pending' })
  const { data: reports, isLoading: reportsLoading } = useAdminReports({ pageNumber: 1, pageSize: 5, status: 'open' })
  const { data: withdrawals, isLoading: withdrawalsLoading } = useAdminWithdrawals({ pageNumber: 1, pageSize: 5, status: 'pending' })
  const { data: wallet, isLoading: walletLoading } = usePlatformWallet()

  const isLoading = usersLoading || verificationsLoading || reportsLoading || withdrawalsLoading || walletLoading

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('dashboard.title')}
      </Typography.Title>

      {/* Stats overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.totalUsers')}
              value={users?.metadata?.totalCount ?? 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title={t('dashboard.pendingVerifications')}
              value={verifications?.metadata?.totalCount ?? 0}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={verifications?.metadata?.totalCount ? { color: '#faad14' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title={t('dashboard.openReports')}
              value={reports?.metadata?.totalCount ?? 0}
              prefix={<WarningOutlined />}
              valueStyle={reports?.metadata?.totalCount ? { color: '#cf1322' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title={t('dashboard.pendingWithdrawals')}
              value={withdrawals?.metadata?.totalCount ?? 0}
              prefix={<ShoppingOutlined />}
              valueStyle={withdrawals?.metadata?.totalCount ? { color: '#faad14' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card>
            <Statistic
              title={t('dashboard.platformBalance')}
              value={wallet?.availableBalance ?? 0}
              prefix={<WalletOutlined />}
              formatter={(val) => formatCurrency(val as number, wallet?.currency)}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick actions */}
      <Card title={t('dashboard.quickActions')} style={{ marginBottom: 24 }}>
        <Space wrap>
          <Button type="primary" icon={<FileSearchOutlined />} onClick={() => navigate('/admin/items/review')}>
            {t('dashboard.reviewQueue')}
          </Button>
          <Button icon={<AuditOutlined />} onClick={() => navigate('/admin/verifications')}>
            {t('dashboard.viewVerifications')}
          </Button>
          <Button icon={<FlagOutlined />} onClick={() => navigate('/admin/reports')}>
            {t('dashboard.viewReports')}
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Recent reports */}
        <Col xs={24} lg={12}>
          <Card
            title={t('dashboard.recentReports')}
            extra={<Button type="link" onClick={() => navigate('/admin/reports')}>{t('dashboard.viewReports')}</Button>}
          >
            {reports?.items?.length ? (
              <List<ReportDto>
                dataSource={reports?.items ?? []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.entityType} - ${item.reasonCode}`}
                      description={formatDateTime(item.createdAt)}
                    />
                    <StatusBadge status={item.status} />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message={t('common.noData')} type="info" showIcon />
            )}
          </Card>
        </Col>

        {/* Pending withdrawals */}
        <Col xs={24} lg={12}>
          <Card
            title={t('dashboard.pendingWithdrawals')}
            extra={<Button type="link" onClick={() => navigate('/admin/payments')}>{t('payments.withdrawals')}</Button>}
          >
            {withdrawals?.items?.length ? (
              <List
                dataSource={withdrawals?.items ?? []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={formatCurrency(item.amount)}
                      description={`${item.accountHolder ?? ''} - ${formatDateTime(item.createdAt)}`}
                    />
                    <StatusBadge status={item.status} />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message={t('common.noData')} type="info" showIcon />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
