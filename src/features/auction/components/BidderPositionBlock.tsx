import { Flex, Typography } from 'antd'
import {
  TrophyOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface BidderPositionBlockProps {
  position: 'leading' | 'outbid' | 'won' | 'lost' | 'none'
  latestBidAmount?: number
  currency?: string
}

const positionConfig = {
  leading: {
    icon: ArrowUpOutlined,
    color: 'var(--color-success)',
    bgColor: 'rgba(74, 124, 89, 0.08)',
    borderColor: 'rgba(74, 124, 89, 0.2)',
  },
  outbid: {
    icon: ExclamationCircleOutlined,
    color: 'var(--color-danger)',
    bgColor: 'rgba(196, 81, 61, 0.08)',
    borderColor: 'rgba(196, 81, 61, 0.2)',
  },
  won: {
    icon: TrophyOutlined,
    color: 'var(--color-success)',
    bgColor: 'rgba(74, 124, 89, 0.08)',
    borderColor: 'rgba(74, 124, 89, 0.2)',
  },
  lost: {
    icon: CloseCircleOutlined,
    color: 'var(--color-text-secondary)',
    bgColor: 'rgba(128, 128, 128, 0.06)',
    borderColor: 'rgba(128, 128, 128, 0.15)',
  },
  none: {
    icon: ArrowUpOutlined,
    color: 'var(--color-text-secondary)',
    bgColor: 'transparent',
    borderColor: 'transparent',
  },
}

export function BidderPositionBlock({ position }: BidderPositionBlockProps) {
  const { t } = useTranslation('auction')

  if (position === 'none') return null

  const config = positionConfig[position]
  const Icon = config.icon

  const labels: Record<string, string> = {
    leading: t('positionLeading', 'You are leading'),
    outbid: t('positionOutbid', 'You have been outbid'),
    won: t('positionWon', 'You won this auction'),
    lost: t('positionLost', 'You did not win'),
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        marginBottom: 12,
      }}
    >
      <Flex align="center" gap={10}>
        <Icon style={{ fontSize: 18, color: config.color }} />
        <Typography.Text style={{ fontWeight: 600, fontSize: 14, color: config.color }}>
          {labels[position]}
        </Typography.Text>
      </Flex>
    </div>
  )
}
