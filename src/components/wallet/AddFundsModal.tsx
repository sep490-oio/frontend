/**
 * AddFundsModal — add money to the wallet via VNPay payment redirect.
 *
 * User selects an amount and payment method, then gets redirected to
 * VNPay to complete payment. After payment, VNPay redirects back and
 * the wallet balance updates via IPN callback.
 *
 * The modal is controlled by the parent (WalletPage) via open/onClose.
 * Responsive: full-width on mobile, 480px on desktop.
 */

import { useState } from 'react';
import { Modal, Form, InputNumber, Radio, Space, Alert, message } from 'antd';
import {
  CreditCardOutlined,
  WalletOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';
import { api } from '@/services/api';

interface AddFundsModalProps {
  open: boolean;
  onClose: () => void;
}

/** Minimum deposit amount: 50,000 VND */
const MIN_AMOUNT = 50_000;

export function AddFundsModal({ open, onClose }: AddFundsModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      setSubmitting(true);
      try {
        // Call VNPay to create a payment URL for wallet top-up
        const { data } = await api.post('/api/payments/vnpay/create-url', {
          purpose: 'wallet_top_up',
          amount: values.amount,
          currency: 'VND',
          description: `Wallet top-up ${values.amount} VND`,
        });
        const paymentUrl = ((data as Record<string, unknown>)?.data ?? data) as Record<string, unknown>;
        const url = paymentUrl?.paymentUrl as string;
        if (url) {
          window.location.href = url; // Redirect to VNPay
        } else {
          message.error(t('common.error'));
          setSubmitting(false);
        }
      } catch {
        message.error(t('common.error'));
        setSubmitting(false);
      }
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('wallet.addFundsTitle')}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      okText={t('wallet.addFunds')}
      cancelText={t('common.cancel')}
      width={isMobile ? '100%' : 480}
      style={isMobile ? { top: 20 } : undefined}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* Amount input */}
        <Form.Item
          name="amount"
          label={t('wallet.addFundsAmount')}
          rules={[
            { required: true, message: t('wallet.addFundsAmountRequired') },
            {
              type: 'number',
              min: MIN_AMOUNT,
              message: t('wallet.addFundsAmountMin', {
                amount: formatVND(MIN_AMOUNT),
              }),
            },
          ]}
        >
          <InputNumber<number>
            style={{ width: '100%' }}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
            }
            parser={(value) =>
              Number(value?.replace(/\./g, '') ?? 0)
            }
            addonAfter="VND"
            placeholder="500.000"
            min={0}
            step={50_000}
          />
        </Form.Item>

        {/* Payment method selection */}
        <Form.Item
          name="paymentMethod"
          label={t('wallet.paymentMethod')}
          rules={[
            { required: true, message: t('wallet.paymentMethodRequired') },
          ]}
        >
          <Radio.Group style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="vnpay">
                <Space>
                  <CreditCardOutlined />
                  {t('wallet.methodVnpay')}
                </Space>
              </Radio>
              <Radio value="momo">
                <Space>
                  <WalletOutlined />
                  {t('wallet.methodMomo')}
                </Space>
              </Radio>
              <Radio value="bank_transfer">
                <Space>
                  <BankOutlined />
                  {t('wallet.methodBank')}
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {/* Info note: this is a simulation */}
        <Alert
          type="info"
          message={t('wallet.addFundsNote')}
          showIcon
          style={{ marginBottom: 0 }}
        />
      </Form>
    </Modal>
  );
}
