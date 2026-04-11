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
    leading: t('positionLeading', 'Bạn đang dẫn đầu'),
    outbid: t('positionOutbid', 'Bạn đã bị vượt giá'),
    won: t('positionWon', 'Bạn đã thắng đấu giá'),
    lost: t('positionLost', 'Bạn không giành được'),
  }

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        marginBottom: 10,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Flex align="center" gap={8}>
        <Icon style={{ fontSize: 16, color: config.color, flexShrink: 0 }} />
        <Typography.Text
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: config.color,
            lineHeight: 1.4,
          }}
        >
          {labels[position]}
        </Typography.Text>
      </Flex>
    </div>
  )
}