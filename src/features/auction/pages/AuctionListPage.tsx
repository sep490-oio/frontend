import { Input, Flex, Button, Row, Col, Skeleton, Empty } from 'antd'
import { SafetyCertificateOutlined, LockOutlined, ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuctions } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import { AuctionCard } from '@/components/ui/AuctionCard'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { AuctionStatus } from '@/types/enums'
import { formatCurrency } from '@/utils/format'

const SERIF = "'DM Serif Display', Georgia, serif"
const MONO = "'DM Mono', monospace"

export default function AuctionListPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const { data: featuredData } = useAuctions({ pageNumber: 1, pageSize: 4, status: AuctionStatus.Active, sortBy: 'BidCount Desc' }, { refetchInterval: 30000 })
  const { data: categories } = useCategories()
  const { data: newAuctions, isLoading: newLoading } = useAuctions({ status: AuctionStatus.Active, sortBy: 'CreatedAt', sortOrder: 'desc', pageSize: 8 })
  const { data: trendingAuctions, isLoading: trendingLoading } = useAuctions({ status: AuctionStatus.Active, sortBy: 'ViewCount', sortOrder: 'desc', pageSize: 8 })

  const featured = featuredData?.items ?? []
  const heroItem = featured[0]

  return (
    <div>
      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: HERO
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px', background: 'var(--color-bg-surface)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} md={12}>
              <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, lineHeight: 1.15, color: 'var(--color-text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
                {t('heroTitle', 'Sở hữu tuyệt tác —')}<br />
                <span style={{ color: 'var(--color-accent)' }}>{t('heroHighlight', 'Đã được kiểm định')}</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 24, maxWidth: 400 }}>
                {t('heroSubtitle', 'Nền tảng đấu giá trực tuyến hàng đầu. Trải nghiệm những sản phẩm xác thực chuyên nghiệp, minh bạch và đáng tin cậy.')}
              </p>
              <Flex gap={12} style={{ marginBottom: 32 }}>
                <Button type="primary" size="large" onClick={() => navigate('/auctions')} style={{ borderRadius: 4, background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500 }}>
                  {t('heroExplore', 'Khám phá đấu giá')} <ArrowRightOutlined />
                </Button>
                <Button size="large" onClick={() => navigate('/seller/register')} style={{ borderRadius: 4, borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontWeight: 500 }}>
                  {t('heroConsign', 'Ký gửi vật phẩm')}
                </Button>
              </Flex>
              <Flex gap={40}>
                {[
                  { value: '12K+', label: t('heroStatItems', 'Sản phẩm') },
                  { value: '45K+', label: t('heroStatUsers', 'Người dùng') },
                  { value: '100%', label: t('heroStatVerified', 'Kiểm định') },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </Flex>
            </Col>
            {heroItem && (
              <Col xs={24} md={12}>
                <div onClick={() => navigate(`/auctions/${heroItem.id}`)} className="oio-card-hover" style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                  {heroItem.primaryImageUrl && (
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                      <img src={heroItem.primaryImageUrl} alt={heroItem.itemTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Đấu giá nổi bật</div>
                      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: 'var(--color-accent)' }}>
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

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1B: NEWLY LISTED
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', margin: 0 }}>
              {t('newlyListed', 'Newly Listed')}
            </h2>
            <Link to="/auctions?sortBy=CreatedAt" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t('viewAll', 'Xem tất cả')} <ArrowRightOutlined />
            </Link>
          </Flex>
          {newLoading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Col xs={12} sm={8} xl={6} key={i}>
                  <Skeleton.Image active style={{ width: '100%', height: 160 }} />
                  <Skeleton active paragraph={{ rows: 1 }} style={{ marginTop: 8 }} />
                </Col>
              ))}
            </Row>
          ) : !newAuctions?.items?.length ? (
            <Empty description={t('noAuctions', 'No auctions found')} />
          ) : (
            <Row gutter={[16, 16]}>
              {newAuctions.items.map((auction) => (
                <Col xs={12} sm={8} xl={6} key={auction.id}>
                  <Link to={`/auctions/${auction.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="oio-card-hover" style={{ borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                      {auction.primaryImageUrl ? (
                        <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                          <img src={auction.primaryImageUrl} alt={auction.itemTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          {t('noImage', 'No image')}
                        </div>
                      )}
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auction.itemTitle}
                        </div>
                        <PriceDisplay price={auction.currentPrice} size="small" />
                      </div>
                    </div>
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1C: TRENDING
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '48px 24px', background: 'var(--color-bg-surface)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', margin: 0 }}>
              {t('trending', 'Trending')}
            </h2>
            <Link to="/auctions?sortBy=ViewCount" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t('viewAll', 'Xem tất cả')} <ArrowRightOutlined />
            </Link>
          </Flex>
          {trendingLoading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Col xs={12} sm={8} xl={6} key={i}>
                  <Skeleton.Image active style={{ width: '100%', height: 160 }} />
                  <Skeleton active paragraph={{ rows: 1 }} style={{ marginTop: 8 }} />
                </Col>
              ))}
            </Row>
          ) : !trendingAuctions?.items?.length ? (
            <Empty description={t('noAuctions', 'No auctions found')} />
          ) : (
            <Row gutter={[16, 16]}>
              {trendingAuctions.items.map((auction) => (
                <Col xs={12} sm={8} xl={6} key={auction.id}>
                  <Link to={`/auctions/${auction.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="oio-card-hover" style={{ borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                      {auction.primaryImageUrl ? (
                        <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                          <img src={auction.primaryImageUrl} alt={auction.itemTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                          {t('noImage', 'No image')}
                        </div>
                      )}
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auction.itemTitle}
                        </div>
                        <PriceDisplay price={auction.currentPrice} size="small" />
                      </div>
                    </div>
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: CATEGORIES
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: 8 }}>
              {t('categoriesLabel', 'TẤT CẢ DANH MỤC')}
            </div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 32, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              {t('categoriesTitle', 'Danh mục')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
              {t('categoriesSubtitle', 'Khám phá các danh mục sản phẩm đấu giá của chúng tôi')}
            </p>
          </div>
          {!categories?.length ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '24px 0' }}>...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
              {categories.slice(0, 6).map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/auctions?categoryId=${cat.id}`)}
                  tabIndex={0}
                  role="link"
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/auctions?categoryId=${cat.id}`) }}
                  className="oio-card-hover"
                  style={{ padding: 24, border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', background: 'var(--color-bg-card)', transition: 'box-shadow 200ms ease, border-color 200ms ease' }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{cat.slug}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: TRUST & SECURITY
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: 8 }}>
            {tc('about.trustLabel', 'Trust & Security')}
          </div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 28, color: 'var(--color-text-primary)', marginBottom: 40 }}>
            {tc('about.trustTitle', 'Bid with Absolute Confidence')}
          </h2>
          <Row gutter={[32, 32]}>
            {[
              { icon: <SafetyCertificateOutlined />, title: tc('about.trust3Title', 'Quality Inspection'), desc: tc('about.trust3Desc', 'Expert team inspects every product before auction') },
              { icon: <LockOutlined />, title: tc('about.trust2Title', 'Secure Payments'), desc: tc('about.trust2Desc', 'SSL encryption and secure digital wallet system') },
              { icon: <ThunderboltOutlined />, title: tc('about.step2Title', 'Bid'), desc: tc('about.step2Desc', 'Place real-time bids with smart auto-bid system') },
            ].map((item) => (
              <Col xs={24} sm={8} key={item.title}>
                <div style={{ padding: 32, borderRadius: 12, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, color: 'var(--color-accent)', marginBottom: 16 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4: FEATURED AUCTIONS
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', margin: 0 }}>
              {t('featuredSection', 'Các đấu giá nổi bật')}
            </h2>
            <a href="/auctions" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t('viewAll', 'Xem tất cả')} <ArrowRightOutlined />
            </a>
          </Flex>
          <div className="oio-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {featured.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5: CTA BANNER
          ════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px', borderRadius: 16, background: 'var(--color-accent-light)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            {tc('about.ctaTitle', 'Start Exploring')}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            {tc('about.ctaDescription', 'Discover thousands of unique products waiting for you on OIO.')}
          </p>
          <Flex gap={12} justify="center">
            <Input placeholder="Nhập email của bạn" style={{ maxWidth: 300, height: 44, borderRadius: 4, borderColor: 'var(--color-border)' }} />
            <Button type="primary" style={{ height: 44, borderRadius: 4, background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500 }}>
              {tc('about.ctaButton', 'Explore Now')}
            </Button>
          </Flex>
        </div>
      </section>
    </div>
  )
}
