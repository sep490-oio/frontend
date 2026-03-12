/**
 * Item & Catalog domain types.
 *
 * Items are the products being auctioned. The lifecycle is:
 * 1. Seller creates item (title, description, images, category, condition)
 * 2. Item submitted for Moderator review
 * 3. Moderator approves/rejects (moderation_status)
 * 4. If approved, seller can create an auction for this item
 * 5. Optionally, item can be verified (listing_verification_status) for trust badge
 */

import type { ItemCondition, ModerationStatus, ListingVerificationStatus } from './enums';
import type { SellerSummary } from './user';

// ─── Category ───────────────────────────────────────────────────────

/**
 * Product category — supports a tree structure via parentId.
 * Example: Electronics → Phones → Smartphones
 */
export interface Category {
  count: ReactI18NextChildren | Iterable<ReactI18NextChildren>;
  id: string;
  parentId: string | null;
  name: string;
  /** URL-friendly version of the name (e.g., "dien-thoai") */
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number | null;
  /** Child categories (populated when fetching the category tree) */
  children?: Category[];
}

// ─── Item Images ────────────────────────────────────────────────────

export interface ItemImage {
  id: string;
  itemId: string;
  imageUrl: string;
  /** The main photo shown in cards and at the top of the detail page */
  isPrimary: boolean;
  sortOrder: number | null;
}

// ─── Item Attributes ────────────────────────────────────────────────

/**
 * Key-value pairs for item-specific details.
 * Example: { attributeName: "Brand", attributeValue: "Apple" }
 * These vary by category — a phone has "Storage" while a watch has "Band Material".
 */
export interface ItemAttribute {
  id: string;
  itemId: string;
  attributeName: string;
  attributeValue: string;
}

// ─── Item Questions ─────────────────────────────────────────────────

/** Q&A between potential bidders and the seller about the item */
export interface ItemQuestion {
  id: string;
  itemId: string;
  askerId: string;
  askerName: string | null; // Denormalized for display
  question: string;
  answer: string | null;
  answeredAt: string | null;
  isPublic: boolean;
  createdAt: string;
}

// ─── Item ───────────────────────────────────────────────────────────

/**
 * Full item detail — returned by GET /items/:id.
 * Includes nested images, attributes, and seller summary.
 */
export interface Item {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string | null;
  condition: ItemCondition;
  quantity: number | null;
  // ─── Verification (3-layer system) ────────────────────────────
  /** Listing badge: verified vs non-verified (professor requirement) */
  verificationStatus: ListingVerificationStatus;
  verifiedAt: string | null;
  verificationNotes: string | null;
  /** Moderator approval: must be 'approved' before auction can start */
  moderationStatus: ModerationStatus;
  moderationNotes: string | null;
  rejectionReason: string | null;
  moderatedAt: string | null;
  /**
   * Seller's estimated value — determines verification tier:
   * Below 20M VND = Standard (online review)
   * Above 20M VND = Enhanced (documentation required)
   */
  estimatedValue: number | null;
  // ─── Nested data (populated by API) ───────────────────────────
  images: ItemImage[];
  attributes: ItemAttribute[];
  category: Category | null;
  seller: SellerSummary | null;
  createdAt: string;
  modifiedAt: string;
}

/**
 * Lightweight item summary for embedding in auction cards.
 * The Browse page shows auction cards, not item cards — but each
 * auction card needs basic item info (title, image, condition).
 */
export interface ItemSummary {
  id: string;
  title: string;
  condition: ItemCondition;
  /** URL of the primary image */
  primaryImageUrl: string | null;
  verificationStatus: ListingVerificationStatus;
  estimatedValue: number | null;
  categoryId: string;
  categoryName: string | null;
  /**
   * Optional fields populated in detail responses (GET /auctions/:id).
   * Not present in list/card responses to keep payloads small.
   */
  description?: string | null;
  images?: ItemImage[];
  attributes?: ItemAttribute[];
}
