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
  AutoBid,
  Bid,
  BuyNowResponse,
  Category,
  JoinAuctionResponse,
  PaginatedResponse,
  PlaceBidResponse,
  ToggleWatchResponse,
  ApiResponse,
} from '@/types';
import type { ItemSummary, ItemImage, SellerItem } from '@/types/item';
import type { AuctionStatus } from '@/types/enums';
import type { CreateAuctionFromItemRequest, SetAuctionTimingRequest } from '@/types/auction';

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
  qualificationStartAt?: string | null;
  qualificationEndAt?: string | null;
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
    qualificationStartAt: a.qualificationStartAt ?? null,
    qualificationEndAt: a.qualificationEndAt ?? null,
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
    // BE caps PageSize at 50. Fetch all pages to get complete bid history.
    // Request newest first so page 1 always has the most recent bids.
    const allBids: ApiBid[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const { data } = await api.get(
        `/api/auctions/${auctionId}/bids`,
        { params: { PageNumber: page, PageSize: 50, SortBy: 'createdAt', IsDescending: true } },
      );

      // Handle 3 possible shapes: plain array, { items }, or { data: { items } }
      const obj = data as Record<string, unknown>;
      const unwrapped = obj?.data;
      const inner = (unwrapped && typeof unwrapped === 'object' && 'items' in (unwrapped as Record<string, unknown>))
        ? unwrapped as { items: ApiBid[]; metadata?: { hasNext?: boolean } }
        : null;

      const paginated = inner
        ?? (obj?.items ? obj as unknown as { items: ApiBid[]; metadata?: { hasNext?: boolean } } : null);

      if (Array.isArray(data)) {
        // Plain array — no pagination, we have everything
        allBids.push(...data);
        hasNext = false;
      } else if (paginated) {
        allBids.push(...(paginated.items ?? []));
        hasNext = paginated.metadata?.hasNext ?? false;
        page++;
        // Safety: cap at 10 pages (500 bids) to prevent infinite loops
        if (page > 10) hasNext = false;
      } else {
        hasNext = false;
      }
    }

    // Sort newest first
    return allBids.map(mapBid).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (err) {
    // 404 = no bids yet (valid state for new auctions)
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

// ─── Categories ─────────────────────────────────────────────────

/** Fetches the category tree (top-level with nested children) */
export async function getCategories(): Promise<Category[]> {
  // BE may return a plain array OR a paginated object { items: [...] }
  const { data } = await api.get<Category[] | ApiPaginatedResponse<Category>>(
    '/api/categories',
  );
  if (Array.isArray(data)) return data;
  // Paginated response — extract items array
  if (data && typeof data === 'object' && 'items' in data) return data.items;
  return [];
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
/**
 * Create VNPay payment URL for auction deposit/qualification.
 * POST /api/payments/vnpay/create-url
 *
 * The real deposit flow:
 * 1. FE calls this → gets paymentUrl
 * 2. FE redirects user to VNPay
 * 3. User pays on VNPay
 * 4. VNPay IPN callback → BE creates deposit → user is qualified
 * 5. User redirected back to returnUrl
 */
export async function createDepositUrl(
  auctionId: string,
  depositAmount: number
): Promise<string> {
  const { data } = await api.post('/api/payments/vnpay/create-url', {
    purpose: 'auction_deposit',
    auctionId,
    amount: depositAmount,
    currency: 'VND',
    description: `Auction deposit for ${auctionId}`,
  });
  // BE returns { paymentUrl: string } or may wrap in data
  const raw = (data as Record<string, unknown>)?.data ?? data;
  return (raw as Record<string, unknown>).paymentUrl as string;
}

/**
 * @deprecated Use createDepositUrl instead — /api/auctions/{id}/qualify does not exist on BE.
 * Kept temporarily for backward compatibility during migration.
 */
export async function joinAuction(
  auctionId: string
): Promise<JoinAuctionResponse> {
  // Redirect to VNPay deposit flow instead of the non-existent qualify endpoint
  const paymentUrl = await createDepositUrl(auctionId, 0);
  window.location.href = paymentUrl;
  // This line won't execute due to redirect, but satisfies the type
  return {} as JoinAuctionResponse;
}

/**
 * Place a bid on an open auction.
 * POST /api/auctions/:id/bids (REST fallback — primary is SignalR)
 *
 * Idempotency-Key: a fresh UUID per call so the BE can deduplicate
 * retries — prevents double-bids if the network drops mid-request.
 */
export async function placeBid(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  const { data } = await api.post<PlaceBidResponse>(
    `/api/auctions/${auctionId}/bids`,
    { amount, currency: 'VND' },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  );
  return data;
}

/**
 * Submit a sealed bid (one-time, hidden).
 * Uses the same endpoint as open bids — BE handles the distinction.
 *
 * Idempotency-Key: same deduplication guard as placeBid.
 */
export async function submitSealedBid(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  const { data } = await api.post<PlaceBidResponse>(
    `/api/auctions/${auctionId}/bids`,
    { amount, currency: 'VND' },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
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

// ─── Auto-Bid ────────────────────────────────────────────────────

/** Configure or update auto-bid for an auction */
export async function configureAutoBid(
  auctionId: string,
  maxAmount: number,
  incrementAmount?: number
): Promise<AutoBid> {
  const { data } = await api.put<AutoBid>(
    `/api/auctions/${auctionId}/auto-bid`,
    { maxAmount, currency: 'VND', incrementAmount },
  );
  return data;
}

/** Pause auto-bid */
export async function pauseAutoBid(auctionId: string): Promise<AutoBid> {
  const { data } = await api.post<AutoBid>(
    `/api/auctions/${auctionId}/auto-bid/pause`,
  );
  return data;
}

/** Resume auto-bid */
export async function resumeAutoBid(auctionId: string): Promise<AutoBid> {
  const { data } = await api.post<AutoBid>(
    `/api/auctions/${auctionId}/auto-bid/resume`,
  );
  return data;
}

/** Get current user's auto-bid for an auction */
export async function getMyAutoBid(auctionId: string): Promise<AutoBid | null> {
  try {
    const { data } = await api.get<AutoBid>(
      `/api/auctions/${auctionId}/auto-bid/my`,
    );
    return data;
  } catch (err) {
    // 404 = no auto-bid configured (valid state)
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

// ─── Item Management (Seller Flow) ──────────────────────────────

/** Shape of BE create item request */
interface CreateItemRequest {
  title: string;
  condition: string;
  categoryId?: string;
  description?: string;
  quantity?: number;
  images?: Array<{
    mediaUploadId: string;
    publicId: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

/** Create a new item (draft status) */
export async function createItem(data: CreateItemRequest): Promise<{ id: string }> {
  const { data: response } = await api.post<ApiResponse<{ id: string }>>('/api/items', data);
  // BE may return wrapped { data, message, success } or unwrapped
  return response.data ?? (response as unknown as { id: string });
}

/** Add a media file to an existing item — POST /api/items/{id}/media */
export async function addItemMedia(
  itemId: string,
  media: { mediaUploadId: string; isPrimary: boolean; sortOrder: number }
): Promise<void> {
  await api.post(`/api/items/${itemId}/media`, media);
}

/** Activate an item (draft → active, requires ≥1 media) */
export async function activateItem(itemId: string): Promise<void> {
  await api.post(`/api/items/${itemId}/activate`);
}

/**
 * Submit item for online moderation review (draft → pending_review).
 * verifyByPlatform=false means admin reviews online (no warehouse shipping).
 * POST /api/items/{id}/submit
 */
export async function submitItemForReview(
  itemId: string,
  verifyByPlatform: boolean = false
): Promise<void> {
  await api.post(`/api/items/${itemId}/submit`, { verifyByPlatform });
}

/** Get seller's items — supports pagination for My Listings */
export async function getMyItems(
  filters: { page?: number; pageSize?: number } = {}
): Promise<PaginatedResponse<SellerItem>> {
  const params: Record<string, unknown> = {};
  if (filters.page) params.PageNumber = filters.page;
  if (filters.pageSize) params.PageSize = filters.pageSize;

  const { data } = await api.get('/api/items/my', { params });
  const raw = data as Record<string, unknown>;
  const items = Array.isArray(data)
    ? (data as Record<string, unknown>[]).map(mapSellerItem)
    : ((raw?.items ?? []) as Record<string, unknown>[]).map(mapSellerItem);
  const metadata = raw?.metadata as Record<string, unknown> | undefined;

  return {
    items,
    page: (metadata?.currentPage as number) ?? 1,
    pageSize: (metadata?.pageSize as number) ?? items.length,
    totalItems: (metadata?.totalCount as number) ?? items.length,
    totalPages: (metadata?.totalPages as number) ?? 1,
    hasNextPage: (metadata?.hasNext as boolean) ?? false,
    hasPreviousPage: (metadata?.hasPrevious as boolean) ?? false,
  };
}

/** Maps BE item response to FE SellerItem type */
function mapSellerItem(raw: Record<string, unknown>): SellerItem {
  return {
    id: raw.id as string,
    title: raw.title as string,
    condition: raw.condition as string,
    status: raw.status as string,
    primaryImageUrl: (raw.primaryImageUrl as string | null)
      ?? ((raw.images as Array<Record<string, unknown>> | undefined)
          ?.find((img) => img.isPrimary)?.url as string | null)
      ?? null,
    categoryId: (raw.categoryId as string | null) ?? null,
    quantity: (raw.quantity as number) ?? 1,
    createdAt: raw.createdAt as string,
  };
}

// ─── Auction Management (Seller Flow) ────────────────────────────────

/**
 * Create auction from an EXISTING item (correct endpoint for our flow).
 * POST /api/items/{itemId}/auctions — returns 201 Created with AuctionDto.
 *
 * This is step 1 of the 3-step auction creation flow:
 * 1. createAuctionFromItem → creates draft auction with pricing
 * 2. setAuctionTiming → sets qualification + start/end times
 * 3. submitAuction → transitions Draft → Scheduled
 */
export async function createAuctionFromItem(
  itemId: string,
  request: CreateAuctionFromItemRequest
): Promise<{ id: string }> {
  const { data } = await api.post(`/api/items/${itemId}/auctions`, request);
  // BE returns AuctionDto — extract id. May be wrapped or unwrapped.
  const result = (data as Record<string, unknown>)?.data ?? data;
  return { id: (result as Record<string, unknown>).id as string };
}

/**
 * Set auction timing — qualification window + start/end times.
 * PUT /api/auctions/{id}/timing — all fields required.
 * Qualification window must be BEFORE auction startTime.
 *
 * Step 2 of the 3-step auction creation flow.
 */
export async function setAuctionTiming(
  auctionId: string,
  timing: SetAuctionTimingRequest
): Promise<void> {
  await api.put(`/api/auctions/${auctionId}/timing`, timing);
}

/**
 * Submit a draft auction for admin review (Draft → PendingReview).
 * POST /api/auctions/{id}/submit — returns 204 No Content.
 */
export async function submitAuction(auctionId: string): Promise<void> {
  await api.post(`/api/auctions/${auctionId}/submit`);
}

/**
 * Publish an approved auction (PendingReview → Published).
 * This is an admin action — sellers do NOT call this directly.
 * POST /api/auctions/{id}/publish — returns 204 No Content.
 */
export async function publishAuction(auctionId: string): Promise<void> {
  await api.post(`/api/auctions/${auctionId}/publish`);
}

/**
 * Get the current seller's auctions.
 * GET /api/me/auctions — paginated list.
 */
export async function getMyAuctions(
  filters: { status?: AuctionStatus; page?: number; pageSize?: number } = {}
): Promise<PaginatedResponse<AuctionListItem>> {
  const params: Record<string, unknown> = {};
  if (filters.status) params.Status = filters.status;
  if (filters.page) params.PageNumber = filters.page;
  if (filters.pageSize) params.PageSize = filters.pageSize;

  const { data } = await api.get('/api/me/auctions', { params });

  // Handle both paginated and plain array responses
  if (Array.isArray(data)) {
    return {
      items: data.map(mapListItem),
      page: 1,
      pageSize: data.length,
      totalItems: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  return mapPagination(data as ApiPaginatedResponse<ApiAuctionListItem>, mapListItem);
}
