import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { App, Input, Button, Form, Row, Col } from 'antd'
import { Link, useNavigate } from 'react-router'
import { useRegister } from '@/features/auth/api'
import { emailSchema, passwordSchema, userNameSchema } from '@/utils/validation'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

const registerSchema = z
  .object({
    userName: userNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'validation.passwordRequired'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'register.passwordMismatch',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const fieldStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 2,
  borderColor: 'var(--color-border)',
}

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const registerMutation = useRegister()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  })

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(
      {
        userName: values.userName,
        email: values.email,
        password: values.password,
        currency: DEFAULT_CURRENCY,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      },
      {
        onSuccess: () => {
          message.success(t('register.success'))
          navigate('/login')
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>
          const detail = axiosError.response?.data?.detail
          message.error(detail ?? t('register.error'))
        },
      },
    )
  }

  return (
    <div className="oio-fade-in" style={{ width: '100%' }}>
      {/* Heading */}
      <h2
        className="oio-serif"
        style={{ fontSize: 28, margin: '0 0 4px', color: 'var(--color-text-primary)' }}
      >
        {t('register.title', 'Create Account')}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 32px', fontSize: 14 }}>
        {t('register.subtitle', 'Join the auction house')}
      </p>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item
          label={t('register.userName')}
          validateStatus={errors.userName ? 'error' : undefined}
          help={errors.userName?.message}
          style={{ marginBottom: 20 }}
        >
          <Controller
            name="userName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('register.userNamePlaceholder')}
                autoFocus
                style={fieldStyle}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('register.email')}
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email?.message}
          style={{ marginBottom: 20 }}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('register.emailPlaceholder')}
                type="email"
                style={fieldStyle}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('register.password')}
          validateStatus={errors.password ? 'error' : undefined}
          help={errors.password?.message}
          style={{ marginBottom: 4 }}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder={t('register.passwordPlaceholder')}
                style={fieldStyle}
              />
            )}
          />
        </Form.Item>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
          {t('register.passwordHint', 'At least 8 characters with a mix of letters, numbers and symbols.')}
        </p>

        <Form.Item
          label={t('register.confirmPassword')}
          validateStatus={errors.confirmPassword ? 'error' : undefined}
          help={errors.confirmPassword ? t(errors.confirmPassword.message ?? '') : undefined}
          style={{ marginBottom: 20 }}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder={t('register.confirmPasswordPlaceholder')}
                style={fieldStyle}
              />
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('register.firstName')}
              validateStatus={errors.firstName ? 'error' : undefined}
              help={errors.firstName?.message}
              style={{ marginBottom: 24 }}
            >
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('register.firstNamePlaceholder')}
                    style={fieldStyle}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('register.lastName')}
              validateStatus={errors.lastName ? 'error' : undefined}
              help={errors.lastName?.message}
              style={{ marginBottom: 24 }}
            >
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('register.lastNamePlaceholder')}
                    style={fieldStyle}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={registerMutation.isPending}
            style={{
              height: 48,
              borderRadius: 2,
              fontWeight: 500,
              fontSize: 15,
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            {t('register.submit', 'Create Account')}
          </Button>
        </Form.Item>
      </Form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 24px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      {/* Login link */}
      <p style={{ textAlign: 'center', margin: 0, fontSize: 14 }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {t('register.hasAccount', 'Already have an account?')}{' '}
        </span>
        <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
          {t('register.loginNow', 'Sign In')}
        </Link>
      </p>
    </div>
  )
}
