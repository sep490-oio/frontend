import { Outlet, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint' // responsive fix: use hook instead of CSS hack

const SERIF_FONT = "'Noto Serif', Georgia, serif"
const SANS_FONT = "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const MONO_FONT = "'JetBrains Mono', monospace"

const STATS = [
  { value: '12K+', label: 'items' },
  { value: '45K+', label: 'users' },
  { value: '100%', label: 'verified' },
]

export function AuthLayout() {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint() // responsive fix

  return (
    <div
      style={{
        display: 'grid',
        // responsive fix: single column on mobile, two on desktop — replaces the raw <style> tag hack
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* ── Left: Hero Panel (hidden on mobile) ── */}
      {!isMobile && ( // responsive fix: conditionally render instead of display:none via CSS hack
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
      )}

      {/* ── Right: Form Panel ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          // responsive fix: tighter padding on mobile
          padding: isMobile ? '32px 16px' : '48px 40px',
          background: 'var(--color-bg-card)',
          overflowY: 'auto',
        }}
      >
        {/* responsive fix: show logo on mobile since hero panel is hidden */}
        {isMobile && (
          <Link
            to="/"
            style={{
              fontFamily: SERIF_FONT,
              fontSize: 24,
              letterSpacing: '0.15em',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              fontWeight: 400,
              marginBottom: 32,
              alignSelf: 'flex-start',
            }}
          >
            OIO
          </Link>
        )}

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
            flexWrap: 'wrap', // responsive fix: wrap footer links on very narrow screens
            justifyContent: 'center',
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
    </div>
  )
}