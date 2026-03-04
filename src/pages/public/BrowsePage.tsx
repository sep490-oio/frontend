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
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <PageTitle>{t('browse.title') || 'Browse Auctions'}</PageTitle>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-lg)', display: 'block' }}>
            {t('browse.subtitle') || 'Discover authenticated luxury items from verified sellers'}
          </Text>
        </div>

      {/* Search + Sort + Filters bar */}
      <div className="stack-on-mobile" style={{ gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)', alignItems: 'center', justifyContent: 'center' }}>
        <Input
          placeholder={t('browse.searchPlaceholder') || 'Search by brand, model, or keyword...'}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
          allowClear
          size="large"
          className="browse-search-input"
        />

        <Select
          value={sortValue}
          onChange={handleFilterChange(setSortValue)}
          options={SORT_OPTIONS.map((o) => ({
            label: t(o.labelKey),
            value: o.value,
          }))}
          size="large"
          style={{ width: 180 }}
          placeholder={t('browse.sortPlaceholder') || undefined}
        />

        <Button
          icon={<MenuOutlined />}
          size="large"
          className="browse-filter-button"
        >
          {t('browse.filters') || 'Filters'}
        </Button>
      </div>

      <div style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <Space wrap size={[8, 12]}>
          <Button
            type={categoryId === undefined ? 'primary' : 'default'}
            onClick={() => {
              setCategoryId(undefined);
              setPage(1);
            }}
            className="category-pill"
          >
            {t('browse.allCategories') || 'All Categories'}
          </Button>

          {categories?.map((cat) => (
            <Button
              key={cat.id}
              type={categoryId === cat.id ? 'primary' : 'default'}
              onClick={() => {
                setCategoryId(cat.id);
                setPage(1);
              }}
              className="category-pill"
            >
              {cat.name}
            </Button>
          ))}
        </Space>
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
          style={{ margin: '120px 0' }}
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
            <Flex justify="center" style={{ marginTop: 48 }}>
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
