import * as signalR from '@microsoft/signalr'
import { SIGNALR_URL, STORAGE_KEYS } from '@/utils/constants'

function createHubConnection(hubPath: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${SIGNALR_URL}${hubPath}`, {
      accessTokenFactory: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? '',
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential backoff: 0s, 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000)
        return delay
      },
    })
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

// Lazy-initialized hub connections
let auctionHub: signalR.HubConnection | null = null
let disputeHub: signalR.HubConnection | null = null
let notificationHub: signalR.HubConnection | null = null

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

export async function startConnection(connection: signalR.HubConnection): Promise<void> {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    try {
      await connection.start()
    } catch (err) {
      console.error('SignalR connection error:', err)
      // Retry after 5 seconds
      setTimeout(() => startConnection(connection), 5000)
    }
  }
}

export async function stopConnection(connection: signalR.HubConnection): Promise<void> {
  if (connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop()
  }
}

export async function stopAllConnections(): Promise<void> {
  const hubs = [auctionHub, disputeHub, notificationHub]
  await Promise.all(hubs.filter(Boolean).map((hub) => stopConnection(hub!)))
  auctionHub = null
  disputeHub = null
  notificationHub = null
}
