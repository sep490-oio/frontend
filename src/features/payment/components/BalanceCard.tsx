import { Card, Statistic, Typography, Flex } from 'antd'
import { formatCurrency } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'

export interface BalanceCardProps {
  title: string
  value: number
  currency?: string
  helpText?: string
  color?: string
  loading?: boolean
  icon?: React.ReactNode
  style?: React.CSSProperties
}

const balanceCardBaseStyle: React.CSSProperties = {
  background: 'var(--color-bg-container)',
  borderColor: 'var(--color-border)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}

export function BalanceCard({ title, value, currency, helpText, color, loading, icon, style }: BalanceCardProps) {
  return (
    <Card loading={loading} style={{ ...balanceCardBaseStyle, ...style }}>
      <Flex vertical gap={4}>
        <Statistic
          title={
            <Flex align="center" gap={8}>
              {icon && <span style={{ color: color ?? 'var(--color-accent)', fontSize: 18 }}>{icon}</span>}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{title}</span>
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
          }}
        />
        {helpText && (
          <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
            {helpText}
          </Typography.Text>
        )}
      </Flex>
    </Card>
  )
}

export default BalanceCard
