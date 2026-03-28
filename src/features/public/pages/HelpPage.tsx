import { Card, Col, Row, Typography } from 'antd'
import { Link } from 'react-router'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const SUPPORT_TOPICS = [
  {
    title: 'How bidding works',
    body: 'Place a deposit during the qualification window, then bid in real time while the auction is active. If you are outbid, the page updates automatically when your connection is live.',
  },
  {
    title: 'Deposits and qualification',
    body: 'Deposits are held while the auction is running. If you lose, the deposit returns to your wallet. If you win, it is applied to the final payment.',
  },
  {
    title: 'Questions and seller replies',
    body: 'Questions posted on an item appear in the Q&A section. Sellers can answer directly from the listing, and connected viewers should see the update without refreshing.',
  },
]

export default function HelpPage() {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{ margin: '0 auto', maxWidth: 1100, padding: isMobile ? '16px 16px 40px' : '32px 0 80px' }}>
      <Typography.Title
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: isMobile ? 28 : 42,
          fontWeight: 400,
          marginBottom: 12,
        }}
      >
        Help Center
      </Typography.Title>
      <Typography.Paragraph
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 15,
          lineHeight: 1.8,
          marginBottom: isMobile ? 20 : 32,
          maxWidth: isMobile ? '100%' : 760,
        }}
      >
        Guidance for bidding, deposits, realtime updates, and the quickest paths to support when something
        looks wrong.
      </Typography.Paragraph>

      <Row gutter={[isMobile ? 12 : 20, isMobile ? 12 : 20]} style={{ marginBottom: isMobile ? 20 : 32 }}>
        {SUPPORT_TOPICS.map((topic) => (
          <Col key={topic.title} xs={24} md={8}>
            <Card
              style={{
                background: 'linear-gradient(180deg, rgba(196, 147, 61, 0.08), rgba(250, 250, 247, 0.9))',
                borderColor: 'rgba(196, 147, 61, 0.18)',
                height: '100%',
              }}
            >
              <Typography.Title level={4} style={{ marginTop: 0 }}>
                {topic.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: 0 }}>
                {topic.body}
              </Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Typography.Title level={4}>Need a next step?</Typography.Title>
        <Typography.Paragraph style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Browse active listings, review seller profiles, or sign in to manage your wallet and orders.
        </Typography.Paragraph>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Link to="/auctions">Browse auctions</Link>
          <Link to="/items">Browse items</Link>
          <Link to="/sellers">Browse sellers</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  )
}
