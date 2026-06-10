import React from 'react'
import { useNavigate } from 'react-router'
import { Drawer, Timeline, Typography, Tag, Divider, Flex, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import {
  LockOutlined,
  UnlockOutlined,
  RollbackOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  WarningOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  BankOutlined,
} from '@ant-design/icons'
import type { EscrowDto } from '@/types'
import { EscrowStatus } from '@/types/enums'
import { formatCurrency } from '@/utils/format'

const { Text, Title } = Typography

interface EscrowAuditDrawerProps {
  open: boolean
  onClose: () => void
  escrow: EscrowDto | null
}

type ReleaseEvent = {
  releaseType?: string
  triggerSourceType?: string
  amount?: number
  createdAt?: string
  createdByDisplayName?: string
}

export const EscrowAuditDrawer: React.FC<EscrowAuditDrawerProps> = ({ open, onClose, escrow }) => {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()

  if (!escrow) return null

  const fmt = (amount: number) => formatCurrency(amount, escrow.currency)

  // Classify a release event by its money DIRECTION. The backend EscrowReleaseType
  // encodes EXTENT (full/partial/adjustment/refund/forfeit) and TriggerSourceType
  // encodes direction (SellerRelease/BuyerRefund/PlatformForfeit). The drawer previously
  // compared against non-existent strings ('seller_release', ...), so seller releases
  // (releaseType 'full') matched nothing — showing Transferred to Seller = 0 and
  // mislabelling the whole amount as Platform Commission.
  const classifyRelease = (e: ReleaseEvent): 'seller' | 'buyer' | 'platform' => {
    const rt = String(e?.releaseType ?? '').toLowerCase()
    const src = String(e?.triggerSourceType ?? '').toLowerCase()
    if (rt === 'refund' || src === 'buyerrefund') return 'buyer'
    if (rt === 'forfeit' || src === 'platformforfeit') return 'platform'
    // full / partial / adjustment / SellerRelease
    return 'seller'
  }

  // ── Block 2: Build timeline items ──────────────────────────────────
  const timelineItems = []

  // 1. Initial Hold Event
  timelineItems.push({
    color: 'gray' as const,
    dot: <LockOutlined style={{ fontSize: 14 }} />,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Text strong>{t('payments.escrowTimeline.fundsHeld', 'Funds Held in Escrow')}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(escrow.createdAt).format('DD MMM YYYY, HH:mm')}
        </Text>
        <Text style={{ fontSize: 13, marginTop: 4 }}>
          {t('payments.escrowTimeline.systemLock', 'System automated lock for order')}{' '}
          <Text strong>{escrow.orderNumber ?? escrow.orderId.slice(0, 8)}</Text>
        </Text>
      </div>
    ),
  })

  // 2. Release events (sorted chronologically)
  if (escrow.releaseEvents && escrow.releaseEvents.length > 0) {
    const sortedEvents = [...escrow.releaseEvents].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    sortedEvents.forEach((event) => {
      let icon = <WarningOutlined style={{ fontSize: 14 }} />
      let color: 'blue' | 'green' | 'orange' | 'red' = 'blue'
      let actionName = event.releaseType

      const direction = classifyRelease(event)
      if (direction === 'seller') {
        icon = <UnlockOutlined style={{ fontSize: 14 }} />
        color = 'green'
        actionName = t('payments.escrowTimeline.releasedToSeller', 'Released to Seller')
      } else if (direction === 'buyer') {
        icon = <RollbackOutlined style={{ fontSize: 14 }} />
        color = 'orange'
        actionName = t('payments.escrowTimeline.refundedToBuyer', 'Refunded to Buyer')
      } else if (direction === 'platform') {
        icon = <SafetyCertificateOutlined style={{ fontSize: 14 }} />
        color = 'red'
        actionName = t('payments.escrowTimeline.forfeitedToPlatform', 'Forfeited to Platform')
      }

      timelineItems.push({
        color,
        dot: icon,
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Flex align="center" gap={8}>
              <Text strong>{actionName}</Text>
              <Tag color="processing" style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>
                {t('payments.escrowTimeline.adminAction', 'Admin Action')}
              </Tag>
            </Flex>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(event.createdAt).format('DD MMM YYYY, HH:mm')}
            </Text>
            <div
              style={{
                marginTop: 8,
                background: 'var(--color-bg-surface, #f5f5f5)',
                border: '1px solid var(--color-border, #e8e8e8)',
                padding: '10px 14px',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <Flex align="center" gap={8}>
                <UserOutlined style={{ color: 'var(--color-text-secondary)' }} />
                <Text type="secondary">{t('payments.escrowTimeline.actionBy', 'Action by')}:</Text>
                <Text strong>{event.createdByDisplayName || t('payments.systemAuto', 'System (Auto)')}</Text>
              </Flex>
              <Flex align="center" gap={8}>
                <DollarOutlined style={{ color: 'var(--color-text-secondary)' }} />
                <Text type="secondary">{t('payments.amount')}:</Text>
                <Text strong>{fmt(event.amount)}</Text>
              </Flex>
            </div>
          </div>
        ),
      })
    })
  }

  // ── Block 3: Money Distribution ────────────────────────────────────
  const distributionRows: { label: string; amount: number; color: string; icon: React.ReactNode }[] = []

  if (escrow.status === EscrowStatus.ReleasedToSeller) {
    const sellerEvents = (escrow.releaseEvents ?? []).filter(
      (e: ReleaseEvent) => classifyRelease(e) === 'seller',
    )
    // Sum the seller-direction releases; fall back to the full escrow amount when no
    // matching event is present (a released_to_seller escrow without recorded events).
    const totalReleased = sellerEvents.length > 0
      ? sellerEvents.reduce((sum: number, e: ReleaseEvent) => sum + (e.amount ?? 0), 0)
      : escrow.amount
    distributionRows.push({
      label: t('payments.transferredToSeller', 'Transferred to Seller'),
      amount: totalReleased,
      color: 'var(--color-success, #52c41a)',
      icon: <UnlockOutlined />,
    })
    // If platform took a cut (total released < escrow amount)
    const platformCut = escrow.amount - totalReleased
    if (platformCut > 0) {
      distributionRows.push({
        label: t('payments.platformCommission', 'Platform Commission'),
        amount: platformCut,
        color: 'var(--color-accent, #1890ff)',
        icon: <BankOutlined />,
      })
    }
  } else if (escrow.status === EscrowStatus.RefundedToBuyer) {
    distributionRows.push({
      label: t('payments.refundedToBuyer', 'Refunded to Buyer'),
      amount: escrow.amount,
      color: 'var(--color-warning, #faad14)',
      icon: <RollbackOutlined />,
    })
  } else if (escrow.status === EscrowStatus.Forfeited) {
    distributionRows.push({
      label: t('payments.forfeitedToPlatform', 'Forfeited to Platform Revenue'),
      amount: escrow.amount,
      color: 'var(--color-error, #ff4d4f)',
      icon: <SafetyCertificateOutlined />,
    })
  }

  const statusTagMap: Record<string, { color: string; label: string }> = {
    [EscrowStatus.Holding]: { color: 'processing', label: t('payments.escrowStatus.holding', 'Holding') },
    [EscrowStatus.ReleasedToSeller]: { color: 'success', label: t('payments.escrowStatus.released', 'Released') },
    [EscrowStatus.RefundedToBuyer]: { color: 'warning', label: t('payments.escrowStatus.refunded', 'Refunded') },
    [EscrowStatus.Forfeited]: { color: 'error', label: t('payments.escrowStatus.forfeited', 'Forfeited') },
  }

  const statusCfg = statusTagMap[escrow.status] ?? { color: 'default', label: escrow.status }

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center">
          <span>{t('payments.escrowDetails', 'Escrow Details')}</span>
          <Tag color={statusCfg.color} style={{ margin: 0 }}>{statusCfg.label}</Tag>
        </Flex>
      }
      placement="right"
      width={520}
      onClose={onClose}
      open={open}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* ── Block 1: Original Source ─────────────────────────────── */}
        <div>
          <Title level={5} style={{ marginBottom: 16, color: 'var(--color-text-primary)' }}>
            <ShoppingOutlined style={{ marginRight: 8 }} />
            {t('payments.escrowSource', 'Source Information')}
          </Title>
          <div
            style={{
              background: 'var(--color-bg-surface, #fafafa)',
              border: '1px solid var(--color-border, #e8e8e8)',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Amount + Status header */}
            <Flex justify="center" align="center" style={{ marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
                  {t('payments.netAmount', 'Net Amount')}
                </Text>
                <Title level={2} style={{ margin: 0, color: 'var(--color-text-primary)' }}>
                  {fmt(escrow.amount)}
                </Title>
              </div>
            </Flex>

            <Divider style={{ margin: '4px 0' }} />

            {/* Item */}
            <Flex align="center" gap={10}>
              <Text type="secondary" style={{ minWidth: 90 }}>{t('payments.item')}:</Text>
              <Text strong>{escrow.auctionItemTitle ?? '—'}</Text>
            </Flex>

            {/* Order */}
            <Flex align="center" gap={10}>
              <Text type="secondary" style={{ minWidth: 90 }}>{t('payments.orderLabel', 'Order')}:</Text>
              <Button
                type="link"
                size="small"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/admin/orders/${escrow.orderId}`) }}
                style={{ padding: 0, fontFamily: 'monospace', fontSize: 13 }}
              >
                {escrow.orderNumber ?? `ORD-${escrow.orderId.slice(0, 8)}`}
              </Button>
            </Flex>

            {/* Buyer */}
            <Flex align="center" gap={10}>
              <Text type="secondary" style={{ minWidth: 90 }}>{t('payments.buyer')}:</Text>
              {escrow.buyerId ? (
                <Button
                  type="link"
                  size="small"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/admin/users/${escrow.buyerId}`) }}
                  style={{ padding: 0 }}
                >
                  <UserOutlined style={{ marginRight: 4 }} />
                  {escrow.buyerDisplayName || escrow.buyerId.slice(0, 8)}
                </Button>
              ) : (
                <Text>—</Text>
              )}
            </Flex>

            {/* Seller */}
            <Flex align="center" gap={10}>
              <Text type="secondary" style={{ minWidth: 90 }}>{t('payments.seller')}:</Text>
              {escrow.sellerId ? (
                <Button
                  type="link"
                  size="small"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/admin/users/${escrow.sellerId}`) }}
                  style={{ padding: 0 }}
                >
                  <UserOutlined style={{ marginRight: 4 }} />
                  {escrow.sellerDisplayName || escrow.sellerId.slice(0, 8)}
                </Button>
              ) : (
                <Text>—</Text>
              )}
            </Flex>
          </div>
        </div>

        {/* ── Block 2: Audit Timeline ─────────────────────────────── */}
        <div>
          <Title level={5} style={{ marginBottom: 16, color: 'var(--color-text-primary)' }}>
            {t('payments.auditTrail')}
          </Title>
          <Timeline items={timelineItems} />
        </div>

        {/* ── Block 3: Money Distribution ─────────────────────────── */}
        {distributionRows.length > 0 && (
          <div>
            <Title level={5} style={{ marginBottom: 16, color: 'var(--color-text-primary)' }}>
              <DollarOutlined style={{ marginRight: 8 }} />
              {t('payments.moneyDistribution', 'Money Distribution')}
            </Title>
            <div
              style={{
                background: 'var(--color-bg-surface, #fafafa)',
                border: '1px solid var(--color-border, #e8e8e8)',
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Total */}
              <Flex justify="space-between" align="center">
                <Text type="secondary">{t('payments.escrowTotal', 'Total Escrow')}</Text>
                <Text strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{fmt(escrow.amount)}</Text>
              </Flex>

              <Divider style={{ margin: '4px 0' }} />

              {/* Distribution rows */}
              {distributionRows.map((row, i) => (
                <Flex key={i} align="center" gap={10} style={{ padding: '6px 0' }}>
                  <ArrowRightOutlined style={{ color: row.color, fontSize: 12 }} />
                  <span style={{ color: row.color, fontSize: 16 }}>{row.icon}</span>
                  <Text style={{ flex: 1 }}>{row.label}</Text>
                  <Text strong style={{ fontFamily: 'monospace', fontSize: 14, color: row.color }}>
                    {fmt(row.amount)}
                  </Text>
                </Flex>
              ))}

              {/* Explicit Formula if platform cut exists */}
              {distributionRows.length === 2 && escrow.status === EscrowStatus.ReleasedToSeller && (
                <div style={{ marginTop: 8, padding: 8, background: 'var(--color-bg-layout)', borderRadius: 8, textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Formula: <Text strong>Total Amount</Text> = <Text strong>Seller Payout</Text> + <Text strong>Platform Commission</Text>
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}
