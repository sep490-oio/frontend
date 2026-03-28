import { Steps } from 'antd'
import {
  DollarOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  CarOutlined,
  InboxOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { OrderStatus } from '@/types/enums'
import type { OrderStatus as OrderStatusType } from '@/types/enums'

const STEP_SEQUENCE = [
  OrderStatus.PendingPayment,
  OrderStatus.Paid,
  OrderStatus.Processing,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
  OrderStatus.Completed,
] as const

const STEP_ICONS: Record<string, React.ReactNode> = {
  [OrderStatus.PendingPayment]: <DollarOutlined />,
  [OrderStatus.Paid]: <CheckCircleOutlined />,
  [OrderStatus.Processing]: <SettingOutlined />,
  [OrderStatus.Shipped]: <CarOutlined />,
  [OrderStatus.Delivered]: <InboxOutlined />,
  [OrderStatus.Completed]: <TrophyOutlined />,
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

  const currentIndex = STEP_SEQUENCE.indexOf(status as (typeof STEP_SEQUENCE)[number])
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
