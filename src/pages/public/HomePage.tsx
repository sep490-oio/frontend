/**
 * HomePage — Landing page with Hero + Featured Auctions
 * Reuses useAuctions hook and Ant Design grid like BrowsePage
 */

import { useMemo } from 'react';
import {
  Row,
  Col,
  Typography,
  Button,
  Spin,
  Empty,
  Flex,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import type { AuctionFilters, AuctionStatus } from '@/types';
import { useAuctions } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/auction/AuctionCard';

const { Title, Paragraph, Text } = Typography;

export function HomePage() {
  const navigate = useNavigate();

  // ================= Fetch featured auctions (same pattern as Browse) =================
  const filters: AuctionFilters = useMemo(() => ({
    page: 1,
    sortBy: 'endTime',
    sortOrder: 'asc',
    status: ['active', 'qualifying'] as AuctionStatus[],
  }), []);

  const { data, isLoading } = useAuctions(filters);

  const featuredAuctions = data?.items ?? [];

  return (
    <div>

      {/* ================= HERO SECTION ================= */}
      <div
        style={{
          textAlign: 'center',
          padding: '100px 24px 80px',
        }}
      >
        <Title
          level={1}
          style={{
            fontSize: 42,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          The Premier Marketplace for
          <br />
          Authenticated Luxury
        </Title>

        <Paragraph
          style={{
            fontSize: 18,
            color: '#666',
            maxWidth: 700,
            margin: '0 auto 40px',
          }}
        >
          Buy and sell verified luxury goods with confidence.
          Every item is authenticated, every transaction is protected.
        </Paragraph>

        <Flex justify="center" gap={16} wrap="wrap">
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/browse')}
          >
            Browse Auctions
          </Button>

          <Button
            size="large"
            onClick={() => navigate('/register')}
          >
            Start Selling
          </Button>
        </Flex>

        {/* Stats */}
        <Row justify="center" gutter={80} style={{ marginTop: 60 }}>
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>$24M+</Title>
            <Text type="secondary">Total Value Traded</Text>
          </Col>
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>8,400+</Title>
            <Text type="secondary">Successful Auctions</Text>
          </Col>
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>99.8%</Title>
            <Text type="secondary">Satisfaction Rate</Text>
          </Col>
        </Row>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #eee' }} />

      {/* ================= FEATURED AUCTIONS ================= */}
      <div style={{ padding: '60px 0' }}>

        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
            <div>
              <Title level={3} style={{ marginBottom: 0 }}>
                Featured Auctions
              </Title>
              <Text type="secondary">
                Ending soon – place your bids now
              </Text>
            </div>

            <Button type="link" onClick={() => navigate('/browse')}>
              View All
            </Button>
          </Flex>

          {isLoading ? (
            <Flex justify="center" align="center" style={{ minHeight: 300 }}>
              <Spin size="large" />
            </Flex>
          ) : featuredAuctions.length === 0 ? (
            <Empty
              description="No live auctions at the moment"
              style={{ margin: '80px 0' }}
            />
          ) : (
            <Row gutter={[24, 32]}>
              {featuredAuctions.slice(0, 4).map((auction) => (
                <Col key={auction.id} xs={24} sm={12} md={8} lg={6}>
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}