import { useState } from 'react'
import { Typography, Form, Input, Button, Card, Space, App, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreateSellerProfile, useMySellerProfile } from '@/features/seller/api'
import { TermsAcceptanceGate } from '@/features/user/components/TermsAcceptanceGate'
import { useEffect } from 'react'
import type { CreateSellerProfileRequest } from '@/types'

export default function CreateSellerProfilePage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const [form] = Form.useForm<CreateSellerProfileRequest>()
  const [hasPendingTerms, setHasPendingTerms] = useState(false)

  const { data: existingProfile, isLoading: profileLoading } = useMySellerProfile()
  const createProfile = useCreateSellerProfile()

  // Redirect if already has profile
  useEffect(() => {
    if (existingProfile) {
      navigate('/seller', { replace: true })
    }
  }, [existingProfile, navigate])

  const onFinish = async (values: CreateSellerProfileRequest) => {
    try {
      await createProfile.mutateAsync(values)
      message.success(t('createSuccess', 'Seller profile created successfully'))
      navigate('/seller')
    } catch {
      message.error(t('createError', 'Failed to create seller profile'))
    }
  }

  if (profileLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 48 : 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>{t('createProfile', 'Create Seller Profile')}</Typography.Title>

      <TermsAcceptanceGate
        termType="seller"
        title={t('sellerTermsRequired', 'Seller Agreement Required')}
        description={t('sellerTermsDesc', 'Please accept the seller agreement before creating your profile.')}
        onPendingChange={setHasPendingTerms}
        redirect
      >
      <Card>
        <Form<CreateSellerProfileRequest>
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="storeName"
            label={t('storeName', 'Store Name')}
            rules={[{ required: true, message: t('storeNameRequired', 'Please enter your store name') }]}
          >
            <Input
              maxLength={100}
              showCount
              placeholder={t('storeNamePlaceholder', 'Enter your store name')}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('storeDescription', 'Description')}
          >
            <Input.TextArea
              rows={6}
              maxLength={2000}
              showCount
              placeholder={t('descriptionPlaceholder', 'Describe your store and what you sell')}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createProfile.isPending} disabled={hasPendingTerms}>
                {tc('action.create', 'Create')}
              </Button>
              <Button onClick={() => navigate(-1)}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      </TermsAcceptanceGate>
    </div>
  )
}
