import { useLocation } from 'react-router'

/**
 * Returns the route prefix for the current context.
 * Pages shared between `/me/*` (bidder) and `/seller/*` (seller center)
 * use this hook to generate correct navigation paths.
 */
export function useRoutePrefix(): '/seller' | '/me' {
  const { pathname } = useLocation()
  return pathname.startsWith('/seller') ? '/seller' : '/me'
}
