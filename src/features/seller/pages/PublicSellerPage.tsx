import { useState } from 'react'
import { Spin, Empty, Tag, Pagination } from 'antd'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useSellerById, useSellerItems, useSellerReviews } from '@/features/seller/api'
import { Rate } from 'antd'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { formatDateTime, formatCurrency, formatNumber } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { PublicSellerItemDto } from '@/types'

import { SANS_FONT, SERIF_FONT, MONO_FONT } from '@/styles/tokens'

export default function PublicSellerPage() {
  const { t, i18n } = useTranslation('seller')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isVi = i18n.language === 'vi'

  const { isMobile, isTablet } = useBreakpoint()

  const headingFont = isVi ? SANS_FONT : SERIF_FONT
  const headingWeight = isVi ? 600 : 400

  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data: seller, isLoading: sellerLoading } = useSellerById(id ?? '')
  const { data: itemsData, isLoading: itemsLoading } = useSellerItems(id ?? '', {
    pageNumber: page,
    pageSize,
  })

  const [reviewPage, setReviewPage] = useState(1)
  const reviewPageSize = 10
  const { data: reviewsData, isLoading: reviewsLoading } = useSellerReviews(id ?? '', {
    pageNumber: reviewPage,
    pageSize: reviewPageSize,
  })

  if (sellerLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 48 : 120 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!seller) {
    return <Empty description={t('sellerNotFound')} />
  }

  const items = itemsData?.items ?? []
  const totalItems = itemsData?.metadata?.totalCount ?? 0
  const totalPages = itemsData?.metadata?.totalPages ?? 1

  const isVerified = seller.status === SellerProfileStatus.Verified
  const trustScore = seller.trustScore ?? 0
  const isTopRated = trustScore > 90

  // Responsive grid columns
  const itemGridCols = isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))'

  return (
    <div className="oio-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 12px 48px' : '0 24px 80px' }}>
      {/* ---- Seller Header ---- */}
      <section
        style={{
          padding: isMobile ? '20px 16px' : '48px 48px',
          marginBottom: isMobile ? 20 : 48,
          background: 'var(--color-bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--color-border-light)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'var(--color-accent)',
            opacity: 0.6,
          }}
        />

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 28, alignItems: isMobile ? 'flex-start' : 'center' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: isMobile ? 56 : 64,
                height: isMobile ? 56 : 64,
                borderRadius: '50%',
                background: 'var(--color-accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid var(--color-border-light)',
              }}
            >
              {seller.logo ? (
                <img
                  src={seller.logo}
                  alt={seller.storeName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontFamily: SERIF_FONT, fontSize: isMobile ? 22 : 26, color: 'var(--color-accent)' }}>
                  {seller.storeName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Verified checkmark badge */}
            {isVerified && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--color-bg-surface)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: headingFont,
                  fontSize: isMobile ? 20 : 26,
                  fontWeight: headingWeight,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                {seller.storeName}
              </h1>

              {/* Verified badge */}
              {isVerified && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    background: 'rgba(74, 124, 89, 0.08)',
                    color: 'var(--color-success)',
                    fontSize: 11,
                    fontFamily: SANS_FONT,
                    fontWeight: 600,
                    borderRadius: 100,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  {t('public.verified')}
                </span>
              )}

              {/* TOP RATED badge */}
              {isTopRated && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    background: 'rgba(202, 138, 4, 0.1)',
                    color: '#b45309',
                    fontSize: 11,
                    fontFamily: SANS_FONT,
                    fontWeight: 700,
                    borderRadius: 100,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(202, 138, 4, 0.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('public.topRated')}
                </span>
              )}
            </div>

            {/* Trust score + member since row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, marginBottom: 8, flexWrap: 'wrap' }}>
              {trustScore > 0 && (
                <span
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 13,
                    fontWeight: 500,
                    color: trustScore > 90 ? 'var(--color-success)' : trustScore > 70 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {t('browse.trust')}: {trustScore}/100
                </span>
              )}
              <span style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                {t('public.memberSince')} {formatDateTime(seller.createdAt)}
              </span>
            </div>

            {seller.description && (
              <div style={{ maxWidth: 600 }}>
                <SafeHtmlRenderer html={seller.description} style={{ fontFamily: SANS_FONT }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---- Stats Row ---- */}
      <section
        className="oio-stagger"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? 10 : 24,
          marginBottom: isMobile ? 28 : 64,
        }}
      >
        {[
          {
            value: formatNumber(totalItems),
            label: t('public.totalItems'),
          },
          {
            value: seller.rating > 0 ? seller.rating.toFixed(1) : '—',
            label: t('public.rating'),
            sublabel: seller.reviewCount > 0 ? `(${formatNumber(seller.reviewCount)} ${t('public.reviews')})` : undefined,
          },
          {
            value: seller.status,
            label: t('public.trustStatus'),
            isBadge: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: isMobile ? '16px 12px' : '28px 24px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            {stat.isBadge ? (
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                <StatusBadge status={stat.value as string} />
              </div>
            ) : (
              <div
                style={{
                  fontFamily: MONO_FONT,
                  fontSize: isMobile ? 20 : 28,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
            )}
            <div style={{ fontFamily: SANS_FONT, fontSize: isMobile ? 11 : 13, color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </div>
            {stat.sublabel && (
              <div style={{ fontFamily: SANS_FONT, fontSize: isMobile ? 10 : 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                {stat.sublabel}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Divider */}
      <div style={{ width: 48, height: 1, background: 'var(--color-accent)', margin: isMobile ? '0 auto 24px' : '0 auto 48px', opacity: 0.4 }} />

      {/* ---- Items Grid ---- */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 32, gap: 8 }}>
          <h2
            style={{
              fontFamily: headingFont,
              fontSize: isMobile ? 18 : isVi ? 22 : 26,
              fontWeight: headingWeight,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {t('sellerItems')}
          </h2>
          <span style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
            {formatNumber(totalItems)} {t('public.items')}
          </span>
        </div>

        {itemsLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              fontFamily: SANS_FONT,
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-surface)',
              borderRadius: 12,
            }}
          >
            {t('public.noItems')}
          </div>
        ) : (
          <>
            <div
              className="oio-stagger"
              style={{
                display: 'grid',
                gridTemplateColumns: itemGridCols,
                gap: isMobile ? 10 : 20,
              }}
            >
              {items.map((item: PublicSellerItemDto) => (
                <div
                  key={item.id}
                  className="oio-card-hover oio-press"
                  onClick={() => navigate(`/items/${item.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/items/${item.id}`) } }}
                  tabIndex={0}
                  role="link"
                  aria-label={item.title}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--color-bg-card)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-light)',
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                    outline: 'none',
                  }}
                >
                  {/* Image area */}
                  <div
                    style={{
                      aspectRatio: '4 / 3',
                      background: 'var(--color-bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-tertiary)',
                      fontSize: 13,
                      fontFamily: SANS_FONT,
                      overflow: 'hidden',
                    }}
                  >
                    {item.images?.[0]?.url ? (
                      <img
                        src={item.images[0].url}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      item.title.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: isMobile ? '10px 12px 12px' : '14px 16px 16px' }}>
                    <h4
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 4px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </h4>
                    {item.auction && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>{item.auction.auctionStatus}</Tag>
                        {item.auction.startTime && !isMobile && (
                          <span style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                            {dayjs(item.auction.startTime).format('DD/MM/YYYY')}
                            {item.auction.endTime ? ` → ${dayjs(item.auction.endTime).format('DD/MM/YYYY')}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 500,
                        color: 'var(--color-accent)',
                        marginBottom: isMobile ? 6 : 10,
                      }}
                    >
                      {item.auction
                        ? formatCurrency(item.auction.currentPrice, item.auction.currency)
                        : t('public.noAuctionPrice')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <StatusBadge status={item.status} size="small" />
                      {!isMobile && (
                        <span style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                          {formatDateTime(item.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 24 : 40 }}>
                <Pagination
                  current={page}
                  total={totalItems}
                  pageSize={pageSize}
                  onChange={setPage}
                  showSizeChanger={false}
                  size={isMobile ? 'small' : undefined}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* ---- Divider ---- */}
      <div style={{ width: 48, height: 1, background: 'var(--color-accent)', margin: isMobile ? '24px auto' : '48px auto', opacity: 0.4 }} />

      {/* ---- Reviews Section ---- */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 32, gap: 8 }}>
          <h2
            style={{
              fontFamily: headingFont,
              fontSize: isMobile ? 18 : isVi ? 22 : 26,
              fontWeight: headingWeight,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {t('public.reviewsTitle')}
          </h2>
          {seller.reviewCount > 0 && (
            <span style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
              {formatNumber(seller.reviewCount)} {t('public.reviews')}
            </span>
          )}
        </div>

        {/* Average rating breakdown */}
        {seller.rating > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 12 : 16,
              marginBottom: isMobile ? 16 : 32,
              padding: isMobile ? '16px' : '20px 24px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: MONO_FONT,
                fontSize: isMobile ? 28 : 36,
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              {seller.rating.toFixed(1)}
            </div>
            <div>
              <Rate disabled allowHalf value={seller.rating} style={{ fontSize: isMobile ? 14 : 18 }} />
              <div style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                {t('public.basedOn')} {formatNumber(seller.reviewCount)} {t('public.reviews')}
              </div>
            </div>
          </div>
        )}

        {reviewsLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : !reviewsData?.items || reviewsData.items.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              fontFamily: SANS_FONT,
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-surface)',
              borderRadius: 12,
            }}
          >
            {t('public.noReviews')}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>
              {reviewsData.items.map((review: { id: string; reviewerName?: string; overallRating: number; comment?: string; createdAt: string }) => (
                <div
                  key={review.id}
                  style={{
                    padding: isMobile ? '14px' : '20px 24px',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: SANS_FONT, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {review.reviewerName || t('public.anonymousReviewer')}
                      </span>
                      <Rate disabled value={review.overallRating} style={{ fontSize: isMobile ? 12 : 14 }} />
                    </div>
                    <span style={{ fontFamily: SANS_FONT, fontSize: 12, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: isMobile ? 13 : 14,
                        lineHeight: 1.7,
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                      }}
                    >
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Review Pagination */}
            {(reviewsData.metadata?.totalPages ?? 1) > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 24 : 40 }}>
                <Pagination
                  current={reviewPage}
                  total={(reviewsData.metadata?.totalPages ?? 1) * reviewPageSize}
                  pageSize={reviewPageSize}
                  onChange={setReviewPage}
                  showSizeChanger={false}
                  size={isMobile ? 'small' : undefined}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
