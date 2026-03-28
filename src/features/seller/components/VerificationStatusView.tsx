import { Button, Card, Result, Timeline, Typography, Flex, Space } from 'antd'
import {
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  IdcardOutlined,
  CameraOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { IdentityVerificationStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { VerificationDto } from '@/types'

interface VerificationStatusViewProps {
  status: 'none' | string
  verification?: VerificationDto | null
  onStartVerification: () => void
  onResubmit: () => void
  hasPendingTerms?: boolean
}

export function VerificationStatusView({
  status,
  verification,
  onStartVerification,
  onResubmit,
  hasPendingTerms,
}: VerificationStatusViewProps) {
  const { t } = useTranslation('seller')

  // ── No verification ─────────────────────────────────────────
  if (status === 'none') {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
        <SafetyCertificateOutlined style={{ fontSize: 64, color: 'var(--color-accent)', marginBottom: 24 }} />
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          {t('verifyIdentity', 'Verify Your Identity')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 480, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.8 }}>
          {t('verifyDescription', 'Identity verification is required to sell items, participate in high-value auctions, and build trust on the platform. The process is quick and secure.')}
        </Typography.Paragraph>

        <Card size="small" style={{ maxWidth: 400, margin: '0 auto 24px', textAlign: 'left', background: 'var(--color-bg-surface)' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
            {t('whatYouNeed', "What you'll need:")}
          </Typography.Text>
          <Space direction="vertical" size={8}>
            <Flex align="center" gap={8}>
              <IdcardOutlined style={{ color: 'var(--color-accent)' }} />
              <Typography.Text>{t('needIdFront', 'Government ID — front side')}</Typography.Text>
            </Flex>
            <Flex align="center" gap={8}>
              <IdcardOutlined style={{ color: 'var(--color-accent)' }} />
              <Typography.Text>{t('needIdBack', 'Government ID — back side (recommended)')}</Typography.Text>
            </Flex>
            <Flex align="center" gap={8}>
              <CameraOutlined style={{ color: 'var(--color-accent)' }} />
              <Typography.Text>{t('needSelfie', 'A selfie photo')}</Typography.Text>
            </Flex>
          </Space>
        </Card>

        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
          {t('processingTime', 'Usually reviewed within 24 hours')}
        </Typography.Text>

        <Button
          type="primary"
          size="large"
          onClick={onStartVerification}
          disabled={hasPendingTerms}
          style={{ height: 48, padding: '0 40px', fontWeight: 500, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('startVerification', 'Start Verification')}
        </Button>
        {hasPendingTerms && (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {t('acceptTermsFirst', 'Please accept pending terms before starting verification.')}
          </Typography.Text>
        )}
      </Card>
    )
  }

  // ── Pending (Draft) ─────────────────────────────────────────
  if (status === IdentityVerificationStatus.Pending) {
    return (
      <Result
        icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
        title={t('draftVerification', 'Verification In Progress')}
        subTitle={t('draftDesc', 'Upload your documents and submit for review.')}
        extra={
          <Flex vertical gap={8} align="center">
            <StatusBadge status={status} />
            {verification && (
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {t('type', 'Type')}: {verification.verificationType} &middot; {t('created', 'Created')}: {formatDateTime(verification.createdAt)}
              </Typography.Text>
            )}
          </Flex>
        }
      />
    )
  }

  // ── Submitted / Under Review ────────────────────────────────
  if (status === IdentityVerificationStatus.Submitted || status === IdentityVerificationStatus.UnderReview) {
    const timelineItems = [
      { color: 'green' as const, children: `${t('created', 'Created')} ${verification ? '— ' + formatDateTime(verification.createdAt) : ''}` },
      { color: 'green' as const, children: `${t('documentsUploaded', 'Documents uploaded')}` },
      { color: 'blue' as const, children: `${t('submitted', 'Submitted')} ${verification?.submittedAt ? '— ' + formatDateTime(verification.submittedAt) : ''}` },
      { color: status === IdentityVerificationStatus.UnderReview ? 'blue' as const : 'gray' as const, children: t('underReview', 'Under review') },
    ]

    return (
      <Result
        status="info"
        icon={<SearchOutlined style={{ color: '#1890ff' }} />}
        title={t('verificationUnderReview', 'Verification Under Review')}
        subTitle={t('reviewDesc', 'Our team is reviewing your documents. This usually takes up to 24 hours.')}
        extra={
          <Card size="small" style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
            <Timeline items={timelineItems} />
          </Card>
        }
      />
    )
  }

  // ── Approved ────────────────────────────────────────────────
  if (status === IdentityVerificationStatus.Approved) {
    return (
      <Result
        status="success"
        title={t('identityVerified', 'Identity Verified')}
        subTitle={t('verifiedDesc', 'Your identity has been verified. You can now create a seller profile and participate in all auctions.')}
        extra={
          <Flex vertical gap={8} align="center">
            {verification?.verifiedAt && (
              <Typography.Text type="secondary">
                {t('verifiedOn', 'Verified on')}: {formatDateTime(verification.verifiedAt)}
              </Typography.Text>
            )}
          </Flex>
        }
      />
    )
  }

  // ── Rejected ────────────────────────────────────────────────
  if (status === IdentityVerificationStatus.Rejected) {
    return (
      <Result
        status="error"
        title={t('verificationRejected', 'Verification Rejected')}
        subTitle={verification?.rejectionReason || t('rejectedDesc', 'Your verification was rejected. Please review the feedback and try again.')}
        extra={
          <Flex vertical gap={12} align="center">
            {verification?.rejectionCode && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('rejectionCode', 'Code')}: {verification.rejectionCode}
              </Typography.Text>
            )}
            <Button type="primary" onClick={onResubmit} style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
              {t('startNewVerification', 'Start New Verification')}
            </Button>
          </Flex>
        }
      />
    )
  }

  // ── Expired / Suspended / Unknown ───────────────────────────
  return (
    <Result
      status="warning"
      title={t('verificationExpired', 'Verification Expired')}
      subTitle={t('expiredDesc', 'Your verification has expired or been suspended. Please start a new verification.')}
      extra={
        <Button type="primary" onClick={onResubmit} style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
          {t('startNewVerification', 'Start New Verification')}
        </Button>
      }
    />
  )
}
