import { Card, Statistic, Typography, Flex, Popover } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { formatCurrency } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'

export interface BalanceCardProps {
  title: string
  value: number
  currency?: string
  helpText?: string
  helpPopover?: React.ReactNode
  color?: string
  loading?: boolean
  icon?: React.ReactNode
  style?: React.CSSProperties
  progressBar?: { percent: number; color: string }
  footer?: React.ReactNode
}

const balanceCardBaseStyle: React.CSSProperties = {
  background: 'var(--color-bg-container)',
  backdropFilter: 'var(--oio-blur)',
  WebkitBackdropFilter: 'var(--oio-blur)',
  borderColor: 'var(--color-border)',
  borderRadius: 24,
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
}

export function BalanceCard({ title, value, currency, helpText, helpPopover, color, loading, icon, style, progressBar, footer }: BalanceCardProps) {
  return (
    <Card 
      loading={loading} 
      style={{ ...balanceCardBaseStyle, ...style }}
      styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, height: '100%' } }}
    >
      <Flex vertical gap={4} style={{ flex: 1 }}>
        <Statistic
          title={
            <Flex align="center" gap={8}>
              {icon && <span style={{ color: color ?? 'var(--color-accent)', fontSize: 18 }}>{icon}</span>}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{title}</span>
              {helpPopover && (
                <Popover content={helpPopover} placement="bottomLeft" overlayStyle={{ maxWidth: 300 }}>
                  <InfoCircleOutlined style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer', marginLeft: 4 }} />
                </Popover>
              )}
            </Flex>
          }
          value={value}
          formatter={(val) => formatCurrency(val as number, currency)}
          valueStyle={{
            color: color ?? 'var(--color-text-primary)',
            fontFamily: MONO_FONT,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            display: 'block'
          }}
        />
        {progressBar && (
          <div style={{ width: '100%', height: 4, background: 'var(--color-bg-layout)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ width: `${progressBar.percent}%`, height: '100%', background: progressBar.color, borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        )}
        {helpText && (
          <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4, marginTop: progressBar ? 4 : 0 }}>
            {helpText}
          </Typography.Text>
        )}
        {footer && (
          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            {footer}
          </div>
        )}
      </Flex>
    </Card>
  )
}

export default BalanceCard
