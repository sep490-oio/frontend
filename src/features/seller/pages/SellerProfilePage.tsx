import { useState } from 'react'
import { Typography, Card, Descriptions, Button, Space, Spin, Empty, Form, Input, App } from 'antd'
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMySellerProfile, useUpdateSellerProfile } from '@/features/seller/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { CreateSellerProfileRequest } from '@/types'

export default function SellerProfilePage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const { data: profile, isLoading } = useMySellerProfile()
  const updateProfile = useUpdateSellerProfile()

  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm<CreateSellerProfileRequest>()

  const handleEdit = () => {
    if (profile) {
      form.setFieldsValue({
        storeName: profile.storeName,
        description: profile.description ?? '',
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
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Empty description={t('noProfile', 'You have not created a seller profile yet')}>
        <Button type="primary" onClick={() => navigate('/me/seller/create')}>
          {t('createProfile', 'Create Seller Profile')}
        </Button>
      </Empty>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/me/seller')}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('sellerProfile', 'Seller Profile')}
        </Typography.Title>
        {!editing && (
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            {tc('action.edit', 'Edit')}
          </Button>
        )}
      </Space>

      {editing ? (
        <Card>
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
              <Input maxLength={100} showCount />
            </Form.Item>

            <Form.Item
              name="description"
              label={t('storeDescription', 'Description')}
            >
              <Input.TextArea rows={6} maxLength={2000} showCount />
            </Form.Item>

            {/* Logo upload placeholder */}
            <Form.Item label={t('logo', 'Logo')}>
              <Card style={{ borderStyle: 'dashed', textAlign: 'center', padding: 24 }}>
                <Typography.Text type="secondary">
                  {t('logoUploadPlaceholder', 'Logo upload will be available here')}
                </Typography.Text>
              </Card>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={updateProfile.isPending}>
                  {tc('action.save', 'Save')}
                </Button>
                <Button onClick={() => setEditing(false)}>
                  {tc('action.cancel', 'Cancel')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={t('storeName', 'Store Name')}>
                {profile.storeName}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusBadge status={profile.status} />
              </Descriptions.Item>
              <Descriptions.Item label={t('rating', 'Rating')}>
                {profile.rating} / 5 ({profile.reviewCount} {t('reviews', 'reviews')})
              </Descriptions.Item>
              <Descriptions.Item label={t('createdAt', 'Created')}>
                {formatDateTime(profile.createdAt)}
              </Descriptions.Item>
              {profile.approvedAt && (
                <Descriptions.Item label={t('approvedAt', 'Approved')}>
                  {formatDateTime(profile.approvedAt)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('storeDescription', 'Description')} span={2}>
                {profile.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Logo placeholder */}
          <Card title={t('logo', 'Logo')}>
            {profile.logo ? (
              <img src={profile.logo} alt={profile.storeName} style={{ maxWidth: 200, maxHeight: 200 }} />
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
