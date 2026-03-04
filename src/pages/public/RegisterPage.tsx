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

  const pageStyle: React.CSSProperties = {
    minHeight: '60vh',
    background: '#F8F8F8',
  };




  const navLinkStyle: React.CSSProperties = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    fontWeight: 500,
    color: '#8c8c8c',
    textDecoration: 'none',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    flex: 1,
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 520,
    borderRadius: 0,
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    border: '1px solid #e8e8e8',
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: '48px 56px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 32,
    letterSpacing: '-1px',
    textTransform: 'uppercase',
    color: '#000',
    marginBottom: 4,
  };

  const submitButtonStyle: React.CSSProperties = {
    height: 52,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    background: '#000',
    border: 'none',
    borderRadius: 0,
  };

  const footerStyle: React.CSSProperties = {
    background: 'transparent',
    padding: '24px 40px',
    borderTop: '1px solid #e8e8e8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  };

  const footerTextStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#bfbfbf',
  };

  const inputStyle: React.CSSProperties = {
    borderRadius: 0,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '1px solid #d9d9d9',
    boxShadow: 'none',
    paddingLeft: 0,
    background: 'transparent',
  };

  if (registered) {
    return (
      <Layout style={pageStyle}>
        <Content style={contentStyle}>
          <Card style={{ ...cardStyle, maxWidth: 460 }} styles={{ body: cardBodyStyle }}>
            <Alert
              type="success"
              message={t('auth.registerSuccess')}
              showIcon
              style={{ marginBottom: 24 }}
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
    <Layout style={pageStyle}>



      {/* Main content */}
      <Content style={contentStyle}>
        <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
          {/* Page heading */}
          <Title level={2} style={titleStyle}>
            {t('auth.registerTitle') || 'Create Account'}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 40, fontSize: 13 }}>
            Join the premier destination for designer art toys.
          </Paragraph>

          {/* Root error */}
          {errors.root && (
            <Alert
              type="error"
              message={t(errors.root.message ?? 'common.error')}
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Username */}
            <Form.Item
              validateStatus={errors.userName ? 'error' : undefined}
              help={errors.userName?.message ? t(errors.userName.message) : undefined}
              style={{ marginBottom: 24 }}
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
                    style={inputStyle}
                  />
                )}
              />
            </Form.Item>

            {/* Full Name – side-by-side */}
            <Text
              style={{
                display: 'block',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: 700,
                color: '#8c8c8c',
                marginBottom: 8,
              }}
            >
              Full Name
            </Text>
            <Row gutter={16} style={{ marginBottom: 24 }}>
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
                        style={inputStyle}
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
                        style={inputStyle}
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
              style={{ marginBottom: 24 }}
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
                    style={inputStyle}
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
                  style={{ marginBottom: 24 }}
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
                        style={inputStyle}
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
                  style={{ marginBottom: 24 }}
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
                        style={inputStyle}
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
                style={submitButtonStyle}
              >
                {t('auth.registerButton') || 'Register'}
              </Button>
            </Form.Item>
          </form>

          {/* Terms notice */}
          <Paragraph
            type="secondary"
            style={{ textAlign: 'center', marginTop: 20, fontSize: 11 }}
          >
            By registering, you agree to our{' '}
            <Link to="/terms">Terms</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </Paragraph>

          <Divider style={{ margin: '24px 0' }} />

          {/* Login link */}
          <Text style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#8c8c8c' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#000', fontWeight: 700 }}>
              {t('auth.loginButton') || 'Log in instead'}
            </Link>
          </Text>
        </Card>
      </Content>

      {/* Footer */}
      <Footer style={footerStyle}>
        <Text style={footerTextStyle}>© 2024 Nest &amp; Field Art Toys</Text>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Twitter', 'Instagram', 'Discord'].map((platform) => (
            <a key={platform} href="#" style={navLinkStyle}>
              {platform}
            </a>
          ))}
        </div>
      </Footer>
    </Layout>
  );
}