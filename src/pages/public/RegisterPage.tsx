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
import { Card, Button, Form, Input, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { register } from '@/services/authService';

const { Title, Text } = Typography;

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

      // Registration succeeded — show the "check your email" message
      // Do NOT navigate to dashboard — the user must confirm email first
      setRegistered(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          // Conflict — email or username already taken
          // The backend error body may specify which field
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

  // After successful registration — show only the success message
  if (registered) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
        <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Alert
            type="success"
            title={t('auth.registerSuccess')}
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Text style={{ display: 'block', textAlign: 'center' }}>
            <Link to="/login">{t('auth.loginButton')}</Link>
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          {t('auth.registerTitle')}
        </Title>

        {/* Root-level error (network failure, unknown server error) */}
        {errors.root && (
          <Alert
            type="error"
            title={t(errors.root.message ?? 'common.error')}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Item
            validateStatus={errors.userName ? 'error' : ''}
            help={errors.userName?.message ? t(errors.userName.message) : undefined}
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
                />
              )}
            />
          </Form.Item>

          {/* First name + Last name side by side */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Form.Item
              style={{ flex: 1 }}
              validateStatus={errors.firstName ? 'error' : ''}
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
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              style={{ flex: 1 }}
              validateStatus={errors.lastName ? 'error' : ''}
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
                  />
                )}
              />
            </Form.Item>
          </div>

          <Form.Item
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message ? t(errors.email.message) : undefined}
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
                />
              )}
            />
          </Form.Item>

          <Form.Item
            validateStatus={errors.password ? 'error' : ''}
            help={
              errors.password?.message
                ? t(errors.password.message, { min: 8 })
                : undefined
            }
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

          <Form.Item
            validateStatus={errors.confirmPassword ? 'error' : ''}
            help={
              errors.confirmPassword?.message
                ? t(errors.confirmPassword.message)
                : undefined
            }
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
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting} block size="large">
              {t('auth.registerButton')}
            </Button>
          </Form.Item>
        </form>

        <Divider />

        <Text style={{ display: 'block', textAlign: 'center' }}>
          {t('auth.hasAccount')} <Link to="/login">{t('auth.loginButton')}</Link>
        </Text>
      </Card>
    </div>
  );
}
