/**
 * SellerListings — active auction grid on the Seller Profile page.
 *
 * Reuses the existing AuctionCard component to display the
 * seller's current listings. Shows non-ended auctions first
 * (active), with ended ones below.
 *
 * Grid: 3 per row (xl) → 2 per row (md) → 1 per row (xs)
 */

import { Card, Row, Col, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import { AuctionCard } from '@/components/auction/AuctionCard';

const { Text } = Typography;

interface SellerListingsProps {
  auctions: AuctionListItem[];
}

/** Sort: active first, then ended/sold/cancelled */
function sortByRelevance(a: AuctionListItem, b: AuctionListItem): number {
  const priority: Record<string, number> = {
    active: 0,
    pending: 1,
    ended: 2,
    sold: 3,
    cancelled: 4,
    failed: 5,
    draft: 6,
  };
  return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
}

export function SellerListings({ auctions }: SellerListingsProps) {
  const { t } = useTranslation();

  const sorted = [...auctions].sort(sortByRelevance);
  const activeCount = auctions.filter(
    (a) => a.status === 'active',
  ).length;

  return (
    <Card
      title={
        <>
          {t('sellerProfile.activeListings')}{' '}
          <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 14 }}>
            ({activeCount} {t('sellerProfile.activeLabel')})
          </Text>
        </>
      }
    >
      {sorted.length === 0 ? (
        <Empty description={t('sellerProfile.noActiveListings')} />
      ) : (
        <Row gutter={[16, 16]}>
          {sorted.map((auction) => (
            <Col key={auction.id} xs={24} md={12} xl={8}>
              <AuctionCard auction={auction} />
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}
