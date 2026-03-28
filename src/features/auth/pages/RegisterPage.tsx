import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { App, Input, Button, Form, Row, Col, Select, Checkbox, Divider } from 'antd'
import { Link, useNavigate } from 'react-router'
import {
  UserOutlined,
  LockOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { useRegister } from '@/features/auth/api'
import { createEmailSchema, createPasswordSchema, createUsernameSchema } from '@/utils/validation'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

type RegisterFormValues = {
  userName: string
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
}

const PROVINCE_OPTIONS = [
  { value: 'hanoi', label: 'Ha Noi' },
  { value: 'hochiminh', label: 'TP. Ho Chi Minh' },
  { value: 'danang', label: 'Da Nang' },
  { value: 'haiphong', label: 'Hai Phong' },
  { value: 'cantho', label: 'Can Tho' },
  { value: 'binhduong', label: 'Binh Duong' },
  { value: 'dongnai', label: 'Dong Nai' },
  { value: 'nghean', label: 'Nghe An' },
  { value: 'thanhhoa', label: 'Thanh Hoa' },
  { value: 'hue', label: 'Thua Thien Hue' },
]

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const SANS_FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const fieldStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 8,
  borderColor: 'var(--color-border)',
}

const sectionBoxStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '24px 24px 4px',
  marginBottom: 24,
  background: 'var(--color-bg-secondary, rgba(255,255,255,0.5))',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: '1px solid var(--color-border)',
}

const sectionIconStyle: React.CSSProperties = {
  fontSize: 20,
  color: 'var(--color-accent)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: SERIF_FONT,
  fontSize: 17,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: 0,
}

const labelStyle: React.CSSProperties = {
  fontFamily: SANS_FONT,
}

const trustBadgeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  flex: 1,
}

const trustIconStyle: React.CSSProperties = {
  fontSize: 24,
  color: 'var(--color-accent)',
}

const trustLabelStyle: React.CSSProperties = {
  fontFamily: SANS_FONT,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.5px',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase' as const,
}

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const { t: tv } = useTranslation('validation')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const [agreed, setAgreed] = useState(false)

  const registerSchema = useMemo(() => z
    .object({
      userName: createUsernameSchema(tv),
      email: createEmailSchema(tv),
      password: createPasswordSchema(tv),
      confirmPassword: z.string().min(1, tv('required', 'Trường này là bắt buộc')),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordMismatch', 'Mật khẩu không khớp'),
      path: ['confirmPassword'],
    }), [tv, t])

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
        style={{
          fontFamily: SERIF_FONT,
          fontSize: 28,
          margin: '0 0 4px',
          color: 'var(--color-text-primary)',
          fontWeight: 700,
        }}
      >
        {t('register.title', 'Dang ky tai khoan')}
      </h2>
      <p style={{ fontFamily: SANS_FONT, color: 'var(--color-text-secondary)', margin: '0 0 32px', fontSize: 14 }}>
        {t('register.subtitle', 'Tao tai khoan moi de tham gia dau gia')}
      </p>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={labelStyle}>
        {/* ── Section 1: Thong tin ca nhan ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <UserOutlined style={sectionIconStyle} />
            <h3 style={sectionTitleStyle}>
              {t('register.sectionPersonal', 'Thong tin ca nhan')}
            </h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('register.firstName', 'Ho')}
                validateStatus={errors.firstName ? 'error' : undefined}
                help={errors.firstName?.message}
                style={{ marginBottom: 20 }}
              >
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                      placeholder={t('register.firstNamePlaceholder', 'Nhap ho')}
                      autoFocus
                      style={fieldStyle}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('register.lastName', 'Ten')}
                validateStatus={errors.lastName ? 'error' : undefined}
                help={errors.lastName?.message}
                style={{ marginBottom: 20 }}
              >
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                      placeholder={t('register.lastNamePlaceholder', 'Nhap ten')}
                      style={fieldStyle}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('register.phone', 'So dien thoai')}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              placeholder={t('register.phonePlaceholder', 'Nhap so dien thoai')}
              style={fieldStyle}
            />
          </Form.Item>
        </div>

        {/* ── Section 2: Thong tin tai khoan ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <LockOutlined style={sectionIconStyle} />
            <h3 style={sectionTitleStyle}>
              {t('register.sectionAccount', 'Thong tin tai khoan')}
            </h3>
          </div>

          <Form.Item
            label={t('register.userName', 'Ten dang nhap')}
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
                  prefix={<UserOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                  placeholder={t('register.userNamePlaceholder', 'Nhap ten dang nhap')}
                  style={fieldStyle}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('register.email', 'Email')}
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
                  prefix={<MailOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                  placeholder={t('register.emailPlaceholder', 'Nhap email')}
                  type="email"
                  style={fieldStyle}
                />
              )}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('register.password', 'Mat khau')}
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
                      prefix={<LockOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                      placeholder={t('register.passwordPlaceholder', 'Nhap mat khau')}
                      style={fieldStyle}
                    />
                  )}
                />
              </Form.Item>
              <p style={{ fontFamily: SANS_FONT, fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
                {t('register.passwordHint', 'It nhat 8 ky tu gom chu hoa, chu thuong, so va ky tu dac biet.')}
              </p>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('register.confirmPassword', 'Xac nhan mat khau')}
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
                      prefix={<LockOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                      placeholder={t('register.confirmPasswordPlaceholder', 'Nhap lai mat khau')}
                      style={fieldStyle}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ── Section 3: Dia chi ── */}
        <div style={sectionBoxStyle}>
          <div style={sectionHeaderStyle}>
            <EnvironmentOutlined style={sectionIconStyle} />
            <h3 style={sectionTitleStyle}>
              {t('register.sectionAddress', 'Dia chi')}
            </h3>
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('register.province', 'Tinh / Thanh pho')}
                style={{ marginBottom: 20 }}
              >
                <Select
                  placeholder={t('register.provincePlaceholder', 'Chon tinh / thanh pho')}
                  options={PROVINCE_OPTIONS}
                  style={{ height: 48 }}
                  size="large"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('register.addressDetail', 'Dia chi chi tiet')}
                style={{ marginBottom: 20 }}
              >
                <Input
                  prefix={<EnvironmentOutlined style={{ color: 'var(--color-text-secondary)' }} />}
                  placeholder={t('register.addressDetailPlaceholder', 'So nha, duong, phuong/xa...')}
                  style={fieldStyle}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: '0 0 24px', borderColor: 'var(--color-border)' }} />

        {/* Terms checkbox */}
        <Form.Item style={{ marginBottom: 24 }}>
          <Checkbox
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}
          >
            {t(
              'register.terms',
              'Toi dong y voi ',
            )}
            <a
              href="/terms"
              target="_blank"
              style={{ color: 'var(--color-accent)', fontWeight: 500 }}
            >
              {t('register.termsOfService', 'Dieu khoan dich vu')}
            </a>
            {' '}
            {t('register.and', 'va')}{' '}
            <a
              href="/privacy"
              target="_blank"
              style={{ color: 'var(--color-accent)', fontWeight: 500 }}
            >
              {t('register.privacyPolicy', 'Chinh sach bao mat')}
            </a>
          </Checkbox>
        </Form.Item>

        {/* Submit button */}
        <Form.Item style={{ marginBottom: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            disabled={!agreed}
            loading={registerMutation.isPending}
            style={{
              height: 52,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              fontFamily: SANS_FONT,
              background: agreed ? 'var(--color-accent)' : undefined,
              borderColor: agreed ? 'var(--color-accent)' : undefined,
            }}
          >
            {t('register.submit', 'Dang ky tai khoan')}
          </Button>
        </Form.Item>
      </Form>

      {/* Login link */}
      <p style={{ textAlign: 'center', margin: '0 0 32px', fontSize: 14, fontFamily: SANS_FONT }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {t('register.hasAccount', 'Da co tai khoan?')}{' '}
        </span>
        <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          {t('register.loginNow', 'Dang nhap ngay')}
        </Link>
      </p>

      {/* Trust badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          padding: '20px 0 0',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={trustBadgeStyle}>
          <SafetyCertificateOutlined style={trustIconStyle} />
          <span style={trustLabelStyle}>Secure Pay</span>
        </div>
        <div style={trustBadgeStyle}>
          <CheckCircleOutlined style={trustIconStyle} />
          <span style={trustLabelStyle}>Verified</span>
        </div>
        <div style={trustBadgeStyle}>
          <CustomerServiceOutlined style={trustIconStyle} />
          <span style={trustLabelStyle}>24/7 Support</span>
        </div>
      </div>
    </div>
  )
}
