import { Steps } from 'antd'
import {
  DollarOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  InboxOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  AppstoreAddOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { OrderStatus } from '@/types/enums'
import type { OrderStatus as OrderStatusType } from '@/types/enums'

const STEP_SEQUENCE = [
  OrderStatus.PendingPayment,
  OrderStatus.Paid,
  OrderStatus.Processing,
  OrderStatus.PickedUp,
  OrderStatus.OnDelivering,
  OrderStatus.Delivered,
  OrderStatus.Completed,
] as const

const STEP_ICONS: Record<string, React.ReactNode> = {
  [OrderStatus.PendingPayment]: <DollarOutlined />,
  [OrderStatus.Paid]: <CheckCircleOutlined />,
  [OrderStatus.Processing]: <SettingOutlined />,
  [OrderStatus.PickedUp]: <AppstoreAddOutlined />,
  [OrderStatus.OnDelivering]: <RocketOutlined />,
  [OrderStatus.Delivered]: <InboxOutlined />,
  [OrderStatus.Completed]: <TrophyOutlined />,
}

// Legacy `shipped` rows predate the picked_up / on_delivering split. Display
// them at the OnDelivering step (closest semantic match) instead of a dead
// position off the sequence.
const LEGACY_STATUS_ALIAS: Record<string, (typeof STEP_SEQUENCE)[number]> = {
  [OrderStatus.Shipped]: OrderStatus.OnDelivering,
}

const TERMINAL_STATUSES = new Set<string>([
  OrderStatus.Cancelled,
  OrderStatus.Refunded,
  OrderStatus.Disputed,
])

interface OrderStatusStepperProps {
  status: OrderStatusType
}

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const { t } = useTranslation('order')

  if (TERMINAL_STATUSES.has(status)) {
    return (
      <Steps
        current={0}
        status="error"
        items={[
          {
            title: t(`status.${status}`, status),
            icon: <CloseCircleOutlined />,
          },
        ]}
      />
    )
  }

  const effectiveStatus = LEGACY_STATUS_ALIAS[status] ?? status
  const currentIndex = STEP_SEQUENCE.indexOf(effectiveStatus as (typeof STEP_SEQUENCE)[number])
  // If status is unknown (not in sequence), don't highlight any step
  const activeStep = currentIndex >= 0 ? currentIndex : -1

  return (
    <Steps
      current={activeStep}
      items={STEP_SEQUENCE.map((step) => ({
        title: t(`status.${step}`, step),
        icon: STEP_ICONS[step],
      }))}
    />
  )
}
