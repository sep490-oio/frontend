import { Grid } from 'antd'

const { useBreakpoint: useAntBreakpoint } = Grid

/**
 * Two-tier responsive breakpoint hook.
 * Mobile: < 1200px (Ant Design `xl` threshold)
 * Desktop: >= 1200px
 */
export function useBreakpoint() {
  const screens = useAntBreakpoint()
  const isDesktop = !!screens.xl
  const isMobile = !isDesktop

  return { isMobile, isDesktop }
}
