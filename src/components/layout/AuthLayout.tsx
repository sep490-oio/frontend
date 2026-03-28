import { Outlet, Link } from 'react-router'
import { useTranslation } from 'react-i18next'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const MONO_FONT = "'DM Mono', monospace"

const STATS = [
  { value: '12K+', label: 'items' },
  { value: '45K+', label: 'users' },
  { value: '100%', label: 'verified' },
]

export function AuthLayout() {
  const { t } = useTranslation('common')

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* ── Left: Hero Panel ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '64px 48px',
          background: 'var(--color-bg-surface)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            position: 'absolute',
            top: 32,
            left: 48,
            fontFamily: SERIF_FONT,
            fontSize: 28,
            letterSpacing: '0.15em',
            color: 'var(--color-text-primary)',
            textDecoration: 'none',
            fontWeight: 400,
          }}
        >
          OIO
        </Link>

        {/* Hero content */}
        <div style={{ maxWidth: 480 }}>
          <h1
            style={{
              fontFamily: SERIF_FONT,
              fontWeight: 400,
              fontSize: 42,
              lineHeight: 1.15,
              color: 'var(--color-text-primary)',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            {t('about.heroTitle', 'The Quiet Authority of Exceptional Things')}
          </h1>
          <p
            style={{
              fontFamily: SANS_FONT,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginBottom: 40,
              maxWidth: 400,
            }}
          >
            {t('about.heroDescription', 'A curated space for discerning collectors and connoisseurs of exceptional objects.')}
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40 }}>
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 28,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: SANS_FONT,
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 40px',
          background: 'var(--color-bg-card)',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Outlet />
        </div>

        {/* Footer links */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 24,
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
            {t('menu.terms', 'Terms')}
          </Link>
          <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
            {t('menu.about', 'About')}
          </Link>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            ← {t('menu.home', 'Home')}
          </Link>
        </div>
      </div>

      {/* Mobile: collapse to single column */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] > div:first-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
