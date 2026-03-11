/**
 * HomePage — Landing page with Hero + Featured Auctions
 * Reuses useAuctions hook and Ant Design grid like BrowsePage
 */

import './HomePage.scss';
import { useMemo } from 'react';
import {
  Row,
  Col,
  Typography,
  Button,
  Spin,
  Empty,
  Space,
} from 'antd';
import { PageContainer } from '@/styles/components/PageContainer';
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
    status: ['active'] as AuctionStatus[],
  }), []);

  const { data, isLoading } = useAuctions(filters);

  const featuredAuctions = data?.items ?? [];

  return (
    <PageContainer>
      <div className="home-page">

      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__content">
            <Title className="home-hero__title" level={1}>
              The Premier Marketplace for
              <br />
              Authenticated Luxury
            </Title>

            <Paragraph className="home-hero__subtitle">
              Buy and sell verified luxury goods with confidence.
              Every item is authenticated, every transaction is protected.
            </Paragraph>

            <div className="home-hero__actions">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/browse')}
              >
                Browse Auctions
              </Button>
              <Button size="large" onClick={() => navigate('/register')}>
                Start Selling
              </Button>
            </div>

            <div className="home-hero__stats">
              <div className="home-hero__stat">
                <div className="home-hero__stat-value">$24M+</div>
                <div className="home-hero__stat-label">Total Value Traded</div>
              </div>
              <div className="home-hero__stat">
                <div className="home-hero__stat-value">8,400+</div>
                <div className="home-hero__stat-label">Successful Auctions</div>
              </div>
              <div className="home-hero__stat">
                <div className="home-hero__stat-value">99.8%</div>
                <div className="home-hero__stat-label">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          <div className="home-hero__visual">
            {featuredAuctions[0] ? (
              <div className="home-hero__visual-card">
                <AuctionCard auction={featuredAuctions[0]} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="home-featured">
        <div className="home-featured__header">
          <div>
            <Title className="home-featured__title" level={2}>
              Featured Auctions
            </Title>
            <Text type="secondary">Ending soon – place your bids now</Text>
          </div>

          <div className="home-featured__cta">
            <Button type="link" onClick={() => navigate('/browse')}>
              View All
            </Button>
          </div>
        </div>

        <div className="home-featured__grid">
          {isLoading ? (
            <div className="home-featured__empty">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Spin size="large" />
              </Space>
            </div>
          ) : featuredAuctions.length === 0 ? (
            <Empty
              description="No live auctions at the moment"
              className="home-featured__empty"
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
      </section>
    </div>
    </PageContainer>
  );
}