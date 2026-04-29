import apiClient from '@/lib/axios'

export interface ServerTimeResponse {
  serverTime: string
}

export const fetchServerTime = async () => {
  try {
    // Try both relative and absolute-ish paths to bypass possible proxy/baseURL issues
    const response = await apiClient.get<ServerTimeResponse>('system/time')
    if (response.data?.serverTime) return response.data
  } catch (err) {
    console.warn('[SystemAPI] fetchServerTime(system/time) failed, trying fallback...', err)
  }

  // Fallback: Use any valid endpoint and extract the Date header
  // We use /auth/login as a safe probe or any other public endpoint
  const fallback = await apiClient.get('/auctions', { params: { pageSize: 1 } })
  const dateHeader = fallback.headers['date']
  if (dateHeader) {
    return { serverTime: new Date(dateHeader).toISOString() }
  }

  throw new Error('Could not synchronize time with server')
}

