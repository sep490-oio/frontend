/**
 * RegisterPage — new user registration form.
 *
 * Creates an account via POST /api/auth/register.
 * The backend does NOT return tokens on register — it sends a confirmation
 * email instead. So after success, we show a message and stay on this page
 * (no auto-login). The user must confirm their email, then go to /login.
 *
 * Form fields match the API's RegisterUserRequest:
 *   userName, firstName, lastName, email, password
 */
import { useState } from 'react';
import { Alert, Button, Form, Input, Row, Col } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { register } from '@/services/authService';

import './RegisterPage.scss';

const registerSchema = z
  .object({
    userName: z.string().min(1, 'auth.userNameRequired'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().min(1, 'auth.emailRequired').email('auth.emailInvalid'),
    password: z.string().min(8, 'auth.passwordMinLength'),
    confirmPassword: z.string().min(1, 'auth.passwordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const [registered, setRegistered] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register({
        userName: data.userName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      setRegistered(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          const detail = err.response?.data as { message?: string } | undefined;
          const msg = detail?.message?.toLowerCase() ?? '';
          if (msg.includes('email')) {
            setError('email', { message: 'auth.emailTaken' });
          } else if (msg.includes('username') || msg.includes('user')) {
            setError('userName', { message: 'auth.userNameTaken' });
          } else {
            setError('email', { message: 'auth.emailTaken' });
          }
        } else {
          setError('root', { message: 'common.error' });
        }
      } else {
        setError('root', { message: 'common.error' });
      }
    }
  };

  if (registered) {
    return (
      <div className="register-page">
        <div className="register-card">
          <div className="register-hero">
            <div className="hero-content">
              <div className="hero-tag">{t('auth.registerBadge') ?? 'Đăng ký tài khoản mới'}</div>
              <h1 className="hero-title">{t('auth.registerSuccessTitle') ?? 'Check your inbox'}</h1>
              <p className="hero-subtitle">
                {t('auth.registerSuccessSubtitle') ?? 'We’ve just emailed you a confirmation link.'}
              </p>
            </div>
          </div>
          <div className="register-panel">
            <Alert
              type="success"
              message={t('auth.registerSuccess')}
              showIcon
              style={{ marginBottom: 24 }}
            />
            <div className="register-footer">
              <div className="login-redirect">
                {t('auth.alreadyHaveAccount') ?? 'Already have an account?'}{' '}
                <Link to="/login">{t('auth.loginButton') ?? 'Log in'}</Link>
              </div>
              <div className="feature-badges">
                <div className="badge">SECURE PAY</div>
                <div className="badge">NFT VERIFIED</div>
                <div className="badge">24/7 SUPPORT</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-hero">
          <div className="hero-content">
            <div className="hero-tag">{t('auth.registerBadge') ?? 'Đăng ký tài khoản mới'}</div>
            <h1 className="hero-title">{t('auth.registerHeroTitle') ?? 'Tham gia Metaz'}</h1>
            <p className="hero-subtitle">
              {t('auth.registerHeroSubtitle') ??
                'Bắt đầu hành trình đấu giá tài sản số và vật phẩm xa xỉ của bạn với nền tảng bảo mật hàng đầu.'}
            </p>
          </div>
        </div>

        <div className="register-panel">
          <div className="register-header">
            <h2 className="register-title">{t('auth.registerTitle') || 'Create Account'}</h2>
            <p className="register-subtitle">
              {t('auth.registerSubtitle') || 'Create a free account to start bidding.'}
            </p>
          </div>

          {errors.root && (
            <Alert
              type="error"
              message={t(errors.root.message ?? 'common.error')}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form className="register-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <div className="section">
              <div className="section-header">
                <div className="section-icon">
                  <UserOutlined />
                </div>
                <h3 className="section-title">{t('auth.personalInfo') ?? 'Thông tin cá nhân'}</h3>
              </div>

              <div className="section-row">
                <Form.Item
                  label={t('auth.userName')}
                  validateStatus={errors.userName ? 'error' : undefined}
                  help={errors.userName?.message ? t(errors.userName.message) : undefined}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Controller
                    name="userName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        prefix={<UserOutlined />}
                        placeholder={t('auth.userName')}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label={t('auth.firstName')}
                  validateStatus={errors.firstName ? 'error' : undefined}
                  help={errors.firstName?.message ? t(errors.firstName.message) : undefined}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t('auth.firstName')} size="large" />
                    )}
                  />
                </Form.Item>
              </div>

              <div className="section-row">
                <Form.Item
                  label={t('auth.lastName')}
                  validateStatus={errors.lastName ? 'error' : undefined}
                  help={errors.lastName?.message ? t(errors.lastName.message) : undefined}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder={t('auth.lastName')} size="large" />
                    )}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <div className="section-icon">
                  <MailOutlined />
                </div>
                <h3 className="section-title">{t('auth.accountInfo') ?? 'Thông tin tài khoản'}</h3>
              </div>

              <Form.Item
                label={t('auth.email')}
                validateStatus={errors.email ? 'error' : undefined}
                help={errors.email?.message ? t(errors.email.message) : undefined}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined />}
                      placeholder={t('auth.email')}
                      size="large"
                    />
                  )}
                />
              </Form.Item>

              <div className="section-row">
                <Form.Item
                  label={t('auth.password')}
                  validateStatus={errors.password ? 'error' : undefined}
                  help={
                    errors.password?.message
                      ? t(errors.password.message, { min: 8 })
                      : undefined
                  }
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        prefix={<LockOutlined />}
                        placeholder={t('auth.password')}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label={t('auth.confirmPassword')}
                  validateStatus={errors.confirmPassword ? 'error' : undefined}
                  help={
                    errors.confirmPassword?.message
                      ? t(errors.confirmPassword.message)
                      : undefined
                  }
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        prefix={<LockOutlined />}
                        placeholder={t('auth.confirmPassword')}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="register-actions">
              <p className="terms">
                {t('auth.registerTerms') ??
                  'By registering, you agree to our '}
                <Link to="/terms">{t('auth.terms') ?? 'Terms'}</Link> {t('auth.and') ?? 'and'}{' '}
                <Link to="/privacy">{t('auth.privacy') ?? 'Privacy Policy'}</Link>.
              </p>

              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                size="large"
                className="submit"
                block
              >
                {t('auth.registerButton') || 'Register'}
              </Button>
            </div>
          </Form>

          <div className="register-footer">
            <div className="login-redirect">
              {t('auth.alreadyHaveAccount') ?? 'Already have an account?'}{' '}
              <Link to="/login">{t('auth.loginButton') || 'Log in'}</Link>
            </div>

            <div className="feature-badges">
              <div className="badge">SECURE PAY</div>
              <div className="badge">NFT VERIFIED</div>
              <div className="badge">24/7 SUPPORT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
