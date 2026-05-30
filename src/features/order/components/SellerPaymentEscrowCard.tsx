import { Card, Typography, Descriptions, Tag, Button, Space, Alert, Skeleton } from 'antd'
import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useSellerEscrowLedger } from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
import type { SellerEscrowLedgerRowDto } from '@/types'

interface SellerPaymentEscrowCardProps {
  orderId: string
  isMobile?: boolean
}

// Map BE-cased escrow statuses to lowercase tokens used by StatusBadge.
function escrowStatusToken(status: SellerEscrowLedgerRowDto['escrowStatus']): string {
  switch (status) {
    case 'Holding':
      return 'holding'
    case 'ReleasedToSeller':
      return 'released_to_seller'
    case 'RefundedToBuyer':
      return 'refunded_to_buyer'
    default:
      return String(status).toLowerCase()
  }
}

function holdReasonLabel(t: ReturnType<typeof useTranslation>['t'], reason: string | null): string {
  if (!reason) return ''
  const known: Record<string, string> = {
    awaiting_delivery: t('sellerFinance.holdReason.awaitingDelivery', 'Awaiting delivery'),
    awaiting_acceptance: t('sellerFinance.holdReason.awaitingAcceptance', 'Awaiting buyer confirmation'),
    frozen_by_dispute: t('sellerFinance.holdReason.frozenByDispute', 'Frozen by dispute'),
    inspection_in_progress: t('sellerFinance.holdReason.inspectionInProgress', 'Inspection in progress'),
  }
  return known[reason] ?? reason
}

/**
 * Seller-facing "Payment & Escrow" card on the order detail page.
 * Pulls the per-order row from the seller escrow ledger so all payment-side
 * numbers (gross, fees, expected payout) are shown verbatim from the BE
 * SellerEscrowLedgerRowDto — never recomputed locally.
 */
export function SellerPaymentEscrowCard({ orderId, isMobile }: SellerPaymentEscrowCardProps) {
  const { t } = useTranslation('payment')
  const { t: torder } = useTranslation('order')
  const navigate = useNavigate()
  const { data: ledger, isLoading } = useSellerEscrowLedger()

  const row = ledger?.find((r) => r.orderId === orderId)

  if (isLoading) {
    return (
      <Card
        style={{ marginBottom: isMobile ? 16 : 24 }}
        title={
          <span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>
            {torder('sellerOrder.paymentEscrow.title', 'Payment & Escrow')}
          </span>
        }
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    )
  }

  if (!row) {
    // No escrow row yet — buyer hasn't paid. Render a lightweight notice so the
    // seller knows why no breakdown is visible.
    return (
      <Card
        style={{ marginBottom: isMobile ? 16 : 24 }}
        title={
          <span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>
            {torder('sellerOrder.paymentEscrow.title', 'Payment & Escrow')}
          </span>
        }
      >
        <Typography.Text type="secondary">
          {torder(
            'sellerOrder.paymentEscrow.notYet',
            'Buyer has not paid for this order yet. Escrow details will appear once payment is complete.',
          )}
        </Typography.Text>
      </Card>
    )
  }

  const isReleased = row.escrowStatus === 'ReleasedToSeller'
  const netValue =
    isReleased && row.actualReleasedAmount != null ? row.actualReleasedAmount : row.estimatedNetPayout

  return (
    <Card
      style={{ marginBottom: isMobile ? 16 : 24 }}
      title={
        <span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>
           {torder('sellerOrder.paymentEscrow.title', 'Payment & Escrow')}
        </span>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {row.disputeId && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message={
              <span>
                <Tag color="error" icon={<WarningOutlined />} style={{ marginRight: 8 }}>
                  {t('sellerFinance.disputeFrozen', 'Frozen by dispute')}
                </Tag>
                {torder(
                  'sellerOrder.paymentEscrow.disputeNotice',
                  'Funds are held due to an active dispute.',
                )}
              </span>
            }
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate(`/me/disputes/${row.disputeId}`)}
              >
                {t('sellerFinance.action.viewDispute', 'View Dispute')}
              </Button>
            }
          />
        )}

        <Descriptions
          column={isMobile ? 1 : 2}
          bordered
          size="small"
          styles={{ label: { width: 200 } }}
        >
          <Descriptions.Item
            label={torder('sellerOrder.paymentEscrow.buyerPaid', 'Buyer Paid?')}
          >
            {row.buyerPaidAt ? (
              <Space>
                <Tag color="success">{t('yes', 'Yes')}</Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(row.buyerPaidAt)}
                </Typography.Text>
              </Space>
            ) : (
              <Tag>{t('no', 'No')}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={torder('sellerOrder.paymentEscrow.escrowStatus', 'Escrow Status')}
          >
            <StatusBadge status={escrowStatusToken(row.escrowStatus)} size="small" />
          </Descriptions.Item>
          {row.holdReason && (
            <Descriptions.Item
              label={torder('sellerOrder.paymentEscrow.holdReason', 'Why can\'t I withdraw?')}
              span={2}
            >
              <Typography.Text>
                <InfoCircleOutlined style={{ marginRight: 6, color: 'var(--color-text-tertiary)' }} />
                {holdReasonLabel(t, row.holdReason)}
              </Typography.Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item
            label={torder('sellerOrder.paymentEscrow.grossPaid', 'Buyer Paid (gross)')}
          >
            <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
              {formatCurrency(row.grossPaidAmount, row.currency)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              isReleased
                ? torder('sellerOrder.paymentEscrow.actualReleased', 'Released')
                : torder('sellerOrder.paymentEscrow.expectedNet', 'Estimated Seller Payout')
            }
          >
            <Space direction="vertical" size={0}>
              <span style={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: 16 }}>
                {formatCurrency(netValue, row.currency)}
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {isReleased
                  ? t('sellerFinance.label.released', 'Released')
                  : t('sellerFinance.label.estimate', '(estimate)')}
              </Typography.Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item
            label={torder('sellerOrder.paymentEscrow.platformFee', 'Platform Fee 10%')}
          >
            <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
              −{formatCurrency(row.platformCommissionAmount, row.currency)}
            </span>
          </Descriptions.Item>
          {row.isPlatformVerifiedItem && (
            <Descriptions.Item
              label={torder('sellerOrder.paymentEscrow.inspectionFee', 'Inspection Fee 3%')}
            >
              <span style={{ fontFamily: MONO_FONT, fontWeight: 600 }}>
                −{formatCurrency(row.inspectionFeeAmount, row.currency)}
              </span>
            </Descriptions.Item>
          )}
          {row.expectedReleaseAt && !isReleased && (
            <Descriptions.Item
              label={torder('sellerOrder.paymentEscrow.expectedRelease', 'Estimated Release')}
              span={2}
            >
              {formatDateTime(row.expectedReleaseAt)}
            </Descriptions.Item>
          )}
          {row.decisionWindowEndsAt && (
            <Descriptions.Item
              label={torder('sellerOrder.paymentEscrow.decisionWindow', 'Decision Window Ends')}
              span={2}
            >
              {formatDateTime(row.decisionWindowEndsAt)}
            </Descriptions.Item>
          )}
        </Descriptions>

      </Space>
    </Card>
  )
}

export default SellerPaymentEscrowCard
