import { useState, useEffect } from 'react'
import { Button, Flex, Typography } from 'antd'
import { SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'
import { ParticipantQualificationStatus, DepositStatus as _DepositStatus } from '@/types/enums'

interface EligibilityPanelProps {
  qualificationStatus?: string
  depositStatus?: string
  depositAmount?: number
  currency: string
  walletBalance: number
  qualificationStartAt?: string
  qualificationEndAt?: string
  isSeller: boolean
  onDepositWallet: () => void
  onDepositVnPay: () => void
  isWalletDepositLoading: boolean
  isVnPayDepositLoading: boolean
}

export function EligibilityPanel({
  qualificationStatus,
  depositStatus,
  depositAmount,
  currency,
  walletBalance,
  qualificationStartAt,
  qualificationEndAt,
  isSeller,
  onDepositWallet,
  onDepositVnPay,
  isWalletDepositLoading,
  isVnPayDepositLoading,
}: EligibilityPanelProps) {
  const { t } = useTranslation('auction')

  if (isSeller) {
    return (
      <div style={panelStyle}>
        <Flex align="center" gap={8}>
          <StarOutlined style={{ fontSize: 18, color: 'var(--color-accent)' }} />
          <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-accent)' }}>
            {t('yourAuctionNote', 'This is your auction')}
          </Typography.Text>
        </Flex>
      </div>
    )
  }

  // Qualified
  if (qualificationStatus === ParticipantQualificationStatus.Qualified) {
    return (
      <div style={{ ...panelStyle, borderColor: 'rgba(74, 124, 89, 0.2)' }}>
        <Flex align="center" gap={10}>
          <CheckCircleOutlined style={{ fontSize: 20, color: 'var(--color-success)' }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-success)', display: 'block' }}>
              {t('qualifiedToBid', 'Eligible to Bid')}
            </Typography.Text>
            {depositAmount != null && depositAmount > 0 && (
              <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {t('depositHeld', 'Deposit')}: {formatCurrency(depositAmount, currency)}
                {depositStatus && <> · <StatusBadge status={depositStatus} size="small" /></>}
              </Typography.Text>
            )}
          </div>
        </Flex>
        <Typography.Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 8 }}>
          {t('depositRefundNote', 'Your deposit will be returned if you do not win, or applied to payment if you win.')}
        </Typography.Text>
      </div>
    )
  }

  // Waived (admin pre-approved)
  if (qualificationStatus === ParticipantQualificationStatus.Waived) {
    return (
      <div style={{ ...panelStyle, borderColor: 'rgba(74, 124, 89, 0.2)' }}>
        <Flex align="center" gap={10}>
          <CheckCircleOutlined style={{ fontSize: 20, color: 'var(--color-success)' }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-success)', display: 'block' }}>
              {t('preApproved', 'Pre-approved to Bid')}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('noDepositRequired', 'No deposit required')}
            </Typography.Text>
          </div>
        </Flex>
      </div>
    )
  }

  // Rejected
  if (qualificationStatus === ParticipantQualificationStatus.Rejected) {
    return (
      <div style={{ ...panelStyle, borderColor: 'rgba(196, 81, 61, 0.2)' }}>
        <Flex align="center" gap={10}>
          <CloseCircleOutlined style={{ fontSize: 20, color: 'var(--color-danger)' }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-danger)', display: 'block' }}>
              {t('qualificationRejected', 'Qualification Rejected')}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('contactSupport', 'Please contact support for assistance.')}
            </Typography.Text>
          </div>
        </Flex>
      </div>
    )
  }

  // Expired
  if (qualificationStatus === ParticipantQualificationStatus.Expired) {
    return (
      <div style={{ ...panelStyle, borderColor: 'rgba(196, 81, 61, 0.2)' }}>
        <Flex align="center" gap={10}>
          <ClockCircleOutlined style={{ fontSize: 20, color: 'var(--color-danger)' }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-danger)', display: 'block' }}>
              {t('registrationClosed', 'Registration Closed')}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('qualificationExpired', 'The registration window for this auction has ended.')}
            </Typography.Text>
          </div>
        </Flex>
      </div>
    )
  }

  // Pending / not yet qualified — show deposit UI
  // Use controlled state for time-dependent rendering (avoids flicker on re-render)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const windowStart = qualificationStartAt ? new Date(qualificationStartAt).getTime() : null
  const windowEnd = qualificationEndAt ? new Date(qualificationEndAt).getTime() : null
  const isBeforeWindow = windowStart && now < windowStart
  const isWindowClosed = windowEnd && now >= windowEnd

  if (isBeforeWindow) {
    return (
      <div style={panelStyle}>
        <Flex align="center" gap={10}>
          <ClockCircleOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', display: 'block' }}>
              {t('depositRequired', 'Deposit Required')}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('registrationOpensIn', 'Registration opens in')}: <CountdownTimer endTime={qualificationStartAt!} size="small" />
            </Typography.Text>
          </div>
        </Flex>
        <Button type="primary" block disabled icon={<SafetyOutlined />} style={{ height: 44, borderRadius: 8, marginTop: 12 }}>
          {t('deposit', 'Deposit')}
        </Button>
      </div>
    )
  }

  if (isWindowClosed && qualificationStatus !== ParticipantQualificationStatus.Qualified) {
    return (
      <div style={{ ...panelStyle, borderColor: 'rgba(196, 81, 61, 0.2)' }}>
        <Flex align="center" gap={10}>
          <CloseCircleOutlined style={{ fontSize: 20, color: 'var(--color-danger)' }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-danger)', display: 'block' }}>
              {t('cannotBid', 'Cannot Bid')}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {t('qualificationClosed', 'The registration window has ended. You needed to deposit during the registration period to participate.')}
            </Typography.Text>
          </div>
        </Flex>
      </div>
    )
  }

  // Window is open — show deposit buttons
  const requiredAmount = depositAmount ?? 0
  const canAfford = walletBalance >= requiredAmount

  return (
    <div style={panelStyle}>
      <Flex align="center" gap={10}>
        <SafetyOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
        <div>
          <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', display: 'block' }}>
            {t('depositToJoin', 'Deposit to Participate')}
          </Typography.Text>
          <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('depositAmountLabel', 'Required')}: <strong>{formatCurrency(requiredAmount, currency)}</strong>
          </Typography.Text>
        </div>
      </Flex>

      {qualificationEndAt && (
        <Typography.Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 8 }}>
          {t('registrationClosesIn', 'Registration closes in')}: <CountdownTimer endTime={qualificationEndAt} size="small" />
        </Typography.Text>
      )}

      <Typography.Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 4 }}>
        {t('walletBalance', 'Wallet balance')}: <strong style={{ color: canAfford ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatCurrency(walletBalance, currency)}</strong>
      </Typography.Text>

      <Button
        type="primary"
        block
        icon={<SafetyOutlined />}
        onClick={onDepositWallet}
        loading={isWalletDepositLoading}
        disabled={!canAfford}
        style={{ height: 48, borderRadius: 8, fontWeight: 500, fontSize: 15, background: 'var(--color-accent)', borderColor: 'var(--color-accent)', marginTop: 12 }}
      >
        {t('depositWallet', 'Deposit from Wallet')}
      </Button>

      <Button
        block
        icon={<SafetyOutlined />}
        onClick={onDepositVnPay}
        loading={isVnPayDepositLoading}
        style={{ height: 44, borderRadius: 8, borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', marginTop: 8 }}
      >
        {t('depositVnPay', 'Deposit via VNPay')}
      </Button>

      <Typography.Text style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 8, lineHeight: 1.6 }}>
        {t('depositTerms', 'Your deposit is held until the auction ends. If you win, it is applied to payment. If you lose, it is returned. Failure to pay within 48h after winning forfeits your deposit.')}
      </Typography.Text>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: 8,
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-light)',
}
