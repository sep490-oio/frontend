import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useAppDispatch } from '@/app/store'
import { setClockOffset } from '@/app/store'
import { fetchServerTime } from '@/features/system/api'

export function useTimeSync() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const syncTime = async () => {
      try {
        const localBefore = Date.now()
        const { serverTime } = await fetchServerTime()
        const localAfter = Date.now()
        
        // Use the midpoint of the request to account for network latency
        const localMidpoint = (localBefore + localAfter) / 2
        const serverTimeMs = dayjs(serverTime).valueOf()
        
        if (isNaN(serverTimeMs)) {
          throw new Error(`Invalid server time received: ${serverTime}`)
        }

        const offset = serverTimeMs - localMidpoint
        
        dispatch(setClockOffset(offset))
        console.log(`[TimeSync] Server time synchronized. Offset: ${Math.round(offset)}ms`)
      } catch (error) {
        console.error('[TimeSync] Failed to synchronize time with server:', error)
      }
    }

    syncTime()
  }, [dispatch])
}
