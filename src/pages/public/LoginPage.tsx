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
          <div className="sphere-container">
            <div className="sphere-glow" />
            <div className="sphere" />
          </div>
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
            <h2 className="login-title">Chào mừng quay trở lại</h2>
            <p className="login-subtitle">
              Đăng nhập để tiếp tục tham gia các phiên đấu giá độc quyền.
            </p>
          </div>

          <Form layout="vertical" className="login-form" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Email"
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
                    placeholder="nhap@email.com"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
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
                    placeholder="••••••••"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <div className="login-actions">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
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
                Đăng nhập ngay
              </Button>
            </Form.Item>

            <div className="divider">HOẶC ĐĂNG NHẬP VỚI</div>

            <div className="social-buttons">
              <button type="button" className="social-btn" onClick={() => {}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button type="button" className="social-btn" onClick={() => {}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            <div className="register-row">
              <span>Chưa có tài khoản?</span>
              <Link className="register-link" to="/register">
                Đăng ký ngay
              </Link>
            </div>

            <div className="login-footer">
              <div className="links">
                <Link to="/terms">Điều khoản</Link>
                <Link to="/privacy">Chính sách bảo mật</Link>
                <Link to="/support">Hỗ trợ</Link>
              </div>
              <div className="copyright">
                © {new Date().getFullYear()} Metaz Auction Platform. All rights reserved.
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
