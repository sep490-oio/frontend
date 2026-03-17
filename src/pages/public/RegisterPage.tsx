/**
 * RegisterPage — new user registration form.
 *
 * Creates an account via POST /api/auth/register.
 * The backend does NOT return tokens on register — it sends a confirmation
 * email instead. So after success, we show a message and stay on this page
 * (no auto-login). The user must confirm their email, then go to /login.
 */
import { useState } from 'react';
import { Alert, Button, Form, Input, Checkbox } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { register } from '@/services/authService';

import './RegisterPage.scss';

const registerSchema = z
  .object({
    userName: z.string().min(1, 'Tên đăng nhập không được để trống'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
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
            setError('email', { message: 'Email đã được sử dụng' });
          } else if (msg.includes('username') || msg.includes('user')) {
            setError('userName', { message: 'Tên đăng nhập đã tồn tại' });
          } else {
            setError('email', { message: 'Email đã được sử dụng' });
          }
        } else {
          setError('root', { message: 'Đã xảy ra lỗi, vui lòng thử lại' });
        }
      } else {
        setError('root', { message: 'Đã xảy ra lỗi, vui lòng thử lại' });
      }
    }
  };

  if (registered) {
    return (
      <div className="register-page">
        <div className="register-card">
          <div className="register-hero">
            <div className="sphere-container">
              <div className="sphere-glow" />
              <div className="sphere" />
            </div>
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="hero-title-line">Đăng ký</span>
                <span className="hero-title-line accent">thành công</span>
              </h1>
              <p className="hero-subtitle">
                Chúng tôi đã gửi liên kết xác nhận đến email của bạn. Vui lòng kiểm tra hộp thư.
              </p>
              <div className="hero-stats">
                <div className="stat">
                  <div className="stat-value">50k+</div>
                  <div className="stat-label">Vật phẩm</div>
                </div>
                <div className="stat">
                  <div className="stat-value">120+</div>
                  <div className="stat-label">Quốc gia</div>
                </div>
                <div className="stat">
                  <div className="stat-value">$2.4B</div>
                  <div className="stat-label">Giao dịch</div>
                </div>
              </div>
            </div>
          </div>

          <div className="register-panel">
            <div className="register-header">
              <div className="brand">
                <div className="brand-icon" />
                <div className="brand-name">oio.vn</div>
              </div>
            </div>

            <div className="success-message">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                  <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="success-title">Xác nhận email của bạn</h2>
              <p className="success-text">
                Chúng tôi đã gửi một email xác nhận đến địa chỉ email bạn đã đăng ký. Vui lòng nhấp vào liên kết trong email để kích hoạt tài khoản.
              </p>
              <p className="resend-text">
                Không nhận được email? <button type="button" className="resend-btn">Gửi lại</button>
              </p>
            </div>

            <div className="register-footer">
              <div className="login-redirect">
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-hero">
          <div className="sphere-container">
            <div className="sphere-glow" />
            <div className="sphere" />
          </div>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-line">Trải nghiệm</span>
              <span className="hero-title-line accent">Đấu giá Thế hệ mới</span>
            </h1>
            <p className="hero-subtitle">
              Khám phá các bộ sưu tập kỹ thuật số độc bản và vật phẩm hiếm có thông qua nền tảng bảo mật hàng đầu.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">50k+</div>
                <div className="stat-label">Vật phẩm</div>
              </div>
              <div className="stat">
                <div className="stat-value">120+</div>
                <div className="stat-label">Quốc gia</div>
              </div>
              <div className="stat">
                <div className="stat-value">$2.4B</div>
                <div className="stat-label">Giao dịch</div>
              </div>
            </div>
          </div>
        </div>

        <div className="register-panel">
          <div className="register-header">
            <div className="brand">
              <div className="brand-icon" />
              <div className="brand-name">oio.vn</div>
            </div>
            <button type="button" className="top-action" aria-label="Menu">
              <MenuOutlined />
            </button>
          </div>

          <div className="register-intro">
            <h2 className="register-title">Tạo tài khoản mới</h2>
            <p className="register-subtitle">
              Tham gia cộng đồng đấu giá độc quyền của chúng tôi
            </p>
          </div>

          {errors.root && (
            <Alert
              type="error"
              message={errors.root.message}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form className="register-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Tên đăng nhập"
              validateStatus={errors.userName ? 'error' : undefined}
              help={errors.userName?.message}
            >
              <Controller
                name="userName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="Tên đăng nhập"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <div className="form-row">
              <Form.Item
                label="Họ"
                validateStatus={errors.firstName ? 'error' : undefined}
                help={errors.firstName?.message}
              >
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Họ" size="large" />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Tên"
                validateStatus={errors.lastName ? 'error' : undefined}
                help={errors.lastName?.message}
              >
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Tên" size="large" />
                  )}
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : undefined}
              help={errors.email?.message}
            >
              <Controller
                name="email"
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
              help={errors.password?.message}
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

            <Form.Item
              label="Xác nhận mật khẩu"
              validateStatus={errors.confirmPassword ? 'error' : undefined}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
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

            <Form.Item>
              <Checkbox>
                Tôi đồng ý với <a href="/terms">Điều khoản</a> và <a href="/privacy">Chính sách bảo mật</a>
              </Checkbox>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              size="large"
              className="register-submit"
              block
            >
              Tạo tài khoản
            </Button>

            <div className="divider">HOẶC ĐĂNG KÝ VỚI</div>

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

            <div className="register-footer">
              <div className="login-redirect">
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
