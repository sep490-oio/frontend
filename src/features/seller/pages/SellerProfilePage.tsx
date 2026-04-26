import { useState } from 'react'
import { Typography, Card, Button, Space, Spin, Empty, Form, Input, App, Row, Col } from 'antd'
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useMySellerProfile, useUpdateSellerProfile } from '@/features/seller/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { CreateSellerProfileRequest } from '@/types'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'

/* ── Responsive label-value row for mobile ───────────────────────────── */
interface InfoRowProps {
  label: string
  children: React.ReactNode
  fullWidth?: boolean
}

function InfoRow({ label, children, fullWidth }: InfoRowProps) {
  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border-light)',
        display: fullWidth ? 'block' : 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span
        style={{
          minWidth: 130,
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          fontWeight: 500,
          flexShrink: 0,
          display: 'block',
          marginBottom: fullWidth ? 6 : 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--color-text-primary)', flex: 1 }}>
        {children}
      </span>
    </div>
  )
}

export default function SellerProfilePage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const { data: profile, isLoading } = useMySellerProfile()
  const updateProfile = useUpdateSellerProfile()

  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm<CreateSellerProfileRequest>()

  const handleEdit = () => {
    if (profile) {
      form.setFieldsValue({
        storeName: profile.storeName,
        storeDescription: profile.description ?? '',
      })
    }
    setEditing(true)
  }

  const handleSave = async (values: CreateSellerProfileRequest) => {
    try {
      await updateProfile.mutateAsync(values)
      message.success(t('updateSuccess', 'Profile updated successfully'))
      setEditing(false)
    } catch {
      message.error(t('updateError', 'Failed to update profile'))
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 48 : 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Empty description={t('noProfile', 'You have not created a seller profile yet')}>
        <Button type="primary" onClick={() => navigate('/me/seller/create')} style={{ minHeight: 44 }}>
          {t('createProfile', 'Create Seller Profile')}
        </Button>
      </Empty>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '0 12px 48px' : '0 0 48px' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/seller')}
          style={{ marginBottom: 12, minHeight: 44, paddingLeft: 0 }}
        >
          {tc('action.back', 'Back')}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Typography.Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            {t('sellerProfile', 'Seller Profile')}
          </Typography.Title>
          {!editing && (
            <Button icon={<EditOutlined />} onClick={handleEdit} style={{ minHeight: 44 }}>
              {tc('action.edit', 'Edit')}
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        /* ── Edit Form ─────────────────────────────────────────────── */
        <Card 
          style={{ 
            borderRadius: 24, 
            background: 'var(--color-bg-container)', 
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
          }} 
          styles={{ body: { padding: isMobile ? '16px' : '24px' } }}
        >
          <Form<CreateSellerProfileRequest>
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="storeName"
              label={t('storeName', 'Store Name')}
              rules={[{ required: true, message: t('storeNameRequired', 'Please enter your store name') }]}
            >
              <Input maxLength={100} showCount style={{ height: 44 }} />
            </Form.Item>

            <Form.Item
              name="storeDescription"
              label={t('storeDescription', 'Store Description')}
              rules={[{ required: true, message: t('storeDescriptionRequired', 'Please describe your store') }]}
            >
              <RichTextEditor
                placeholder={t('descriptionPlaceholder', 'Describe your store and what you sell')}
                maxLength={2000}
              />
            </Form.Item>

            {/* Logo upload placeholder */}
            <Form.Item label={t('logo', 'Logo')}>
              <Card style={{ borderStyle: 'dashed', textAlign: 'center', padding: isMobile ? 16 : 24 }}>
                <Typography.Text type="secondary">
                  {t('logoUploadPlaceholder', 'Logo upload will be available here')}
                </Typography.Text>
              </Card>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              {isMobile ? (
                <Row gutter={8}>
                  <Col span={12}>
                    <Button type="primary" htmlType="submit" loading={updateProfile.isPending} block style={{ minHeight: 44 }}>
                      {tc('action.save', 'Save')}
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button onClick={() => setEditing(false)} block style={{ minHeight: 44 }}>
                      {tc('action.cancel', 'Cancel')}
                    </Button>
                  </Col>
                </Row>
              ) : (
                <Space>
                  <Button type="primary" htmlType="submit" loading={updateProfile.isPending} style={{ minHeight: 44 }}>
                    {tc('action.save', 'Save')}
                  </Button>
                  <Button onClick={() => setEditing(false)} style={{ minHeight: 44 }}>
                    {tc('action.cancel', 'Cancel')}
                  </Button>
                </Space>
              )}
            </Form.Item>
          </Form>
        </Card>
      ) : (
        /* ── View Mode ─────────────────────────────────────────────── */
        <>
          <Card 
            style={{ 
              marginBottom: 24, 
              borderRadius: 24, 
              background: 'var(--color-bg-container)', 
              backdropFilter: 'var(--oio-blur)',
              WebkitBackdropFilter: 'var(--oio-blur)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }} 
            styles={{ body: { padding: isMobile ? '0 16px' : '0 24px' } }}
          >
            {isMobile ? (
              // Mobile: vertical label-value rows
              <div>
                <InfoRow label={t('storeName', 'Store Name')}>{profile.storeName}</InfoRow>
                <InfoRow label={t('status', 'Status')}><StatusBadge status={profile.status} /></InfoRow>
                <InfoRow label={t('rating', 'Rating')}>
                  {profile.rating} / 5 ({profile.reviewCount} {t('reviews', 'reviews')})
                </InfoRow>
                <InfoRow label={t('createdAt', 'Created')}>{formatDateTime(profile.createdAt)}</InfoRow>
                {profile.approvedAt && (
                  <InfoRow label={t('approvedAt', 'Approved')}>{formatDateTime(profile.approvedAt)}</InfoRow>
                )}
                <InfoRow label={t('storeDescription', 'Description')} fullWidth>
                  {profile.description ? <SafeHtmlRenderer html={profile.description} /> : '-'}
                </InfoRow>
              </div>
            ) : (
              // Desktop: 2-column grid
              <div style={{ padding: '8px 0' }}>
                <Row gutter={[0, 0]}>
                  {[
                    { label: t('storeName', 'Store Name'), value: profile.storeName },
                    { label: t('status', 'Status'), value: <StatusBadge status={profile.status} /> },
                    { label: t('rating', 'Rating'), value: `${profile.rating} / 5 (${profile.reviewCount} ${t('reviews', 'reviews')})` },
                    { label: t('createdAt', 'Created'), value: formatDateTime(profile.createdAt) },
                    ...(profile.approvedAt ? [{ label: t('approvedAt', 'Approved'), value: formatDateTime(profile.approvedAt) }] : []),
                  ].map((item, idx) => (
                    <Col key={idx} xs={24} sm={12}>
                      <div style={{ padding: '14px 0', borderBottom: '1px solid var(--color-border-light)', paddingRight: 24 }}>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.value}</div>
                      </div>
                    </Col>
                  ))}
                  <Col xs={24}>
                    <div style={{ padding: '14px 0' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{t('storeDescription', 'Description')}</div>
                      <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{profile.description ? <SafeHtmlRenderer html={profile.description} /> : '-'}</div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </Card>

          {/* Logo card */}
          <Card 
            title={<span className="oio-serif" style={{ fontWeight: 600 }}>{t('logo', 'Logo')}</span>} 
            style={{ 
              borderRadius: 24, 
              background: 'var(--color-bg-container)', 
              backdropFilter: 'var(--oio-blur)',
              WebkitBackdropFilter: 'var(--oio-blur)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={profile.storeName}
                style={{ maxWidth: isMobile ? 120 : 200, maxHeight: isMobile ? 120 : 200, objectFit: 'contain' }}
              />
            ) : (
              <Typography.Text type="secondary">
                {t('noLogo', 'No logo uploaded')}
              </Typography.Text>
            )}
          </Card>
        </>
      )}
    </div>
  )
}