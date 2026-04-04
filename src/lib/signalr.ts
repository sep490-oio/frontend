import * as signalR from '@microsoft/signalr'
import axios from 'axios'
import { API_URL, SIGNALR_URL, STORAGE_KEYS } from '@/utils/constants'

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token, or empty string if refresh fails.
 */
async function ensureFreshToken(): Promise<string> {
  const current = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? ''
  if (!current) return ''

  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  if (!refreshToken) return current

  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
    const newAccessToken = data.accessToken as string
    const newRefreshToken = data.refreshToken as string
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
    return newAccessToken
  } catch {
    // Refresh failed — return current token (may be expired)
    return current
  }
}

function createHubConnection(hubPath: string): signalR.HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${SIGNALR_URL}${hubPath}`, {
      accessTokenFactory: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (token) await ensureFreshToken()
        return token ?? ''
      },
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000)
        return delay
      },
    })
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  // When connection closes with error (e.g. token expired),
  // refresh token and restart after a short delay.
  connection.onclose(async (error) => {
    if (error) {
      await ensureFreshToken()
      setTimeout(() => void startConnection(connection), 3000)
    }
  })

  return connection
}

const retryTimeouts = new Map<signalR.HubConnection, ReturnType<typeof setTimeout>>()

// Lazy-initialized hub connections
let auctionHub: signalR.HubConnection | null = null
let disputeHub: signalR.HubConnection | null = null
let notificationHub: signalR.HubConnection | null = null
let userHub: signalR.HubConnection | null = null

function waitForConnectionReady(
  connection: signalR.HubConnection,
  timeoutMs = 10000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const intervalId = setInterval(() => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        clearInterval(intervalId)
        resolve(true)
        return
      }

      if (
        connection.state === signalR.HubConnectionState.Disconnected ||
        Date.now() - startedAt >= timeoutMs
      ) {
        clearInterval(intervalId)
        resolve(false)
      }
    }, 100)
  })
}

export function getAuctionHub(): signalR.HubConnection {
  if (!auctionHub) {
    auctionHub = createHubConnection('/auction')
  }
  return auctionHub
}

export function getDisputeHub(): signalR.HubConnection {
  if (!disputeHub) {
    disputeHub = createHubConnection('/disputes')
  }
  return disputeHub
}

export function getNotificationHub(): signalR.HubConnection {
  if (!notificationHub) {
    notificationHub = createHubConnection('/notifications')
  }
  return notificationHub
}

export function getUserHub(): signalR.HubConnection {
  if (!userHub) {
    userHub = createHubConnection('/user')
  }
  return userHub
}

export async function startConnection(connection: signalR.HubConnection): Promise<boolean> {
  if (connection.state === signalR.HubConnectionState.Connected) {
    return true
  }

  if (connection.state !== signalR.HubConnectionState.Disconnected) {
    return waitForConnectionReady(connection)
  }

  try {
    await connection.start()
    return true
  } catch (err) {
    console.error('SignalR connection error:', err)
    // Retry after 5 seconds
    const existing = retryTimeouts.get(connection)
    if (existing) clearTimeout(existing)
    retryTimeouts.set(connection, setTimeout(() => {
      retryTimeouts.delete(connection)
      void startConnection(connection)
    }, 5000))
    return false
  }
}

export async function stopConnection(connection: signalR.HubConnection): Promise<void> {
  const existing = retryTimeouts.get(connection)
  if (existing) {
    clearTimeout(existing)
    retryTimeouts.delete(connection)
  }
  if (connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop()
  }
}

export async function stopAllConnections(): Promise<void> {
  const hubs = [auctionHub, disputeHub, notificationHub, userHub]
  await Promise.all(hubs.filter(Boolean).map((hub) => stopConnection(hub!)))
  auctionHub = null
  disputeHub = null
  notificationHub = null
  userHub = null
}
