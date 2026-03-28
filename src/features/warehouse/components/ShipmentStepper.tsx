import { Steps } from 'antd'
import { getStepperIndex, isCancelledStatus, isFailedStatus } from '../utils/shipmentLabels'

interface ShipmentStepperProps {
  status: string
}

const STEPS = [
  { title: 'Awaiting Pickup' },
  { title: 'In Transit' },
  { title: 'Arrived' },
  { title: 'Inspected' },
  { title: 'Completed' },
]

export function ShipmentStepper({ status }: ShipmentStepperProps) {
  const current = getStepperIndex(status)
  const cancelled = isCancelledStatus(status) || isFailedStatus(status)

  return (
    <div style={{ marginBottom: 24 }}>
      <Steps
        current={cancelled ? current : current}
        status={cancelled ? 'error' : undefined}
        size="small"
        items={STEPS}
        style={{ maxWidth: 600 }}
      />
    </div>
  )
}
