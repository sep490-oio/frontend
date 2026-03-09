/**
 * Mock auction detail data — converts AuctionListItem → full Auction.
 *
 * TEMPORARY: Will be replaced when GET /auctions/:id returns real data.
 *
 * The builder adds all nested data (item, seller, bids, deposit info, etc.)
 * that the real API will return. This lets us build the Auction Detail page
 * with realistic data structures from day one.
 */

import type {
  Auction,
  AuctionDeposit,
  AuctionListItem,
  Bid,
  ItemImage,
  ItemAttribute,
  ItemSummary,
} from '@/types';
import type { SellerSummary } from '@/types';
import { MOCK_AUCTION_LIST, MOCK_BIDS_AUCTION_1 } from './auctions';
import { MOCK_SELLERS } from './users';
import { mockId, mockDate } from './helpers';

// ─── Current user ID (matches MOCK_WALLET.userId and dashboard) ──

export const CURRENT_USER_ID = mockId('user', 100);

// ─── Image data per auction (3-5 images each) ──────────────────────

/** Maps auction index → array of picsum seed suffixes for multiple images */
const MOCK_IMAGE_SEEDS: Record<number, string[]> = {
  1: ['iphone15', 'iphone15-side', 'iphone15-back', 'iphone15-box', 'iphone15-acc'],
  2: ['jordan1', 'jordan1-side', 'jordan1-sole', 'jordan1-box'],
  3: ['macbookm2', 'macbookm2-open', 'macbookm2-side', 'macbookm2-kb'],
  4: ['pokemon', 'pokemon-rare', 'pokemon-holo', 'pokemon-set'],
  5: ['sonyxm5', 'sonyxm5-case', 'sonyxm5-ear', 'sonyxm5-box'],
  6: ['canonr6', 'canonr6-top', 'canonr6-lens', 'canonr6-box', 'canonr6-grip'],
  7: ['vinyl', 'vinyl-sleeve', 'vinyl-set'],
  8: ['ps5', 'ps5-controller', 'ps5-box', 'ps5-games'],
  9: ['giantbike', 'giantbike-wheel', 'giantbike-gear'],
  10: ['marshall', 'marshall-back', 'marshall-knobs', 'marshall-box'],
  11: ['gundam', 'gundam-parts', 'gundam-box'],
  12: ['gshock', 'gshock-side', 'gshock-box'],
  13: ['kanken', 'kanken-open', 'kanken-strap'],
  14: ['yamahaguitar', 'yamahaguitar-neck', 'yamahaguitar-body'],
  15: ['ipadair', 'ipadair-back', 'ipadair-box'],
  16: ['airfryer', 'airfryer-open', 'airfryer-box'],
};

function buildMockImages(auctionIndex: number, itemId: string): ItemImage[] {
  const seeds = MOCK_IMAGE_SEEDS[auctionIndex] ?? ['placeholder'];
  return seeds.map((seed, i) => ({
    id: mockId('img', auctionIndex * 100 + i),
    itemId,
    imageUrl: `https://picsum.photos/seed/${seed}/800/600`,
    isPrimary: i === 0,
    sortOrder: i,
  }));
}

// ─── Item attributes per auction ────────────────────────────────────

const MOCK_ATTRIBUTES: Record<number, Array<[string, string]>> = {
  1: [['Thương hiệu', 'Apple'], ['Dung lượng', '256GB'], ['Màu sắc', 'Titan Tự Nhiên'], ['Bảo hành', 'Còn 8 tháng']],
  2: [['Thương hiệu', 'Nike'], ['Size', '42 EU'], ['Màu sắc', 'Đen/Đỏ'], ['Năm sản xuất', '2024']],
  3: [['Thương hiệu', 'Apple'], ['RAM', '16GB'], ['Ổ cứng', '512GB SSD'], ['Chip', 'Apple M2']],
  4: [['Bộ sưu tập', 'Pokémon TCG'], ['Số lượng', '50 lá'], ['Ngôn ngữ', 'Tiếng Nhật'], ['Độ hiếm', 'Holo Rare+']],
  5: [['Thương hiệu', 'Sony'], ['Loại', 'Over-ear'], ['Chống ồn', 'ANC'], ['Pin', '30 giờ']],
  6: [['Thương hiệu', 'Canon'], ['Cảm biến', 'Full-frame CMOS'], ['Megapixel', '24.2 MP'], ['Quay video', '4K 60fps']],
  7: [['Nghệ sĩ', 'Trịnh Công Sơn'], ['Số đĩa', '5'], ['Tình trạng đĩa', 'VG+'], ['Năm phát hành', 'Tái bản 2020']],
  8: [['Thương hiệu', 'Sony'], ['Phiên bản', 'Slim'], ['Ổ cứng', '1TB SSD'], ['Phụ kiện', '2 tay cầm DualSense']],
  9: [['Thương hiệu', 'Giant'], ['Loại', 'Xe đạp đường phố'], ['Kích cỡ khung', 'M'], ['Năm', '2024']],
  10: [['Thương hiệu', 'Marshall'], ['Model', 'Stanmore II'], ['Kết nối', 'Bluetooth 5.0'], ['Công suất', '80W']],
  11: [['Thương hiệu', 'Bandai'], ['Dòng', 'Master Grade'], ['Tỉ lệ', '1/100'], ['Số chi tiết', '300+']],
  12: [['Thương hiệu', 'Casio'], ['Dòng', 'G-Shock'], ['Chống nước', '200m'], ['Chất liệu', 'Nhựa carbon']],
  13: [['Thương hiệu', 'Fjällräven'], ['Model', 'Kånken Classic'], ['Chất liệu', 'Vinylon F'], ['Dung tích', '16L']],
  14: [['Thương hiệu', 'Yamaha'], ['Model', 'F310'], ['Loại', 'Acoustic'], ['Chất liệu mặt', 'Gỗ vân sam']],
  15: [['Thương hiệu', 'Apple'], ['Chip', 'Apple M1'], ['Dung lượng', '64GB'], ['Kết nối', 'WiFi']],
  16: [['Thương hiệu', 'Philips'], ['Model', 'HD9252'], ['Dung tích', '4.1L'], ['Công suất', '1400W']],
};

function buildMockAttributes(auctionIndex: number, itemId: string): ItemAttribute[] {
  const attrs = MOCK_ATTRIBUTES[auctionIndex] ?? [];
  return attrs.map(([name, value], i) => ({
    id: mockId('attr', auctionIndex * 100 + i),
    itemId,
    attributeName: name,
    attributeValue: value,
  }));
}

// ─── Item descriptions ──────────────────────────────────────────────

const MOCK_DESCRIPTIONS: Record<number, string> = {
  1: 'iPhone 15 Pro Max 256GB màu Titan Tự Nhiên, mua tại TGDĐ tháng 11/2024. Máy còn bảo hành chính hãng 8 tháng. Sử dụng cẩn thận, luôn dán cường lực và ốp lưng. Pin 96%, không trầy xước. Fullbox đầy đủ phụ kiện: sạc, cáp USB-C, sách hướng dẫn.',
  2: 'Nike Air Jordan 1 Retro High OG phối màu đen/đỏ kinh điển, size 42 EU. Hàng chính hãng mua từ Nike.com, còn nguyên hộp và tag. Chưa qua sử dụng, chỉ thử giày một lần. Phù hợp cho người sưu tầm hoặc sử dụng hàng ngày.',
  3: 'MacBook Air M2 2023 cấu hình 16GB RAM / 512GB SSD, màu Midnight. Máy hoạt động hoàn hảo, pin cycle count 87. Có vài vết trầy nhẹ ở mặt đáy do sử dụng. Đã cài sẵn macOS Sonoma mới nhất. Kèm sạc và hộp gốc.',
  4: 'Bộ sưu tập 50 lá bài Pokémon TCG tiếng Nhật, bao gồm nhiều lá Holo Rare và một số lá Ultra Rare. Các lá đều được bảo quản trong sleeve và toploader. Tình trạng từ Near Mint đến Mint. Phù hợp cho collector.',
  5: 'Sony WH-1000XM5 tai nghe chống ồn hàng đầu thế giới. Hàng mới 100%, nguyên seal. Chống ồn ANC thế hệ mới, pin 30 giờ, sạc nhanh 3 phút cho 3 giờ nghe. Kết nối multipoint 2 thiết bị cùng lúc.',
  6: 'Canon EOS R6 Mark II body only, mua tại Canon Vietnam 06/2024. Shutter count khoảng 5.000. Máy còn rất mới, không trầy xước. Cảm biến Full-frame 24.2MP, quay 4K 60fps, chống rung IBIS 8 stop. Kèm pin, sạc, dây đeo và hộp gốc.',
  7: 'Bộ 5 đĩa vinyl Trịnh Công Sơn tái bản năm 2020, sản xuất tại Nhật Bản. Tình trạng đĩa VG+ (rất tốt), bìa VG. Bao gồm các album kinh điển. Âm thanh warm và chi tiết, phù hợp audiophile.',
  8: 'PS5 Slim 1TB kèm 2 tay cầm DualSense (trắng + đen). Máy mua 03/2024, sử dụng ít, chủ yếu chơi cuối tuần. Hoạt động hoàn hảo, không lỗi. Fullbox đầy đủ, kèm cáp HDMI 2.1 và dây nguồn.',
  9: 'Xe đạp Giant Escape 3 2024, size M, màu xanh navy. Đã đi khoảng 500km, bảo dưỡng định kỳ tại Giant Vietnam. Khung nhôm ALUXX, bộ truyền động Shimano 3x8 tốc độ. Phù hợp đi làm và tập thể dục.',
  10: 'Marshall Stanmore II loa Bluetooth phiên bản đen classic. Máy còn rất mới, ít sử dụng. Công suất 80W, bass sâu, treble trong. Kết nối Bluetooth 5.0, có thể điều chỉnh EQ trên app Marshall. Kèm dây nguồn và hộp gốc.',
  11: 'Mô hình Bandai MG Gundam RX-78-2 Ver.3.0 tỉ lệ 1/100. Hàng mới 100%, nguyên hộp seal. Hơn 300 chi tiết, khớp nối linh hoạt, có thể tạo nhiều pose. Kèm sticker và decal water slide.',
  12: 'Casio G-Shock GA-2100-1A1 "CasiOak" phiên bản đen full. Đồng hồ mới 100%, nguyên hộp thiếc và tag. Chống nước 200m, chống va đập, pin 3 năm. Thiết kế mỏng nhẹ, phù hợp đeo hàng ngày.',
  13: 'Túi xách Fjällräven Kånken Classic chính hãng, màu Deep Red. Mới 100%, còn tag. Chất liệu Vinylon F bền bỉ, chống nước nhẹ. Dung tích 16L, có ngăn laptop 13". Logo phản quang.',
  14: 'Guitar acoustic Yamaha F310 tình trạng rất tốt. Mặt đàn gỗ vân sam, lưng và hông gỗ meranti. Âm thanh ấm, vang, phù hợp người mới tập hoặc chơi fingerstyle. Đã thay dây mới Elixir Nanoweb.',
  15: 'iPad Air M1 2022 64GB WiFi, màu Space Gray. Máy còn mới, pin 94%. Có vài vết trầy nhẹ ở viền. Kèm sạc 20W và cáp USB-C gốc. Đã reset về máy mới, sẵn sàng sử dụng.',
  16: 'Nồi chiên không dầu Philips HD9252 dung tích 4.1L. Hàng mới 100%, nguyên hộp. Công nghệ Rapid Air, nấu nhanh và ít dầu. 7 chế độ nấu preset. Bảo hành chính hãng 24 tháng.',
};

// ─── Additional mock bids for auctions #2, #3, #4 ──────────────────

const MOCK_BIDS_AUCTION_2: Bid[] = [
  {
    id: mockId('bid', 201),
    auctionId: mockId('auction', 2),
    bidderId: mockId('user', 11),
    bidderName: 'Trần T. B.',
    amount: 7_200_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'winning',
    createdAt: mockDate(-2),
  },
  {
    id: mockId('bid', 202),
    auctionId: mockId('auction', 2),
    bidderId: mockId('user', 13),
    bidderName: 'Phạm M. D.',
    amount: 6_800_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'outbid',
    createdAt: mockDate(-4),
  },
  {
    id: mockId('bid', 203),
    auctionId: mockId('auction', 2),
    bidderId: mockId('user', 10),
    bidderName: 'Nguyễn V. A.',
    amount: 6_200_000,
    isAutoBid: true,
    autoBidId: mockId('autobid', 2),
    status: 'outbid',
    createdAt: mockDate(-6),
  },
  {
    id: mockId('bid', 204),
    auctionId: mockId('auction', 2),
    bidderId: mockId('user', 12),
    bidderName: 'Lê H. C.',
    amount: 5_500_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'outbid',
    createdAt: mockDate(-9),
  },
];

const MOCK_BIDS_AUCTION_3: Bid[] = [
  {
    id: mockId('bid', 301),
    auctionId: mockId('auction', 3),
    bidderId: mockId('user', 12),
    bidderName: 'Lê H. C.',
    amount: 21_000_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'winning',
    createdAt: mockDate(-0.5),
  },
  {
    id: mockId('bid', 302),
    auctionId: mockId('auction', 3),
    bidderId: mockId('user', 10),
    bidderName: 'Nguyễn V. A.',
    amount: 20_500_000,
    isAutoBid: true,
    autoBidId: mockId('autobid', 3),
    status: 'outbid',
    createdAt: mockDate(-1),
  },
  {
    id: mockId('bid', 303),
    auctionId: mockId('auction', 3),
    bidderId: mockId('user', 13),
    bidderName: 'Phạm M. D.',
    amount: 19_000_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'outbid',
    createdAt: mockDate(-2),
  },
];

const MOCK_BIDS_AUCTION_4: Bid[] = [
  {
    id: mockId('bid', 401),
    auctionId: mockId('auction', 4),
    bidderId: mockId('user', 14),
    bidderName: 'Hoàng T. E.',
    amount: 4_800_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'winning',
    createdAt: mockDate(-0.5),
  },
  {
    id: mockId('bid', 402),
    auctionId: mockId('auction', 4),
    bidderId: mockId('user', 11),
    bidderName: 'Trần T. B.',
    amount: 4_500_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'outbid',
    createdAt: mockDate(-2),
  },
  {
    id: mockId('bid', 403),
    auctionId: mockId('auction', 4),
    bidderId: mockId('user', 10),
    bidderName: 'Nguyễn V. A.',
    amount: 4_000_000,
    isAutoBid: false,
    autoBidId: null,
    status: 'outbid',
    createdAt: mockDate(-5),
  },
  {
    id: mockId('bid', 404),
    auctionId: mockId('auction', 4),
    bidderId: mockId('user', 12),
    bidderName: 'Lê H. C.',
    amount: 3_500_000,
    isAutoBid: true,
    autoBidId: mockId('autobid', 4),
    status: 'outbid',
    createdAt: mockDate(-10),
  },
];

/** Maps auction ID → bids array */
const BIDS_MAP: Record<string, Bid[]> = {
  [mockId('auction', 1)]: MOCK_BIDS_AUCTION_1,
  [mockId('auction', 2)]: MOCK_BIDS_AUCTION_2,
  [mockId('auction', 3)]: MOCK_BIDS_AUCTION_3,
  [mockId('auction', 4)]: MOCK_BIDS_AUCTION_4,
};

// ─── Seller lookup (match AuctionListItem.sellerName → SellerSummary) ─

function findSellerByName(name: string | null): SellerSummary | null {
  if (!name) return null;
  return MOCK_SELLERS.find((s) => s.storeName === name) ?? null;
}

// ─── Auction-specific pricing config ────────────────────────────────

interface AuctionPricingConfig {
  bidIncrement: number;
  reservePrice: number | null;
  depositPercentage: number;
}

/** Realistic bid increments and reserve prices per auction */
const PRICING_CONFIG: Record<number, AuctionPricingConfig> = {
  1:  { bidIncrement: 500_000,  reservePrice: 22_000_000, depositPercentage: 10 },
  2:  { bidIncrement: 200_000,  reservePrice: null,       depositPercentage: 10 },
  3:  { bidIncrement: 500_000,  reservePrice: 20_000_000, depositPercentage: 10 },
  4:  { bidIncrement: 100_000,  reservePrice: null,       depositPercentage: 10 },
  5:  { bidIncrement: 200_000,  reservePrice: null,       depositPercentage: 10 },
  6:  { bidIncrement: 1_000_000, reservePrice: 30_000_000, depositPercentage: 15 },
  7:  { bidIncrement: 100_000,  reservePrice: null,       depositPercentage: 10 },
  8:  { bidIncrement: 500_000,  reservePrice: null,       depositPercentage: 10 },
  9:  { bidIncrement: 200_000,  reservePrice: null,       depositPercentage: 10 },
  10: { bidIncrement: 200_000,  reservePrice: null,       depositPercentage: 10 },
  11: { bidIncrement: 100_000,  reservePrice: null,       depositPercentage: 10 },
  12: { bidIncrement: 100_000,  reservePrice: null,       depositPercentage: 10 },
  13: { bidIncrement: 100_000,  reservePrice: null,       depositPercentage: 10 },
  14: { bidIncrement: 200_000,  reservePrice: null,       depositPercentage: 10 },
  15: { bidIncrement: 500_000,  reservePrice: null,       depositPercentage: 10 },
  16: { bidIncrement: 100_000,  reservePrice: null,       depositPercentage: 10 },
};

// ─── Current user's relationship with each auction ───────────────
//
// Simulates the "current user" (user-00000100-mock) having different
// states across auctions. Aligns with dashboard mock data:
// - Bidding on #1 (winning), #3 (outbid), #4 (outbid)
// - Won #8, lost #9
// - Watching #2, #6, #12

interface UserAuctionState {
  deposit: AuctionDeposit | null;
  isWatching: boolean;
  winnerId: string | null;
  winningBidId: string | null;
}

function buildDeposit(
  auctionIndex: number,
  amount: number,
  status: AuctionDeposit['status'],
): AuctionDeposit {
  return {
    id: mockId('deposit', auctionIndex),
    auctionId: mockId('auction', auctionIndex),
    userId: CURRENT_USER_ID,
    amount,
    currency: 'VND',
    sourceType: 'wallet',
    status,
    auctionResult: status === 'converted_to_payment' ? 'winner' : status === 'returned' ? 'outbid' : null,
    depositedAt: mockDate(-72),
    refundedAt: status === 'returned' ? mockDate(-24) : null,
    forfeitedAt: null,
  };
}

/** Maps auction index → user's simulated state for that auction */
const MOCK_USER_STATE: Record<number, UserAuctionState> = {
  1:  { deposit: buildDeposit(1, 2_000_000, 'held'),                  isWatching: false, winnerId: null, winningBidId: null },
  3:  { deposit: buildDeposit(3, 1_800_000, 'held'),                  isWatching: false, winnerId: null, winningBidId: null },
  4:  { deposit: buildDeposit(4, 300_000,   'held'),                  isWatching: false, winnerId: null, winningBidId: null },
  5:  { deposit: buildDeposit(5, 550_000,   'held'),                  isWatching: false, winnerId: null, winningBidId: null },
  8:  { deposit: buildDeposit(8, 1_000_000, 'converted_to_payment'),  isWatching: false, winnerId: CURRENT_USER_ID, winningBidId: mockId('bid', 110) },
  9:  { deposit: buildDeposit(9, 600_000,   'returned'),              isWatching: false, winnerId: mockId('user', 11), winningBidId: mockId('bid', 901) },
  // Watching but not qualified
  2:  { deposit: null, isWatching: true,  winnerId: null, winningBidId: null },
  6:  { deposit: null, isWatching: true,  winnerId: null, winningBidId: null },
  12: { deposit: null, isWatching: true,  winnerId: null, winningBidId: null },
};

const DEFAULT_USER_STATE: UserAuctionState = {
  deposit: null, isWatching: false, winnerId: null, winningBidId: null,
};

// ─── Builder: AuctionListItem → full Auction ────────────────────────

/**
 * Converts a flat AuctionListItem into a full Auction object
 * with all nested data (item, seller, bids, deposit info, etc.).
 *
 * This mirrors the shape that GET /auctions/:id will return.
 */
export function buildMockAuctionDetail(
  listItem: AuctionListItem,
  auctionIndex: number
): Auction {
  const userState = MOCK_USER_STATE[auctionIndex] ?? DEFAULT_USER_STATE;
  const itemId = mockId('item', auctionIndex);
  const pricing = PRICING_CONFIG[auctionIndex] ?? {
    bidIncrement: 200_000,
    reservePrice: null,
    depositPercentage: 10,
  };

  const depositAmount = Math.round(
    listItem.startingPrice * (pricing.depositPercentage / 100)
  );

  // Build nested item summary with detail fields
  // AuctionListItem has optional fields (not always returned by BE list endpoint),
  // so we provide sensible defaults when building the full detail object.
  const item: ItemSummary = {
    id: itemId,
    title: listItem.itemTitle,
    condition: listItem.itemCondition ?? 'good',
    primaryImageUrl: listItem.primaryImageUrl,
    verificationStatus: listItem.verificationStatus ?? 'unverified',
    estimatedValue: listItem.startingPrice,
    categoryId: mockId('cat', auctionIndex),
    categoryName: listItem.categoryName ?? null,
    description: MOCK_DESCRIPTIONS[auctionIndex] ?? null,
    images: buildMockImages(auctionIndex, itemId),
    attributes: buildMockAttributes(auctionIndex, itemId),
  };

  const seller = findSellerByName(listItem.sellerName ?? null);
  const bids = BIDS_MAP[listItem.id] ?? [];

  const startDate = new Date(listItem.startTime);
  const createdDate = new Date(startDate.getTime() - 72 * 60 * 60 * 1000);

  const auctionType = listItem.auctionType ?? 'open';
  const currentPrice = listItem.currentPrice ?? listItem.startingPrice;

  return {
    id: listItem.id,
    itemId,
    sellerId: seller?.userId ?? mockId('user', 99),
    auctionType,

    // Pricing
    startingPrice: listItem.startingPrice,
    bidIncrement: pricing.bidIncrement,
    reservePrice: pricing.reservePrice,
    buyNowPrice: listItem.buyNowPrice,
    currentPrice,

    // Deposit
    depositPercentage: pricing.depositPercentage,
    depositAmount,
    currency: listItem.currency,

    // Timing
    startTime: listItem.startTime,
    endTime: listItem.endTime,
    actualEndTime: null,

    // Status & participants
    status: listItem.status,
    minimumParticipants: 2,
    qualifiedCount: listItem.qualifiedCount ?? 0,
    winnerId: userState.winnerId,
    winningBidId: userState.winningBidId,

    // Computed fields from BE
    minimumBidAmount: currentPrice + pricing.bidIncrement,
    isReserveMet: pricing.reservePrice != null ? currentPrice >= pricing.reservePrice : true,
    hasBuyNow: listItem.buyNowPrice != null,
    isEndingSoon: listItem.isEndingSoon,

    // Anti-sniping
    autoExtend: auctionType === 'open',
    extensionMinutes: 5,

    // Engagement
    isFeatured: listItem.isFeatured,
    viewCount: Math.floor(Math.random() * 500) + 50,
    bidCount: listItem.bidCount,
    watchCount: Math.floor(Math.random() * 30) + 5,

    // Nested data
    item,
    seller,
    recentBids: bids,
    currentUserDeposit: userState.deposit,
    currentUserAutoBid: null,
    isWatching: userState.isWatching,

    // Meta
    createdAt: createdDate.toISOString(),
    modifiedAt: listItem.startTime,
  };
}

// ─── Pre-built detail map for quick lookup ──────────────────────────

/** Maps auction ID → full Auction detail, built lazily on first access */
let detailCache: Map<string, Auction> | null = null;

export function getMockAuctionDetail(id: string): Auction | null {
  if (!detailCache) {
    detailCache = new Map();
    MOCK_AUCTION_LIST.forEach((item, index) => {
      detailCache!.set(item.id, buildMockAuctionDetail(item, index + 1));
    });
  }
  return detailCache.get(id) ?? null;
}

/** Returns bids for a given auction ID */
export function getMockAuctionBids(auctionId: string): Bid[] {
  return BIDS_MAP[auctionId] ?? [];
}

/**
 * Clears the detail cache for a specific auction (or all).
 * Called after mutations so the next fetch rebuilds with fresh data.
 */
export function invalidateDetailCache(id?: string): void {
  if (!detailCache) return;
  if (id) {
    detailCache.delete(id);
  } else {
    detailCache = null;
  }
}
