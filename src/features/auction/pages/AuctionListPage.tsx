import { Input, Flex, Button, Row, Col, Skeleton, Empty } from 'antd'
import { SafetyCertificateOutlined, LockOutlined, ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { AuctionStatus } from '@/types/enums'
import { formatCurrency } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'

import { useTheme } from '@/hooks/useTheme'

const SERIF = SERIF_FONT
const MONO = MONO_FONT

export default function AuctionListPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile, isTablet } = useBreakpoint()
  const { isDark } = useTheme()

  const { data: featuredData } = useAuctions({ pageNumber: 1, pageSize: 3, status: AuctionStatus.Active, sortBy: 'BidCount Desc' }, { refetchInterval: 30000 })
  const { data: categories } = useCategories()
  const { data: newAuctions, isLoading: newLoading } = useAuctions({ status: AuctionStatus.Active, sortBy: 'CreatedAt Desc', pageSize: 6 })
  const { data: trendingAuctions, isLoading: trendingLoading } = useAuctions({ status: AuctionStatus.Active, sortBy: 'ViewCount Desc', pageSize: 6 })

  const featured = featuredData?.items ?? []
  const heroItem = featured[0]

  const sectionPadding = isMobile ? '32px 16px' : isTablet ? '48px 20px' : '64px 24px'

  return (
    <div>
      {/* ── SECTION 1: HERO ── */}
      <section
        style={{
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          padding: isMobile ? '36px 16px 28px' : isTablet ? '48px 20px' : '64px 24px',
          background: isDark
            ? 'linear-gradient(135deg, #05070a 0%, #0a0e17 50%, #0d1629 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #DBEAFE 100%)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[isMobile ? 0 : 48, 32]} align="middle">
            <Col xs={24} md={12}>
              <h1
                style={{
                  fontFamily: SERIF,
                  fontSize: isMobile ? 28 : isTablet ? 34 : 42,
                  fontWeight: 400,
                  lineHeight: 1.15,
                  color: 'var(--color-text-primary)',
                  marginBottom: 12,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('heroTitle')}<br />
                <span style={{ color: 'var(--color-accent)' }}>{t('heroHighlight')}</span>
              </h1>
              <p
                style={{
                  fontSize: isMobile ? 14 : 16,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 20,
                  maxWidth: 400,
                }}
              >
                {t('heroSubtitle')}
              </p>

              <Flex gap={10} wrap="wrap" style={{ marginBottom: 28 }}>
                <Button
                  type="primary"
                  size={isMobile ? 'middle' : 'large'}
                  onClick={() => navigate('/auctions')}
                  style={{
                    borderRadius: 8,
                    background: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                    fontWeight: 500,
                    height: isMobile ? 44 : 48,
                    flex: isMobile ? 1 : undefined,
                  }}
                >
                  {t('heroExplore')} <ArrowRightOutlined />
                </Button>
                <Button
                  size={isMobile ? 'middle' : 'large'}
                  onClick={() => navigate('/seller/register')}
                  style={{
                    borderRadius: 8,
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                    fontWeight: 500,
                    height: isMobile ? 44 : 48,
                    flex: isMobile ? 1 : undefined,
                  }}
                >
                  {t('heroConsign')}
                </Button>
              </Flex>

              <Flex gap={isMobile ? 24 : 40}>
                {[
                  { value: '12K+', label: t('heroStatItems') },
                  { value: '45K+', label: t('heroStatUsers') },
                  { value: '100%', label: t('heroStatVerified') },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </Flex>
            </Col>

            {heroItem && (
              <Col xs={24} md={12}>
                <div
                  onClick={() => navigate(`/auctions/${heroItem.id}`)}
                  className="oio-card-hover"
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)',
                    marginTop: isMobile ? 8 : 0,
                  }}
                >
                  {heroItem.primaryImageUrl && (
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                      <img
                        src={heroItem.primaryImageUrl}
                        alt={heroItem.itemTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div
                    style={{
                      padding: isMobile ? '14px 16px' : 20,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}
                      >
                        {t('featuredBadge')}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: isMobile ? 16 : 20, fontWeight: 600, color: 'var(--color-accent)' }}>
                        {formatCurrency(heroItem.currentPrice?.amount ?? 0, heroItem.currency)}
                      </div>
                    </div>
                    {heroItem.endTime && <CountdownTimer endTime={heroItem.endTime} size="default" />}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </section>

      {/* ── SECTION 1B: NEWLY LISTED ── */}
      <section style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', padding: isMobile ? '28px 16px' : isTablet ? '36px 20px' : '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: isMobile ? 18 : 24,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {t('newlyListed')}
            </h2>
            <Link
              to="/auctions?sortBy=CreatedAt+Desc"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {t('viewAll')} <ArrowRightOutlined />
            </Link>
          </Flex>

          {newLoading ? (
            <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Col xs={12} sm={12} md={8} xl={8} key={i}>
                  <Skeleton.Image active style={{ width: '100%', height: isMobile ? 180 : 240 }} />
                  <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 8 }} />
                </Col>
              ))}
            </Row>
          ) : !newAuctions?.items?.length ? (
            <Empty description={t('noAuctions')} />
          ) : (
            <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
              {newAuctions.items.map((auction) => (
                <Col xs={24} sm={12} md={8} xl={8} key={auction.id}>
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* ── SECTION: TRENDING ── */}
      {trendingAuctions?.items?.length ? (
        <section style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', padding: isMobile ? '0 16px 28px' : isTablet ? '0 20px 36px' : '0 24px 48px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: isMobile ? 18 : 24,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                }}
              >
                {t('trending')}
              </h2>
              <Link
                to="/auctions?sortBy=ViewCount+Desc"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('viewAll')} <ArrowRightOutlined />
              </Link>
            </Flex>
            {trendingLoading ? (
              <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Col xs={12} sm={12} md={8} xl={8} key={i}>
                    <Skeleton.Image active style={{ width: '100%', height: isMobile ? 180 : 240 }} />
                    <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 8 }} />
                  </Col>
                ))}
              </Row>
            ) : (
              <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
                {trendingAuctions.items.map((auction) => (
                  <Col xs={24} sm={12} md={8} xl={8} key={auction.id}>
                    <AuctionCard auction={auction} />
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </section>
      ) : null}

      {/* ── SECTION 2: CATEGORIES ── */}
      <section style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', padding: sectionPadding, background: 'var(--color-bg-surface)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 40 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-accent)',
                marginBottom: 8,
              }}
            >
              {t('categoriesLabel')}
            </div>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: isMobile ? 22 : 32,
                color: 'var(--color-text-primary)',
                margin: '0 0 8px',
              }}
            >
              {t('categoriesTitle')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
              {t('categoriesSubtitle')}
            </p>
          </div>

          {!categories?.length ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '24px 0' }}>...</div>
          ) : (
            <Row gutter={[isMobile ? 10 : 20, isMobile ? 10 : 20]}>
              {categories.slice(0, 6).map((cat) => (
                <Col xs={12} sm={8} md={8} key={cat.id}>
                  <div
                    onClick={() => navigate(`/auctions?categoryId=${cat.id}`)}
                    tabIndex={0}
                    role="link"
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/auctions?categoryId=${cat.id}`) }}
                    className="oio-card-hover"
                    style={{
                      padding: isMobile ? '16px 14px' : 24,
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: 'var(--color-bg-card)',
                      transition: 'box-shadow 200ms ease, border-color 200ms ease',
                      minHeight: isMobile ? 72 : 'auto',
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 13 : 16,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.name}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* ── SECTION 3: TRUST & SECURITY ── */}
      <section style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', padding: sectionPadding }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--color-accent)',
              marginBottom: 8,
            }}
          >
            {tc('about.trustLabel', 'Trust & Security')}
          </div>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: isMobile ? 20 : 28,
              color: 'var(--color-text-primary)',
              marginBottom: isMobile ? 24 : 40,
            }}
          >
            {tc('about.trustTitle', 'Bid with Absolute Confidence')}
          </h2>
          <Row gutter={[isMobile ? 10 : 32, isMobile ? 10 : 32]}>
            {[
              { icon: <SafetyCertificateOutlined />, title: tc('about.trust3Title', 'Quality Inspection'), desc: tc('about.trust3Desc', 'Expert team inspects every product before auction') },
              { icon: <LockOutlined />, title: tc('about.trust2Title', 'Secure Payments'), desc: tc('about.trust2Desc', 'SSL encryption and secure digital wallet system') },
              { icon: <ThunderboltOutlined />, title: tc('about.step2Title', 'Bid'), desc: tc('about.step2Desc', 'Place real-time bids with smart auto-bid system') },
            ].map((item) => (
              <Col xs={24} sm={8} key={item.title}>
                <div
                  style={{
                    padding: isMobile ? '20px 16px' : 32,
                    borderRadius: 12,
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: isMobile ? 24 : 32, color: 'var(--color-accent)', marginBottom: isMobile ? 10 : 16 }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ── SECTION 4: FEATURED AUCTIONS ── */}
      <section style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', padding: isMobile ? '28px 16px' : isTablet ? '36px 20px' : '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: isMobile ? 18 : 24,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {t('featuredSection')}
            </h2>
            <a
              href="/auctions"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {t('viewAll')} <ArrowRightOutlined />
            </a>
          </Flex>
          <Row className="oio-stagger" gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
            {featured.map((auction) => (
              <Col key={auction.id} xs={24} sm={12} md={8} xl={8}>
                <AuctionCard auction={auction} />
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ── SECTION 5: CTA BANNER ── */}
      <section style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', padding: isMobile ? '0 16px 64px' : isTablet ? '0 20px 64px' : '0 24px 80px' }}>
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: isMobile ? '28px 20px' : '40px 48px',
            borderRadius: 16,
            background: 'var(--color-accent-light)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: isMobile ? 18 : 24,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
            }}
          >
            {tc('about.ctaTitle', 'Start Exploring')}
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: isMobile ? 13 : 14,
              marginBottom: 20,
              maxWidth: 400,
              margin: '0 auto 20px',
            }}
          >
            {tc('about.ctaDescription', 'Discover thousands of unique products waiting for you on OIO.')}
          </p>
          <Flex gap={8} justify="center" vertical={isMobile} align={isMobile ? 'stretch' : undefined}>
            <Input
              placeholder={t('emailPlaceholder')}
              style={{
                maxWidth: isMobile ? '100%' : 280,
                height: 44,
                borderRadius: 8,
                borderColor: 'var(--color-border)',
              }}
            />
            <Button
              type="primary"
              style={{
                height: 44,
                borderRadius: 8,
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                fontWeight: 500,
                minWidth: isMobile ? undefined : 120,
              }}
            >
              {tc('about.ctaButton', 'Explore Now')}
            </Button>
          </Flex>
        </div>
      </section>
    </div>
  )
}