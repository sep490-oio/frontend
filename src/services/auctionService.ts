/**
 * Auction service — data fetching functions for auctions & bidding.
 *
 * Calls real backend API at VITE_API_BASE_URL (https://api.newlsun.com).
 * Includes adapter functions to map BE response shapes to FE types.
 *
 * The function signatures and return types stay the same as the mock
 * version, so NO changes are needed in hooks or UI components.
 */

import { api } from './api';
import axios from 'axios';
import type {
  Auction,
  AuctionListItem,
  AuctionFilters,
  Bid,
  BuyNowResponse,
  Category,
  JoinAuctionResponse,
  PaginatedResponse,
  PlaceBidResponse,
  ToggleWatchResponse,
} from '@/types';
import type { ItemSummary, ItemImage } from '@/types/item';
import type { AuctionStatus } from '@/types/enums';

// ─── BE Response Shapes (what the backend actually returns) ──────

/** BE MoneyDto — wraps all monetary values with currency info */
interface ApiMoneyDto {
  amount: number;
  currency: string;
  symbol: string;
}

/** Shape of a single item in GET /api/auctions list response */
interface ApiAuctionListItem {
  id: string;
  itemTitle: string;
  primaryImageUrl: string | null;
  currentPrice: ApiMoneyDto;
  startingPrice: ApiMoneyDto;
  buyNowPrice?: ApiMoneyDto | null;
  currency: string;
  status: string;
  bidCount: number;
  watchCount: number;
  startTime: string;
  endTime: string;
  remainingTime: string;
  isEndingSoon: boolean;
  isFeatured: boolean;
  sellerId: string;
}

/** Shape of GET /api/auctions paginated response */
interface ApiPaginatedResponse<T> {
  items: T[];
  metadata: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

/** Shape of an image in the BE item response */
interface ApiItemImage {
  id: string;
  url: string;
  publicId: string;
  resourceType: string;
  isPrimary: boolean;
  sortOrder: number;
  fileName: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
}

/** Shape of the item nested in GET /api/auctions/{id} */
interface ApiItemDetail {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string | null;
  condition: string;
  status: string;
  quantity: number;
  images: ApiItemImage[];
  createdAt: string;
}

/** Shape of auction object nested in GET /api/auctions/{id} */
interface ApiAuctionDetail {
  id: string;
  itemId: string;
  sellerId: string;
  startingPrice: ApiMoneyDto;
  reservePrice?: ApiMoneyDto | null;
  buyNowPrice?: ApiMoneyDto | null;
  currentPrice: ApiMoneyDto;
  bidIncrement: ApiMoneyDto;
  currency: string;
  startTime: string;
  endTime: string;
  actualEndTime?: string | null;
  status: string;
  currentWinnerId?: string | null;
  autoExtend: boolean;
  extensionMinutes: number;
  isFeatured: boolean;
  viewCount: number;
  bidCount: number;
  watchCount: number;
  minimumBidAmount: ApiMoneyDto;
  isReserveMet: boolean;
  hasBuyNow: boolean;
  remainingTime: string;
  isEndingSoon: boolean;
  createdAt: string;
}

/** Shape of a bid in the BE response */
interface ApiBid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderDisplayName?: string | null;
  bidderName?: string | null;
  amount: ApiMoneyDto;
  isAutoBid: boolean;
  autoBidId?: string | null;
  status: string;
  createdAt: string;
}

/** Full shape of GET /api/auctions/{id} response */
interface ApiAuctionDetailResponse {
  auction: ApiAuctionDetail;
  item: ApiItemDetail;
  recentBids: ApiBid[];
  priceHistory: Array<{ price: ApiMoneyDto; bidId?: string | null; recordedAt: string }>;
}

// ─── Adapters (BE shape → FE types) ─────────────────────────────

/**
 * Maps BE paginated response to FE PaginatedResponse format.
 * BE uses `metadata.currentPage`, FE uses `page`, etc.
 */
function mapPagination<TApi, TFe>(
  response: ApiPaginatedResponse<TApi>,
  mapItem: (item: TApi) => TFe,
): PaginatedResponse<TFe> {
  return {
    items: response.items.map(mapItem),
    page: response.metadata.currentPage,
    pageSize: response.metadata.pageSize,
    totalItems: response.metadata.totalCount,
    totalPages: response.metadata.totalPages,
    hasNextPage: response.metadata.hasNext,
    hasPreviousPage: response.metadata.hasPrevious,
  };
}

/**
 * Maps BE auction list item to FE AuctionListItem.
 * Fields missing from BE are defaulted to safe values.
 */
function mapListItem(api: ApiAuctionListItem): AuctionListItem {
  return {
    id: api.id,
    status: api.status as AuctionStatus,
    itemTitle: api.itemTitle,
    primaryImageUrl: api.primaryImageUrl,
    startingPrice: api.startingPrice.amount,
    currentPrice: api.currentPrice.amount,
    buyNowPrice: api.buyNowPrice?.amount ?? null,
    currency: api.currency,
    startTime: api.startTime,
    endTime: api.endTime,
    bidCount: api.bidCount,
    watchCount: api.watchCount,
    isFeatured: api.isFeatured,
    isEndingSoon: api.isEndingSoon,
    sellerId: api.sellerId,
  };
}

/**
 * Maps BE item images to FE ItemImage format.
 * BE uses `url`, FE uses `imageUrl`.
 */
function mapItemImage(img: ApiItemImage, itemId: string): ItemImage {
  return {
    id: img.id,
    itemId,
    imageUrl: img.url,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  };
}

/**
 * Maps the full BE auction detail response to the FE Auction type.
 * Merges auction + item data into a single flat Auction object.
 */
function mapAuctionDetail(response: ApiAuctionDetailResponse): Auction {
  const { auction: a, item, recentBids } = response;

  // Map item to FE ItemSummary
  const itemSummary: ItemSummary = {
    id: item.id,
    title: item.title,
    condition: item.condition as ItemSummary['condition'],
    primaryImageUrl: item.images.find((img) => img.isPrimary)?.url
      ?? item.images[0]?.url
      ?? null,
    verificationStatus: 'unverified', // Not in BE response
    estimatedValue: null,
    categoryId: item.categoryId,
    categoryName: null, // Not in BE response
    description: item.description,
    images: item.images.map((img) => mapItemImage(img, item.id)),
    attributes: [], // Not in BE response — could be added later
  };

  // Map bids
  const mappedBids: Bid[] = recentBids.map(mapBid);

  const startingPrice = a.startingPrice.amount;

  return {
    id: a.id,
    itemId: a.itemId,
    sellerId: a.sellerId,
    auctionType: 'open' as const, // BE doesn't return this yet — default to open
    startingPrice,
    bidIncrement: a.bidIncrement.amount,
    reservePrice: a.reservePrice?.amount ?? null,
    buyNowPrice: a.buyNowPrice?.amount ?? null,
    currentPrice: a.currentPrice.amount,
    depositPercentage: 10, // Default per business rules
    depositAmount: startingPrice * 0.1, // Calculate from default percentage
    currency: a.currency,
    startTime: a.startTime,
    endTime: a.endTime,
    actualEndTime: a.actualEndTime ?? null,
    status: a.status as AuctionStatus,
    minimumParticipants: 2, // Default per business rules
    qualifiedCount: 0, // Not in BE response
    winnerId: a.currentWinnerId ?? null,
    winningBidId: null,
    // Computed fields from BE
    minimumBidAmount: a.minimumBidAmount.amount,
    isReserveMet: a.isReserveMet,
    hasBuyNow: a.hasBuyNow,
    isEndingSoon: a.isEndingSoon,
    autoExtend: a.autoExtend,
    extensionMinutes: a.extensionMinutes,
    isFeatured: a.isFeatured,
    viewCount: a.viewCount,
    bidCount: a.bidCount,
    watchCount: a.watchCount,
    item: itemSummary,
    seller: null, // Not in BE response — seller info not returned
    recentBids: mappedBids,
    currentUserDeposit: null, // Not in BE response (requires auth)
    currentUserAutoBid: null, // Not in BE response
    isWatching: false, // Not in BE response
    createdAt: a.createdAt,
    modifiedAt: a.createdAt, // BE doesn't return modifiedAt — use createdAt
  };
}

/** Maps a single BE bid to FE Bid type */
function mapBid(b: ApiBid): Bid {
  return {
    id: b.id,
    auctionId: b.auctionId,
    bidderId: b.bidderId,
    bidderName: b.bidderDisplayName ?? b.bidderName ?? null,
    amount: b.amount.amount,
    isAutoBid: b.isAutoBid,
    autoBidId: b.autoBidId ?? null,
    status: b.status as Bid['status'],
    createdAt: b.createdAt,
  };
}

// ─── Auction List (Browse page) ─────────────────────────────────

/**
 * Fetches a paginated, filterable list of auctions.
 * Used by the Browse/Catalog page.
 */
export async function getAuctions(
  filters: AuctionFilters = {}
): Promise<PaginatedResponse<AuctionListItem>> {
  // Map FE filter names to BE query parameter names
  const params: Record<string, unknown> = {};
  if (filters.page) params.PageNumber = filters.page;
  if (filters.pageSize) params.PageSize = filters.pageSize;
  if (filters.search) params.Search = filters.search;
  if (filters.categoryId) params.CategoryId = filters.categoryId;
  if (filters.auctionType) params.AuctionType = filters.auctionType;
  if (filters.status) {
    params.Status = Array.isArray(filters.status)
      ? filters.status.join(',')
      : filters.status;
  }
  if (filters.sortBy) params.SortBy = filters.sortBy;
  if (filters.sortOrder) params.SortOrder = filters.sortOrder;
  if (filters.priceMin !== undefined) params.PriceMin = filters.priceMin;
  if (filters.priceMax !== undefined) params.PriceMax = filters.priceMax;
  if (filters.buyNowOnly) params.HasBuyNow = true;

  const { data } = await api.get<ApiPaginatedResponse<ApiAuctionListItem>>(
    '/api/auctions',
    { params },
  );

  return mapPagination(data, mapListItem);
}

// ─── Single Auction Detail ──────────────────────────────────────

/**
 * Fetches a single auction by ID — returns the full Auction type
 * with nested item, seller, bids, and deposit info.
 */
export async function getAuctionById(
  id: string
): Promise<Auction | null> {
  try {
    const { data } = await api.get<ApiAuctionDetailResponse>(
      `/api/auctions/${id}`,
    );
    return mapAuctionDetail(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

// ─── Bid History ────────────────────────────────────────────────

/**
 * Fetches bid history for an auction.
 * Uses the dedicated GET /api/auctions/{id}/bids endpoint.
 */
export async function getAuctionBids(auctionId: string): Promise<Bid[]> {
  try {
    // BE may return a plain array OR a paginated object { items: [...] }
    const { data } = await api.get<ApiBid[] | ApiPaginatedResponse<ApiBid>>(
      `/api/auctions/${auctionId}/bids`,
    );
    const bids = Array.isArray(data) ? data : data?.items ?? [];
    return bids.map(mapBid);
  } catch {
    return [];
  }
}

// ─── Categories ─────────────────────────────────────────────────

/** Fetches the category tree (top-level with nested children) */
export async function getCategories(): Promise<Category[]> {
  try {
    // BE may return a plain array OR a paginated object { items: [...] }
    const { data } = await api.get<Category[] | ApiPaginatedResponse<Category>>(
      '/api/categories',
    );
    if (Array.isArray(data)) return data;
    // Paginated response — extract items array
    if (data && typeof data === 'object' && 'items' in data) return data.items;
    return [];
  } catch {
    // If endpoint doesn't exist yet, return empty array
    return [];
  }
}

/** Fetches a flat list of all categories */
export async function getCategoriesFlat(): Promise<Category[]> {
  const tree = await getCategories();
  // Flatten the tree — extract all children into a single array
  const flat: Category[] = [];
  for (const cat of tree) {
    flat.push(cat);
    if (cat.children) {
      flat.push(...cat.children);
    }
  }
  return flat;
}

// ─── Mutations (Layer 2: Interactive Bidding) ────────────────────

/**
 * Join auction qualification by paying the deposit.
 * POST /api/auctions/:id/qualify (or /deposit)
 */
export async function joinAuction(
  auctionId: string
): Promise<JoinAuctionResponse> {
  const { data } = await api.post<JoinAuctionResponse>(
    `/api/auctions/${auctionId}/qualify`,
  );
  return data;
}

/**
 * Place a bid on an open auction.
 * POST /api/auctions/:id/bids (REST fallback — primary is SignalR)
 */
export async function placeBid(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  const { data } = await api.post<PlaceBidResponse>(
    `/api/auctions/${auctionId}/bids`,
    { amount, currency: 'VND' },
  );
  return data;
}

/**
 * Submit a sealed bid (one-time, hidden).
 * Uses the same endpoint as open bids — BE handles the distinction.
 */
export async function submitSealedBid(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  const { data } = await api.post<PlaceBidResponse>(
    `/api/auctions/${auctionId}/bids`,
    { amount, currency: 'VND' },
  );
  return data;
}

/**
 * Buy-now — instant purchase at the buyNowPrice.
 * POST /api/auctions/:id/buy-now
 */
export async function buyNow(
  auctionId: string
): Promise<BuyNowResponse> {
  const { data } = await api.post<BuyNowResponse>(
    `/api/auctions/${auctionId}/buy-now`,
  );
  return data;
}

/**
 * Watch or unwatch an auction.
 * Watch:   POST   /api/auctions/:id/watch
 * Unwatch: DELETE /api/auctions/:id/watch
 */
export async function toggleWatch(
  auctionId: string,
  currentlyWatching: boolean,
): Promise<ToggleWatchResponse> {
  if (currentlyWatching) {
    await api.delete(`/api/auctions/${auctionId}/watch`);
    return { isWatching: false, newWatchCount: -1 };
  }
  const { data } = await api.post<ToggleWatchResponse>(
    `/api/auctions/${auctionId}/watch`,
  );
  return data;
}
