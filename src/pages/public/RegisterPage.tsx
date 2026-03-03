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
import { Card, Button, Form, Input, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined,EyeOutlined,EyeInvisibleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { register } from '@/services/authService';

const { Title, Text } = Typography;

const registerSchema = z
  .object({
    userName: z.string().min(1, 'auth.userNameRequired'),
    firstName: z.string().min(1, 'auth.firstNameRequired'),
    lastName: z.string().min(1, 'auth.lastNameRequired'),
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

      // Registration succeeded — show the "check your email" message
      // Do NOT navigate to dashboard — the user must confirm email first
      setRegistered(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          // Conflict — email or username already taken
          // The backend error body may specify which field
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

  // After successful registration — show only the success message
  if (registered) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
        <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Alert
            type="success"
            title={t('auth.registerSuccess')}
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Text style={{ display: 'block', textAlign: 'center' }}>
            <Link to="/login">{t('auth.loginButton')}</Link>
          </Text>
        </Card>
      </div>
    );
  }

  return (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
     
      padding: '24px 16px',
    }}
  >
    <div style={{ width: '100%', maxWidth: 420 }}>
      {/* Header */}
      <Title
        level={2}
        style={{
          textAlign: 'center',
          marginBottom: 8,
          fontWeight: 700,
          color: '#1a1a1a',
        }}
      >
        Create Account
      </Title>

      <Text
        type="secondary"
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: 16,
          marginBottom: 32,
        }}
      >
        Join the luxury auction marketplace
      </Text>

      {/* Form container */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid #eee',
        }}
      >
        {/* Success state sau khi register */}
        {registered ? (
          <>
            <Alert
              type="success"
              message={t('auth.registerSuccess')}
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Text style={{ display: 'block', textAlign: 'center', fontSize: 15 }}>
              Please check your email to confirm your account.
            </Text>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link to="/login">
                <Button type="default" size="large" style={{ borderRadius: 8, minWidth: 180 }}>
                  Sign In
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <Text
              strong
              style={{
                display: 'block',
                fontSize: 18,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              Sign Up
            </Text>

            <Text
              type="secondary"
              style={{
                display: 'block',
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              Create your account to start bidding or selling
            </Text>

            {/* Root error */}
            {errors.root && (
              <Alert
                type="error"
                message={t(errors.root.message ?? 'common.error')}
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <Form.Item
                label="Full Name"
                validateStatus={errors.userName ? 'error' : ''}
                help={errors.userName?.message ? t(errors.userName.message) : undefined}
              >
                <Controller
                  name="userName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined style={{ color: '#888' }} />}
                      placeholder="John Doe"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Email"
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message ? t(errors.email.message) : undefined}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined style={{ color: '#888' }} />}
                      placeholder="you@example.com"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Password"
                validateStatus={errors.password ? 'error' : ''}
                help={
                  errors.password?.message
                    ? t(errors.password.message, { min: 8 })
                    : undefined
                }
                style={{ marginBottom: 12 }}
              >
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#888' }} />}
                      iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                      placeholder="••••••••"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                validateStatus={errors.confirmPassword ? 'error' : ''}
                help={
                  errors.confirmPassword?.message
                    ? t(errors.confirmPassword.message)
                    : undefined
                }
              >
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined style={{ color: '#888' }} />}
                      iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                      placeholder="••••••••"
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  block
                  size="large"
                  style={{
                    height: 48,
                    borderRadius: 8,
                    background: '#000',
                    border: 'none',
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Create Account
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '32px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
                ALREADY HAVE AN ACCOUNT?
              </Text>
              <Link to="/login">
                <Button
                  type="default"
                  size="large"
                  style={{ borderRadius: 8, minWidth: 180 }}
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <Text
        type="secondary"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13,
        }}
      >
        By creating an account, you agree to our{' '}
        <Link to="/terms">Terms of Service</Link> and{' '}
        <Link to="/privacy">Privacy Policy</Link>
      </Text>
    </div>
  </div>
);
}
