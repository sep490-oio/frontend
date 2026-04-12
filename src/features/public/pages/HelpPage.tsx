import { Card, Col, Row, Typography } from 'antd'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'

const SUPPORT_TOPIC_KEYS = ['bidding', 'deposits', 'questions'] as const

export default function HelpPage() {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()

  return (
    <div style={{ margin: '0 auto', maxWidth: 1100, padding: isMobile ? '16px 16px 40px' : '32px 0 80px' }}>
      <Typography.Title
        style={{
          fontFamily: SERIF_FONT,
          fontSize: isMobile ? 28 : 42,
          fontWeight: 400,
          marginBottom: 12,
        }}
      >
        {t('help.title')}
      </Typography.Title>
      <Typography.Paragraph
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 15,
          lineHeight: 1.8,
          marginBottom: isMobile ? 20 : 32,
          maxWidth: isMobile ? '100%' : 760,
        }}
      >
        {t('help.description')}
      </Typography.Paragraph>

      <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]} style={{ marginBottom: isMobile ? 20 : 32 }}>
        {SUPPORT_TOPIC_KEYS.map((key) => (
          <Col key={key} xs={24} md={8}>
            <Card
              style={{
                background: 'linear-gradient(180deg, rgba(196, 147, 61, 0.08), rgba(250, 250, 247, 0.9))',
                borderColor: 'rgba(196, 147, 61, 0.18)',
                height: '100%',
              }}
            >
              <Typography.Title level={4} style={{ marginTop: 0 }}>
                {t(`help.topics.${key}.title`)}
              </Typography.Title>
              <Typography.Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
                {t(`help.topics.${key}.body`)}
              </Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Typography.Title level={4}>{t('help.nextStep')}</Typography.Title>
        <Typography.Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          {t('help.nextStepDesc')}
        </Typography.Paragraph>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Link to="/auctions">{t('help.browseAuctions')}</Link>
          <Link to="/items">{t('help.browseItems')}</Link>
          <Link to="/sellers">{t('help.browseSellers')}</Link>
          <Link to="/login">{t('help.signIn')}</Link>
        </div>
      </Card>
    </div>
  )
}
