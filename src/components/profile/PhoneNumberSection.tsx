/**
 * PhoneNumberSection — 3-step phone number management.
 *
 * Step 1 (display): Show current phone or "Not set" with Change button
 * Step 2 (input): Phone number field → sends verification SMS
 * Step 3 (verify): 6-digit code field → confirms phone
 */
import { useState } from 'react';
import { Button, Flex, Form, Input, Tag, Typography, message } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSetPhoneNumber, useConfirmPhone } from '@/hooks/useUser';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const { Text } = Typography;

type PhoneStep = 'display' | 'input' | 'verify';

const phoneSchema = z.object({
  phoneNumber: z.string().min(1, 'profile.phoneRequired'),
});

const verifySchema = z.object({
  verificationCode: z.string().min(1, 'profile.verificationCodeRequired'),
});

interface PhoneNumberSectionProps {
  currentPhone: string | null | undefined;
  phoneConfirmed: boolean;
}

export function PhoneNumberSection({ currentPhone, phoneConfirmed }: PhoneNumberSectionProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const [step, setStep] = useState<PhoneStep>('display');
  const setPhoneMutation = useSetPhoneNumber();
  const confirmPhoneMutation = useConfirmPhone();

  const phoneForm = useForm<{ phoneNumber: string }>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: currentPhone ?? '' },
  });

  const verifyForm = useForm<{ verificationCode: string }>({
    resolver: zodResolver(verifySchema),
    defaultValues: { verificationCode: '' },
  });

  const handleSetPhone = async (data: { phoneNumber: string }) => {
    try {
      await setPhoneMutation.mutateAsync({ phoneNumber: data.phoneNumber });
      message.success(t('profile.verificationSent'));
      setStep('verify');
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleVerify = async (data: { verificationCode: string }) => {
    try {
      await confirmPhoneMutation.mutateAsync({ verificationCode: data.verificationCode });
      message.success(t('profile.phoneConfirmed'));
      setStep('display');
    } catch {
      verifyForm.setError('verificationCode', { message: 'profile.invalidCode' });
    }
  };

  return (
    <div className="security-section">
      <Text className="profile-field-label">{t('profile.phoneNumber')}</Text>

      {step === 'display' && (
        <Flex align={isMobile ? 'flex-start' : 'center'} gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
          <PhoneOutlined style={{ color: '#8c8c8c' }} />
          <Text>{currentPhone || t('profile.phoneNotSet')}</Text>
          {currentPhone && (
            phoneConfirmed ? (
              <Tag className="profile-tag profile-tag-confirmed">{t('profile.confirmed')}</Tag>
            ) : (
              <Tag className="profile-tag profile-tag-unconfirmed">{t('profile.unconfirmed')}</Tag>
            )
          )}
          <Button size="small" onClick={() => setStep('input')}>
            {currentPhone ? t('profile.changePhone') : t('profile.addPhone')}
          </Button>
        </Flex>
      )}

      {step === 'input' && (
        <form onSubmit={phoneForm.handleSubmit(handleSetPhone)}>
          <Form.Item
            validateStatus={phoneForm.formState.errors.phoneNumber ? 'error' : undefined}
            help={
              phoneForm.formState.errors.phoneNumber?.message
                ? t(phoneForm.formState.errors.phoneNumber.message)
                : undefined
            }
            style={{ marginBottom: 16 }}
          >
            <Controller
              name="phoneNumber"
              control={phoneForm.control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder={t('profile.enterPhone')}
                  size="large"
                  variant="borderless"
                  className="profile-input"
                />
              )}
            />
          </Form.Item>
          <Flex gap={8} wrap="wrap">
            <Button
              type="primary"
              htmlType="submit"
              loading={setPhoneMutation.isPending}
              size="large"
              className="profile-save-button"
            >
              {t('profile.sendCode')}
            </Button>
            <Button size="large" onClick={() => setStep('display')}>
              {t('common.cancel')}
            </Button>
          </Flex>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={verifyForm.handleSubmit(handleVerify)}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            {t('profile.enterVerificationCode')}
          </Text>
          <Form.Item
            validateStatus={verifyForm.formState.errors.verificationCode ? 'error' : undefined}
            help={
              verifyForm.formState.errors.verificationCode?.message
                ? t(verifyForm.formState.errors.verificationCode.message)
                : undefined
            }
            style={{ marginBottom: 16 }}
          >
            <Controller
              name="verificationCode"
              control={verifyForm.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t('profile.verificationCode')}
                  size="large"
                  variant="borderless"
                  className="profile-input"
                  maxLength={6}
                />
              )}
            />
          </Form.Item>
          <Flex gap={8} wrap="wrap">
            <Button
              type="primary"
              htmlType="submit"
              loading={confirmPhoneMutation.isPending}
              size="large"
              className="profile-save-button"
            >
              {t('profile.verify')}
            </Button>
            <Button size="large" onClick={() => setStep('display')}>
              {t('common.cancel')}
            </Button>
          </Flex>
        </form>
      )}
    </div>
  );
}
