import { Typography } from 'antd'
import { Link } from 'react-router'
import { LinkOutlined } from '@ant-design/icons'
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
    <Link
      to={`/auctions/${id}`}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
    >
      <Typography.Text
        strong
        style={{
          color: 'var(--color-accent)',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
        }}
        ellipsis={{ tooltip: title }}
      >
        <LinkOutlined style={{ fontSize: 11 }} />
        {title}
      </Typography.Text>
    </Link>
  )
}

const OrderTitle = ({ id }: { id: string }) => {
  const { data: order, isLoading } = useOrderById(id)

  if (isLoading) return <div style={{ height: 20, width: 100, background: 'var(--color-bg-secondary)', borderRadius: 4, opacity: 0.6 }} />
  
  const title = order?.item?.itemTitle
  if (!title) return null

  return (
    <Link
      to={`/me/orders/${id}`}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
    >
      <Typography.Text
        strong
        style={{
          color: 'var(--color-accent)',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
        }}
        ellipsis={{ tooltip: title }}
      >
        <LinkOutlined style={{ fontSize: 11 }} />
        {title}
      </Typography.Text>
    </Link>
  )
}
