
import { useParams, useNavigate } from 'react-router'
import { Flex, Result, Button, Space, Tabs, Spin, Card } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { useAuctionDetail, useAuctionBids } from '@/features/auction/auctionApi'
import { useBreakpoint } from '@/hooks/useBreakpoint'

import { ActiveAuctionControls as ActiveAuctionBody } from '@/features/admin/components/auctions/ActiveAuctionControls'
import { CompletedAuctionSummary as CompletedAuctionBody } from '@/features/admin/components/auctions/CompletedAuctionSummary'
import { AdminAuctionHeader } from '@/features/admin/components/auctions/AdminAuctionHeader'
import { AdminAuctionFinancialsTable } from '@/features/admin/components/auctions/AdminAuctionFinancialsTable'

export default function AdminAuctionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('admin')
  const { isMobile } = useBreakpoint()

  const { data: detail, isLoading, isError, refetch } = useAuctionDetail(id!)
  const { data: bidsData } = useAuctionBids(id!)

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  
  if (isError || !detail?.auction) {
    return (
      <Result
        status="404"
        title={t('auctionDetail.notFoundTitle', 'Auction Not Found')}
        subTitle={t('auctionDetail.notFoundDesc', 'The auction you are looking for does not exist or has been removed.')}
        extra={
          <Button onClick={() => navigate('/admin/auctions')}>
            {t('auctionDetail.backToList', 'Back to List')}
          </Button>
        }
      />
    )
  }

  const auction = detail.auction
  const item = detail.item

  const isCompleted = ['completed', 'sold'].includes(auction.status)

  return (
    <Flex vertical gap={24} style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Space style={{ marginBottom: 8 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/auctions')}
          style={{ minHeight: 44 }}
        >
          {t('common.backToList', 'Back to Auctions')}
        </Button>
      </Space>

      <AdminAuctionHeader auction={auction} item={item} bids={bidsData?.items ?? []} />

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          size="large"
          tabBarStyle={{ padding: '0 24px', margin: 0 }}
          items={[
            {
              key: 'overview',
              label: t('auctionDetail.tabs.overview', 'Overview'),
              children: isCompleted ? (
                <CompletedAuctionBody auctionId={id!} bidsData={bidsData} />
              ) : (
                <ActiveAuctionBody auction={auction} refetch={refetch} />
              ),
            },
            {
              key: 'transactions',
              label: t('auctionDetail.tabs.transactions', 'Transactions'),
              children: <AdminAuctionFinancialsTable auctionId={id!} />,
            },
          ]}
        />
      </Card>
    </Flex>
  )
}
