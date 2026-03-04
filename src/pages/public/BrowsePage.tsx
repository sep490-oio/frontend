/**
 * BrowsePage — public catalog page where users explore auctions.
 *
 * This is the "front door" of the platform — accessible without login.
 * Features:
 * - Search bar (400ms debounce to avoid query-per-keystroke)
 * - Category filter (parent groups with child options)
 * - Status filter (Live / Qualifying / Ended / All)
 * - Sort selector (Ending soonest, Price, Bids, Newest)
 * - Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
 * - Ant Design Pagination at the bottom
 *
 * Data is fetched via TanStack Query (useAuctions hook).
 * Filter changes automatically trigger a refetch because
 * the filters object is part of the query key.
 */

import { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Typography,
  Pagination,
  Spin,
  Empty,
  Space,
  Flex,
  Button,
} from 'antd';
import { PageContainer } from '@/design-system/components/PageContainer';
import { PageTitle } from '@/design-system/typography';
import { MenuOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { AuctionFilters } from '@/types';
import { useAuctions, useCategories } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';


const { Text } = Typography;


/** Sort options for the sort dropdown */
const SORT_OPTIONS: {
  value: string;
  labelKey: string;
  sortBy: AuctionFilters['sortBy'];
  sortOrder: AuctionFilters['sortOrder'];
}[] = [
  { value: 'endingSoon', labelKey: 'auction.sortEndingSoon', sortBy: 'endTime', sortOrder: 'asc' },
  { value: 'lowestPrice', labelKey: 'auction.sortLowestPrice', sortBy: 'currentPrice', sortOrder: 'asc' },
  { value: 'highestPrice', labelKey: 'auction.sortHighestPrice', sortBy: 'currentPrice', sortOrder: 'desc' },
  { value: 'mostBids', labelKey: 'auction.sortMostBids', sortBy: 'bidCount', sortOrder: 'desc' },
  { value: 'newest', labelKey: 'auction.sortNewest', sortBy: 'createdAt', sortOrder: 'desc' },
];

export function BrowsePage() {
  const { t } = useTranslation();

  // ─── Filter state ────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [sortValue, setSortValue] = useState('endingSoon');
  const [page, setPage] = useState(1);

  // Debounce search input — waits 400ms after the user stops typing
  const debouncedSearch = useDebouncedValue(searchText, 400);

  // Resolve the selected sort option into sortBy + sortOrder
  const selectedSort = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];

  // Build the filter object passed to useAuctions
  const filters: AuctionFilters = useMemo(() => {
    const f: AuctionFilters = {
      page,
      sortBy: selectedSort.sortBy,
      sortOrder: selectedSort.sortOrder,
    };

    if (debouncedSearch) f.search = debouncedSearch;
    if (categoryId) f.categoryId = categoryId;


    return f;
  }, [debouncedSearch, categoryId, selectedSort, page]);

  // ─── Data fetching ───────────────────────────────────────────
  const { data, isLoading } = useAuctions(filters);
  const { data: categories } = useCategories();

  // Build category options for Select — parent as group, children as options

  // Reset page to 1 when any filter changes
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

return (
    <PageContainer>
      <div className="container">
        <div className="browse-filter-header">
          {/* Left: big editorial title */}
          <div className="browse-title-section">
            <PageTitle>
              {t('browse.title') || 'Live\nAuctions'}
            </PageTitle>
            <Text type="secondary" className="browse-subtitle">
              {t('browse.subtitle') || 'Curated high-end designer toys and collectible figurines from global independent artists.'}
            </Text>
          </div>

          {/* Right: compact inline filter controls */}
          <div className="browse-filter-controls">
            {/* Category pill select */}
            <Select
              value={categoryId ?? '__all__'}
              onChange={(val) => {
                setCategoryId(val === '__all__' ? undefined : val);
                setPage(1);
              }}
              size="small"
              className="browse-category-select"
              options={[
                { label: t('browse.allCategories') || 'CATEGORY: ALL', value: '__all__' },
                ...(categories ?? []).map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                })),
              ]}
            />

            {/* Sort select */}
            <Select
              value={sortValue}
              onChange={handleFilterChange(setSortValue)}
              options={SORT_OPTIONS.map((o) => ({
                label: t(o.labelKey),
                value: o.value,
              }))}
              size="small"
              className="browse-sort-select"
              placeholder={t('browse.sortPlaceholder') || `SORT: ENDING SOON`}
            />

            {/* Price / extra filter button */}
            <Button
              icon={<MenuOutlined />}
              size="small"
              className="browse-filter-button"
            >
              {t('browse.priceFilter') || 'PRICE: ANY'}
            </Button>

            {/* Search input — compact */}
            <Input
              placeholder={t('browse.searchPlaceholder') || 'Search…'}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              allowClear
              size="small"
              className="browse-search-input"
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
                {t('browse.tryAdjustFilters') || 'Try adjusting filters or search term'}
              </Text>
            </Space>
          }
          className="browse-empty-state"
        />
      ) : (
        <>
          <Row gutter={[24, 32]}>
            {data.items.map((auction) => (
              <Col key={auction.id} xs={24} sm={12} md={8} lg={6}>
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
      </div>
    </PageContainer>
);
}
