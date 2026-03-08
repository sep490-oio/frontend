/**
 * SignalR Auction Hub — connection manager.
 *
 * Manages a single HubConnection to the backend's AuctionHub.
 * The hub requires authentication (JWT), so we read the access token
 * from Redux on every connection/reconnection attempt.
 *
 * Architecture:
 *   - One connection per app (singleton pattern)
 *   - On connect: server auto-joins user to `user:{userId}` group
 *   - Call joinAuction/leaveAuction to subscribe to auction-specific events
 *   - All bidding actions (placeBid, buyNow, configureAutoBid) go through
 *     the hub as the PRIMARY channel; REST endpoints are fallback only
 *
 * Source: docs/vps/AuctionHub.cs, docs/vps/IAuctionHubClient.cs
 */
import {
  HubConnectionBuilder,
  HubConnectionState,
  HubConnection,
  LogLevel,
  HttpTransportType,
} from '@microsoft/signalr';
import { store } from '@/app/store';
import type { AuctionHubEvents } from '@/types/signalr';

// ─── Configuration ──────────────────────────────────────────────────

/**
 * Hub URL — constructed from the same base URL the REST API uses.
 * The exact path needs to be confirmed with Tan (defaulting to /hubs/auction,
 * which is the standard .NET MapHub convention).
 */
const HUB_PATH = import.meta.env.VITE_SIGNALR_HUB_PATH || '/hubs/auction';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const HUB_URL = `${BASE_URL}${HUB_PATH}`;

// ─── Singleton Connection ───────────────────────────────────────────

let connection: HubConnection | null = null;

/** Returns the current access token from Redux for hub authentication */
function getAccessToken(): string {
  return store.getState().auth.accessToken ?? '';
}

/**
 * Gets the existing connection or creates a new one.
 *
 * SignalR handles reconnection automatically with the .withAutomaticReconnect()
 * builder option. The retry policy uses increasing delays: 0s, 2s, 10s, 30s.
 *
 * The accessTokenFactory is called on EVERY connection attempt (including
 * reconnects), so it always picks up the latest token from Redux — even
 * after a silent refresh has swapped the token.
 */
function getOrCreateConnection(): HubConnection {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      // accessTokenFactory is called each time the client connects/reconnects
      accessTokenFactory: () => getAccessToken(),
      // WebSockets only + skip negotiate — avoids connectionId mismatch
      // caused by Cloudflare/Caddy proxies routing the negotiate POST and
      // WebSocket upgrade to different backend instances.
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
      // Don't send browser credentials (cookies) — we use Authorization header
      // instead. Without this, CORS fails because the BE doesn't send
      // Access-Control-Allow-Credentials: true.
      withCredentials: false,
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(
      import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning
    )
    .build();

  return connection;
}

// ─── Connection Lifecycle ───────────────────────────────────────────

/** Starts the connection if not already connected */
async function startConnection(): Promise<void> {
  const conn = getOrCreateConnection();

  if (conn.state === HubConnectionState.Connected) return;
  if (conn.state === HubConnectionState.Connecting) return;

  // Don't attempt to connect without a token — hub requires [Authorize]
  if (!getAccessToken()) {
    console.warn('[AuctionHub] No access token available — skipping connect');
    return;
  }

  try {
    await conn.start();
    console.log('[AuctionHub] Connected');
  } catch (err) {
    console.error('[AuctionHub] Connection failed:', err);
    throw err;
  }
}

/** Stops the connection and clears the singleton */
async function stopConnection(): Promise<void> {
  if (!connection) return;

  try {
    await connection.stop();
    console.log('[AuctionHub] Disconnected');
  } catch (err) {
    console.error('[AuctionHub] Disconnect error:', err);
  } finally {
    connection = null;
  }
}

/** Returns the current connection state */
function getConnectionState(): HubConnectionState {
  return connection?.state ?? HubConnectionState.Disconnected;
}

// ─── Auction Room Management ────────────────────────────────────────
// These map directly to the hub's JoinAuction/LeaveAuction methods.
// The server adds/removes the caller from the `auction:{auctionId}` group.

async function joinAuction(auctionId: string): Promise<void> {
  const conn = getOrCreateConnection();
  if (conn.state !== HubConnectionState.Connected) {
    await startConnection();
  }
  await conn.invoke('JoinAuction', auctionId);
}

async function leaveAuction(auctionId: string): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) return;
  await connection.invoke('LeaveAuction', auctionId);
}

// ─── Bidding Actions (Client-to-Server) ─────────────────────────────
// These are the primary channel for bidding. REST endpoints are fallback.

async function placeBid(
  auctionId: string,
  amount: number,
  currency: string
): Promise<void> {
  const conn = getOrCreateConnection();
  await conn.invoke('PlaceBid', auctionId, amount, currency);
}

async function buyNow(auctionId: string): Promise<void> {
  const conn = getOrCreateConnection();
  await conn.invoke('BuyNow', auctionId);
}

async function configureAutoBid(
  auctionId: string,
  maxAmount: number,
  currency: string,
  incrementAmount?: number
): Promise<void> {
  const conn = getOrCreateConnection();
  await conn.invoke(
    'ConfigureAutoBid',
    auctionId,
    maxAmount,
    currency,
    incrementAmount ?? null
  );
}

async function watchAuction(
  auctionId: string,
  notifyOnBid = true,
  notifyOnEnd = true
): Promise<void> {
  const conn = getOrCreateConnection();
  await conn.invoke('WatchAuction', auctionId, notifyOnBid, notifyOnEnd);
}

// ─── Event Subscription (Server-to-Client) ──────────────────────────
// Type-safe wrappers around connection.on() using the AuctionHubEvents map.

/**
 * Registers a handler for a server-to-client event.
 * Returns an unsubscribe function for cleanup.
 */
function on<K extends keyof AuctionHubEvents>(
  event: K,
  handler: (data: AuctionHubEvents[K]) => void
): () => void {
  const conn = getOrCreateConnection();
  conn.on(event, handler);
  return () => conn.off(event, handler);
}

/**
 * Removes a specific handler for an event.
 * If no handler is provided, removes ALL handlers for that event.
 */
function off<K extends keyof AuctionHubEvents>(
  event: K,
  handler?: (data: AuctionHubEvents[K]) => void
): void {
  if (!connection) return;
  if (handler) {
    connection.off(event, handler);
  } else {
    connection.off(event);
  }
}

// ─── Reconnect Event Hooks ──────────────────────────────────────────

function onReconnecting(callback: (error?: Error) => void): void {
  getOrCreateConnection().onreconnecting(callback);
}

function onReconnected(callback: (connectionId?: string) => void): void {
  getOrCreateConnection().onreconnected(callback);
}

function onClose(callback: (error?: Error) => void): void {
  getOrCreateConnection().onclose(callback);
}

// ─── Public API ─────────────────────────────────────────────────────

export const auctionHubService = {
  // Connection
  startConnection,
  stopConnection,
  getConnectionState,

  // Rooms
  joinAuction,
  leaveAuction,

  // Actions (client-to-server)
  placeBid,
  buyNow,
  configureAutoBid,
  watchAuction,

  // Events (server-to-client)
  on,
  off,

  // Lifecycle hooks
  onReconnecting,
  onReconnected,
  onClose,
} as const;
