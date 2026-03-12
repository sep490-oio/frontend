/**
 * EndedBidsList — full list of ended auctions the user participated in.
 *
 * Two view modes controlled by parent:
 * - Table: Ant Design Table (desktop) / List (mobile) with 5 columns
 * - Card: Responsive grid of compact result cards
 *
 * Includes client-side filters:
 * - Result: All | Won | Lost
 * - Auction type: All | Open | Sealed
 * - Sort: End date | Price | My bid
 *
 * Pattern follows RecentlyEndedList.tsx from Dashboard but expanded
 * with table view and filter controls.
 */

import { useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Typography,
  List,
  Avatar,
  Empty,
  Skeleton,
  Select,
  Flex,
  Card,
  Row,
  Col,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyBidItem } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface EndedBidsListProps {
  bids: MyBidItem[];
  isLoading: boolean;
  viewMode: 'table' | 'card';
}

export function EndedBidsList({ bids, isLoading, viewMode }: EndedBidsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  // ─── Filter state ──────────────────────────────────────────────
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('endDate');

  // ─── Client-side filtering + sorting ───────────────────────────
  const filteredBids = useMemo(() => {
    let result = [...bids];

    // Filter by result (won = status 'won', lost = status 'outbid')
    if (resultFilter === 'won') {
      result = result.filter((b) => b.myBidStatus === 'won');
    } else if (resultFilter === 'lost') {
      result = result.filter((b) => b.myBidStatus !== 'won');
    }

    // Filter by auction type
    if (typeFilter !== 'all') {
      result = result.filter((b) => b.auction.auctionType === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'endDate':
          return new Date(b.auction.endTime).getTime() - new Date(a.auction.endTime).getTime();
        case 'price':
          return (b.auction.currentPrice ?? b.auction.startingPrice)
            - (a.auction.currentPrice ?? a.auction.startingPrice);
        case 'myBid':
          return b.myLatestBid.amount - a.myLatestBid.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [bids, resultFilter, typeFilter, sortBy]);

  // ─── Empty state ───────────────────────────────────────────────
  const emptyContent = (
    <Empty description={t('myBids.emptyEnded')} />
  );

  // ─── Filter bar ────────────────────────────────────────────────
  const filterBar = (
    <Flex wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
      <Flex align="center" gap={4}>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {t('myBids.filterResult')}:
        </Text>
        <Select
          value={resultFilter}
          onChange={setResultFilter}
          style={{ width: 130 }}
          options={[
            { value: 'all', label: t('myBids.filterAll') },
            { value: 'won', label: t('myBids.resultWon') },
            { value: 'lost', label: t('myBids.resultLost') },
          ]}
        />
      </Flex>
      <Flex align="center" gap={4}>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {t('myBids.filterType')}:
        </Text>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 130 }}
          options={[
            { value: 'all', label: t('myBids.filterAll') },
            { value: 'open', label: t('myBids.typeOpen') },
            { value: 'sealed', label: t('myBids.typeSealed') },
          ]}
        />
      </Flex>
      <Flex align="center" gap={4}>
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {t('myBids.filterSort')}:
        </Text>
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 150 }}
          options={[
            { value: 'endDate', label: t('myBids.sortEndDate') },
            { value: 'price', label: t('myBids.sortPrice') },
            { value: 'myBid', label: t('myBids.sortMyBid') },
          ]}
        />
      </Flex>
    </Flex>
  );

  // ─── Helpers ───────────────────────────────────────────────────
  const isWon = (item: MyBidItem) => item.myBidStatus === 'won';

  const getDepositTag = (item: MyBidItem) => {
    if (isWon(item)) {
      return { color: 'green' as const, label: t('myBids.depositApplied') };
    }
    return { color: 'cyan' as const, label: t('myBids.depositRefunded') };
  };

  // ─── Desktop: Table view ───────────────────────────────────────
  const columns = [
    {
      title: t('myBids.columnItem'),
      key: 'item',
      render: (_: unknown, record: MyBidItem) => (
        <Space>
          <img
            src={record.auction.primaryImageUrl || '/placeholder-item.svg'}
            alt={record.auction.itemTitle}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
          <Paragraph
            ellipsis={{ rows: 1 }}
            style={{ margin: 0 }}
          >
            {record.auction.itemTitle}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: t('myBids.columnFinalPrice'),
      key: 'finalPrice',
      width: 160,
      render: (_: unknown, record: MyBidItem) => (
        <Text>
          {formatVND(record.auction.currentPrice ?? record.auction.startingPrice)}
        </Text>
      ),
    },
    {
      title: t('myBids.columnYourBid'),
      key: 'yourBid',
      width: 160,
      render: (_: unknown, record: MyBidItem) => (
        <Text strong>{formatVND(record.myLatestBid.amount)}</Text>
      ),
    },
    {
      title: t('myBids.columnResult'),
      key: 'result',
      width: 100,
      render: (_: unknown, record: MyBidItem) => (
        <Tag color={isWon(record) ? 'green' : 'default'}>
          {isWon(record) ? t('myBids.resultWon') : t('myBids.resultLost')}
        </Tag>
      ),
    },
    {
      title: t('myBids.columnDeposit'),
      key: 'deposit',
      width: 120,
      render: (_: unknown, record: MyBidItem) => {
        const dep = getDepositTag(record);
        return <Tag color={dep.color}>{dep.label}</Tag>;
      },
    },
  ];

  // ─── Mobile: List view (used when viewMode=table on small screens) ──
  const mobileList = (
    <List
      dataSource={filteredBids}
      locale={{ emptyText: emptyContent }}
      renderItem={(item) => {
        const finalPrice = item.auction.currentPrice ?? item.auction.startingPrice;
        const dep = getDepositTag(item);
        return (
          <List.Item
            style={{ cursor: 'pointer', padding: '12px 0' }}
            onClick={() => navigate(`/auction/${item.auction.id}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  shape="square"
                  size={48}
                  src={item.auction.primaryImageUrl || '/placeholder-item.svg'}
                />
              }
              title={
                <Paragraph
                  ellipsis={{ rows: 1 }}
                  style={{ margin: 0, fontSize: 14 }}
                >
                  {item.auction.itemTitle}
                </Paragraph>
              }
              description={
                <Flex wrap="wrap" gap={4} align="center">
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {formatVND(finalPrice)}
                  </Text>
                  <Tag color={isWon(item) ? 'green' : 'default'} style={{ margin: 0 }}>
                    {isWon(item) ? t('myBids.resultWon') : t('myBids.resultLost')}
                  </Tag>
                  <Tag color={dep.color} style={{ margin: 0 }}>
                    {dep.label}
                  </Tag>
                </Flex>
              }
            />
          </List.Item>
        );
      }}
    />
  );

  // ─── Card view ────────────────────────────────────────────────
  const cardGrid = (
    <Row gutter={[16, 16]}>
      {filteredBids.map((item) => {
        const dep = getDepositTag(item);
        const finalPrice = item.auction.currentPrice ?? item.auction.startingPrice;
        return (
          <Col key={item.auction.id} xs={24} sm={12} lg={8}>
            <Card
              hoverable
              onClick={() => navigate(`/auction/${item.auction.id}`)}
              styles={{ body: { padding: 16 } }}
              cover={
                <div style={{ position: 'relative' }}>
                  <img
                    alt={item.auction.itemTitle}
                    src={item.auction.primaryImageUrl || '/placeholder-item.svg'}
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                  {/* Result badge — top-right */}
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Tag color={isWon(item) ? 'green' : 'default'}>
                      {isWon(item) ? t('myBids.resultWon') : t('myBids.resultLost')}
                    </Tag>
                  </div>
                </div>
              }
            >
              <Paragraph
                strong
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 8, fontSize: 15 }}
              >
                {item.auction.itemTitle}
              </Paragraph>

              {/* Price comparison */}
              <Flex justify="space-between" style={{ marginBottom: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('myBids.columnFinalPrice')}
                  </Text>
                  <div>
                    <Text style={{ fontSize: 14 }}>
                      {formatVND(finalPrice)}
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('myBids.columnYourBid')}
                  </Text>
                  <div>
                    <Text strong style={{ fontSize: 14, color: '#1677ff' }}>
                      {formatVND(item.myLatestBid.amount)}
                    </Text>
                  </div>
                </div>
              </Flex>

              {/* Deposit status + View Order */}
              <Flex justify="space-between" align="center">
                <Tag color={dep.color} style={{ margin: 0 }}>
                  {dep.label}
                </Tag>
              </Flex>
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // ─── Render logic ─────────────────────────────────────────────
  const renderContent = () => {
    if (filteredBids.length === 0) return emptyContent;

    if (viewMode === 'card') return cardGrid;

    return isMobile ? mobileList : (
      <Table
        dataSource={filteredBids}
        columns={columns}
        rowKey={(record) => record.auction.id}
        pagination={false}
        size="small"
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/auction/${record.auction.id}`),
        })}
      />
    );
  };

  return (
    <div>
      {filterBar}
      {renderContent()}
    </div>
  );
}
