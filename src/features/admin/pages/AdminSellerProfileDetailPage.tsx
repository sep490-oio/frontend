import { Breadcrumb, Button, Card, Col, Descriptions, Result, Row, Skeleton, Space, Tag, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { SellerProfileStatus } from '@/types'
import { useAdminSellerProfileById, useVerifySellerProfile, useRejectSellerProfile } from '@/features/admin/api'
import { formatDateTime } from '@/utils/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'

const { Text } = Typography

export default function AdminSellerProfileDetailPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminSellerProfileById(id ?? '')

  const verifyMut = useVerifySellerProfile()
  // Note: the backend requires a reason, but for simplicity we might pass a default if not using a modal.
  // Actually, we could use a modal, but let's just do a basic verification here.
  const rejectMut = useRejectSellerProfile()

  if (!id) {
    return <Result status="404" title="404" subTitle="Invalid ID" />
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (isError || !profile) {
    return (
      <Card>
        <Typography.Text type="danger">{error?.message || 'Error loading profile'}</Typography.Text>
        <Button onClick={() => refetch()} style={{ marginTop: 16 }}>Retry</Button>
      </Card>
    )
  }

  const handleVerify = () => {
    verifyMut.mutate(id)
  }

  const handleReject = () => {
    // Basic rejection reason for now, AdminSellerProfilesPage uses a modal which we could extract if needed.
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
          { title: profile.storeName || 'Detail' },
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

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title={t('sellers.generalInfo', 'General Information')}>
            <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
              <Descriptions.Item label={t('sellers.storeName', 'Store Name')}>
                <Text strong>{profile.storeName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('sellers.status', 'Status')}>
                <StatusBadge status={profile.status} />
              </Descriptions.Item>
              <Descriptions.Item label={t('sellers.joinedAt', 'Joined At')}>
                {formatDateTime(profile.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('sellers.verifiedAt', 'Verified At')}>
                {profile.verifiedAt ? formatDateTime(profile.verifiedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('sellers.storeDescription', 'Store Description')} span={2}>
                {profile.storeDescription || <Text type="secondary">{tc('common:empty.noData')}</Text>}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t('sellers.performance', 'Performance & Stats')}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('sellers.trustScore', 'Trust Score')}>
                <Tag color="blue">{profile.trustScore?.toFixed(1) || '0.0'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('sellers.averageRating', 'Average Rating')}>
                {profile.averageRating?.toFixed(1) || 'N/A'} ({profile.ratingCount || 0} reviews)
              </Descriptions.Item>
              <Descriptions.Item label={t('sellers.totalSales', 'Total Sales')}>
                {profile.totalSalesCount || 0} items
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
