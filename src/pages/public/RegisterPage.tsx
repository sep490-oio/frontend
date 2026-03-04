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
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Layout,
  Row,
  Typography,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { register } from '@/services/authService';

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

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

  // design-system-aligned CSS classes are applied via className
  // No need for style constants anymore

  if (registered) {
    return (
      <Layout className="register-page">
        <Content className="register-content">
          <Card className="register-card register-success-card" classNames={{ body: 'register-card-body' }}>
            <Alert
              type="success"
              message={t('auth.registerSuccess')}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Text strong style={{ display: 'block', textAlign: 'center' }}>
              <Link to="/login">{t('auth.loginButton')}</Link>
            </Text>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="register-page">



      {/* Main content */}
      <Content className="register-content">
        <Card className="register-card" classNames={{ body: 'register-card-body' }}>
          {/* Page heading */}
          <Title level={2} className="register-title">
            {t('auth.registerTitle') || 'Create Account'}
          </Title>
          <Paragraph className="register-subtitle">
            Join the premier destination for designer art toys.
          </Paragraph>

          {/* Root error */}
          {errors.root && (
            <Alert
              type="error"
              message={t(errors.root.message ?? 'common.error')}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Username */}
            <Form.Item
              validateStatus={errors.userName ? 'error' : undefined}
              help={errors.userName?.message ? t(errors.userName.message) : undefined}
              className="register-form-item"
            >
              <Controller
                name="userName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder={t('auth.userName')}
                    size="large"
                    variant="borderless"
                    className="register-input"
                  />
                )}
              />
            </Form.Item>

            {/* Full Name – side-by-side */}
            <Text className="register-field-label">
              Full Name
            </Text>
            <Row gutter={16} className="register-full-name-row">
              <Col span={12}>
                <Form.Item
                  validateStatus={errors.firstName ? 'error' : undefined}
                  help={errors.firstName?.message ? t(errors.firstName.message) : undefined}
                  style={{ marginBottom: 0 }}
                >
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder={t('auth.firstName')}
                        size="large"
                        variant="borderless"
                        className="register-input"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  validateStatus={errors.lastName ? 'error' : undefined}
                  help={errors.lastName?.message ? t(errors.lastName.message) : undefined}
                  style={{ marginBottom: 0 }}
                >
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={t('auth.lastName')}
                        size="large"
                        variant="borderless"
                        className="register-input"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Email */}
            <Form.Item
              validateStatus={errors.email ? 'error' : undefined}
              help={errors.email?.message ? t(errors.email.message) : undefined}
              className="register-form-item"
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder={t('auth.email')}
                    size="large"
                    variant="borderless"
                    className="register-input"
                  />
                )}
              />
            </Form.Item>

            {/* Password + Confirm Password — side by side */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  validateStatus={errors.password ? 'error' : undefined}
                  help={
                    errors.password?.message
                      ? t(errors.password.message, { min: 8 })
                      : undefined
                  }
                  className="register-form-item"
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder={t('auth.password')}
                        size="large"
                        variant="borderless"
                        className="register-input"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  validateStatus={errors.confirmPassword ? 'error' : undefined}
                  help={
                    errors.confirmPassword?.message
                      ? t(errors.confirmPassword.message)
                      : undefined
                  }
                  className="register-form-item"
                >
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder={t('auth.confirmPassword')}
                        size="large"
                        variant="borderless"
                        className="register-input"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Submit */}
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                block
                size="large"
                className="register-button"
              >
                {t('auth.registerButton') || 'Register'}
              </Button>
            </Form.Item>
          </form>

          {/* Terms notice */}
          <Paragraph className="register-terms">
            By registering, you agree to our{' '}
            <Link to="/terms">Terms</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </Paragraph>

          <Divider className="register-divider" />

          {/* Login link */}
          <Text className="register-login-link">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#000', fontWeight: 700 }}>
              {t('auth.loginButton') || 'Log in instead'}
            </Link>
          </Text>
        </Card>
      </Content>

      {/* Footer */}
      <Footer className="register-footer">
        <Text className="register-footer-text">© 2024 Nest &amp; Field Art Toys</Text>
        <div className="register-footer-links">
          {['Twitter', 'Instagram', 'Discord'].map((platform) => (
            <a key={platform} href="#" className="register-nav-link">
              {platform}
            </a>
          ))}
        </div>
      </Footer>
    </Layout>
  );
}