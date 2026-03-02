/**
 * OrderPaymentInfo — escrow status and payment details.
 *
 * Shows the escrow lifecycle (holding → released/refunded/disputed)
 * and relevant timestamps.
 */

import { Card, Descriptions, Tag, Typography } from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Order, EscrowStatus } from '@/types';
import { formatVND, formatDate } from '@/utils/formatters';

const { Text } = Typography;

interface OrderPaymentInfoProps {
  order: Order;
}

const ESCROW_COLORS: Record<EscrowStatus, string> = {
  holding: 'processing',
  released_to_seller: 'success',
  refunded_to_buyer: 'default',
  disputed: 'error',
};

const ESCROW_KEYS: Record<EscrowStatus, string> = {
  holding: 'orders.escrowHolding',
  released_to_seller: 'orders.escrowReleased',
  refunded_to_buyer: 'orders.escrowRefunded',
  disputed: 'orders.escrowDisputed',
};

const ESCROW_ICONS: Record<EscrowStatus, React.ReactNode> = {
  holding: <SafetyCertificateOutlined />,
  released_to_seller: <CheckCircleOutlined />,
  refunded_to_buyer: <CheckCircleOutlined />,
  disputed: <ExclamationCircleOutlined />,
};

export function OrderPaymentInfo({ order }: OrderPaymentInfoProps) {
  const { t } = useTranslation();

  return (
    <Card title={t('orders.paymentInfo')} size="small">
      <Descriptions column={1} size="small">
        <Descriptions.Item label={t('orders.totalAmount')}>
          <Text strong style={{ color: '#1677ff' }}>
            {formatVND(order.totalAmount)}
          </Text>
        </Descriptions.Item>

        {order.paidAt && (
          <Descriptions.Item label={t('orders.paidAt')}>
            {formatDate(order.paidAt)}
          </Descriptions.Item>
        )}

        {order.escrow && (
          <Descriptions.Item label={t('orders.escrowStatus')}>
            <Tag
              color={ESCROW_COLORS[order.escrow.status]}
              icon={ESCROW_ICONS[order.escrow.status]}
            >
              {t(ESCROW_KEYS[order.escrow.status])}
            </Tag>
          </Descriptions.Item>
        )}

        {order.escrow && (
          <Descriptions.Item label={t('orders.escrowStatus')}>
            {formatVND(order.escrow.amount)}
          </Descriptions.Item>
        )}

        {order.escrow?.releasedAt && (
          <Descriptions.Item label={t('orders.completedAt')}>
            {formatDate(order.escrow.releasedAt)}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('orders.shippingAddress')}
          </Text>
          <div>
            <Text style={{ fontSize: 13 }}>
              {[order.shippingAddress.street, order.shippingAddress.ward, order.shippingAddress.district, order.shippingAddress.city].filter(Boolean).join(', ')}
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
