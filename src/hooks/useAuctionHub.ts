/**
 * useAuctionHub — React hook for SignalR auction hub lifecycle.
 *
 * Manages the connection to a specific auction room:
 *   1. On mount: connects to hub + joins auction group
 *   2. Registers all server-to-client event handlers
 *   3. On unmount: leaves auction group (connection stays alive for reuse)
 *
 * Usage:
 *   const { connectionState, placeBid, buyNow } = useAuctionHub(auctionId, {
 *     onBidPlaced: (notification) => { ... },
 *     onOutbid: (notification) => { ... },
 *   });
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { auctionHubService } from '@/services/auctionHubService';
import type {
  BidNotification,
  OutbidNotification,
  BuyNowNotification,
  AuctionStartedNotification,
  AuctionEndedNotification,
  AuctionExtendedNotification,
  AuctionCancelledNotification,
  PriceUpdateNotification,
  HubErrorNotification,
} from '@/types/signalr';

// ─── Callback Options ───────────────────────────────────────────────

export interface AuctionHubCallbacks {
  onBidPlaced?: (data: BidNotification) => void;
  onOutbid?: (data: OutbidNotification) => void;
  onBuyNowExecuted?: (data: BuyNowNotification) => void;
  onAuctionStarted?: (data: AuctionStartedNotification) => void;
  onAuctionEnded?: (data: AuctionEndedNotification) => void;
  onAuctionExtended?: (data: AuctionExtendedNotification) => void;
  onAuctionCancelled?: (data: AuctionCancelledNotification) => void;
  onPriceUpdated?: (data: PriceUpdateNotification) => void;
  onError?: (data: HubErrorNotification) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onClose?: (error?: Error) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useAuctionHub(
  auctionId: string | undefined,
  callbacks?: AuctionHubCallbacks
) {
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected
  );

  // Store callbacks in a ref so event handlers always call the latest version
  // without needing to re-subscribe on every render
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // ─── Connect + Subscribe on mount, cleanup on unmount ───────────
  useEffect(() => {
    if (!auctionId) return;

    // Capture as const so TS knows it's a string inside the async closure
    const currentAuctionId = auctionId;
    let mounted = true;
    const unsubscribers: (() => void)[] = [];

    async function setup() {
      try {
        // Register event handlers BEFORE connecting so we don't miss
        // any events that fire immediately after join
        unsubscribers.push(
          auctionHubService.on('BidPlaced', (data) =>
            callbacksRef.current?.onBidPlaced?.(data)
          ),
          auctionHubService.on('Outbid', (data) =>
            callbacksRef.current?.onOutbid?.(data)
          ),
          auctionHubService.on('BuyNowExecuted', (data) =>
            callbacksRef.current?.onBuyNowExecuted?.(data)
          ),
          auctionHubService.on('AuctionStarted', (data) =>
            callbacksRef.current?.onAuctionStarted?.(data)
          ),
          auctionHubService.on('AuctionEnded', (data) =>
            callbacksRef.current?.onAuctionEnded?.(data)
          ),
          auctionHubService.on('AuctionExtended', (data) =>
            callbacksRef.current?.onAuctionExtended?.(data)
          ),
          auctionHubService.on('AuctionCancelled', (data) =>
            callbacksRef.current?.onAuctionCancelled?.(data)
          ),
          auctionHubService.on('PriceUpdated', (data) =>
            callbacksRef.current?.onPriceUpdated?.(data)
          ),
          auctionHubService.on('Error', (data) =>
            callbacksRef.current?.onError?.(data)
          )
        );

        // Lifecycle hooks
        auctionHubService.onReconnecting((error) => {
          if (mounted) setConnectionState(HubConnectionState.Reconnecting);
          callbacksRef.current?.onReconnecting?.(error);
        });
        auctionHubService.onReconnected((connId) => {
          if (mounted) setConnectionState(HubConnectionState.Connected);
          callbacksRef.current?.onReconnected?.(connId);
          // Re-join the auction room after reconnect
          auctionHubService.joinAuction(currentAuctionId).catch(console.error);
        });
        auctionHubService.onClose((error) => {
          if (mounted) setConnectionState(HubConnectionState.Disconnected);
          callbacksRef.current?.onClose?.(error);
        });

        // Connect and join auction room
        await auctionHubService.startConnection();
        if (mounted) {
          setConnectionState(auctionHubService.getConnectionState());
          await auctionHubService.joinAuction(currentAuctionId);
        }
      } catch (err) {
        console.error('[useAuctionHub] Setup failed:', err);
        if (mounted) setConnectionState(HubConnectionState.Disconnected);
      }
    }

    setup();

    return () => {
      mounted = false;
      // Unsubscribe all event handlers
      unsubscribers.forEach((unsub) => unsub());
      // Leave the auction room (don't stop the connection — other hooks may use it)
      auctionHubService.leaveAuction(currentAuctionId).catch(console.error);
    };
  }, [auctionId]);

  // ─── Stable action wrappers ───────────────────────────────────────

  const placeBid = useCallback(
    (amount: number, currency: string) => {
      if (!auctionId) return Promise.reject(new Error('No auction ID'));
      return auctionHubService.placeBid(auctionId, amount, currency);
    },
    [auctionId]
  );

  const buyNow = useCallback(() => {
    if (!auctionId) return Promise.reject(new Error('No auction ID'));
    return auctionHubService.buyNow(auctionId);
  }, [auctionId]);

  const configureAutoBid = useCallback(
    (maxAmount: number, currency: string, incrementAmount?: number) => {
      if (!auctionId) return Promise.reject(new Error('No auction ID'));
      return auctionHubService.configureAutoBid(
        auctionId,
        maxAmount,
        currency,
        incrementAmount
      );
    },
    [auctionId]
  );

  const watchAuction = useCallback(
    (notifyOnBid = true, notifyOnEnd = true) => {
      if (!auctionId) return Promise.reject(new Error('No auction ID'));
      return auctionHubService.watchAuction(
        auctionId,
        notifyOnBid,
        notifyOnEnd
      );
    },
    [auctionId]
  );

  return {
    connectionState,
    isConnected: connectionState === HubConnectionState.Connected,

    // Actions (client-to-server)
    placeBid,
    buyNow,
    configureAutoBid,
    watchAuction,
  };
}
