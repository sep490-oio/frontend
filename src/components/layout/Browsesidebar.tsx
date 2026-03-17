/**
 * BrowseSidebar — filter sidebar cho BrowsePage.
 *
 * Thiết kế theo ảnh: mỗi section là 1 dark card bo tròn riêng biệt.
 * Props được truyền từ BrowsePage để giữ state ở page level.
 *
 * ── Tái sử dụng ──────────────────────────────────────────────────
 * Component này có thể được dùng lại ở các page khác bằng cách:
 *   <BrowseSidebar
 *     filters={filters}
 *     onChange={handleFilterChange}
 *     sections={['categories', 'status', 'price', 'endingSoon']}
 *   />
 * Truyền vào `sections` để bật/tắt từng nhóm filter tùy page.
 *
 * ── Role-based visibility ─────────────────────────────────────────
 * Một số section chỉ hiện với role cụ thể (vd: seller tools).
 * Truyền prop `role` để sidebar tự ẩn/hiện section phù hợp.
 */

import '../../styles/components/Browsesidebar.scss';
import { Input, Switch, Slider, Radio, Space, Typography, Button } from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  TagOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/types';

const { Text } = Typography;

// ─── Section keys — dùng để bật/tắt từng nhóm ───────────────────
export type SidebarSection =
  | 'search'
  | 'categories'
  | 'status'
  | 'verifiedOnly'
  | 'price'
  | 'endingSoon';

// ─── Status filter options ───────────────────────────────────────
const STATUS_OPTIONS = [
  {
    labelKey: 'browse.statusActive',
    label: 'Đang diễn ra',
    value: 'active',
    icon: <span className="browse-sidebar-status-dot browse-sidebar-status-dot--active" />,
  },
  {
    labelKey: 'browse.statusUpcoming',
    label: 'Sắp diễn ra',
    value: 'pending',
    icon: <span className="browse-sidebar-status-dot browse-sidebar-status-dot--pending" />,
  },
  {
    labelKey: 'browse.statusEnded',
    label: 'Đã kết thúc',
    value: 'ended',
    icon: <span className="browse-sidebar-status-dot browse-sidebar-status-dot--ended" />,
  },
];

const ENDING_SOON_OPTIONS = [
  { label: 'Dưới 1 giờ', value: '1h' },
  { label: 'Hôm nay', value: 'today' },
];

// ─── Props ───────────────────────────────────────────────────────
export interface BrowseSidebarProps {
  // Which sections to render — defaults to all
  sections?: SidebarSection[];

  // Role — controls visibility of role-specific sections
  // 'bidder' | 'seller' | 'admin' — defaults to 'bidder'
  role?: 'bidder' | 'seller' | 'admin';

  // Search
  searchText: string;
  onSearchChange: (val: string) => void;

  // Category
  categories: Category[];
  categoryId: string | undefined;
  onCategoryChange: (id: string | undefined) => void;

  // Status (active / pending / ended)
  statusFilter?: string | undefined;
  onStatusChange?: (val: string | undefined) => void;

  // Verified only
  verifiedOnly: boolean;
  onVerifiedChange: (val: boolean) => void;

  // Price range
  priceRange: [number, number];
  onPriceRangeChange: (val: [number, number]) => void;

  // Ending soon
  endingSoon: string | undefined;
  onEndingSoonChange: (val: string | undefined) => void;

  // CTA button (e.g. "Trở thành Người bán")
  showSellerCta?: boolean;
  onSellerCtaClick?: () => void;
}

const DEFAULT_SECTIONS: SidebarSection[] = [
  'search',
  'categories',
  'status',
  'verifiedOnly',
  'price',
  'endingSoon',
];

// ─── Component ───────────────────────────────────────────────────
export function BrowseSidebar({
  sections = DEFAULT_SECTIONS,
  role = 'bidder',
  searchText,
  onSearchChange,
  categories,
  categoryId,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  verifiedOnly,
  onVerifiedChange,
  priceRange,
  onPriceRangeChange,
  endingSoon,
  onEndingSoonChange,
  showSellerCta = true,
  onSellerCtaClick,
}: BrowseSidebarProps) {
  const { t } = useTranslation();

  const has = (s: SidebarSection) => sections.includes(s);

  return (
    <aside className="browse-sidebar">

      {/* ── Search ───────────────────────────────────────────── */}
      {has('search') && (
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('browse.searchPlaceholder', 'Tìm kiếm thương hiệu, mẫu mã…')}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          className="browse-sidebar-search"
        />
      )}

      {/* ── Categories card ──────────────────────────────────── */}
      {has('categories') && (
        <div className="browse-sidebar-card">
          <div className="browse-sidebar-card-header">
            <AppstoreOutlined className="browse-sidebar-card-icon" />
            <span className="browse-sidebar-card-title">
              {t('browse.categories', 'DANH MỤC')}
            </span>
          </div>
          <ul className="browse-category-list">
            <li
              className={`browse-category-item ${!categoryId ? 'browse-category-item--active' : ''}`}
              onClick={() => onCategoryChange(undefined)}
            >
              <AppstoreOutlined className="browse-category-item-icon" />
              <span className="browse-category-name">
                {t('browse.allCategories', 'Tất cả')}
              </span>
            </li>
            {categories.map((cat) => (
              <li
                key={cat.id}
                className={`browse-category-item ${categoryId === cat.id ? 'browse-category-item--active' : ''}`}
                onClick={() => onCategoryChange(cat.id)}
              >
                <TagOutlined className="browse-category-item-icon" />
                <span className="browse-category-name">{cat.name}</span>
                {cat.count !== undefined && (
                  <span className="browse-category-count">{cat.count}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Status card ──────────────────────────────────────── */}
      {has('status') && onStatusChange && (
        <div className="browse-sidebar-card">
          <div className="browse-sidebar-card-header">
            <FilterOutlined className="browse-sidebar-card-icon" />
            <span className="browse-sidebar-card-title">
              {t('browse.status', 'Trạng thái')}
            </span>
          </div>
          <Radio.Group
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="browse-status-group"
          >
            <Space direction="vertical" size={4}>
              {STATUS_OPTIONS.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  className="browse-status-radio"
                >
                  {opt.icon}
                  {t(opt.labelKey, opt.label)}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      )}

      {/* ── Verified only — inline toggle (no card) ──────────── */}
      {has('verifiedOnly') && (
        <div className="browse-sidebar-card">
          <div className="browse-sidebar-toggle-row">
            <Text className="browse-sidebar-card-title browse-sidebar-card-title--sm">
              {t('browse.verifiedOnly', 'ĐÃ KIỂM ĐỊNH')}
            </Text>
            <Switch
              size="small"
              checked={verifiedOnly}
              onChange={onVerifiedChange}
            />
          </div>
        </div>
      )}

      {/* ── Price range card ─────────────────────────────────── */}
      {has('price') && (
        <div className="browse-sidebar-card">
          <div className="browse-sidebar-card-header">
            <span className="browse-sidebar-card-title">
              {t('browse.priceRange', 'KHOẢNG GIÁ')}
            </span>
          </div>
          <div className="browse-price-inputs">
            <Input
              placeholder="Min"
              size="small"
              className="browse-price-input"
              value={priceRange[0] > 0 ? priceRange[0].toLocaleString() : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                onPriceRangeChange([val, priceRange[1]]);
              }}
            />
            <Input
              placeholder="Max"
              size="small"
              className="browse-price-input"
              value={priceRange[1] < 100_000_000 ? priceRange[1].toLocaleString() : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/\D/g, '')) || 100_000_000;
                onPriceRangeChange([priceRange[0], val]);
              }}
            />
          </div>
          <Slider
            range
            min={0}
            max={100_000_000}
            step={500_000}
            value={priceRange}
            onChange={(v) => onPriceRangeChange(v as [number, number])}
            tooltip={{ formatter: (v) => `${((v ?? 0) / 1_000_000).toFixed(0)}M` }}
            className="browse-price-slider"
          />
        </div>
      )}

      {/* ── Ending soon card ─────────────────────────────────── */}
      {has('endingSoon') && (
        <div className="browse-sidebar-card">
          <div className="browse-sidebar-card-header">
            <ClockCircleOutlined className="browse-sidebar-card-icon" />
            <span className="browse-sidebar-card-title">
              {t('browse.endingSoon', 'SẮP KẾT THÚC')}
            </span>
          </div>
          <Radio.Group
            value={endingSoon}
            onChange={(e) => onEndingSoonChange(e.target.value)}
            className="browse-ending-soon-group"
          >
            <Space direction="vertical" size={4}>
              {ENDING_SOON_OPTIONS.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  className="browse-ending-soon-radio"
                >
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      )}

      {/* ── Seller CTA — only for bidder role ────────────────── */}
      {showSellerCta && role === 'bidder' && (
        <Button
          type="primary"
          block
          icon={<ShopOutlined />}
          className="browse-sidebar-seller-cta"
          onClick={onSellerCtaClick}
        >
          {t('browse.becomeSellerCta', 'Trở thành Người bán')}
        </Button>
      )}

    </aside>
  );
}