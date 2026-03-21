/**
 * Wallet service — data fetching functions for wallet & transactions.
 *
 * Uses real API endpoints:
 * - GET /api/me/wallet → WalletSummaryDto
 * - GET /api/me/wallet/transactions → paginated list
 *
 * Errors propagate to TanStack Query for retry handling.
 */

import { api } from './api';
import type { Wallet, WalletTransaction } from '@/types';

/** Maps BE WalletSummaryDto (MoneyDto fields) to FE Wallet type */
function mapApiWallet(data: Record<string, unknown>): Wallet {
  // BE uses MoneyDto wrappers: { amount: number, currency: string }
  // or may return flat numbers — handle both shapes
  const extractAmount = (field: unknown): number => {
    if (typeof field === 'number') return field;
    if (field && typeof field === 'object' && 'amount' in field) {
      return (field as { amount: number }).amount;
    }
    return 0;
  };

  return {
    id: (data.id as string) ?? '',
    userId: (data.userId as string) ?? '',
    availableBalance: extractAmount(data.availableBalance ?? data.balance),
    lockedBalance: extractAmount(data.lockedBalance ?? data.pendingBalance),
    heldBalance: extractAmount(data.heldBalance),
    refundBalance: extractAmount(data.refundBalance),
    currency: (data.currency as string) ?? 'VND',
    isActive: (data.isActive as boolean) ?? false,
    createdAt: (data.createdAt as string) ?? '',
    modifiedAt: (data.modifiedAt as string) ?? '',
  };
}

/** Fetches the current user's wallet from GET /api/me/wallet */
export async function getMyWallet(): Promise<Wallet> {
  const { data } = await api.get('/api/me/wallet');
  // BE may wrap in { data: ... } or return directly
  const raw = (data as Record<string, unknown>)?.data ?? data;
  return mapApiWallet(raw as Record<string, unknown>);
}

/** Fetches the current user's wallet transaction history */
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const { data } = await api.get('/api/me/wallet/transactions');
  // BE returns paginated: { items: [...], totalItems, ... } or array
  const raw = data as Record<string, unknown>;
  const items = (raw?.items ?? raw?.data ?? data) as WalletTransaction[];
  return Array.isArray(items) ? items : [];
}
