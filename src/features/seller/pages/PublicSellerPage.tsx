import { useState } from 'react'
import { Spin, Empty } from 'antd'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useSellerById, useSellerItems } from '@/features/seller/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime, formatCurrency, formatNumber } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { PublicSellerItemDto } from '@/types'

const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function PublicSellerPage() {
  const { t, i18n } = useTranslation('seller')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isVi = i18n.language === 'vi'

  const headingFont = isVi ? SANS_FONT : SERIF_FONT
  const headingWeight = isVi ? 600 : 400

  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data: seller, isLoading: sellerLoading } = useSellerById(id ?? '')
  const { data: itemsData, isLoading: itemsLoading } = useSellerItems(id ?? '', {
    pageNumber: page,
    pageSize,
  })

  if (sellerLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 120 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!seller) {
    return <Empty description={t('sellerNotFound', 'Seller not found')} />
  }

  const items = itemsData?.items ?? []
  const totalItems = itemsData?.metadata?.totalCount ?? 0
  const totalPages = itemsData?.metadata?.totalPages ?? 1

  const isVerified = seller.status === SellerProfileStatus.Approved

  return (
    <div className="oio-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* ─── Seller Header ─── */}
      <section
        style={{
          padding: '64px 48px',
          marginBottom: 48,
          background: 'var(--color-bg-surface)',
          borderRadius: 2,
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

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {/* Avatar */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--color-accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
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
              <span
                style={{
                  fontFamily: SERIF_FONT,
                  fontSize: 36,
                  color: 'var(--color-accent)',
                }}
              >
                {seller.storeName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1
                style={{
                  fontFamily: headingFont,
                  fontSize: 28,
                  fontWeight: headingWeight,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {seller.storeName}
              </h1>
              {isVerified && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    background: 'rgba(74, 124, 89, 0.08)',
                    color: 'var(--color-success)',
                    fontSize: 12,
                    fontFamily: SANS_FONT,
                    fontWeight: 500,
                    borderRadius: 2,
                    letterSpacing: '0.02em',
                  }}
                >
                  Verified
                </span>
              )}
            </div>

            {seller.description && (
              <p
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'var(--color-text-secondary)',
                  margin: '0 0 12px',
                  maxWidth: 600,
                }}
              >
                {seller.description}
              </p>
            )}

            <p
              style={{
                fontFamily: SANS_FONT,
                fontSize: 13,
                color: 'var(--color-text-tertiary)',
                margin: 0,
              }}
            >
              {t('memberSince', 'Th\u00e0nh vi\u00ean t\u1eeb')} {formatDateTime(seller.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Stats Row ─── */}
      <section
        className="oio-stagger"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 64,
        }}
      >
        {[
          {
            value: formatNumber(totalItems),
            label: t('totalItems', 'S\u1ea3n ph\u1ea9m'),
          },
          {
            value: seller.rating > 0 ? seller.rating.toFixed(1) : '\u2014',
            label: t('rating', '\u0110\u00e1nh gi\u00e1'),
            sublabel: seller.reviewCount > 0 ? `(${formatNumber(seller.reviewCount)} ${t('reviews', '\u0111\u00e1nh gi\u00e1')})` : undefined,
          },
          {
            value: seller.status,
            label: t('trustStatus', 'Tr\u1ea1ng th\u00e1i'),
            isBadge: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '28px 24px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            {stat.isBadge ? (
              <div style={{ marginBottom: 8 }}>
                <StatusBadge status={stat.value as string} />
              </div>
            ) : (
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 28,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
            )}
            <div
              style={{
                fontFamily: SANS_FONT,
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              {stat.label}
            </div>
            {stat.sublabel && (
              <div
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                  marginTop: 2,
                }}
              >
                {stat.sublabel}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Divider */}
      <div style={{ width: 48, height: 1, background: 'var(--color-accent)', margin: '0 auto 48px', opacity: 0.4 }} />

      {/* ─── Items Grid ─── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: headingFont,
              fontSize: isVi ? 22 : 26,
              fontWeight: headingWeight,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {t('sellerItems', 'S\u1ea3n ph\u1ea9m')}
          </h2>
          <span
            style={{
              fontFamily: SANS_FONT,
              fontSize: 13,
              color: 'var(--color-text-tertiary)',
            }}
          >
            {formatNumber(totalItems)} {t('items', 's\u1ea3n ph\u1ea9m')}
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
              borderRadius: 2,
            }}
          >
            {t('noItems', 'Ch\u01b0a c\u00f3 s\u1ea3n ph\u1ea9m n\u00e0o')}
          </div>
        ) : (
          <>
            <div
              className="oio-stagger"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 20,
              }}
            >
              {items.map((item: PublicSellerItemDto) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="oio-press"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 2,
                    padding: '20px 18px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-light)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <h4
                    style={{
                      fontFamily: SANS_FONT,
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      margin: '0 0 8px',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </h4>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--color-accent)',
                      marginBottom: 8,
                    }}
                  >
                    {formatCurrency(item.price)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <StatusBadge status={item.status} size="small" />
                    <span
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: 11,
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    style={{
                      width: 36,
                      height: 36,
                      border: p === page ? '1px solid var(--color-accent)' : '1px solid var(--color-border-light)',
                      borderRadius: 2,
                      background: p === page ? 'var(--color-accent)' : 'var(--color-bg-card)',
                      color: p === page ? '#fff' : 'var(--color-text-secondary)',
                      fontFamily: SANS_FONT,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
