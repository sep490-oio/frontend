import { Typography, Timeline, Card, Tag, Flex } from 'antd'
import {
  WalletOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CreditCardOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const { Text, Title } = Typography

/**
 * Visual money-flow explainer showing the lifecycle of funds in OIO auctions.
 * Renders as a timeline with explanations for each step:
 *   Deposit → Bid/BuyNow → Win → Payment → Escrow → Release
 */
export function MoneyFlowExplainer() {
  const { t } = useTranslation('payment')
  const { isMobile } = useBreakpoint()

  const steps = [
    {
      icon: <WalletOutlined />,
      color: 'var(--color-accent)' as const,
      title: t('flow.deposit.title', 'Deposit (Đặt cọc)'),
      tag: t('flow.deposit.tag', 'Hold'),
      tagColor: 'warning',
      desc: t(
        'flow.deposit.desc',
        'Khi tham gia đấu giá, bạn đặt cọc từ ví. Số tiền này bị tạm giữ (hold) — không thể rút hay sử dụng cho đến khi phiên đấu giá kết thúc.',
      ),
    },
    {
      icon: <ArrowRightOutlined />,
      color: 'var(--color-info)' as const,
      title: t('flow.bid.title', 'Bid / Buy Now'),
      tag: t('flow.bid.tag', 'Active'),
      tagColor: 'processing',
      desc: t(
        'flow.bid.desc',
        'Bạn đấu giá hoặc mua ngay. Deposit vẫn bị giữ trong suốt phiên đấu giá. Nếu bạn không thắng, deposit sẽ được hoàn lại 100%.',
      ),
    },
    {
      icon: <TrophyOutlined />,
      color: 'var(--color-success)' as const,
      title: t('flow.win.title', 'Win (Thắng đấu giá)'),
      tag: t('flow.win.tag', 'Won'),
      tagColor: 'success',
      desc: t(
        'flow.win.desc',
        'Nếu thắng, deposit được trừ vào giá thanh toán. Bạn chỉ cần thanh toán phần còn lại. Nếu hủy thanh toán, bạn mất 50% deposit.',
      ),
    },
    {
      icon: <CreditCardOutlined />,
      color: 'var(--color-accent)' as const,
      title: t('flow.payment.title', 'Payment (Thanh toán)'),
      tag: t('flow.payment.tag', 'Debit'),
      tagColor: 'error',
      desc: t(
        'flow.payment.desc',
        'Thanh toán phần chênh lệch (giá cuối − deposit). Tiền được trừ từ ví hoặc qua VNPay. Sau thanh toán, đơn hàng chuyển sang trạng thái xử lý.',
      ),
    },
    {
      icon: <LockOutlined />,
      color: 'var(--color-warning)' as const,
      title: t('flow.escrow.title', 'Escrow (Ký quỹ)'),
      tag: t('flow.escrow.tag', 'Protected'),
      tagColor: 'warning',
      desc: t(
        'flow.escrow.desc',
        'Tiền thanh toán được giữ trong ký quỹ (escrow) — chưa chuyển cho seller. Bảo vệ buyer trong trường hợp cần hoàn tiền hoặc khiếu nại.',
      ),
    },
    {
      icon: <CheckCircleOutlined />,
      color: 'var(--color-success)' as const,
      title: t('flow.release.title', 'Release (Giải ngân)'),
      tag: t('flow.release.tag', 'Complete'),
      tagColor: 'success',
      desc: t(
        'flow.release.desc',
        'Sau khi buyer xác nhận nhận hàng (hoặc hết hạn khiếu nại), tiền escrow được giải ngân cho seller. Giao dịch hoàn tất.',
      ),
    },
  ]

  return (
    <Card
      styles={{ body: { padding: isMobile ? 16 : 24 } }}
      style={{
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Title level={5} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SafetyCertificateOutlined style={{ color: 'var(--color-accent)' }} />
        {t('flow.title', 'Dòng tiền đấu giá')}
      </Title>

      {/* Visual flow bar */}
      <Flex
        wrap="wrap"
        gap={4}
        style={{
          marginBottom: 24,
          padding: '12px 16px',
          background: 'var(--color-bg-secondary)',
          borderRadius: 12,
        }}
      >
        {steps.map((step, i) => (
          <Flex key={i} align="center" gap={4}>
            <Tag
              color={step.tagColor}
              bordered={false}
              style={{ fontSize: 11, fontWeight: 600, margin: 0, borderRadius: 6 }}
            >
              {step.title.split('(')[0].trim()}
            </Tag>
            {i < steps.length - 1 && (
              <ArrowRightOutlined style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }} />
            )}
          </Flex>
        ))}
      </Flex>

      {/* Detailed timeline */}
      <Timeline
        items={steps.map((step) => ({
          color: step.color,
          dot: <span style={{ fontSize: 16 }}>{step.icon}</span>,
          children: (
            <div style={{ paddingBottom: 8 }}>
              <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                <Text strong style={{ fontSize: 14 }}>
                  {step.title}
                </Text>
                <Tag
                  color={step.tagColor}
                  bordered={false}
                  style={{ fontSize: 10, borderRadius: 4, margin: 0 }}
                >
                  {step.tag}
                </Tag>
              </Flex>
              <Text style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {step.desc}
              </Text>
            </div>
          ),
        }))}
      />
    </Card>
  )
}
