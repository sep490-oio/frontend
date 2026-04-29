import { useAppSelector, store, setClockOffset } from '@/app/store'
import apiClient from '@/lib/axios'

// Listen for the Date header in responses to sync clock as a secondary mechanism
apiClient.interceptors.response.use((response) => {
  const serverDateStr = response.headers['date']
  if (serverDateStr) {
    const serverTime = new Date(serverDateStr).getTime()
    const clientTime = Date.now()
    const offset = serverTime - clientTime
    
    // Only update if the offset is significantly different to avoid excessive re-renders
    const currentState = store.getState() as any
    const currentOffset = currentState.system?.clockOffset ?? 0
    if (Math.abs(offset - currentOffset) > 2000) {
      store.dispatch(setClockOffset(offset))
    }
  }
  return response
})

export function useTimeOffset() {
  const offset = useAppSelector((state) => state.system.clockOffset)
  return offset
}

/**
 * @deprecated Use getServerNow() or getServerNowMs() from @/utils/time instead
 */
export function getServerTime() {
  const { store } = require('@/app/store')
  return Date.now() + store.getState().system.clockOffset
}
