import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Button, Spin } from 'antd'
import { Link, useSearchParams } from 'react-router'
import { useConfirmEmail, useResendConfirmEmail } from '@/features/auth/api'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function ConfirmEmailPage() {
  const { t } = useTranslation('auth')
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const confirmMutation = useConfirmEmail()
  const resendMutation = useResendConfirmEmail()
  const calledRef = useRef(false)

  const userId = searchParams.get('userId')
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (userId && token && !calledRef.current) {
      calledRef.current = true
      confirmMutation.mutate({ userId, token })
    }
  }, [userId, token])

  // Invalid link
  if (!userId || !token) {
    return (
      <div className="oio-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--color-danger)' }}>!</div>
        <h2 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          {t('confirmEmail.invalidLink', 'Link xác nhận không hợp lệ')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          {t('confirmEmail.invalidLinkDesc', 'Link xác nhận email không hợp lệ hoặc đã hết hạn.')}
        </p>
        <Link to="/login">
          <Button type="primary" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
            {t('confirmEmail.goToLogin', 'Đăng nhập')}
          </Button>
        </Link>
      </div>
    )
  }

  // Loading
  if (confirmMutation.isPending) {
    return (
      <div className="oio-fade-in" style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 16 }}>
          {t('confirmEmail.verifying', 'Đang xác nhận email...')}
        </p>
      </div>
    )
  }

  // Success
  if (confirmMutation.isSuccess) {
    return (
      <div className="oio-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,124,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          {t('confirmEmail.success', 'Email đã được xác nhận!')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>
          {t('confirmEmail.successDesc', 'Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay.')}
        </p>
        <Link to="/login">
          <Button
            type="primary"
            size="large"
            style={{ height: 48, padding: '0 40px', background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500 }}
          >
            {t('confirmEmail.goToLogin', 'Đăng nhập ngay')}
          </Button>
        </Link>
      </div>
    )
  }

  // Error
  if (confirmMutation.isError) {
    const axiosError = confirmMutation.error as AxiosError<ApiError>
    const detail = axiosError.response?.data?.detail

    const handleResend = () => {
      if (!email) {
        message.warning(t('confirmEmail.noEmail', 'Không tìm thấy email để gửi lại'))
        return
      }
      resendMutation.mutate(
        { email },
        {
          onSuccess: () => message.success(t('confirmEmail.resendSuccess', 'Đã gửi lại email xác nhận')),
          onError: () => message.error(t('confirmEmail.error', 'Gửi lại thất bại')),
        },
      )
    }

    return (
      <div className="oio-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(196,81,61,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          {t('confirmEmail.error', 'Xác nhận thất bại')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          {detail ?? t('confirmEmail.errorDesc', 'Token đã hết hạn hoặc không hợp lệ.')}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {email && (
            <Button onClick={handleResend} loading={resendMutation.isPending} style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
              {t('confirmEmail.resend', 'Gửi lại email')}
            </Button>
          )}
          <Link to="/login">
            <Button>{t('confirmEmail.goToLogin', 'Đăng nhập')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}
