import { useState } from 'react'
import { Input, Pagination, Flex, Row, Col, Spin, Empty, Select } from 'antd'
import { SearchOutlined, ShopOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useBrowseSellers } from '@/features/seller/api'

import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'
import FilterWidget from '@/components/ui/FilterWidget'
import { htmlToPlainTextExcerpt } from '@/components/ui/SafeHtmlRenderer'

const SERIF = SERIF_FONT
const MONO = MONO_FONT



// ─── Component ───────────────────────────────────────────────────────────────



export default function BrowseSellersPage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const { isMobile, isTablet } = useBreakpoint()
  const isNarrow = isMobile || isTablet

  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [search, setSearch] = useState('')

  // Widget States
  const [sellerRating, setSellerRating] = useState('all')
  const [storeTypeOfficial, setStoreTypeOfficial] = useState(true)
  const [storeTypePersonal, setStoreTypePersonal] = useState(true)
  const [sortBy, setSortBy] = useState('popular')

  const { data, isLoading } = useBrowseSellers({ 
    pageNumber: page, 
    pageSize, 
    search: search || undefined
  })
  
  let sellers = data?.items ?? []
  
  // Restore Frontend Filtering (Safer for now)
  if (sellerRating === '4plus') {
    sellers = sellers.filter(s => (s.trustScore ?? 0) >= 80) // Assuming 80/100 is 4 stars
  } else if (sellerRating === '5star') {
    sellers = sellers.filter(s => (s.trustScore ?? 0) >= 95)
  }

  // Restore Frontend Sorting
  if (sortBy === 'newest') {
    sellers = [...sellers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy === 'items_desc') {
    // totalSalesCount is optional/any, so fallback to 0
    sellers = [...sellers].sort((a, b) => ((b as any).totalSalesCount ?? 0) - ((a as any).totalSalesCount ?? 0))
  } else {
    sellers = [...sellers].sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
  }

  const totalCount = data?.metadata?.totalCount ?? 0

  return (
    <div style={{ width: '100%', padding: isMobile ? '16px 12px 48px' : isTablet ? '24px 16px 64px' : '32px 48px 80px' }}>
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: isMobile ? 22 : isTablet ? 28 : 32,
          color: 'var(--color-text-primary)',
          marginBottom: 6,
          marginTop: 0,
        }}>
          {t('browse.title')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 13 : 14, margin: 0 }}>
          {t('browse.subtitle')}
        </p>
      </div>

      {/* ── Search Bar (Mobile) ────────────────────────────────────────────── */}
      {isMobile && (
        <div style={{ marginBottom: 20 }}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
            placeholder={t('browse.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => setPage(1)}
            style={{
              width: '100%',
              borderRadius: 100,
              height: 44,
              borderColor: 'var(--color-border)',
            }}
          />
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      <Flex gap={32} align="flex-start">
        {!isNarrow && (
          <div style={{ 
            width: 280, 
            flexShrink: 0, 
            position: 'sticky', 
            top: 100,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            paddingRight: 8,
            scrollbarWidth: 'thin'
          }}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)', marginRight: 4 }} />}
              placeholder={t('browse.searchPlaceholder', 'Tìm kiếm cửa hàng...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => setPage(1)}
              size="large"
              allowClear
              style={{
                width: '100%',
                borderRadius: 100,
                height: 48,
                borderColor: 'var(--color-border)',
                marginBottom: 20,
                fontSize: 15
              }}
            />

            <FilterWidget title={t('browse.filterRating', 'Đánh giá cửa hàng')} noPadding>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="sellerRating" checked={sellerRating === 'all'} onChange={() => setSellerRating('all')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.ratingAll', 'Tất cả đánh giá')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="sellerRating" checked={sellerRating === '4plus'} onChange={() => setSellerRating('4plus')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.rating4Plus', 'Từ 4 sao trở lên')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="sellerRating" checked={sellerRating === '5star'} onChange={() => setSellerRating('5star')} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.rating5Star', '5 sao (Uy tín)')}</span>
                </label>
              </div>
            </FilterWidget>

            <FilterWidget title={t('browse.filterType', 'Loại hình Cửa hàng')} noPadding>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={storeTypeOfficial} onChange={e => setStoreTypeOfficial(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.typeOfficial', 'Cửa hàng chính hãng')}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={storeTypePersonal} onChange={e => setStoreTypePersonal(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('browse.typePersonal', 'Cá nhân')}</span>
                </label>
              </div>
            </FilterWidget>

            <FilterWidget title={t('browse.filterSort', 'Sắp xếp')} noPadding>
              <div style={{ padding: '16px 20px' }}>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: isMobile ? '100%' : 160 }}
                  options={[
                    { value: 'popular', label: t('browse.sortPopular') },
                    { value: 'newest', label: t('browse.sortNewest') },
                    { value: 'items_desc', label: t('browse.sortItemsCount') },
                  ]}
                  size="large"
                  variant="filled"
                />
              </div>
            </FilterWidget>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? 40 : 80 }}>
          <Spin size="large" />
        </div>
      ) : sellers.length === 0 ? (
        <Empty description={t('browse.noResults')} />
      ) : (
        <>
          <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]}>
            {sellers.map((seller) => (
              <Col key={seller.id} xs={12} sm={12} lg={8}>
                  <div
                    className="oio-press group"
                    onClick={() => navigate(`/sellers/${seller.id}`)}
                    style={{
                      cursor: 'pointer',
                      background: 'var(--color-bg-card, #11141b)',
                      border: '1px solid var(--color-border, rgba(255,255,255,0.05))',
                      borderRadius: isMobile ? 16 : 24,
                      padding: isMobile ? 10 : 16,
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent, rgba(59, 130, 246, 0.5))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.05))';
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: isMobile ? 12 : 16,
                        overflow: 'hidden',
                        aspectRatio: '4/3',
                        marginBottom: isMobile ? 16 : 24,
                        background: 'linear-gradient(135deg, var(--color-bg-surface, #1f2937) 0%, var(--color-bg-base, #0a0c10) 100%)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        width: isMobile ? 60 : 80,
                        height: isMobile ? 60 : 80,
                        borderRadius: '50%',
                        background: 'var(--color-accent, rgba(59, 130, 246, 0.1))',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? 24 : 32,
                        fontWeight: 700,
                        color: 'var(--color-accent, #3494f8)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                      }}>
                        {seller.storeName?.[0]?.toUpperCase() ?? <ShopOutlined />}
                      </div>

                      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                        <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, fontWeight: 500 }}>
                           {new Date(seller.createdAt).toLocaleDateString(tc('locale') || 'vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: 18,
                          marginBottom: 8,
                          color: 'var(--color-text-primary, #f3f4f6)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        {seller.storeName}
                        {seller.status === 'verified' && (
                          <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 14 }} title="Verified Seller" />
                        )}
                      </h3>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {htmlToPlainTextExcerpt(seller.description || '') || '—'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 16 }}>
                        <Flex gap={8} align="center" style={{ flex: 1 }}>
                          <div style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <StarOutlined style={{ color: 'var(--color-warning, #f59e0b)' }} />
                            <span style={{ fontFamily: MONO, fontWeight: 500 }}>
                              {seller.trustScore?.toFixed(0) ?? '—'}/100
                            </span>
                          </div>
                        </Flex>
                        
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                            {t('browse.sales')}
                          </div>
                          <div style={{ fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 700 }}>
                            <span>{(seller as any).totalSalesCount ?? 0} {tc('common.sales')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </Col>
            ))}
          </Row>

          {/* ── Pagination ─────────────────────────────────────────── */}
          {totalCount > pageSize && (
            <Flex justify="center" style={{ marginTop: isMobile ? 24 : 40 }}>
              <Pagination
                current={data?.metadata?.currentPage ?? page}
                pageSize={data?.metadata?.pageSize ?? pageSize}
                total={totalCount}
                showSizeChanger={!isMobile}
                showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })}
                onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
                size={isMobile ? 'small' : undefined}
              />
            </Flex>
          )}
        </>
      )}
        </div>
      </Flex>
    </div>
  )
}
