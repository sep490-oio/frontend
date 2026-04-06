import { Grid } from 'antd'

const { useBreakpoint: useAntBreakpoint } = Grid

/**
 * Three-tier responsive breakpoint hook.
 * Mobile:  < 768px  (Ant `md`)
 * Tablet:  768–1199px (Ant `md` but not `xl`)
 * Desktop: >= 1200px (Ant `xl`)
 *
 * `isMobile` is kept for backward compat — true when < 768px only.
 * Use `isDesktop` for 2-column layout decisions.
 * Use `!isDesktop` for single-column (tablet + mobile).
 */
export function useBreakpoint() {
  const screens = useAntBreakpoint()
  const isDesktop = !!screens.xl       // >= 1200
  const isTablet = !!screens.md && !screens.xl  // 768–1199
  const isMobile = !screens.md         // < 768

  return { isMobile, isTablet, isDesktop }
}
