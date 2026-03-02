/**
 * LoginPage — user login form.
 *
 * Uses React Hook Form + Zod for validation.
 * On successful login:
 *   1. POST /api/auth/login → receive tokens
 *   2. GET /api/users/me    → receive user data
 *   3. Store credentials in Redux → redirect to intended page
 */
import { Card, Button, Form, Input, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
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
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          {t('auth.loginTitle')}
        </Title>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email field — the backend accepts this as the 'account' field */}
          <Form.Item
            validateStatus={errors.account ? 'error' : ''}
            help={errors.account?.message ? t(errors.account.message) : undefined}
          >
            <Controller
              name="account"
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

          <Form.Item
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message ? t(errors.password.message) : undefined}
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

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting} block size="large">
              {t('auth.loginButton')}
            </Button>
          </Form.Item>
        </form>

        <Divider />

        <Text style={{ display: 'block', textAlign: 'center' }}>
          {t('auth.noAccount')} <Link to="/register">{t('auth.registerButton')}</Link>
        </Text>
      </Card>
    </div>
  );
}
