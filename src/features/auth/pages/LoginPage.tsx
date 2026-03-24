import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { App, Input, Button, Form } from 'antd'
import { Link, useNavigate } from 'react-router'
import { useAppDispatch, setCredentials, set2FARequired } from '@/app/store'
import { useLogin } from '@/features/auth/api'
import { STORAGE_KEYS } from '@/utils/constants'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

function getRedirectPath(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const roles: string[] = Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : []
    const lowerRoles = roles.map((r) => r.toLowerCase())
    if (lowerRoles.includes('admin')) return '/admin'
    if (lowerRoles.includes('inspector') || lowerRoles.includes('warehousemanager')) return '/inspector'
    if (lowerRoles.includes('seller')) return '/seller'
    return '/'
  } catch {
    return '/'
  }
}

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId)
  }
  return deviceId
}

const loginSchema = z.object({
  account: z.string().min(1, 'validation.accountRequired'),
  password: z.string().min(1, 'validation.passwordRequired'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const loginMutation = useLogin()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: '', password: '' },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(
      {
        account: values.account,
        password: values.password,
        deviceId: getOrCreateDeviceId(),
      },
      {
        onSuccess: (data) => {
          if (data.requiresTwoFactor) {
            dispatch(set2FARequired({ userName: values.account, tempAccessToken: data.accessToken ?? '' }))
            navigate('/2fa')
          } else if (data.accessToken && data.refreshToken) {
            dispatch(setCredentials(data))
            message.success(t('login.success'))
            navigate(getRedirectPath(data.accessToken))
          } else {
            message.error(t('login.error', 'Login failed — no token received'))
          }
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>
          const detail = axiosError.response?.data?.detail
          message.error(detail ?? t('login.error'))
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
        {t('login.title', 'Sign In')}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 32px', fontSize: 14 }}>
        {t('login.subtitle', 'Welcome back')}
      </p>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item
          label={t('login.account')}
          validateStatus={errors.account ? 'error' : undefined}
          help={errors.account ? t(errors.account.message ?? '') : undefined}
          style={{ marginBottom: 20 }}
        >
          <Controller
            name="account"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('login.accountPlaceholder')}
                autoFocus
                style={{
                  height: 48,
                  borderRadius: 2,
                  borderColor: 'var(--color-border)',
                }}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('login.password')}
          validateStatus={errors.password ? 'error' : undefined}
          help={errors.password ? t(errors.password.message ?? '') : undefined}
          style={{ marginBottom: 8 }}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder={t('login.passwordPlaceholder')}
                style={{
                  height: 48,
                  borderRadius: 2,
                  borderColor: 'var(--color-border)',
                }}
              />
            )}
          />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <Link
            to="/forgot-password"
            style={{ color: 'var(--color-text-secondary)', fontSize: 13, textDecoration: 'none' }}
            className="oio-link"
          >
            {t('login.forgotPassword', 'Forgot password?')}
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loginMutation.isPending}
            style={{
              height: 48,
              borderRadius: 2,
              fontWeight: 500,
              fontSize: 15,
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            {t('login.submit', 'Sign In')}
          </Button>
        </Form.Item>
      </Form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 24px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      </div>

      {/* Register link */}
      <p style={{ textAlign: 'center', margin: 0, fontSize: 14 }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {t('login.noAccount', "Don't have an account?")}{' '}
        </span>
        <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
          {t('login.registerNow', 'Create account')}
        </Link>
      </p>
    </div>
  )
}
