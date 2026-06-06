import { Breadcrumb, Button, Card, Col, Descriptions, Result, Row, Skeleton, Space, Tag, Typography, Avatar, Statistic, Tooltip, Tabs } from 'antd'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, IdcardOutlined, InfoCircleOutlined, CopyOutlined } from '@ant-design/icons'

import { SellerProfileStatus } from '@/types'
import { useAdminSellerProfileById, useVerifySellerProfile, useRejectSellerProfile, useAdminUserWallet } from '@/features/admin/api'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAdminItems } from '../api'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useState } from 'react'

const { Text } = Typography

function SellerItemsList({ sellerId }: { sellerId: string }) {
  const { t } = useTranslation('admin')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = useAdminItems({
    pageNumber: currentPage,
    pageSize,
    sellerId,
  })

  const columns = [
    {
      title: t('items.columns.item', 'Item'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (_: unknown, record: { id: string; title: string; primaryImageUrl?: string }) => (
        <Space>
          <img src={record.primaryImageUrl || '/placeholder.png'} alt={record.title} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.title}</div>
            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              ID: {record.id.substring(0, 8)}...
              <Typography.Text copyable={{ text: record.id, icon: [<CopyOutlined key="copy" style={{ fontSize: 12 }} />, <CopyOutlined key="copied" style={{ fontSize: 12, color: '#52c41a' }} />] }} />
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('items.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const titleCase = status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        return <Tag color="blue">{titleCase}</Tag>
      },
    },
    {
      title: t('items.columns.totalAuctions', 'Total Auctions'),
      dataIndex: 'totalAuctions',
      key: 'totalAuctions',
      width: 130,
      align: 'center' as const,
      render: (count: number) => count ?? 0,
    },
    {
      title: t('items.columns.action', 'Action'),
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, record: { id: string }) => (
        <Link to={`/admin/items/${record.id}`}>
          <Button type="link" size="small" style={{ padding: 0 }}>
            {t('items.action.viewDetails', 'View Details')}
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={data?.items || []}
      rowKey="id"
      loading={isLoading}
      mobileMode="card"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: data?.metadata?.totalCount || 0,
        onChange: (p, ps) => { setCurrentPage(p); setPageSize(ps) },
        showSizeChanger: true,
      }}
    />
  )
}

export default function AdminSellerProfileDetailPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminSellerProfileById(id ?? '')

  const {
    data: wallet,
    isLoading: isWalletLoading
  } = useAdminUserWallet(id ?? '')

  const verifyMut = useVerifySellerProfile()
  const rejectMut = useRejectSellerProfile()

  if (!id) {
    return <Result status="404" title="404" subTitle={t('sellers.invalidId', 'Invalid ID')} />
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (isError || !detail) {
    return (
      <Card>
        <Typography.Text type="danger">{error?.message || t('sellers.errorLoadingProfile', 'Error loading profile')}</Typography.Text>
        <Button onClick={() => refetch()} style={{ marginTop: 16 }}>{tc('action.retry', 'Retry')}</Button>
      </Card>
    )
  }

  const { profile, user } = detail

  const handleVerify = () => {
    verifyMut.mutate(id)
  }

  const handleReject = () => {
    const reason = window.prompt(t('sellers.rejectReasonPrompt', 'Enter rejection reason:'))
    if (reason) {
      rejectMut.mutate({ id, reason })
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Link to="/admin">{tc('nav.admin', 'Admin')}</Link> },
          { title: <Link to="/admin/seller-profiles">{t('sellers.title', 'Sellers')}</Link> },
          { title: profile.storeName || t('sellers.detailBreadcrumb', 'Detail') },
        ]}
      />

      <PageHeader
        title={t('sellers.detailTitle', 'Seller Profile Detail')}
        extra={
          <Space>
            {profile.status === SellerProfileStatus.Pending && (
              <>
                <Button type="primary" onClick={handleVerify} loading={verifyMut.isPending}>
                  {t('sellers.verify', 'Verify')}
                </Button>
                <Button danger onClick={handleReject} loading={rejectMut.isPending}>
                  {t('sellers.reject', 'Reject')}
                </Button>
              </>
            )}
            <Button onClick={() => navigate(`/admin/users/${profile.id}`)}>
              {t('users.viewUser', 'View User')}
            </Button>
          </Space>
        }
      />

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: t('sellers.tabOverview', 'Overview'),
            children: (
              <Row gutter={[24, 24]}>
                <Col span={24}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 4 Statistic Cards Row */}
            <Row gutter={[16, 16]}>
              <Col xs={12} lg={6}>
                <Card bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <Statistic
                    title={t('sellers.totalSalesAmount', 'Total Sales')}
                    value={profile.totalSalesAmount ?? 0}
                    precision={0}
                    prefix="₫"
                    valueStyle={{ color: 'var(--color-success)', fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <Statistic
                    title={t('sellers.totalSales', 'Total Items Sold')}
                    value={profile.totalSalesCount ?? 0}
                    valueStyle={{ fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <Statistic
                    title={
                      <Space>
                        {t('sellers.trustScore', 'Trust Score')}
                        <Tooltip title={t('sellers.trustScoreUpdated', 'Last updated: ') + (profile.trustScoreCalculatedAt ? formatDateTime(profile.trustScoreCalculatedAt) : 'N/A')}>
                          <InfoCircleOutlined style={{ fontSize: 12 }} />
                        </Tooltip>
                      </Space>
                    }
                    value={profile.trustScore ?? 0}
                    precision={1}
                    valueStyle={{ color: 'var(--color-primary)', fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <Statistic
                    title={t('sellers.averageRating', 'Average Rating')}
                    value={profile.averageRating ?? 0}
                    precision={1}
                    suffix={`/ 5 (${profile.ratingCount ?? 0})`}
                    valueStyle={{ color: 'var(--color-warning)', fontWeight: 600 }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              {/* Left Column: User & Wallet */}
              <Col xs={24} lg={12}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title={t('sellers.userIdentity', 'User Identity')} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <Row gutter={[16, 16]} align="middle">
                      <Col>
                        <Avatar size={64} src={user.profile?.avatarUrl} icon={!user.profile?.avatarUrl ? <UserOutlined /> : undefined} />
                      </Col>
                      <Col flex="auto">
                        <Space direction="vertical" size={2}>
                          <Text strong style={{ fontSize: 16 }}>{user.profile?.firstName} {user.profile?.lastName}</Text>
                          <Text type="secondary">@{user.userName}</Text>
                          <Text type="secondary">
                            <MailOutlined style={{ marginRight: 8 }} />
                            {user.email}
                          </Text>
                          {user.phoneNumber && (
                            <Text type="secondary">
                              <PhoneOutlined style={{ marginRight: 8 }} />
                              {user.phoneNumber}
                            </Text>
                          )}
                          <Space style={{ marginTop: 8 }}>
                            {user.emailConfirmed ? (
                              <Tag color="success" icon={<SafetyCertificateOutlined />}>{t('users.emailConfirmed', 'Email Confirmed')}</Tag>
                            ) : (
                              <Tag color="warning">{t('users.emailUnconfirmed', 'Email Unconfirmed')}</Tag>
                            )}
                            {profile.verifiedAt ? (
                              <Tag color="success" icon={<IdcardOutlined />}>{t('users.identityVerified', 'Identity Verified')}</Tag>
                            ) : (
                              <Tag color="default">{t('users.identityUnverified', 'Identity Unverified')}</Tag>
                            )}
                          </Space>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  <Card title={t('sellers.financialOverview', 'Wallet Balance')} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <Skeleton loading={isWalletLoading} active paragraph={{ rows: 2 }}>
                      {wallet ? (
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label={t('sellers.availableBalance', 'Available Balance')}>
                            <Text type="success" strong style={{ fontSize: 16 }}>{formatCurrency(wallet.availableBalance, wallet.currency)}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('sellers.pendingBalance', 'Pending Balance')}>
                            <Text type="warning" strong>{formatCurrency(wallet.pendingBalance, wallet.currency)}</Text>
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Result status="warning" title={t('sellers.walletNotActivated', 'Wallet Not Activated')} />
                      )}
                    </Skeleton>
                  </Card>
                </Space>
              </Col>

              {/* Right Column: Store Info */}
              <Col xs={24} lg={12}>
                <Card title={t('sellers.storeInfo', 'Store Information')} bordered={false} style={{ boxShadow: 'var(--shadow-sm)', height: '100%' }}>
                  <Descriptions column={1} bordered size="small" labelStyle={{ width: '35%' }}>
                    <Descriptions.Item label={t('sellers.storeName', 'Store Name')}>
                      <Text strong>{profile.storeName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={tc('tableHeader.status', 'Status')}>
                      <StatusBadge status={profile.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label={t('sellers.verifiedAt', 'Verified At')}>
                      {profile.verifiedAt ? formatDateTime(profile.verifiedAt) : <Text type="secondary">N/A</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label={tc('createdAt', 'Created At')}>
                      {formatDateTime(profile.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('sellers.lastUpdated', 'Last Updated')}>
                      {profile.modifiedAt ? formatDateTime(profile.modifiedAt) : <Text type="secondary">N/A</Text>}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* Full-width Description */}
            <Card title={t('sellers.storeDescription', 'Store Description')} bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                    </Card>
                  </Space>
                </Col>
              </Row>
            )
          },
          {
            key: 'items',
            label: t('sellers.tabItems', 'Items'),
            children: (
              <Card bordered={false} style={{ boxShadow: 'var(--shadow-sm)' }}>
                <SellerItemsList sellerId={user.id} />
              </Card>
            )
          }
        ]}
      />
    </Space>
  )
}
