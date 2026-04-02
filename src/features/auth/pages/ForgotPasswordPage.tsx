import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { App, Typography, Input, Button, Form, Space } from 'antd'
import { Link } from 'react-router'
import { useForgotPassword } from '@/features/auth/api'
import { createEmailSchema } from '@/utils/validation'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

type ForgotPasswordFormValues = { email: string }

//  responsive fix: scoped mobile styles
const mobileStyles = `
  @media (max-width: 768px) {
    .oio-forgot-btn { height: 44px !important; font-size: 14px !important; }
    .oio-forgot-input { height: 44px !important; }
  }
`

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const { t: tv } = useTranslation('validation')
  const { message } = App.useApp()
  const forgotMutation = useForgotPassword()

  const forgotPasswordSchema = useMemo(() => z.object({
    email: createEmailSchema(tv),
  }), [tv])

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotMutation.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          message.success(t('forgotPassword.success'))
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>
          const detail = axiosError.response?.data?.detail
          message.error(detail ?? t('forgotPassword.error'))
        },
      },
    )
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/*  responsive fix: inject scoped media query */}
      <style>{mobileStyles}</style>

      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          {t('forgotPassword.title')}
        </Typography.Title>
        <Typography.Text type="secondary">{t('forgotPassword.subtitle')}</Typography.Text>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item
          label={t('forgotPassword.email')}
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('forgotPassword.emailPlaceholder')}
                size="large"
                type="email"
                autoFocus
                className="oio-forgot-input"
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={forgotMutation.isPending}
            className="oio-forgot-btn"
          >
            {t('forgotPassword.submit')}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center' }}>
        <Link to="/login">{t('forgotPassword.backToLogin')}</Link>
      </div>
    </Space>
  )
}