import { Typography, Flex, Button, App } from 'antd'
import { CopyOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel, getModeLabel, getNextStepMessage } from '../utils/shipmentLabels'
import { formatDateTime } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'

interface ShipmentHeaderProps {
  clientOrderCode: string
  status: string
  providerCode?: string
  shipmentMode?: string
  externalCarrierName?: string
  updatedAt?: string
  backTo?: string
  backLabel?: string
}

export function ShipmentHeader({ clientOrderCode, status, providerCode, shipmentMode, externalCarrierName, updatedAt, backTo, backLabel }: ShipmentHeaderProps) {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()

  const carrierName = externalCarrierName || getProviderLabel(providerCode)
  const nextStep = getNextStepMessage(status)

  return (
    <div style={{ marginBottom: 20 }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(backTo ?? `${prefix}/warehouse/inbound`)} style={{ marginBottom: 8 }}>
        {backLabel ?? tc('action.back', 'Back')}
      </Button>

      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 8 }}>
        <Flex align="center" gap={12}>
          <Typography.Title level={3} style={{ margin: 0, fontFamily: MONO_FONT }}>
            {clientOrderCode}
          </Typography.Title>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => { void navigator.clipboard.writeText(clientOrderCode); message.success(tc('copied', 'Copied')) }}
          />
        </Flex>
        <StatusBadge status={status} />
      </Flex>

      <Flex gap={16} wrap="wrap" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        <span>{carrierName}</span>
        <span>&middot;</span>
        <span>{getModeLabel(shipmentMode)}</span>
        {updatedAt && (
          <>
            <span>&middot;</span>
            <span>{t('lastUpdated', 'Updated')}: {formatDateTime(updatedAt)}</span>
          </>
        )}
      </Flex>

      {nextStep && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(139, 115, 85, 0.06)',
          border: '1px solid rgba(139, 115, 85, 0.12)',
          fontSize: 13,
          color: 'var(--color-text-primary)',
        }}>
          <strong>{t('nextStep', 'Next step')}:</strong> {nextStep}
        </div>
      )}
    </div>
  )
}
