/**
 * Mock order data — 7 orders across all statuses.
 *
 * TEMPORARY: Will be replaced by GET /orders API endpoint.
 *
 * Orders are linked to existing mock sellers. Only order #1
 * is linked to real auction #8 (PS5, won by current user).
 * Orders #2-7 are fictional past wins to demonstrate all statuses.
 *
 * Status coverage:
 * #1 shipped, #2 pending_payment, #3 delivered,
 * #4 completed, #5 processing, #6 cancelled, #7 disputed
 */

import type {
  Order,
  OrderListItem,
  OrderTracking,
  Escrow,
  ItemSummary,
  UserAddress,
} from '@/types';
import type { SellerSummary } from '@/types';
import { mockId, mockDate } from './helpers';
import { MOCK_SELLERS } from './users';
import { CURRENT_USER_ID } from './auctionDetails';

// ─── Helpers ──────────────────────────────────────────────────────────

const orderId = (n: number) => mockId('order', n);
const seller = (index: number): SellerSummary => MOCK_SELLERS[index];

/** Maps auctionId → orderId for the "View Order" button in AuctionResult */
export const AUCTION_TO_ORDER_MAP: Record<string, string> = {
  [mockId('auction', 8)]: orderId(1),
};

// ─── Mock Addresses ───────────────────────────────────────────────────

const MOCK_SHIPPING_ADDRESS: UserAddress = {
  id: mockId('address', 1),
  type: 'home',
  recipientName: 'Nguyễn Văn A',
  street: '123 Nguyễn Huệ',
  ward: 'Phường Bến Nghé',
  district: 'Quận 1',
  city: 'TP. Hồ Chí Minh',
  postalCode: null,
  phoneNumber: '0901234567',
  isDefault: true,
};

const MOCK_BILLING_ADDRESS: UserAddress = {
  id: mockId('address', 2),
  type: 'home',
  recipientName: 'Nguyễn Văn A',
  street: '123 Nguyễn Huệ',
  ward: 'Phường Bến Nghé',
  district: 'Quận 1',
  city: 'TP. Hồ Chí Minh',
  postalCode: null,
  phoneNumber: '0901234567',
  isDefault: true,
};

// ─── Mock Item Summaries (embedded in orders) ─────────────────────────

const orderItems: Record<number, ItemSummary> = {
  1: {
    id: mockId('item', 81),
    title: 'PS5 Slim + 2 Tay Cầm DualSense',
    condition: 'new',
    primaryImageUrl: 'https://picsum.photos/seed/ps5/400/400',
    verificationStatus: 'verified',
    estimatedValue: 13_000_000,
    categoryId: mockId('cat', 1),
    categoryName: 'Gaming',
  },
  2: {
    id: mockId('item', 82),
    title: 'iPhone 15 Pro Max 256GB',
    condition: 'like_new',
    primaryImageUrl: 'https://picsum.photos/seed/iphone15/400/400',
    verificationStatus: 'verified',
    estimatedValue: 28_000_000,
    categoryId: mockId('cat', 1),
    categoryName: 'Điện thoại',
  },
  3: {
    id: mockId('item', 83),
    title: 'Nike Air Jordan 1 Retro High OG',
    condition: 'new',
    primaryImageUrl: 'https://picsum.photos/seed/jordan1/400/400',
    verificationStatus: 'verified',
    estimatedValue: 5_500_000,
    categoryId: mockId('cat', 2),
    categoryName: 'Giày dép',
  },
  4: {
    id: mockId('item', 84),
    title: 'MacBook Air M2 256GB Starlight',
    condition: 'like_new',
    primaryImageUrl: 'https://picsum.photos/seed/macbook/400/400',
    verificationStatus: 'verified',
    estimatedValue: 22_000_000,
    categoryId: mockId('cat', 1),
    categoryName: 'Laptop',
  },
  5: {
    id: mockId('item', 85),
    title: 'Bộ Thẻ Pokémon Card 151 Booster Box',
    condition: 'new',
    primaryImageUrl: 'https://picsum.photos/seed/pokemon/400/400',
    verificationStatus: 'unverified',
    estimatedValue: 3_500_000,
    categoryId: mockId('cat', 3),
    categoryName: 'Sưu tầm',
  },
  6: {
    id: mockId('item', 86),
    title: 'Sony WH-1000XM5 Wireless',
    condition: 'new',
    primaryImageUrl: 'https://picsum.photos/seed/sonyxm5/400/400',
    verificationStatus: 'verified',
    estimatedValue: 7_500_000,
    categoryId: mockId('cat', 1),
    categoryName: 'Âm thanh',
  },
  7: {
    id: mockId('item', 87),
    title: 'Marshall Stanmore II Bluetooth',
    condition: 'like_new',
    primaryImageUrl: 'https://picsum.photos/seed/marshall/400/400',
    verificationStatus: 'verified',
    estimatedValue: 6_000_000,
    categoryId: mockId('cat', 1),
    categoryName: 'Âm thanh',
  },
};

// ─── Mock Tracking Data ───────────────────────────────────────────────

const trackingShipped: OrderTracking = {
  carrier: 'Giao Hàng Nhanh',
  trackingNumber: 'GHN-2026021501234',
  trackingUrl: 'https://donhang.ghn.vn/?order_code=GHN-2026021501234',
  estimatedDelivery: mockDate(24),
  events: [
    {
      status: 'in_transit',
      description: 'Đang vận chuyển đến kho phân loại TP.HCM',
      location: 'Kho Tân Bình, TP.HCM',
      timestamp: mockDate(-6),
    },
    {
      status: 'in_transit',
      description: 'Đã rời kho gửi hàng',
      location: 'Kho Cầu Giấy, Hà Nội',
      timestamp: mockDate(-18),
    },
    {
      status: 'picked_up',
      description: 'Đã lấy hàng từ người bán',
      location: 'Hà Nội',
      timestamp: mockDate(-24),
    },
  ],
};

const trackingDelivered: OrderTracking = {
  carrier: 'Giao Hàng Tiết Kiệm',
  trackingNumber: 'GHTK-2026020899876',
  trackingUrl: 'https://giaohangtietkiem.vn/tracking?code=GHTK-2026020899876',
  estimatedDelivery: mockDate(-72),
  events: [
    {
      status: 'delivered',
      description: 'Đã giao hàng thành công',
      location: 'Quận 1, TP.HCM',
      timestamp: mockDate(-72),
    },
    {
      status: 'out_for_delivery',
      description: 'Đang giao hàng',
      location: 'Quận 1, TP.HCM',
      timestamp: mockDate(-74),
    },
    {
      status: 'in_transit',
      description: 'Đang vận chuyển',
      location: 'Kho TP.HCM',
      timestamp: mockDate(-96),
    },
    {
      status: 'picked_up',
      description: 'Đã lấy hàng từ người bán',
      location: 'TP.HCM',
      timestamp: mockDate(-120),
    },
  ],
};

const trackingCompleted: OrderTracking = {
  carrier: 'ViettelPost',
  trackingNumber: 'VTP-2026013056789',
  trackingUrl: 'https://viettelpost.vn/tracking?code=VTP-2026013056789',
  estimatedDelivery: mockDate(-240),
  events: [
    {
      status: 'delivered',
      description: 'Đã giao hàng thành công',
      location: 'Quận 7, TP.HCM',
      timestamp: mockDate(-240),
    },
    {
      status: 'out_for_delivery',
      description: 'Đang giao hàng',
      location: 'Quận 7, TP.HCM',
      timestamp: mockDate(-242),
    },
    {
      status: 'picked_up',
      description: 'Đã lấy hàng',
      location: 'Hà Nội',
      timestamp: mockDate(-264),
    },
  ],
};

// ─── 7 Mock Orders ────────────────────────────────────────────────────

function buildOrder(
  n: number,
  overrides: Partial<Order> & { itemPrice: number; sellerId: string }
): Order {
  const platformFee = Math.round(overrides.itemPrice * 0.05);
  const shippingFee = overrides.shippingFee ?? 50_000;
  const totalAmount = overrides.itemPrice + shippingFee + platformFee;

  return {
    id: orderId(n),
    orderNumber: `ORD-2026${String(n).padStart(4, '0')}`,
    auctionId: overrides.auctionId ?? mockId('auction', 100 + n),
    buyerId: CURRENT_USER_ID,
    sellerId: overrides.sellerId,
    itemPrice: overrides.itemPrice,
    shippingFee,
    platformFee,
    taxAmount: 0,
    totalAmount,
    currency: 'VND',
    status: overrides.status ?? 'processing',
    paidAt: overrides.paidAt ?? null,
    shippedAt: overrides.shippedAt ?? null,
    deliveredAt: overrides.deliveredAt ?? null,
    completedAt: overrides.completedAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    notes: overrides.notes ?? null,
    item: orderItems[n] ?? null,
    seller: overrides.seller ?? null,
    shippingAddress: MOCK_SHIPPING_ADDRESS,
    billingAddress: MOCK_BILLING_ADDRESS,
    escrow: overrides.escrow ?? null,
    tracking: overrides.tracking ?? null,
    createdAt: overrides.createdAt ?? mockDate(-48),
    modifiedAt: overrides.modifiedAt ?? mockDate(-24),
  };
}

function buildEscrow(
  orderId: string,
  amount: number,
  status: Escrow['status'],
  extra?: Partial<Escrow>
): Escrow {
  return {
    id: mockId('escrow', parseInt(orderId.split('-')[1]) || 1),
    orderId,
    amount,
    currency: 'VND',
    status,
    heldAt: extra?.heldAt ?? mockDate(-48),
    releasedAt: extra?.releasedAt ?? null,
  };
}

export const MOCK_ORDERS: Order[] = [
  // #1: Shipped — linked to real auction #8 (PS5, won)
  buildOrder(1, {
    auctionId: mockId('auction', 8),
    sellerId: seller(0).userId,
    seller: seller(0),
    itemPrice: 12_800_000,
    shippingFee: 60_000,
    status: 'shipped',
    paidAt: mockDate(-36),
    shippedAt: mockDate(-24),
    escrow: buildEscrow(orderId(1), 12_800_000 + 60_000 + 640_000, 'holding'),
    tracking: trackingShipped,
    createdAt: mockDate(-48),
    modifiedAt: mockDate(-24),
  }),

  // #2: Pending payment — 48h deadline approaching
  buildOrder(2, {
    sellerId: seller(0).userId,
    seller: seller(0),
    itemPrice: 26_500_000,
    shippingFee: 0,
    status: 'pending_payment',
    createdAt: mockDate(-12),
    modifiedAt: mockDate(-12),
  }),

  // #3: Delivered — awaiting receipt confirmation
  buildOrder(3, {
    sellerId: seller(1).userId,
    seller: seller(1),
    itemPrice: 4_800_000,
    shippingFee: 40_000,
    status: 'delivered',
    paidAt: mockDate(-144),
    shippedAt: mockDate(-120),
    deliveredAt: mockDate(-72),
    escrow: buildEscrow(orderId(3), 4_800_000 + 40_000 + 240_000, 'holding'),
    tracking: trackingDelivered,
    createdAt: mockDate(-168),
    modifiedAt: mockDate(-72),
  }),

  // #4: Completed — escrow released, fully done
  buildOrder(4, {
    sellerId: seller(0).userId,
    seller: seller(0),
    itemPrice: 20_500_000,
    shippingFee: 80_000,
    status: 'completed',
    paidAt: mockDate(-360),
    shippedAt: mockDate(-336),
    deliveredAt: mockDate(-264),
    completedAt: mockDate(-96),
    escrow: buildEscrow(orderId(4), 20_500_000 + 80_000 + 1_025_000, 'released_to_seller', {
      releasedAt: mockDate(-96),
    }),
    tracking: trackingCompleted,
    createdAt: mockDate(-384),
    modifiedAt: mockDate(-96),
  }),

  // #5: Processing — seller preparing shipment
  buildOrder(5, {
    sellerId: seller(2).userId,
    seller: seller(2),
    itemPrice: 3_200_000,
    shippingFee: 35_000,
    status: 'processing',
    paidAt: mockDate(-24),
    escrow: buildEscrow(orderId(5), 3_200_000 + 35_000 + 160_000, 'holding'),
    createdAt: mockDate(-48),
    modifiedAt: mockDate(-24),
  }),

  // #6: Cancelled — non-payment timeout
  buildOrder(6, {
    sellerId: seller(4).userId,
    seller: seller(4),
    itemPrice: 6_900_000,
    shippingFee: 50_000,
    status: 'cancelled',
    cancelledAt: mockDate(-168),
    notes: 'Quá hạn thanh toán 48 giờ',
    createdAt: mockDate(-216),
    modifiedAt: mockDate(-168),
  }),

  // #7: Disputed — item not as described
  buildOrder(7, {
    sellerId: seller(4).userId,
    seller: seller(4),
    itemPrice: 5_200_000,
    shippingFee: 50_000,
    status: 'disputed',
    paidAt: mockDate(-240),
    shippedAt: mockDate(-216),
    deliveredAt: mockDate(-168),
    escrow: buildEscrow(orderId(7), 5_200_000 + 50_000 + 260_000, 'disputed'),
    tracking: {
      carrier: 'Giao Hàng Nhanh',
      trackingNumber: 'GHN-2026020166543',
      trackingUrl: null,
      estimatedDelivery: null,
      events: [
        {
          status: 'delivered',
          description: 'Đã giao hàng',
          location: 'Quận 1, TP.HCM',
          timestamp: mockDate(-168),
        },
      ],
    },
    notes: 'Sản phẩm không đúng mô tả — đã mở khiếu nại',
    createdAt: mockDate(-264),
    modifiedAt: mockDate(-144),
  }),
];

// ─── List Item Conversion ─────────────────────────────────────────────

function toListItem(order: Order): OrderListItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    auctionId: order.auctionId,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    itemTitle: order.item?.title ?? '',
    primaryImageUrl: order.item?.primaryImageUrl ?? null,
    sellerName: order.seller?.storeName ?? null,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
  };
}

// ─── Query Helpers ────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set([
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
]);
const COMPLETED_STATUSES = new Set(['completed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'refunded', 'disputed']);

export function getMockOrders(
  tab: 'active' | 'completed' | 'cancelled'
): OrderListItem[] {
  const statusSet =
    tab === 'active'
      ? ACTIVE_STATUSES
      : tab === 'completed'
        ? COMPLETED_STATUSES
        : CANCELLED_STATUSES;

  return MOCK_ORDERS.filter((o) => statusSet.has(o.status)).map(toListItem);
}

export function getMockOrderDetail(id: string): Order | null {
  return MOCK_ORDERS.find((o) => o.id === id) ?? null;
}
