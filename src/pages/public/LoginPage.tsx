/**
 * LoginPage — user login form.
 *
 * Uses React Hook Form + Zod for validation.
 * On successful login:
 *   1. POST /api/auth/login → receive tokens
 *   2. GET /api/users/me    → receive user data
 *   3. Store credentials in Redux → redirect to intended page
 */
import './LoginPage.scss';

import { Button, Form, Input, Checkbox, message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { login, getMe, mapApiUserToUser, getOrCreateDeviceId } from '@/services/authService';

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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-line">
                {t('auth.heroTitleLine1', { defaultValue: 'Trải nghiệm' })}
              </span>
              <span className="hero-title-line accent">
                {t('auth.heroTitleLine2', { defaultValue: 'Đấu giá Thế hệ mới' })}
              </span>
            </h1>
            <p className="hero-subtitle">
              {t('auth.heroSubtitle', {
                defaultValue:
                  'Khám phá các bộ sưu tập kỹ thuật số độc bản và vật phẩm hiếm có thông qua nền tảng bảo mật hàng đầu.',
              })}
            </p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">50k+</div>
                <div className="stat-label">{t('auth.statItems', { defaultValue: 'Vật phẩm' })}</div>
              </div>
              <div className="stat">
                <div className="stat-value">120+</div>
                <div className="stat-label">{t('auth.statCountries', { defaultValue: 'Quốc gia' })}</div>
              </div>
              <div className="stat">
                <div className="stat-value">$2.4B</div>
                <div className="stat-label">{t('auth.statVolume', { defaultValue: 'Giao dịch' })}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-header">
            <div className="brand">
              <div className="brand-icon" />
              <div className="brand-name">oio.vn</div>
            </div>
            <button type="button" className="top-action" aria-label={t('common.menu') ?? 'Menu'}>
              <MenuOutlined />
            </button>
          </div>

          <div className="login-intro">
            <h2 className="login-title">{t('auth.loginTitle')}</h2>
            <p className="login-subtitle">
              {t('auth.loginSubtitle') || 'Sign in to your luxury auction account'}
            </p>
          </div>

          <Form layout="vertical" className="login-form" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label={t('auth.email')}
              validateStatus={errors.account ? 'error' : undefined}
              help={errors.account?.message ? t(errors.account.message) : undefined}
            >
              <Controller
                name="account"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="you@example.com"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={t('auth.password')}
              validateStatus={errors.password ? 'error' : undefined}
              help={errors.password?.message ? t(errors.password.message) : undefined}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    placeholder={t('auth.password')}
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <div className="login-actions">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{t('auth.rememberMe', { defaultValue: 'Remember me' })}</Checkbox>
              </Form.Item>

              <Link className="forgot-link" to="/forgot-password">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                size="large"
                className="login-submit"
                block
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>

            <div className="divider">{t('auth.orLoginWith', { defaultValue: 'Or log in with' })}</div>

            <div className="social-buttons">
              <button type="button" className="social-btn" onClick={() => {}}>
                <span className="label">Google</span>
              </button>
              <button type="button" className="social-btn" onClick={() => {}}>
                <span className="label">GitHub</span>
              </button>
            </div>

            <div className="register-row">
              <span>{t('auth.noAccount') || "Don't have an account?"}</span>
              <Link className="register-link" to="/register">
                {t('auth.registerButton')}
              </Link>
            </div>

            <div className="login-footer">
              <div className="links">
                <Link to="/terms">{t('auth.terms') || 'Terms'}</Link>
                <Link to="/privacy">{t('auth.privacy') || 'Privacy'}</Link>
                <Link to="/support">{t('common.support') ?? 'Support'}</Link>
              </div>
              <div className="copyright">
                © {new Date().getFullYear()} oio.vn All rights reserved.
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
