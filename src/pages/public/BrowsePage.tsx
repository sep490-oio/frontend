/**
 * BrowsePage — public catalog page where users explore auctions.
 *
 * Theme is handled globally by theme.ts (dark design-system tokens).
 * Layout primitives (PageContainer, PageTitle) are from the shared
 * design-system — their styles live in _global.scss.
 */

import './BrowsePage.scss';
import { useState, useMemo } from 'react';
import {
  Row, Col,
  Input, Select,
  Typography, Pagination,
  Spin, Empty, Space, Flex,
  Switch, Slider, Radio,
} from 'antd';
import { PageContainer } from '@/styles/components/PageContainer';
import { PageTitle, PageSubtitle } from '@/styles/components/typography';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AuctionFilters } from '@/types';
import { useAuctions, useCategories } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const { Text } = Typography;

const SORT_OPTIONS: {
  value: string;
  labelKey: string;
  sortBy: AuctionFilters['sortBy'];
  sortOrder: AuctionFilters['sortOrder'];
}[] = [
  { value: 'endingSoon',   labelKey: 'auction.sortEndingSoon',   sortBy: 'endTime',      sortOrder: 'asc'  },
  { value: 'lowestPrice',  labelKey: 'auction.sortLowestPrice',  sortBy: 'currentPrice', sortOrder: 'asc'  },
  { value: 'highestPrice', labelKey: 'auction.sortHighestPrice', sortBy: 'currentPrice', sortOrder: 'desc' },
  { value: 'mostBids',     labelKey: 'auction.sortMostBids',     sortBy: 'bidCount',     sortOrder: 'desc' },
  { value: 'newest',       labelKey: 'auction.sortNewest',       sortBy: 'createdAt',    sortOrder: 'desc' },
];

const ENDING_SOON_OPTIONS = [
  { label: 'Under 1 hour', value: '1h'    },
  { label: 'Today',        value: 'today' },
];

export function BrowsePage() {
  const { t } = useTranslation();

  const [searchText,   setSearchText]   = useState('');
  const [categoryId,   setCategoryId]   = useState<string | undefined>();
  const [sortValue,    setSortValue]    = useState('endingSoon');
  const [page,         setPage]         = useState(1);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange,   setPriceRange]   = useState<[number, number]>([0, 100_000_000]);
  const [endingSoon,   setEndingSoon]   = useState<string | undefined>();

  const debouncedSearch = useDebouncedValue(searchText, 400);
  const selectedSort    = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];
  const resetPage       = () => setPage(1);

  const filters: AuctionFilters = useMemo(() => {
    const f: AuctionFilters = {
      page,
      sortBy:    selectedSort.sortBy,
      sortOrder: selectedSort.sortOrder,
    };
    if (debouncedSearch) f.search     = debouncedSearch;
    if (categoryId)      f.categoryId = categoryId;
    return f;
  }, [debouncedSearch, categoryId, selectedSort, page]);

  const { data, isLoading }  = useAuctions(filters);
  const { data: categories } = useCategories();

  return (
    <PageContainer>
      <Row gutter={[32, 0]}>

        {/* ── Left Sidebar ─────────────────────────────────────────── */}
        <Col xs={0} md={5} lg={4} xl={4}>
          <div className="browse-sidebar">

            <Input
              prefix={<SearchOutlined />}
              placeholder={t('browse.searchPlaceholder') || 'Search for brands, models…'}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); resetPage(); }}
              allowClear
              className="browse-sidebar-search"
            />

            <div className="browse-sidebar-section">
              <Text className="browse-sidebar-section-label">
                {t('browse.categories', 'CATEGORIES')}
              </Text>
              <ul className="browse-category-list">
                <li
                  className={`browse-category-item ${!categoryId ? 'browse-category-item--active' : ''}`}
                  onClick={() => { setCategoryId(undefined); resetPage(); }}
                >
                  <span className="browse-category-name">
                    {t('browse.allCategories', 'All')}
                  </span>
                </li>
                {(categories ?? []).map((cat) => (
                  <li
                    key={cat.id}
                    className={`browse-category-item ${categoryId === cat.id ? 'browse-category-item--active' : ''}`}
                    onClick={() => { setCategoryId(cat.id); resetPage(); }}
                  >
                    <span className="browse-category-name">{cat.name}</span>
                    {cat.count !== undefined && (
                      <span className="browse-category-count">{cat.count}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="browse-sidebar-section">
              <div className="browse-sidebar-toggle-row">
                <Text className="browse-sidebar-section-label">
                  {t('browse.verifiedOnly', 'VERIFIED ONLY')}
                </Text>
                <Switch
                  size="small"
                  checked={verifiedOnly}
                  onChange={(v) => { setVerifiedOnly(v); resetPage(); }}
                />
              </div>
            </div>

            <div className="browse-sidebar-section">
              <Text className="browse-sidebar-section-label">
                {t('browse.priceRange', 'PRICE RANGE')}
              </Text>
              <div className="browse-price-inputs">
                <Input
                  placeholder="Min"
                  size="small"
                  className="browse-price-input"
                  value={priceRange[0] > 0 ? priceRange[0].toLocaleString() : ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                    setPriceRange([val, priceRange[1]]);
                  }}
                />
                <Input
                  placeholder="Max"
                  size="small"
                  className="browse-price-input"
                  value={priceRange[1] < 100_000_000 ? priceRange[1].toLocaleString() : ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 100_000_000;
                    setPriceRange([priceRange[0], val]);
                  }}
                />
              </div>
              <Slider
                range
                min={0}
                max={100_000_000}
                step={500_000}
                value={priceRange}
                onChange={(v) => setPriceRange(v as [number, number])}
                tooltip={{ formatter: (v) => `${((v ?? 0) / 1_000_000).toFixed(0)}M` }}
                className="browse-price-slider"
              />
            </div>

            <div className="browse-sidebar-section">
              <Text className="browse-sidebar-section-label">
                {t('browse.endingSoon', 'ENDING SOON')}
              </Text>
              <Radio.Group
                value={endingSoon}
                onChange={(e) => { setEndingSoon(e.target.value); resetPage(); }}
                className="browse-ending-soon-group"
              >
                <Space direction="vertical" size={6}>
                  {ENDING_SOON_OPTIONS.map((opt) => (
                    <Radio key={opt.value} value={opt.value} className="browse-ending-soon-radio">
                      {opt.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

          </div>
        </Col>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <Col xs={24} md={19} lg={20} xl={20}>

          <div className="browse-header-row">
            <div className="browse-title-section">
              <PageTitle>
                {t('browse.title') || 'Luxury Collection'}
              </PageTitle>
              <PageSubtitle>
                {t('browse.subtitle') || 'Discover exceptional finds with expert verification'}
              </PageSubtitle>
            </div>

            <div className="browse-sort-bar">
              <Text className="browse-sort-label">
                {t('browse.sortBy', 'Sort by:')}
              </Text>
              <Select
                value={sortValue}
                onChange={(val) => { setSortValue(val); resetPage(); }}
                options={SORT_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }))}
                className="browse-sort-select"
                popupMatchSelectWidth={false}
              />
            </div>
          </div>

          {isLoading ? (
            <Flex justify="center" align="center" style={{ minHeight: 400 }}>
              <Spin size="large" />
            </Flex>
          ) : !data || data.items.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical" size={8}>
                  <Text>{t('browse.noResults') || 'No auctions found'}</Text>
                  <Text type="secondary">
                    {t('browse.tryAdjustFilters') || 'Try adjusting your filters or search term'}
                  </Text>
                </Space>
              }
              className="browse-empty-state"
            />
          ) : (
            <>
              <Row gutter={[20, 24]}>
                {data.items.map((auction) => (
                  <Col key={auction.id} xs={24} sm={12} lg={8} xl={8}>
                    <AuctionCard auction={auction} />
                  </Col>
                ))}
              </Row>

              {data.totalPages > 1 && (
                <Flex justify="center" className="browse-pagination-container">
                  <Pagination
                    current={data.page}
                    total={data.totalItems}
                    pageSize={data.pageSize}
                    onChange={(p) => setPage(p)}
                    showSizeChanger={false}
                  />
                </Flex>
              )}
            </>
          )}
        </Col>

      </Row>
    </PageContainer>
  );
}