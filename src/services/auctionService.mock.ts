/**
 * Mock Auction Service - For development/testing with local data
 * 
 * This file provides the same interface as auctionService.ts but returns
 * mock data instead of making real API calls.
 */

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
} from '@/types';
import { MOCK_AUCTION_LIST } from './mock/auctions';
import { getMockAuctionDetail, getMockAuctionBids } from './mock/auctionDetails';

// ─── Mock delay helper ──────────────────────────────────────────
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Auction List ───────────────────────────────────────────────

export async function getAuctions(
    filters: AuctionFilters = {}
): Promise<PaginatedResponse<AuctionListItem>> {
    await delay(300); // Simulate network delay

    let filtered = [...MOCK_AUCTION_LIST];

    // Apply filters
    if (filters.status && filters.status.length > 0) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        filtered = filtered.filter(a => statusArray.includes(a.status));
    }

    if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(a =>
            a.itemTitle.toLowerCase().includes(search)
        );
    }

    if (filters.categoryId) {
        filtered = filtered.filter(a => a.categoryName === filters.categoryId);
    }

    if (filters.priceMin !== undefined) {
        filtered = filtered.filter(a => a.currentPrice >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
        filtered = filtered.filter(a => a.currentPrice <= filters.priceMax!);
    }

    if (filters.buyNowOnly) {
        filtered = filtered.filter(a => a.buyNowPrice !== null);
    }

    // Sort
    if (filters.sortBy) {
        filtered.sort((a, b) => {
            let aVal: number | string = 0;
            let bVal: number | string = 0;

            switch (filters.sortBy) {
                case 'endTime':
                    aVal = new Date(a.endTime).getTime();
                    bVal = new Date(b.endTime).getTime();
                    break;
                case 'currentPrice':
                    aVal = a.currentPrice;
                    bVal = b.currentPrice;
                    break;
                case 'bidCount':
                    aVal = a.bidCount;
                    bVal = b.bidCount;
                    break;
                default:
                    aVal = new Date(a.startTime).getTime();
                    bVal = new Date(b.startTime).getTime();
            }

            const order = filters.sortOrder === 'desc' ? -1 : 1;
            return aVal > bVal ? order : aVal < bVal ? -order : 0;
        });
    }

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 12;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
        items,
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        hasNextPage: end < filtered.length,
        hasPreviousPage: page > 1,
    };
}

// ─── Single Auction Detail ──────────────────────────────────────

export async function getAuctionById(id: string): Promise<Auction | null> {
    await delay(200);
    return getMockAuctionDetail(id);
}

// ─── Bid History ────────────────────────────────────────────────

export async function getAuctionBids(auctionId: string): Promise<Bid[]> {
    await delay(150);
    return getMockAuctionBids(auctionId);
}

// ─── Categories ─────────────────────────────────────────────────

const MOCK_CATEGORIES: Category[] = [
    {
        id: 'cat-1',
        name: 'Điện tử',
        slug: 'dien-tu',
        description: 'Điện thoại, laptop, máy tính bảng',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        children: [
            { id: 'cat-1-1', name: 'Điện thoại', slug: 'dien-thoai', parentId: 'cat-1', sortOrder: 1, isActive: true },
            { id: 'cat-1-2', name: 'Laptop & Máy tính', slug: 'laptop', parentId: 'cat-1', sortOrder: 2, isActive: true },
        ],
    },
    {
        id: 'cat-2',
        name: 'Thời trang',
        slug: 'thoi-trang',
        description: 'Giày dép, túi xách, phụ kiện',
        parentId: null,
        sortOrder: 2,
        isActive: true,
        children: [
            { id: 'cat-2-1', name: 'Giày dép', slug: 'giay-dep', parentId: 'cat-2', sortOrder: 1, isActive: true },
            { id: 'cat-2-2', name: 'Túi xách', slug: 'tui-xach', parentId: 'cat-2', sortOrder: 2, isActive: true },
        ],
    },
    {
        id: 'cat-3',
        name: 'Sưu tầm',
        slug: 'suu-tam',
        description: 'Thẻ bài, mô hình, đồ cổ',
        parentId: null,
        sortOrder: 3,
        isActive: true,
        children: [
            { id: 'cat-3-1', name: 'Thẻ bài sưu tầm', slug: 'the-bai', parentId: 'cat-3', sortOrder: 1, isActive: true },
            { id: 'cat-3-2', name: 'Mô hình & Figure', slug: 'mo-hinh', parentId: 'cat-3', sortOrder: 2, isActive: true },
        ],
    },
    {
        id: 'cat-4',
        name: 'Âm thanh',
        slug: 'am-thanh',
        description: 'Tai nghe, loa, thiết bị âm thanh',
        parentId: null,
        sortOrder: 4,
        isActive: true,
    },
];

export async function getCategories(): Promise<Category[]> {
    await delay(100);
    return MOCK_CATEGORIES;
}

export async function getCategoriesFlat(): Promise<Category[]> {
    await delay(100);
    const flat: Category[] = [];
    for (const cat of MOCK_CATEGORIES) {
        flat.push(cat);
        if (cat.children) {
            flat.push(...cat.children);
        }
    }
    return flat;
}

// ─── Mutations (Mock implementations) ────────────────────────────

export async function joinAuction(auctionId: string): Promise<JoinAuctionResponse> {
    await delay(500);
    return {
        success: true,
        message: 'Đã đặt cọc thành công',
        depositId: `deposit-${Date.now()}`,
        auctionId,
    };
}

export async function placeBid(auctionId: string, amount: number): Promise<PlaceBidResponse> {
    await delay(300);
    return {
        success: true,
        message: 'Đặt giá thành công',
        bidId: `bid-${Date.now()}`,
        newCurrentPrice: amount,
        isWinning: true,
    };
}

export async function submitSealedBid(auctionId: string, amount: number): Promise<PlaceBidResponse> {
    await delay(300);
    return {
        success: true,
        message: 'Đã gửi giá thầu kín',
        bidId: `bid-${Date.now()}`,
        newCurrentPrice: 0,
        isWinning: false,
    };
}

export async function buyNow(auctionId: string): Promise<BuyNowResponse> {
    await delay(500);
    return {
        success: true,
        message: 'Mua ngay thành công',
        orderId: `order-${Date.now()}`,
        auctionId,
    };
}

export async function toggleWatch(
    auctionId: string,
    currentlyWatching: boolean
): Promise<ToggleWatchResponse> {
    await delay(200);
    return {
        isWatching: !currentlyWatching,
        newWatchCount: currentlyWatching ? 4 : 6,
    };
}

export async function configureAutoBid(
    auctionId: string,
    maxAmount: number,
    incrementAmount?: number
): Promise<AutoBid> {
    await delay(300);
    return {
        id: `autobid-${Date.now()}`,
        auctionId,
        userId: 'user-00000100-mock',
        maxAmount,
        incrementAmount: incrementAmount || 500_000,
        currentAmount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
    };
}

export async function pauseAutoBid(auctionId: string): Promise<AutoBid> {
    await delay(200);
    return {
        id: `autobid-${Date.now()}`,
        auctionId,
        userId: 'user-00000100-mock',
        maxAmount: 25_000_000,
        incrementAmount: 500_000,
        currentAmount: 24_500_000,
        isActive: false,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
    };
}

export async function resumeAutoBid(auctionId: string): Promise<AutoBid> {
    await delay(200);
    return {
        id: `autobid-${Date.now()}`,
        auctionId,
        userId: 'user-00000100-mock',
        maxAmount: 25_000_000,
        incrementAmount: 500_000,
        currentAmount: 24_500_000,
        isActive: true,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
    };
}

export async function getMyAutoBid(auctionId: string): Promise<AutoBid | null> {
    await delay(150);
    // Return null for most auctions (user hasn't set up auto-bid)
    return null;
}

// ─── Item Management (Mock) ──────────────────────────────────────

export async function createItem(data: unknown): Promise<{ id: string }> {
    await delay(400);
    return { id: `item-${Date.now()}` };
}

export async function addItemMedia(itemId: string, media: unknown): Promise<void> {
    await delay(300);
}

export async function activateItem(itemId: string): Promise<void> {
    await delay(200);
}

export async function getMyItems(): Promise<unknown[]> {
    await delay(200);
    return [];
}
