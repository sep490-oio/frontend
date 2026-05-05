import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { App, Input, Button, Form, Alert, Modal } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAppDispatch, setCredentials, set2FARequired } from '@/app/store'
import { useLogin, useResendConfirmEmail } from '@/features/auth/api'
import { STORAGE_KEYS, uuid } from '@/utils/constants'
import { getReturnToFromSearch } from '@/utils/returnTo'
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
    deviceId = uuid()
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
  const location = useLocation()
  const dispatch = useAppDispatch()
  const loginMutation = useLogin()
  const resendEmail = useResendConfirmEmail()
  const [emailNotConfirmed, setEmailNotConfirmed] = useState<string | null>(null)
  const [resendModalOpen, setResendModalOpen] = useState(false)
  const [resendEmailInput, setResendEmailInput] = useState('')

  // Preserve a safe `?returnTo=` deep-link target across the auth flow so a
  // user landing on a protected page while logged out is sent back where
  // they tried to go after a successful login.
  const returnTo = getReturnToFromSearch(location.search)

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
            // Preserve returnTo across the 2FA hop.
            navigate(returnTo ? `/2fa?returnTo=${encodeURIComponent(returnTo)}` : '/2fa')
          } else if (data.accessToken && data.refreshToken) {
            dispatch(setCredentials(data))
            message.success(t('login.success'))
            // Prefer the validated returnTo over the role-based default.
            navigate(returnTo ?? getRedirectPath(data.accessToken))
          } else {
            message.error(t('login.error', 'Login failed — no token received'))
          }
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>
          const detail = axiosError.response?.data?.detail ?? ''
          const code = axiosError.response?.data?.code ?? ''
          // Detect email-not-confirmed error (BE code: "User.Email.NotConfirmed")
          if (code === 'User.Email.NotConfirmed' || code.includes('EmailNotConfirmed')) {
            setEmailNotConfirmed(values.account)
          } else {
            setEmailNotConfirmed(null)
            message.error(detail || t('login.error'))
          }
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

        {emailNotConfirmed && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
            message={t('login.emailNotConfirmed', 'Email not verified')}
            description={
              <div>
                <p style={{ margin: '0 0 12px', fontSize: 13 }}>
                  {t('login.emailNotConfirmedDesc', 'Your email address has not been verified yet. Please check your inbox or resend the verification email.')}
                </p>
                <Button
                  size="small"
                  onClick={() => { setResendEmailInput(''); setResendModalOpen(true) }}
                  style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: '#fff' }}
                >
                  {t('login.resendEmail', 'Resend Verification Email')}
                </Button>
              </div>
            }
          />
        )}

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
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t('or')}</span>
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

      {/* Resend Verification Email Modal */}
      <Modal
        title={t('login.resendModalTitle', 'Resend Verification Email')}
        open={resendModalOpen}
        onCancel={() => setResendModalOpen(false)}
        onOk={async () => {
          if (!resendEmailInput.trim()) return
          try {
            await resendEmail.mutateAsync({ email: resendEmailInput.trim() })
            message.success(t('login.resendSuccess', 'Verification email sent! Check your inbox.'))
            setResendModalOpen(false)
          } catch {
            message.error(t('login.resendError', 'Failed to send. Please wait 60 seconds between attempts.'))
          }
        }}
        okText={t('login.sendEmail', 'Send')}
        okButtonProps={{
          loading: resendEmail.isPending,
          disabled: !resendEmailInput.trim() || !resendEmailInput.includes('@'),
          style: { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' },
        }}
        centered
        width={420}
      >
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('login.resendModalDesc', 'Enter the email address you used to register. We will send a new verification link.')}
        </p>
        <Input
          type="email"
          placeholder={t('login.emailPlaceholder', 'Enter your email address')}
          value={resendEmailInput}
          onChange={(e) => setResendEmailInput(e.target.value)}
          onPressEnter={async () => {
            if (!resendEmailInput.trim() || !resendEmailInput.includes('@')) return
            try {
              await resendEmail.mutateAsync({ email: resendEmailInput.trim() })
              message.success(t('login.resendSuccess', 'Verification email sent! Check your inbox.'))
              setResendModalOpen(false)
            } catch {
              message.error(t('login.resendError', 'Failed to send. Please wait 60 seconds between attempts.'))
            }
          }}
          style={{ height: 44, borderRadius: 8 }}
          autoFocus
        />
      </Modal>
    </div>
  )
}
