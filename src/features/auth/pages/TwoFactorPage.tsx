import { useEffect, useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { App, Input, Button, Form, Alert } from 'antd'
import { Link, useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector, setCredentials, logout } from '@/app/store'
import { useVerifyTotp } from '@/features/auth/api'
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

// Get remaining seconds from 2FA temp JWT exp claim
function getTokenRemainingSeconds(): number {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TWO_FA_TOKEN)
    if (!token) return 0
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp as number
    return Math.max(0, exp - Math.floor(Date.now() / 1000))
  } catch {
    return 0
  }
}

const totpSchema = z.object({
  totpCode: z
    .string()
    .min(1, 'validation.codeRequired')
    .regex(/^\d{6}$/, 'validation.codeLength'),
})

type TotpFormValues = z.infer<typeof totpSchema>

export default function TwoFactorPage() {
  const { t } = useTranslation('auth')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const verifyMutation = useVerifyTotp()

  const requires2FA = useAppSelector((state) => state.auth.requires2FA)
  const [remaining, setRemaining] = useState(getTokenRemainingSeconds)
  const [expired, setExpired] = useState(false)

  // Countdown timer for temp token expiry
  useEffect(() => {
    if (!requires2FA) return
    const interval = setInterval(() => {
      const secs = getTokenRemainingSeconds()
      setRemaining(secs)
      if (secs <= 0) {
        setExpired(true)
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [requires2FA])

  // Redirect if not in 2FA state
  useEffect(() => {
    if (!requires2FA) {
      navigate('/login', { replace: true })
    }
  }, [requires2FA, navigate])

  const handleExpiredRedirect = useCallback(() => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }, [dispatch, navigate])

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TotpFormValues>({
    resolver: zodResolver(totpSchema),
    defaultValues: { totpCode: '' },
  })

  const onSubmit = (values: TotpFormValues) => {
    if (expired) {
      message.error(t('twoFactor.expired', 'Session expired. Please login again.'))
      handleExpiredRedirect()
      return
    }

    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID) ?? ''

    verifyMutation.mutate(
      {
        code: values.totpCode,
        deviceId,
      },
      {
        onSuccess: (data) => {
          // Clean up 2FA temp token
          localStorage.removeItem(STORAGE_KEYS.TWO_FA_TOKEN)

          if (data.accessToken && data.refreshToken) {
            dispatch(setCredentials(data))
            message.success(t('login.success', 'Login successful'))
            navigate(getRedirectPath(data.accessToken))
          } else {
            message.error(t('twoFactor.error', 'Verification failed'))
          }
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>
          const status = axiosError.response?.status
          const detail = axiosError.response?.data?.detail

          if (status === 401) {
            // Token expired or invalid
            message.error(t('twoFactor.tokenExpired', 'Session expired. Please login again.'))
            handleExpiredRedirect()
          } else {
            message.error(detail ?? t('twoFactor.invalidCode', 'Invalid verification code'))
          }
        },
      },
    )
  }

  if (!requires2FA) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="oio-fade-in" style={{ width: '100%' }}>
      <h2
        className="oio-serif"
        style={{ fontSize: 28, margin: '0 0 4px', color: 'var(--color-text-primary)' }}
      >
        {t('twoFactor.title', 'Two-Factor Authentication')}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 24px', fontSize: 14 }}>
        {t('twoFactor.subtitle', 'Enter the 6-digit code from your authenticator app')}
      </p>

      {/* Token expiry countdown */}
      {!expired && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: 20,
            fontFamily: "'DM Mono', monospace",
            fontSize: 14,
            color: remaining < 60 ? 'var(--color-danger)' : 'var(--color-text-secondary)',
          }}
        >
          {t('twoFactor.timeRemaining', 'Time remaining')}: {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      )}

      {/* Expired warning */}
      {expired && (
        <Alert
          type="warning"
          showIcon
          message={t('twoFactor.expiredTitle', 'Session expired')}
          description={t('twoFactor.expiredDesc', 'Your verification session has expired. Please login again.')}
          action={
            <Button size="small" onClick={handleExpiredRedirect}>
              {t('twoFactor.backToLogin', 'Back to Login')}
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item
          label={t('twoFactor.code', 'Verification Code')}
          validateStatus={errors.totpCode ? 'error' : undefined}
          help={errors.totpCode ? t(errors.totpCode.message ?? '') : undefined}
          style={{ marginBottom: 24 }}
        >
          <Controller
            name="totpCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="000000"
                size="large"
                maxLength={6}
                autoFocus
                disabled={expired}
                style={{
                  textAlign: 'center',
                  letterSpacing: 8,
                  fontSize: 24,
                  height: 56,
                  borderRadius: 2,
                  fontFamily: "'DM Mono', monospace",
                }}
              />
            )}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={verifyMutation.isPending}
            disabled={expired}
            style={{
              height: 52,
              borderRadius: 2,
              fontWeight: 500,
              fontSize: 15,
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
            }}
          >
            {t('twoFactor.submit', 'Verify')}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center' }}>
        <Link
          to="/login"
          onClick={() => dispatch(logout())}
          style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}
          className="oio-link"
        >
          {t('twoFactor.backToLogin', 'Back to Login')}
        </Link>
      </div>
    </div>
  )
}
