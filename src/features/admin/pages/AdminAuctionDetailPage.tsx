
import { useParams, useNavigate } from 'react-router'
import { Flex, Result, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Spin } from 'antd'

import { useAuctionDetail, useAuctionBids } from '@/features/auction/auctionApi'
import { useBreakpoint } from '@/hooks/useBreakpoint'

import { ActiveAuctionControls as ActiveAuctionBody } from '@/features/admin/components/auctions/ActiveAuctionControls'
import { CompletedAuctionSummary as CompletedAuctionBody } from '@/features/admin/components/auctions/CompletedAuctionSummary'
import { AdminAuctionHeader } from '@/features/admin/components/auctions/AdminAuctionHeader'

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
        title="Auction Not Found"
        subTitle="The auction you are looking for does not exist or has been removed."
        extra={<Button onClick={() => navigate('/admin/auctions')}>Back to List</Button>}
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

      {isCompleted ? (
        <CompletedAuctionBody auctionId={id!} bidsData={bidsData} />
      ) : (
        <ActiveAuctionBody auction={auction} refetch={refetch} />
      )}
    </Flex>
  )
}
