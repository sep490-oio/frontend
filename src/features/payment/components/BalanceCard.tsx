import { Card, Statistic, Typography } from 'antd'
import { formatCurrency } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'

export interface BalanceCardProps {
  title: string
  value: number
  currency?: string
  helpText?: string
  color?: string
  loading?: boolean
}

const balanceCardStyle: React.CSSProperties = {
  background: 'var(--color-accent-light)',
  borderColor: 'var(--color-border)',
}

export function BalanceCard({ title, value, currency, helpText, color, loading }: BalanceCardProps) {
  return (
    <Card loading={loading} style={balanceCardStyle}>
      <Statistic
        title={title}
        value={value}
        formatter={(val) => formatCurrency(val as number, currency)}
        valueStyle={{
          color: color ?? 'var(--color-text-primary)',
          fontFamily: MONO_FONT,
          fontSize: 28,
          fontWeight: 500,
        }}
      />
      {helpText && (
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          {helpText}
        </Typography.Text>
      )}
    </Card>
  )
}

export default BalanceCard
