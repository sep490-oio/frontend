import { useState } from 'react'
import { Typography, Form, Input, Button, Card, Space, App, Spin, Row, Col } from 'antd'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreateSellerProfile, useMySellerProfile } from '@/features/seller/api'
import { TermsAcceptanceGate } from '@/features/user/components/TermsAcceptanceGate'
import { useEffect } from 'react'
import type { CreateSellerProfileRequest } from '@/types'
import { SellerProfileStatus } from '@/types/enums'

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
      if (existingProfile.status === SellerProfileStatus.Verified) {
        navigate('/seller', { replace: true })
      } else {
        navigate('/seller/verification', { replace: true })
      }
    }
  }, [existingProfile, navigate])

  const onFinish = async (values: CreateSellerProfileRequest) => {
    try {
      await createProfile.mutateAsync(values)
      message.success(t('createSuccess', 'Seller profile created successfully'))
      navigate('/seller/verification')
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px 48px' : '0 0 48px' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => { navigate(-1); }}
          style={{ marginBottom: 12, minHeight: 44, paddingLeft: 0 }}
        >
          {tc('action.back', 'Back')}
        </Button>
        <Typography.Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
          {t('createProfile', 'Create Seller Profile')}
        </Typography.Title>
      </div>

      <TermsAcceptanceGate
        termType="seller"
        title={t('sellerTermsRequired', 'Seller Agreement Required')}
        description={t('sellerTermsDesc', 'Please accept the seller agreement before creating your profile.')}
        onPendingChange={setHasPendingTerms}
        redirect
      >
        <Card styles={{ body: { padding: isMobile ? '16px' : '24px 28px' } }}>
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
                style={{ height: 44 }}
              />
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

            <Form.Item style={{ marginBottom: 0, marginTop: isMobile ? 8 : 16 }}>
              {isMobile ? (
                <Row gutter={8}>
                  <Col span={12}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={createProfile.isPending}
                      disabled={hasPendingTerms}
                      block
                      style={{ minHeight: 48, fontWeight: 500 }}
                    >
                      {tc('action.create', 'Create')}
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      onClick={() => { navigate(-1); }}
                      block
                      style={{ minHeight: 48 }}
                    >
                      {tc('action.cancel', 'Cancel')}
                    </Button>
                  </Col>
                </Row>
              ) : (
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createProfile.isPending}
                    disabled={hasPendingTerms}
                    style={{ minHeight: 44, fontWeight: 500 }}
                  >
                    {tc('action.create', 'Create')}
                  </Button>
                  <Button onClick={() => { navigate(-1); }} style={{ minHeight: 44 }}>
                    {tc('action.cancel', 'Cancel')}
                  </Button>
                </Space>
              )}
            </Form.Item>
          </Form>
        </Card>
      </TermsAcceptanceGate>
    </div>
  )
}
