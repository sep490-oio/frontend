/**
 * LoginPage — user login form.
 *
 * Uses React Hook Form + Zod for validation.
 * On successful login:
 *   1. POST /api/auth/login → receive tokens
 *   2. GET /api/users/me    → receive user data
 *   3. Store credentials in Redux → redirect to intended page
 */
import { Button, Form, Input, Typography, message, Divider, Layout, Card } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { login, getMe, mapApiUserToUser, getOrCreateDeviceId } from '@/services/authService';

const { Text, Title, Paragraph } = Typography;
const { Content } = Layout;

/** Zod schema — validates the email + password fields */
const loginSchema = z.object({
  account: z.string().min(1, 'auth.emailRequired').email('auth.emailInvalid'),
  password: z.string().min(1, 'auth.passwordRequired'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Where to redirect after login (default: dashboard)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const deviceId = getOrCreateDeviceId();

      // Step 1: Authenticate — receive JWT tokens
      const tokenDto = await login({
        account: data.account,
        password: data.password,
        deviceId,
      });

      // Step 2: Fetch user profile with the fresh access token
      const userDto = await getMe(tokenDto.accessToken);
      const user = mapApiUserToUser(userDto, tokenDto.accessToken);

      // Step 3: Persist credentials in Redux + localStorage
      dispatch(
        setCredentials({
          user,
          accessToken: tokenDto.accessToken,
          refreshToken: tokenDto.refreshToken,
        })
      );

      message.success(t('dashboard.welcome', { name: user.fullName }));
      navigate(from, { replace: true });
    } catch (err) {
      // Show specific messages for known HTTP status codes
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          message.error(t('auth.invalidCredentials'));
        } else if (status === 403) {
          // Backend returns 403 when email is not yet confirmed
          message.error(t('auth.emailNotConfirmed'));
        } else {
          message.error(t('common.error'));
        }
      } else {
        message.error(t('common.error'));
      }
    }
  };

  // design-system‑aligned styles adapted from RegisterPage
  const pageStyle: React.CSSProperties = {
    minHeight: '60vh',
    background: '#F8F8F8',
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

  return (
    <Layout style={pageStyle}>
      <Content style={contentStyle}>
        <Card style={cardStyle} bodyStyle={cardBodyStyle}>
          <Title level={2} style={titleStyle}>
            {t('auth.loginTitle')}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 40, fontSize: 13 }}>
            {t('auth.loginSubtitle') || 'Sign in to your luxury auction account'}
          </Paragraph>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Email"
              validateStatus={errors.account ? 'error' : ''}
              help={errors.account?.message ? t(errors.account.message) : undefined}
            >
              <Controller
                name="account"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined style={{ color: '#888' }} />}
                    placeholder="you@example.com"
                    size="large"
                    style={inputStyle}
                  />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message ? t(errors.password.message) : undefined}
              style={{ marginBottom: 24 }}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined style={{ color: '#888' }} />}
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    placeholder={t('auth.password')}
                    size="large"
                    style={inputStyle}
                  />
                )}
              />
            </Form.Item>
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link to="/forgot-password" style={{ color: '#000', fontWeight: 500 }}>
                {t('auth.forgotPassword') || 'Forgot password?'}
              </Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                block
                size="large"
                style={submitButtonStyle}
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '32px 0 24px' }} />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
              {t('auth.noAccount') || "DON'T HAVE AN ACCOUNT?"}
            </Text>
            <Link to="/register">
              <Button type="default" size="large" style={{ height: 52, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: 0 }}>
                {t('auth.registerButton')}
              </Button>
            </Link>
          </div>

          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 13 }}>
            {t('auth.agreement') || 'By continuing, you agree to our'}{' '}
            <Link to="/terms">{t('auth.terms') || 'Terms of Service'}</Link>{' '}
            {t('auth.and') || 'and'}{' '}
            <Link to="/privacy">{t('auth.privacy') || 'Privacy Policy'}</Link>
          </Text>
        </Card>
      </Content>
    </Layout>
  );
}
