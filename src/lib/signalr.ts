import * as signalR from '@microsoft/signalr'
import { SIGNALR_URL, STORAGE_KEYS } from '@/utils/constants'
import { refreshToken } from '@/lib/tokenRefresh'

let lastAttemptedToken: string | null = null

function createHubConnection(hubPath: string): signalR.HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${SIGNALR_URL}${hubPath}`, {
      accessTokenFactory: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        if (!token) throw new Error('No access token available')
        lastAttemptedToken = token
        return token
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

  // When connection closes with error (e.g. server drop, page reload),
  // we should attempt to reconnect. We ONLY refresh the token if the error is explicitly a 401.
  // Skip the recovery path entirely once the connection is flagged as
  // terminally stopped — otherwise we loop 401 -> onclose -> refresh-fail
  // -> setTimeout -> startConnection -> 401 indefinitely.
  connection.onclose(async (error) => {
    if (terminallyStopped.get(connection)) return
    if (error) {
      if (error?.message?.includes('401')) {
        try {
          await refreshToken(lastAttemptedToken)
          setTimeout(() => void startConnection(connection), 3000)
        } catch {
          // handleRefreshFailure already cleared tokens + redirected to /login.
          // Do NOT reconnect — it would loop through 401 -> onclose -> here.
          terminallyStopped.set(connection, true)
        }
      } else {
        // Generic network drop (like closing laptop, or during page reload before it dies)
        // Just retry the connection later
        setTimeout(() => void startConnection(connection), 5000)
      }
    }
  })

  return connection
}

const retryTimeouts = new Map<signalR.HubConnection, ReturnType<typeof setTimeout>>()

// Per-connection terminal flag. Set when a refresh attempt permanently fails
// (handleRefreshFailure has already redirected to /login). Prevents the
// onclose -> refresh-fail -> setTimeout -> startConnection -> 401 -> onclose
// loop. Per-connection (not module-global) because 4 hubs run independently.
const terminallyStopped = new Map<signalR.HubConnection, boolean>()

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
    // Reversibility: a successful start clears any terminal flag so a hub
    // that was marked dead due to a transient failure (which later self-
    // healed, e.g. user re-authenticated in another tab) can come back.
    terminallyStopped.delete(connection)
    return true
  } catch (err: any) {
    console.error('SignalR connection error:', err)
    
    // If it's a 401 Unauthorized, force refresh
    if (err?.statusCode === 401 || err?.message?.includes('401')) {
      // Pass the token that actually failed, not the one currently in localStorage (which might have already been refreshed by another tab/request)
      try {
        await refreshToken(lastAttemptedToken)
        // Note: startConnection will naturally retry after the timeout below
      } catch {
        terminallyStopped.set(connection, true)
        return false // don't loop
      }
    }

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
  terminallyStopped.delete(connection)
}

export async function stopAllConnections(): Promise<void> {
  const hubs = [auctionHub, disputeHub, notificationHub, userHub]
  await Promise.all(hubs.filter(Boolean).map((hub) => stopConnection(hub!)))
  terminallyStopped.clear()
  auctionHub = null
  disputeHub = null
  notificationHub = null
  userHub = null
}
