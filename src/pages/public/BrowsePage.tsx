/**
 * BrowsePage — public catalog page where users explore auctions.
 *
 * Sidebar filter logic tách ra BrowseSidebar component để tái sử dụng.
 * State filter vẫn giữ ở BrowsePage và truyền xuống qua props.
 */

import './BrowsePage.scss';
import { useState, useMemo } from 'react';
import {
  Row, Col, Select,
  Typography, Pagination,
  Spin, Empty, Space, Flex,
} from 'antd';
import { PageContainer } from '@/styles/components/PageContainer';
import { PageTitle, PageSubtitle } from '@/styles/components/typography';
import { useTranslation } from 'react-i18next';
import type { AuctionFilters } from '@/types';
import { useAuctions, useCategories } from '@/hooks/useAuctions';
import { useAppSelector } from '@/app/hooks';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { BrowseSidebar } from '@/components/layout/Browsesidebar';

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

export function BrowsePage() {
  const { t } = useTranslation();
  const user  = useAppSelector((state) => state.auth.user);
  const role  = (user?.roles?.[0] ?? 'bidder') as 'bidder' | 'seller' | 'admin';

  // ─── Filter state ────────────────────────────────────────────
  const [searchText,   setSearchText]   = useState('');
  const [categoryId,   setCategoryId]   = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
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
    if (debouncedSearch)             f.search      = debouncedSearch;
    if (categoryId)                  f.categoryId  = categoryId;
    if (statusFilter)                f.status      = statusFilter;
    if (verifiedOnly)                f.verifiedOnly = true;
    if (priceRange[0] > 0)           f.priceMin    = priceRange[0];
    if (priceRange[1] < 100_000_000) f.priceMax    = priceRange[1];
    return f;
  }, [debouncedSearch, categoryId, statusFilter, verifiedOnly, priceRange, selectedSort, page]);

  const { data, isLoading }  = useAuctions(filters);
  const { data: categories } = useCategories();

  return (
    <PageContainer>
      <Row gutter={[24, 0]}>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <Col xs={0} md={6} lg={5} xl={4}>
          <BrowseSidebar
            role={role}
            sections={['search', 'categories', 'status', 'verifiedOnly', 'price', 'endingSoon']}
            searchText={searchText}
            onSearchChange={(v) => { setSearchText(v); resetPage(); }}
            categories={categories ?? []}
            categoryId={categoryId}
            onCategoryChange={(v) => { setCategoryId(v); resetPage(); }}
            statusFilter={statusFilter}
            onStatusChange={(v) => { setStatusFilter(v); resetPage(); }}
            verifiedOnly={verifiedOnly}
            onVerifiedChange={(v) => { setVerifiedOnly(v); resetPage(); }}
            priceRange={priceRange}
            onPriceRangeChange={(v) => { setPriceRange(v); resetPage(); }}
            endingSoon={endingSoon}
            onEndingSoonChange={(v) => { setEndingSoon(v); resetPage(); }}
            showSellerCta={role === 'bidder'}
          />
        </Col>

        {/* ── Main content ─────────────────────────────────────── */}
        <Col xs={24} md={18} lg={19} xl={20}>


          {isLoading ? (
            <Flex justify="center" align="center" style={{ minHeight: 400 }}>
              <Spin size="large" />
            </Flex>
          ) : !data || data.items.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical" size={8}>
                  <Text>{t('browse.noResults', 'No auctions found')}</Text>
                  <Text type="secondary">
                    {t('browse.tryAdjustFilters', 'Try adjusting your filters or search term')}
                  </Text>
                </Space>
              }
              className="browse-empty-state"
            />
          ) : (
            <>
              <Row gutter={[20, 24]}>
                {data.items.map((auction) => (
                  <Col key={auction.id} xs={24} sm={12} xl={8}>
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