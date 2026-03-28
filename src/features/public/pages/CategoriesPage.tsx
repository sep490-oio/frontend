import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Spin, Empty } from 'antd'
import { useCategories } from '@/features/item/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function CategoriesPage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const isVi = i18n.language === 'vi'

  const headingFont = isVi ? SANS_FONT : SERIF_FONT
  const headingWeight = isVi ? 600 : 400

  const { isMobile } = useBreakpoint()
  const { data: categories, isLoading } = useCategories()

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 120 }}>
        <Spin size="large" />
      </div>
    )
  }

  const activeCategories = categories?.filter((c) => c.isActive) ?? []

  return (
    <div className="oio-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
      {/* Header */}
      <section style={{ textAlign: 'center', padding: isMobile ? '40px 0 32px' : '80px 0 64px' }}>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginBottom: 16,
          }}
        >
          {t('categories.label', 'OIO Categories')}
        </p>
        <h1
          style={{
            fontFamily: headingFont,
            fontSize: isMobile ? (isVi ? 24 : 28) : (isVi ? 36 : 44),
            fontWeight: headingWeight,
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
            margin: '0 auto 16px',
            letterSpacing: isVi ? '-0.01em' : '-0.02em',
          }}
        >
          {t('categories.title', 'Danh m\u1ee5c')}
        </h1>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: 16,
            lineHeight: 1.7,
            color: 'var(--color-text-secondary)',
            maxWidth: 500,
            margin: '0 auto',
          }}
        >
          {t('categories.subtitle', 'Kh\u00e1m ph\u00e1 c\u00e1c danh m\u1ee5c s\u1ea3n ph\u1ea9m \u0111\u1ea5u gi\u00e1 c\u1ee7a ch\u00fang t\u00f4i')}
        </p>
      </section>

      {/* Divider */}
      <div style={{ width: 48, height: 1, background: 'var(--color-accent)', margin: '0 auto 64px', opacity: 0.4 }} />

      {/* Grid */}
      {activeCategories.length === 0 ? (
        <Empty
          description={t('categories.empty', 'Ch\u01b0a c\u00f3 danh m\u1ee5c n\u00e0o')}
          style={{ padding: '80px 0' }}
        />
      ) : (
        <div
          className="oio-stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? 12 : 24,
            paddingBottom: isMobile ? 40 : 80,
          }}
        >
          {activeCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => navigate(`/auctions?categoryId=${category.id}`)}
              className="oio-press"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 2,
                padding: isMobile ? '16px 14px' : '32px 28px',
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
              {category.iconUrl && (
                <img
                  src={category.iconUrl}
                  alt=""
                  style={{ width: 40, height: 40, objectFit: 'contain', marginBottom: 16 }}
                />
              )}
              <h3
                style={{
                  fontFamily: headingFont,
                  fontSize: 20,
                  fontWeight: headingWeight,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 8px',
                  lineHeight: 1.3,
                }}
              >
                {category.name}
              </h3>
              {category.description && (
                <p
                  style={{
                    fontFamily: SANS_FONT,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 12px',
                  }}
                >
                  {category.description}
                </p>
              )}
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.02em',
                }}
              >
                {category.slug}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
