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
import {
  Card,
  Button,
  Form,
  Input,
  Typography,
  Alert,
  Divider,
  Space,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { register } from '@/services/authService';

const { Title, Text, Paragraph } = Typography;

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '24px 16px',
          background: '#f8f9fa',
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 460,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            padding: '32px 40px',
          }}
        >
          <Alert
            type="success"
            message={t('auth.registerSuccess')}
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
          <Text strong style={{ display: 'block', textAlign: 'center' }}>
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
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '24px 16px',
        background: '#f8f9fa', 
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '40px 48px',
        }}
      >
        <Title
          level={2}
          style={{
            textAlign: 'center',
            marginBottom: 8,
            fontWeight: 600,
            color: '#1a1a1a',
          }}
        >
          {t('auth.registerTitle') || 'Create Account'}
        </Title>

        <Paragraph
          type="secondary"
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          Join the luxury auction marketplace
        </Paragraph>

        {errors.root && (
          <Alert
            type="error"
            message={t(errors.root.message ?? 'common.error')}
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* userName field — often treated as display/login name in luxury platforms */}
          <Form.Item
            validateStatus={errors.userName ? 'error' : undefined}
            help={errors.userName?.message ? t(errors.userName.message) : undefined}
            style={{ marginBottom: 20 }}
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
                  style={{ borderRadius: 8 }}
                />
              )}
            />
          </Form.Item>

          {/* Full Name – visual grouping, but inputs remain separate */}
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Full Name
          </Text>
          <Space.Compact block style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item
                style={{ flex: 1, marginBottom: 0 }}
                validateStatus={errors.firstName ? 'error' : undefined}
                help={errors.firstName?.message ? t(errors.firstName.message) : undefined}
              >
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined />}
                      placeholder={t('auth.firstName')}
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                style={{ flex: 1, marginBottom: 0 }}
                validateStatus={errors.lastName ? 'error' : undefined}
                help={errors.lastName?.message ? t(errors.lastName.message) : undefined}
              >
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('auth.lastName')}
                      size="large"
                      style={{ borderRadius: 8 }}
                    />
                  )}
                />
              </Form.Item>
            </div>
          </Space.Compact>

          <Form.Item
            validateStatus={errors.email ? 'error' : undefined}
            help={errors.email?.message ? t(errors.email.message) : undefined}
            style={{ marginBottom: 20 }}
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
                  style={{ borderRadius: 8 }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            validateStatus={errors.password ? 'error' : undefined}
            help={
              errors.password?.message
                ? t(errors.password.message, { min: 8 })
                : undefined
            }
            style={{ marginBottom: 20 }}
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
                  style={{ borderRadius: 8 }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            validateStatus={errors.confirmPassword ? 'error' : undefined}
            help={
              errors.confirmPassword?.message
                ? t(errors.confirmPassword.message)
                : undefined
            }
            style={{ marginBottom: 32 }}
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
                  style={{ borderRadius: 8 }}
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              block
              size="large"
              style={{
                height: 52,
                fontSize: 18,
                fontWeight: 500,
                borderRadius: 8,
                background: '#000', // dark luxury button
                border: 'none',
              }}
            >
              {t('auth.registerButton') || 'Create Account'}
            </Button>
          </Form.Item>
        </form>

        <Divider plain style={{ margin: '24px 0' }}>
          <Text type="secondary">ALREADY HAVE AN ACCOUNT?</Text>
        </Divider>

        <Text style={{ display: 'block', textAlign: 'center', fontSize: 15 }}>
          <Link to="/login" style={{ color: '#1890ff', fontWeight: 500 }}>
            {t('auth.loginButton') || 'Sign In'}
          </Link>
        </Text>

        <Paragraph
          type="secondary"
          style={{ textAlign: 'center', marginTop: 32, fontSize: 13 }}
        >
          By creating an account, you agree to our{' '}
          <Link to="/terms">Terms of Service</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>
        </Paragraph>
      </Card>
    </div>
  );
}