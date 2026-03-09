/**
 * MyActiveBidsTable — auctions the user is currently bidding on.
 *
 * Desktop: Ant Design Table with columns (item, current bid, your bid, status, time left).
 * Mobile: Compact card list with key info stacked vertically.
 *
 * Empty state shows a "Browse Now" CTA to drive engagement.
 */

import { Card, Table, Tag, Space, Typography, List, Avatar, Button, Empty, Skeleton } from 'antd';
import {
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyBidItem } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND, formatCountdown } from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface MyActiveBidsTableProps {
  bids: MyBidItem[];
  isLoading: boolean;
}

/** Color + label for bid status tags (plain function, not a hook) */
function getBidStatusTag(
  status: MyBidItem['myBidStatus'],
  t: (key: string) => string,
) {
  const map: Record<string, { color: string; label: string }> = {
    winning: { color: 'green', label: t('dashboard.bidStatusWinning') },
    won: { color: 'green', label: t('dashboard.bidStatusWon') },
    outbid: { color: 'orange', label: t('dashboard.bidStatusOutbid') },
    active: { color: 'blue', label: t('dashboard.bidStatusWinning') },
  };
  return map[status] ?? { color: 'default', label: status };
}

export function MyActiveBidsTable({ bids, isLoading }: MyActiveBidsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  // ─── Empty state ─────────────────────────────────────────────
  const emptyContent = (
    <Empty
      description={
        <Space direction="vertical" size={4}>
          <Text>{t('dashboard.noBidsYet')}</Text>
          <Text type="secondary">{t('dashboard.noBidsHint')}</Text>
        </Space>
      }
    >
      <Button type="primary" onClick={() => navigate('/browse')}>
        {t('dashboard.browseNow')}
      </Button>
    </Empty>
  );

  // ─── Desktop: Table view ─────────────────────────────────────
  const columns = [
    {
      title: t('dashboard.auctionItem'),
      key: 'item',
      render: (_: unknown, record: MyBidItem) => (
        <Space
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/auction/${record.auction.id}`)}
        >
          <img
            src={record.auction.primaryImageUrl ?? ''}
            alt={record.auction.itemTitle}
            style={{
              width: 40,
              height: 40,
              objectFit: 'cover',
              borderRadius: 4,
            }}
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
      title: t('dashboard.currentBid'),
      key: 'currentBid',
      width: 160,
      render: (_: unknown, record: MyBidItem) => (
        <Text>
          {formatVND(
            record.auction.currentPrice ?? record.auction.startingPrice,
          )}
        </Text>
      ),
    },
    {
      title: t('dashboard.yourBid'),
      key: 'yourBid',
      width: 160,
      render: (_: unknown, record: MyBidItem) => (
        <Text strong>{formatVND(record.myLatestBid.amount)}</Text>
      ),
    },
    {
      title: t('dashboard.status'),
      key: 'status',
      width: 120,
      render: (_: unknown, record: MyBidItem) => {
        const tag = getBidStatusTag(record.myBidStatus, t);
        return <Tag color={tag.color}>{tag.label}</Tag>;
      },
    },
    {
      title: t('dashboard.timeLeft'),
      key: 'timeLeft',
      width: 150,
      render: (_: unknown, record: MyBidItem) => {
        const isLive =
          record.auction.status === 'active';
        return (
          <Space size={4}>
            <ClockCircleOutlined
              style={{ color: isLive ? '#52c41a' : '#999' }}
            />
            <Text type={isLive ? undefined : 'secondary'}>
              {isLive
                ? formatCountdown(record.auction.endTime, t)
                : t('auction.ended')}
            </Text>
          </Space>
        );
      },
    },
  ];

  // ─── Mobile: List view ───────────────────────────────────────
  const mobileList = (
    <List
      dataSource={bids}
      locale={{ emptyText: emptyContent }}
      renderItem={(item) => {
        const tag = getBidStatusTag(item.myBidStatus, t);
        const isLive =
          item.auction.status === 'active';
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
                  src={item.auction.primaryImageUrl}
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
                <Space size={[8, 4]} wrap>
                  <Text style={{ fontSize: 13 }}>
                    {formatVND(item.myLatestBid.amount)}
                  </Text>
                  <Tag color={tag.color} style={{ margin: 0 }}>
                    {tag.label}
                  </Tag>
                  {isLive && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ClockCircleOutlined /> {formatCountdown(item.auction.endTime, t)}
                    </Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        );
      }}
    />
  );

  return (
    <Card
      title={t('dashboard.myActiveBids')}
      extra={
        bids.length > 0 && (
          <Button
            type="link"
            size="small"
            onClick={() => navigate('/my-bids')}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
          >
            {t('dashboard.viewAllBids')}
          </Button>
        )
      }
      style={{ height: '100%' }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : bids.length === 0 ? (
        emptyContent
      ) : isMobile ? (
        mobileList
      ) : (
        <Table
          dataSource={bids}
          columns={columns}
          rowKey={(record) => record.auction.id}
          pagination={false}
          size="small"
        />
      )}
    </Card>
  );
}
