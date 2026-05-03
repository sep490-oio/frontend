import { useMemo } from 'react'
import { useLocation } from 'react-router'
import type { AssistantPageContext } from '../types'

const ROUTE_PATTERNS: Array<{
  regex: RegExp
  entityType: string
  paramIndex: number
}> = [
  { regex: /^\/auctions\/([0-9a-f-]{36})/i, entityType: 'auction', paramIndex: 1 },
  { regex: /^\/items\/([0-9a-f-]{36})/i, entityType: 'item', paramIndex: 1 },
  { regex: /^\/me\/orders\/([0-9a-f-]{36})/i, entityType: 'order', paramIndex: 1 },
  { regex: /^\/me\/disputes\/([0-9a-f-]{36})/i, entityType: 'dispute', paramIndex: 1 },
  { regex: /^\/me\/shipments\/([0-9a-f-]{36})/i, entityType: 'shipment', paramIndex: 1 },
  { regex: /^\/me\/wallet/i, entityType: 'wallet', paramIndex: 0 },
  { regex: /^\/me\/payment-methods/i, entityType: 'payment-methods', paramIndex: 0 },
  { regex: /^\/me\/verification/i, entityType: 'verification', paramIndex: 0 },
]

export function usePageContext(): AssistantPageContext {
  const location = useLocation()
  return useMemo(() => {
    const route = location.pathname
    for (const pattern of ROUTE_PATTERNS) {
      const match = route.match(pattern.regex)
      if (match) {
        return {
          route,
          entityType: pattern.entityType,
          entityId: pattern.paramIndex > 0 ? match[pattern.paramIndex] : undefined,
        }
      }
    }
    return { route }
  }, [location.pathname])
}
