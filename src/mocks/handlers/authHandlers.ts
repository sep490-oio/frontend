import { http, HttpResponse, delay } from 'msw'
import { API_URL } from '@/utils/constants'
import { mockCurrentUser } from '../data/auth'

export const authHandlers = [
  http.get(`${API_URL}/auth/me`, async () => {
    await delay(500) // Simulate network latency
    return HttpResponse.json(mockCurrentUser)
  }),

  http.post(`${API_URL}/auth/login`, async () => {
    await delay(800)
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    })
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token-refreshed',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    })
  }),
]
