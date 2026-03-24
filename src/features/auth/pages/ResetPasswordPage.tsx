import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { App, Input, Button, Form } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useResetPassword } from '@/features/auth/api'
import { passwordSchema } from '@/utils/validation'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetMutation = useResetPassword()

  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  // Invalid link
  if (!email || !token) {
    return (
      <div className="oio-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(196,81,61,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          {t('resetPassword.invalidLink', 'Link không hợp lệ')}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          {t('resetPassword.invalidLinkDesc', 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')}
        </p>
        <Link to="/login">
          <Button style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
            {t('resetPassword.backToLogin', 'Quay lại đăng nhập')}
          </Button>
        </Link>
      </div>
    )
  }

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetMutation.mutate(
      { email, token, newPassword: values.newPassword, confirmPassword: values.confirmPassword },
      {
        onSuccess: () => {
          message.success(t('resetPassword.success', 'Mật khẩu đã được đặt lại thành công'))
          navigate('/login')
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>
          const detail = axiosError.response?.data?.detail
          message.error(detail ?? t('resetPassword.error', 'Đặt lại mật khẩu thất bại'))
        },
      },
    )
  }

  return (
    <div className="oio-fade-in" style={{ width: '100%' }}>
      <h2
        style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, color: 'var(--color-text-primary)', margin: '0 0 4px' }}
      >
        {t('resetPassword.title', 'Đặt lại mật khẩu')}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 32px', fontSize: 14 }}>
        {t('resetPassword.subtitle', 'Nhập mật khẩu mới cho tài khoản của bạn')}
      </p>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item
          label={t('resetPassword.newPassword', 'Mật khẩu mới')}
          validateStatus={errors.newPassword ? 'error' : undefined}
          help={errors.newPassword?.message}
          style={{ marginBottom: 20 }}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder={t('resetPassword.newPasswordPlaceholder', 'Nhập mật khẩu mới')}
                autoFocus
                style={{ height: 48, borderRadius: 2, borderColor: 'var(--color-border)' }}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('resetPassword.confirmPassword', 'Xác nhận mật khẩu')}
          validateStatus={errors.confirmPassword ? 'error' : undefined}
          help={errors.confirmPassword?.message}
          style={{ marginBottom: 24 }}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                placeholder={t('resetPassword.confirmPasswordPlaceholder', 'Nhập lại mật khẩu')}
                style={{ height: 48, borderRadius: 2, borderColor: 'var(--color-border)' }}
              />
            )}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={resetMutation.isPending}
            style={{ height: 48, fontWeight: 500, fontSize: 15, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            {t('resetPassword.submit', 'Đặt lại mật khẩu')}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center' }}>
        <Link to="/login" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }} className="oio-link">
          {t('resetPassword.backToLogin', 'Quay lại đăng nhập')}
        </Link>
      </div>
    </div>
  )
}
