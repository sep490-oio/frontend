/**
 * ChangePasswordSection — password change form with current + new + confirm.
 *
 * Uses Zod refine for password match validation.
 * Resets form on success.
 */
import { Button, Col, Form, Input, Row, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePassword } from '@/hooks/useUser';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const { Text } = Typography;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'profile.currentPasswordRequired'),
    newPassword: z.string().min(8, 'auth.passwordMinLength'),
    confirmNewPassword: z.string().min(1, 'auth.passwordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmNewPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ChangePasswordSection() {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const changePasswordMutation = useChangePassword();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      message.success(t('profile.passwordChanged'));
      reset();
    } catch {
      setError('currentPassword', { message: 'profile.currentPasswordWrong' });
    }
  };

  return (
    <div className="security-section">
      <Text className="profile-field-label">{t('profile.changePassword')}</Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Form.Item
          validateStatus={errors.currentPassword ? 'error' : undefined}
          help={errors.currentPassword?.message ? t(errors.currentPassword.message) : undefined}
          className="profile-form-item"
        >
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder={t('profile.currentPassword')}
                size="large"
                variant="borderless"
                className="profile-input"
              />
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.newPassword ? 'error' : undefined}
              help={
                errors.newPassword?.message
                  ? t(errors.newPassword.message, { min: 8 })
                  : undefined
              }
              className="profile-form-item"
            >
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder={t('profile.newPassword')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.confirmNewPassword ? 'error' : undefined}
              help={
                errors.confirmNewPassword?.message
                  ? t(errors.confirmNewPassword.message)
                  : undefined
              }
              className="profile-form-item"
            >
              <Controller
                name="confirmNewPassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder={t('profile.confirmNewPassword')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting || changePasswordMutation.isPending}
          size="large"
          className="profile-save-button"
          style={{ marginTop: isMobile ? 0 : 8 }}
        >
          {t('profile.updatePassword')}
        </Button>
      </form>
    </div>
  );
}
