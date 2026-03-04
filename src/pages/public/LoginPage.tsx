/**
 * LoginPage — user login form.
 *
 * Uses React Hook Form + Zod for validation.
 * On successful login:
 *   1. POST /api/auth/login → receive tokens
 *   2. GET /api/users/me    → receive user data
 *   3. Store credentials in Redux → redirect to intended page
 */
import { Button, Form, Input, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined,EyeOutlined,EyeInvisibleOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { login, getMe, mapApiUserToUser, getOrCreateDeviceId } from '@/services/authService';

const { Title, Text } = Typography;

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
      <Title
        level={2}
        style={{
          textAlign: 'center',
          marginBottom: 8,
          fontWeight: 700,
          color: '#1a1a1a',
        }}
      >
        {t('auth.loginTitle')}
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
        Sign in to your luxury auction account
      </Text>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '40px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid #eee',
        }}
      >
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
                  style={{ borderRadius: 8 }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message ? t(errors.password.message) : undefined}
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
                  placeholder={t('auth.password')}
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              )}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link to="/forgot-password" style={{ color: '#000', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>

          <Form.Item>
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
              {t('auth.loginButton')}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '32px 0 24px' }} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
            DON'T HAVE AN ACCOUNT?
          </Text>
          <Link to="/register">
            <Button type="default" size="large" style={{ borderRadius: 8, minWidth: 180 }}>
              {t('auth.registerButton')}
            </Button>
          </Link>
        </div>
      </div>

      <Text
        type="secondary"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 24,
          fontSize: 13,
        }}
      >
        By continuing, you agree to our{' '}
        <Link to="/terms">Terms of Service</Link> and{' '}
        <Link to="/privacy">Privacy Policy</Link>
      </Text>
    </div>
  </div>
);
}
