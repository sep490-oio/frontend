import { Typography } from 'antd'
import { useAuctionDetail } from '@/features/auction/auctionApi'
import { useOrderById } from '@/features/order/api'

interface ReferenceTitleProps {
  referenceId: string | null | undefined
  referenceType: string | null | undefined
}

export const ReferenceTitle = ({ referenceId, referenceType }: ReferenceTitleProps) => {
  if (!referenceId) return null

  if (referenceType === 'auction' || referenceType === 'deposit') {
    return <AuctionTitle id={referenceId} />
  }

  if (referenceType === 'order') {
    return <OrderTitle id={referenceId} />
  }

  return null
}

const AuctionTitle = ({ id }: { id: string }) => {
  const { data: detail, isLoading } = useAuctionDetail(id, undefined, { 
    refetchInterval: false,
  })

  if (isLoading) return <div style={{ height: 20, width: 100, background: 'var(--color-bg-secondary)', borderRadius: 4, opacity: 0.6 }} />
  
  const title = detail?.item?.title
  if (!title) return null

  return (
    <Typography.Text
      strong
      style={{ color: 'var(--color-accent)', fontSize: 13, display: 'block', marginBottom: 2 }}
      ellipsis={{ tooltip: title }}
    >
      {title}
    </Typography.Text>
  )
}

const OrderTitle = ({ id }: { id: string }) => {
  const { data: order, isLoading } = useOrderById(id)

  if (isLoading) return <div style={{ height: 20, width: 100, background: 'var(--color-bg-secondary)', borderRadius: 4, opacity: 0.6 }} />
  
  const title = order?.item?.itemTitle
  if (!title) return null

  return (
    <Typography.Text
      strong
      style={{ color: 'var(--color-accent)', fontSize: 13, display: 'block', marginBottom: 2 }}
      ellipsis={{ tooltip: title }}
    >
      {title}
    </Typography.Text>
  )
}
