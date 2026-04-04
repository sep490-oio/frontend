import { Steps } from 'antd'
import { getStepperIndex, isCancelledStatus, isFailedStatus } from '../utils/shipmentLabels'

interface ShipmentStepperProps {
  status: string
}

const STEPS = [
  { title: 'Pickup' },
  { title: 'Transit' },
  { title: 'Claimed' },
  { title: 'Arrived' },
  { title: 'Inspected' },
  { title: 'Done' },
]

export function ShipmentStepper({ status }: ShipmentStepperProps) {
  const current = getStepperIndex(status)
  const cancelled = isCancelledStatus(status) || isFailedStatus(status)

  return (
    <div style={{ marginBottom: 24, overflowX: 'auto' }}>
      <Steps
        current={current}
        status={cancelled ? 'error' : undefined}
        size="small"
        items={STEPS}
        style={{ minWidth: 500 }}
      />
    </div>
  )
}
