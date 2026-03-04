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

/** Zod schema — validates the account (username or email) + password fields */
const loginSchema = z.object({
  account: z.string().min(1, 'auth.accountRequired'),
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

  // design-system-aligned CSS classes are applied via className
  // No need for style constants anymore

  return (
    <Layout className="login-page">
      <Content className="login-content">
        <Card className="login-card" classNames={{ body: 'login-card-body' }}>
          <Title level={2} className="login-title">
            {t('auth.loginTitle')}
          </Title>
          <Paragraph className="login-subtitle">
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
                    className="login-input"
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
                    className="login-input"
                  />
                )}
              />
            </Form.Item>
            <div className="login-forgot-password">
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
                className="login-button"
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>
          </Form>

          <Divider className="login-divider" />

          <div className="login-signup-section">
            <Text className="login-signup-text">
              {t('auth.noAccount') || "DON'T HAVE AN ACCOUNT?"}
            </Text>
            <Link to="/register">
              <Button type="default" size="large" className="login-signup-button">
                {t('auth.registerButton')}
              </Button>
            </Link>
          </div>

          <Text className="login-agreement-text">
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
